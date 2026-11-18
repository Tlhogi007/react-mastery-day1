/**
 * Signed-in learner cloud sync + free AI quota status.
 * GET  — merge-ready snapshot + quota remaining
 * PUT  — upsert snapshot (merged with existing cloud copy)
 */
/// <reference types="node" />
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAiUser } from './_lib/auth.js'
import { getUserFreeQuotaStatus } from './_lib/aiQuizGuard.js'
import { redisConfigured, redisGet, redisSet } from './_lib/redis.js'
import {
  emptySnapshot,
  mergeSnapshots,
  parseSnapshot,
  sanitizeIncomingSnapshot,
  userCloudKey,
} from './_lib/userCloud.js'

const MAX_BYTES = 200_000

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET' && req.method !== 'PUT') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const auth = await requireAiUser(req)
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error, code: auth.code })
    return
  }
  if (auth.user.userId === 'anonymous') {
    res.status(401).json({
      error: 'Sign in to sync progress across devices.',
      code: 'auth_required',
    })
    return
  }

  if (!redisConfigured()) {
    res.status(503).json({
      error: 'Cloud sync unavailable (quota store not configured).',
      code: 'quota_unavailable',
    })
    return
  }

  const key = userCloudKey(auth.user.userId)
  const quota = await getUserFreeQuotaStatus(auth.user.userId)

  if (req.method === 'GET') {
    const raw = await redisGet(key)
    const cloud = parseSnapshot(raw) || emptySnapshot()
    res.status(200).json({ cloud, quota })
    return
  }

  let body: unknown = req.body
  try {
    if (typeof body === 'string') body = JSON.parse(body || '{}')
  } catch {
    res.status(400).json({ error: 'Invalid JSON' })
    return
  }

  const incoming = sanitizeIncomingSnapshot(body)
  if (!incoming) {
    res.status(400).json({ error: 'Invalid snapshot' })
    return
  }

  const encoded = JSON.stringify(incoming)
  if (encoded.length > MAX_BYTES) {
    res.status(413).json({ error: 'Snapshot too large' })
    return
  }

  const existing = parseSnapshot(await redisGet(key))
  const merged = mergeSnapshots(incoming, existing)
  merged.updatedAt = new Date().toISOString()
  const ok = await redisSet(key, JSON.stringify(merged))
  if (!ok) {
    res.status(503).json({
      error: 'Failed to save cloud progress.',
      code: 'quota_unavailable',
    })
    return
  }

  res.status(200).json({ cloud: merged, quota })
}
