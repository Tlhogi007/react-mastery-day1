/**
 * Server-side AI quiz proxy — Groq → Gemini → Together waterfall.
 * Imports use `.js` extensions for Node 24 ESM on Vercel.
 *
 * Env (server only): GROQ_API_KEY, GEMINI_API_KEY, TOGETHER_API_KEY
 * Caps: AI_QUIZ_MAX_*, AI_QUIZ_GLOBAL_MAX_PER_DAY
 * Optional durable global budget: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 */
/// <reference types="node" />
import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  generateQuizContent,
  providerAvailability,
  type Provider,
} from './_lib/generateQuiz.js'
import { allowAiQuizRequest, clampQuestionCount } from './_lib/aiQuizGuard.js'

function clientIp(req: VercelRequest): string {
  const xf = req.headers['x-forwarded-for']
  if (typeof xf === 'string' && xf.length > 0) return xf.split(',')[0].trim()
  return req.socket?.remoteAddress || 'unknown'
}

function envKeys() {
  return {
    groq: process.env.GROQ_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    together: process.env.TOGETHER_API_KEY,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET') {
    res.status(200).json(providerAvailability(envKeys()))
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const guard = await allowAiQuizRequest(clientIp(req))
  if (!guard.ok) {
    if (guard.retryAfterSec) {
      res.setHeader('Retry-After', String(guard.retryAfterSec))
    }
    res.status(guard.status).json({ error: guard.error })
    return
  }

  let body: Record<string, unknown> = {}
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  } catch {
    res.status(400).json({ error: 'Invalid JSON' })
    return
  }

  const rawProvider = body.provider
  const provider = (
    rawProvider === 'groq' ||
    rawProvider === 'gemini' ||
    rawProvider === 'together' ||
    rawProvider === 'auto'
      ? rawProvider
      : 'auto'
  ) as Provider
  const topic = typeof body.topic === 'string' ? body.topic : ''
  const count = clampQuestionCount(body.count)

  if (!topic.trim()) {
    res.status(400).json({ error: 'Missing topic' })
    return
  }

  const result = await generateQuizContent(provider, topic, count, envKeys())
  if (!result.ok) {
    res.status(result.status).json({ error: result.error })
    return
  }
  res.status(200).json({ content: result.content, provider: result.used || provider })
}
