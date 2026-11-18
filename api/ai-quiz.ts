/**
 * Server-side AI quiz proxy — keeps Groq/Together keys off the client.
 * Env (server only, never VITE_*): GROQ_API_KEY, TOGETHER_API_KEY
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  generateQuizContent,
  providerAvailability,
  type Provider,
} from './_lib/generateQuiz'

const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 20
const hits = new Map<string, { count: number; resetAt: number }>()

function clientIp(req: VercelRequest): string {
  const xf = req.headers['x-forwarded-for']
  if (typeof xf === 'string' && xf.length > 0) return xf.split(',')[0].trim()
  return req.socket?.remoteAddress || 'unknown'
}

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = hits.get(ip)
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= MAX_PER_WINDOW) return false
  entry.count += 1
  return true
}

function envKeys() {
  return {
    groq: process.env.GROQ_API_KEY,
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

  if (!rateLimit(clientIp(req))) {
    res.status(429).json({ error: 'Too many requests' })
    return
  }

  let body: Record<string, unknown> = {}
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  } catch {
    res.status(400).json({ error: 'Invalid JSON' })
    return
  }

  const provider = body.provider as Provider
  const topic = typeof body.topic === 'string' ? body.topic : ''
  const count = Number(body.count) || 3

  if (provider !== 'groq' && provider !== 'together') {
    res.status(400).json({ error: 'Invalid provider' })
    return
  }
  if (!topic.trim()) {
    res.status(400).json({ error: 'Missing topic' })
    return
  }

  const result = await generateQuizContent(provider, topic, count, envKeys())
  if (!result.ok) {
    res.status(result.status).json({ error: result.error })
    return
  }
  res.status(200).json({ content: result.content })
}
