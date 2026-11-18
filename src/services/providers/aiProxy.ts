/**
 * Client → /api/ai-quiz (server holds Groq/Gemini/Together keys)
 * Prefer BYO keys when present (does not burn hosted quota / skip auth).
 */

import type { QuizQuestion } from '../../types/challenges'
import { TIMEOUT } from '../../constants'
import { parseAIQuestions } from './utils'
import { captureWarning } from '../../lib/sentry'
import { byoAiKeys } from '../byoAiKeys'
import { fetchWithByoKey } from './byoDirect'
import { clearAiGate, emitAiGate, waitForAiAuthToken } from '../aiAuthBridge'

export type AiProxyProvider = 'auto' | 'groq' | 'gemini' | 'together'

let availabilityCache: {
  groq: boolean
  gemini: boolean
  together: boolean
  authRequired: boolean
  at: number
} | null = null
const AVAIL_TTL_MS = 60_000

export async function getAiProxyAvailability(): Promise<{
  groq: boolean
  gemini: boolean
  together: boolean
  authRequired: boolean
}> {
  const byo = byoAiKeys.get()
  if (byo.groq || byo.gemini || byo.together) {
    return {
      groq: Boolean(byo.groq),
      gemini: Boolean(byo.gemini),
      together: Boolean(byo.together),
      authRequired: false,
    }
  }

  const now = Date.now()
  if (availabilityCache && now - availabilityCache.at < AVAIL_TTL_MS) {
    return {
      groq: availabilityCache.groq,
      gemini: availabilityCache.gemini,
      together: availabilityCache.together,
      authRequired: availabilityCache.authRequired,
    }
  }

  try {
    const res = await fetch('/api/ai-quiz', {
      method: 'GET',
      signal: AbortSignal.timeout(TIMEOUT.API_AVAILABILITY_CHECK),
    })
    if (!res.ok) {
      availabilityCache = { groq: false, gemini: false, together: false, authRequired: false, at: now }
      return { groq: false, gemini: false, together: false, authRequired: false }
    }
    const data = (await res.json()) as {
      groq?: boolean
      gemini?: boolean
      together?: boolean
      authRequired?: boolean
    }
    availabilityCache = {
      groq: Boolean(data.groq),
      gemini: Boolean(data.gemini),
      together: Boolean(data.together),
      authRequired: Boolean(data.authRequired),
      at: now,
    }
    return {
      groq: availabilityCache.groq,
      gemini: availabilityCache.gemini,
      together: availabilityCache.together,
      authRequired: availabilityCache.authRequired,
    }
  } catch {
    availabilityCache = { groq: false, gemini: false, together: false, authRequired: false, at: now }
    return { groq: false, gemini: false, together: false, authRequired: false }
  }
}

export async function fetchViaAiProxy(
  provider: AiProxyProvider,
  topic: string,
  count: number,
): Promise<QuizQuestion[]> {
  // BYO keys: call vendor APIs from the browser — no hosted quota / auth
  if (byoAiKeys.hasAny()) {
    const byoResult = await fetchWithByoKey(provider, topic, count)
    if (byoResult.length > 0) return byoResult
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  // After OAuth remount, Clerk token may not be ready on the first tick
  let token = await waitForAiAuthToken(15, 80)
  if (token) headers.Authorization = `Bearer ${token}`

  const body = JSON.stringify({ provider, topic, count })
  let res = await fetch('/api/ai-quiz', {
    method: 'POST',
    headers,
    body,
    signal: AbortSignal.timeout(TIMEOUT.API_REQUEST * 5),
  })

  // One retry if we raced before the session token was available
  if (res.status === 401) {
    token = await waitForAiAuthToken(20, 100)
    if (token) {
      headers.Authorization = `Bearer ${token}`
      res = await fetch('/api/ai-quiz', {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(TIMEOUT.API_REQUEST * 5),
      })
    }
  }

  if (!res.ok) {
    let message = `AI proxy ${provider} failed: ${res.status}`
    let code: string | undefined
    try {
      const errBody = (await res.json()) as { error?: string; code?: string }
      if (errBody.error) message = errBody.error
      code = errBody.code
    } catch {
      /* ignore */
    }

    console.warn(`[AI Proxy] ${provider} failed: ${res.status}`, message)

    if (res.status === 401 || code === 'auth_required') {
      emitAiGate({
        mode: 'auth',
        message: message || 'Sign in to use hosted AI quiz generation, or add your own API key in Settings.',
      })
      return []
    }
    if (res.status === 403 || code === 'email_verification_required') {
      emitAiGate({
        mode: 'quota',
        message:
          message ||
          'Verify your email to use free hosted AI, or add your own API key in Settings.',
      })
      return []
    }
    if (res.status === 402 || code === 'quota_exceeded') {
      emitAiGate({
        mode: 'quota',
        message:
          message ||
          'Free hosted AI limit reached. Add your own free API key in Settings to continue.',
      })
      return []
    }
    if (res.status === 503 || code === 'quota_unavailable') {
      emitAiGate({
        mode: 'quota',
        message:
          message ||
          'Hosted free AI is temporarily unavailable. Add your own API key in Settings to continue.',
      })
      return []
    }

    if (res.status >= 500 || res.status === 429) {
      captureWarning(
        new Error(message),
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
  clearAiGate()
  return parseAIQuestions(data.content, topic, count)
}
