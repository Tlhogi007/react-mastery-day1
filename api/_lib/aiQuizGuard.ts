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
 *   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (optional)
 */

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
  | { ok: false; status: 429; error: string; retryAfterSec?: number }

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
