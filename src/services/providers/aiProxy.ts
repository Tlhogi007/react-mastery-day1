/**
 * Client → /api/ai-quiz (server holds Groq/Together keys)
 */

import type { QuizQuestion } from '../../types/challenges'
import { TIMEOUT } from '../../constants'
import { parseAIQuestions } from './utils'

export type AiProxyProvider = 'groq' | 'together'

let availabilityCache: { groq: boolean; together: boolean; at: number } | null = null
const AVAIL_TTL_MS = 60_000

export async function getAiProxyAvailability(): Promise<{ groq: boolean; together: boolean }> {
  const now = Date.now()
  if (availabilityCache && now - availabilityCache.at < AVAIL_TTL_MS) {
    return { groq: availabilityCache.groq, together: availabilityCache.together }
  }

  try {
    const res = await fetch('/api/ai-quiz', {
      method: 'GET',
      signal: AbortSignal.timeout(TIMEOUT.API_AVAILABILITY_CHECK),
    })
    if (!res.ok) {
      availabilityCache = { groq: false, together: false, at: now }
      return { groq: false, together: false }
    }
    const data = (await res.json()) as { groq?: boolean; together?: boolean }
    availabilityCache = {
      groq: Boolean(data.groq),
      together: Boolean(data.together),
      at: now,
    }
    return { groq: availabilityCache.groq, together: availabilityCache.together }
  } catch {
    availabilityCache = { groq: false, together: false, at: now }
    return { groq: false, together: false }
  }
}

export async function fetchViaAiProxy(
  provider: AiProxyProvider,
  topic: string,
  count: number,
): Promise<QuizQuestion[]> {
  const res = await fetch('/api/ai-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, topic, count }),
    signal: AbortSignal.timeout(TIMEOUT.API_REQUEST * 5),
  })

  if (!res.ok) {
    console.warn(`[AI Proxy] ${provider} failed: ${res.status}`)
    return []
  }

  const data = (await res.json()) as { content?: string }
  if (!data.content) return []
  return parseAIQuestions(data.content, topic, count)
}
