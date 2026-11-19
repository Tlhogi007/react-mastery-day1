import type { VercelRequest, VercelResponse } from '@vercel/node'
import { redisCommand, redisConfigured, redisGet, redisSet } from './_lib/redis'

const COUNTS_KEY = 'rm:community:helpful:counts'

async function readCounts(): Promise<Record<string, number>> {
  const raw = await redisGet(COUNTS_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as Record<string, number>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeCounts(counts: Record<string, number>): Promise<void> {
  await redisSet(COUNTS_KEY, JSON.stringify(counts))
}

function sanitizeSlug(slug: unknown): string | null {
  if (typeof slug !== 'string') return null
  const s = slug.trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9-]{0,80}$/.test(s)) return null
  return s
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET') {
    if (!redisConfigured()) {
      res.status(200).json({ counts: {}, available: false })
      return
    }
    const counts = await readCounts()
    res.status(200).json({ counts, available: true })
    return
  }

  if (req.method === 'POST') {
    if (!redisConfigured()) {
      res.status(503).json({ error: 'Votes unavailable', code: 'redis_missing' })
      return
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const slug = sanitizeSlug(body.slug)
    if (!slug) {
      res.status(400).json({ error: 'Invalid slug' })
      return
    }
    const helpful = Boolean(body.helpful)
    const counts = await readCounts()
    const prev = Number(counts[slug] || 0)
    counts[slug] = Math.max(0, prev + (helpful ? 1 : -1))
    await writeCounts(counts)
    // Touch key so Upstash stays warm; ignore result
    void redisCommand(['EXPIRE', COUNTS_KEY, 60 * 60 * 24 * 365])
    res.status(200).json({ count: counts[slug], counts })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
