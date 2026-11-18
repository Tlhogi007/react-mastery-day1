/**
 * AI usage guards for /api/ai-quiz.
 * - Per-IP minute/day caps (in-memory, best-effort per isolate)
 * - Optional global daily budget via Upstash Redis REST (durable across instances)
 *
 * Env:
 *   AI_QUIZ_MAX_PER_MINUTE (default 5)
 *   AI_QUIZ_MAX_PER_DAY (default 40)
 *   AI_QUIZ_MAX_COUNT (default 5)
 *   AI_QUIZ_GLOBAL_MAX_PER_DAY (default 200)
 *   AI_QUIZ_FREE_PER_USER_DAY (default 5) — hosted free tier per signed-in user
 *   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *     Required for signed-in per-user free tier (fail closed if missing/unavailable).
 *     Still optional for anonymous / IP+global memory fallbacks.
 */

import { redisConfigured, redisGet, redisIncr } from './redis.js'

const WINDOW_MS = 60_000

type WindowEntry = { count: number; resetAt: number }
type DayEntry = { count: number; day: string }

const minuteHits = new Map<string, WindowEntry>()
const dayHits = new Map<string, DayEntry>()
let memoryGlobal: DayEntry | null = null

function envInt(name: string, fallback: number): number {
  const raw = process.env[name]
  const n = raw ? Number(raw) : NaN
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}

export function freePerUserDayLimit(): number {
  return envInt('AI_QUIZ_FREE_PER_USER_DAY', 5)
}

export function userFreeQuotaRedisKey(userId: string, day = utcDay()): string {
  return `ai-quiz:user:${userId}:${day}`
}

export function maxQuestionsPerRequest(): number {
  return Math.min(envInt('AI_QUIZ_MAX_COUNT', 5), 8)
}

export function clampQuestionCount(count: unknown): number {
  const n = Number(count)
  const fallback = 3
  const raw = Number.isFinite(n) ? n : fallback
  return Math.min(Math.max(Math.floor(raw), 1), maxQuestionsPerRequest())
}

function utcDay(): string {
  return new Date().toISOString().slice(0, 10)
}

export type GuardResult =
  | { ok: true }
  | {
      ok: false
      status: 429 | 402 | 503
      error: string
      code?: string
      retryAfterSec?: number
    }

export type UserFreeQuotaStatus = {
  used: number
  limit: number
  remaining: number
  day: string
  available: boolean
}

/** Read-only free-tier usage (does not increment). */
export async function getUserFreeQuotaStatus(userId: string): Promise<UserFreeQuotaStatus> {
  const limit = freePerUserDayLimit()
  const day = utcDay()
  if (!userId || userId === 'anonymous' || !redisConfigured()) {
    return { used: 0, limit, remaining: limit, day, available: false }
  }
  const raw = await redisGet(userFreeQuotaRedisKey(userId, day))
  const used = Math.max(0, Number(raw) || 0)
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    day,
    available: true,
  }
}

/**
 * Free hosted AI generations per signed-in user per UTC day.
 * Uses Upstash only — fail closed if Redis is unset or unreachable so
 * per-isolate memory maps cannot bypass the free tier.
 * When exceeded → 402 so the client can nudge BYO keys.
 */
export async function allowUserFreeQuota(userId: string): Promise<GuardResult> {
  if (!userId || userId === 'anonymous') return { ok: true }

  const maxFree = freePerUserDayLimit()
  const key = userFreeQuotaRedisKey(userId)

  if (!redisConfigured()) {
    return {
      ok: false,
      status: 503,
      code: 'quota_unavailable',
      error:
        'Hosted free AI is temporarily unavailable (quota store not configured). Add your own API key in Settings, or try again later.',
    }
  }

  const redisCount = await redisIncr(key)
  if (redisCount == null) {
    return {
      ok: false,
      status: 503,
      code: 'quota_unavailable',
      error:
        'Hosted free AI is temporarily unavailable (quota store unreachable). Add your own API key in Settings, or try again later.',
    }
  }

  if (redisCount > maxFree) {
    return {
      ok: false,
      status: 402,
      code: 'quota_exceeded',
      error: `Free hosted AI limit (${maxFree}/day) reached. Add your own API key in Settings to continue.`,
    }
  }
  return { ok: true }
}

async function allowGlobalBudget(): Promise<GuardResult> {
  const maxGlobal = envInt('AI_QUIZ_GLOBAL_MAX_PER_DAY', 200)
  const day = utcDay()
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (url && token) {
    try {
      const key = `ai-quiz:global:${day}`
      const base = url.replace(/\/$/, '')
      // Body-style REST (works with Upstash start-redis + standard REST)
      const res = await fetch(base, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['INCR', key]),
        signal: AbortSignal.timeout(3000),
      })
      if (res.ok) {
        const data = (await res.json()) as { result?: number }
        const count = Number(data.result) || 0
        if (count === 1) {
          void fetch(base, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(['EXPIRE', key, 172800]),
          }).catch(() => undefined)
        }
        if (count > maxGlobal) {
          return {
            ok: false,
            status: 429,
            error: 'Global daily AI quiz budget reached. Try again tomorrow or use your own API key in Settings.',
          }
        }
        return { ok: true }
      }
    } catch {
      // Fall through to in-memory global
    }
  }

  if (!memoryGlobal || memoryGlobal.day !== day) {
    memoryGlobal = { count: 1, day }
    return { ok: true }
  }
  if (memoryGlobal.count >= maxGlobal) {
    return {
      ok: false,
      status: 429,
      error: 'Global daily AI quiz budget reached. Try again tomorrow or use your own API key in Settings.',
    }
  }
  memoryGlobal.count += 1
  return { ok: true }
}

/** Per-IP + global caps. Call only for hosted (server-key) POST generate. */
export async function allowAiQuizRequest(ip: string): Promise<GuardResult> {
  const maxPerMinute = envInt('AI_QUIZ_MAX_PER_MINUTE', 5)
  const maxPerDay = envInt('AI_QUIZ_MAX_PER_DAY', 40)
  const now = Date.now()
  const key = ip || 'unknown'

  const minute = minuteHits.get(key)
  if (!minute || now > minute.resetAt) {
    minuteHits.set(key, { count: 1, resetAt: now + WINDOW_MS })
  } else if (minute.count >= maxPerMinute) {
    return {
      ok: false,
      status: 429,
      error: 'Too many AI quiz requests. Try again in a minute.',
      retryAfterSec: Math.max(1, Math.ceil((minute.resetAt - now) / 1000)),
    }
  } else {
    minute.count += 1
  }

  const day = utcDay()
  const daily = dayHits.get(key)
  if (!daily || daily.day !== day) {
    dayHits.set(key, { count: 1, day })
  } else if (daily.count >= maxPerDay) {
    return {
      ok: false,
      status: 429,
      error: 'Daily AI quiz limit reached for this network. Try again tomorrow.',
    }
  } else {
    daily.count += 1
  }

  if (minuteHits.size > 5000) {
    for (const [k, v] of minuteHits) {
      if (now > v.resetAt) minuteHits.delete(k)
    }
  }
  if (dayHits.size > 5000) {
    for (const [k, v] of dayHits) {
      if (v.day !== day) dayHits.delete(k)
    }
  }

  return allowGlobalBudget()
}
