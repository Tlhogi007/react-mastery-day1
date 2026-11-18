/**
 * Client → /api/ai-quiz (server holds Groq/Gemini/Together keys)
 * Prefer BYO keys when present (does not burn hosted quota).
 */

import type { QuizQuestion } from '../../types/challenges'
import { TIMEOUT } from '../../constants'
import { parseAIQuestions } from './utils'
import { captureWarning } from '../../lib/sentry'
import { byoAiKeys } from '../byoAiKeys'
import { fetchWithByoKey } from './byoDirect'

export type AiProxyProvider = 'auto' | 'groq' | 'gemini' | 'together'

let availabilityCache: {
  groq: boolean
  gemini: boolean
  together: boolean
  at: number
} | null = null
const AVAIL_TTL_MS = 60_000

export async function getAiProxyAvailability(): Promise<{
  groq: boolean
  gemini: boolean
  together: boolean
}> {
  const byo = byoAiKeys.get()
  if (byo.groq || byo.gemini || byo.together) {
    return {
      groq: Boolean(byo.groq),
      gemini: Boolean(byo.gemini),
      together: Boolean(byo.together),
    }
  }

  const now = Date.now()
  if (availabilityCache && now - availabilityCache.at < AVAIL_TTL_MS) {
    return {
      groq: availabilityCache.groq,
      gemini: availabilityCache.gemini,
      together: availabilityCache.together,
    }
  }

  try {
    const res = await fetch('/api/ai-quiz', {
      method: 'GET',
      signal: AbortSignal.timeout(TIMEOUT.API_AVAILABILITY_CHECK),
    })
    if (!res.ok) {
      availabilityCache = { groq: false, gemini: false, together: false, at: now }
      return { groq: false, gemini: false, together: false }
    }
    const data = (await res.json()) as {
      groq?: boolean
      gemini?: boolean
      together?: boolean
    }
    availabilityCache = {
      groq: Boolean(data.groq),
      gemini: Boolean(data.gemini),
      together: Boolean(data.together),
      at: now,
    }
    return {
      groq: availabilityCache.groq,
      gemini: availabilityCache.gemini,
      together: availabilityCache.together,
    }
  } catch {
    availabilityCache = { groq: false, gemini: false, together: false, at: now }
    return { groq: false, gemini: false, together: false }
  }
}

export async function fetchViaAiProxy(
  provider: AiProxyProvider,
  topic: string,
  count: number,
): Promise<QuizQuestion[]> {
  // BYO keys: call vendor APIs from the browser — does not use server quota
  if (byoAiKeys.hasAny()) {
    const byoResult = await fetchWithByoKey(provider, topic, count)
    if (byoResult.length > 0) return byoResult
  }

  const res = await fetch('/api/ai-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, topic, count }),
    signal: AbortSignal.timeout(TIMEOUT.API_REQUEST * 5),
  })

  if (!res.ok) {
    console.warn(`[AI Proxy] ${provider} failed: ${res.status}`)
    if (res.status >= 500 || res.status === 429) {
      captureWarning(
        new Error(`AI proxy ${provider} failed: ${res.status}`),
        { provider, topic, count, status: res.status },
        {
          'ai.provider': provider,
          'ai.endpoint': '/api/ai-quiz',
          'http.status': String(res.status),
          feature: 'quiz',
        },
      )
    }
    return []
  }

  const data = (await res.json()) as { content?: string }
  if (!data.content) return []
  return parseAIQuestions(data.content, topic, count)
}
