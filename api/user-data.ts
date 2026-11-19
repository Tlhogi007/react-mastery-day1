/**
 * Signed-in learner cloud sync + free AI quota status.
 * GET  — merge-ready snapshot + quota remaining
 * PUT  — upsert snapshot (merged with existing cloud copy)
 */
/// <reference types="node" />
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireCloudUser } from './_lib/auth.js'
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
/** Stay under vercel.json maxDuration (20s) for user-data. */
const LONG_POLL_MS = 12_000
const LONG_POLL_STEP_MS = 1_500

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function queryFlag(value: string | string[] | undefined): boolean {
  const v = Array.isArray(value) ? value[0] : value
  return v === '1' || v === 'true'
}

function queryString(value: string | string[] | undefined): string {
  const v = Array.isArray(value) ? value[0] : value
  return typeof v === 'string' ? v : ''
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET' && req.method !== 'PUT') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const auth = await requireCloudUser(req)
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error, code: auth.code })
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

  if (req.method === 'GET') {
    const wait = queryFlag(req.query.wait)
    const since = queryString(req.query.since)

    // Long-poll: hold until cloud.updatedAt changes (or timeout). Cuts client chatter vs 2s polling.
    if (wait && since) {
      const deadline = Date.now() + LONG_POLL_MS
      let raw = await redisGet(key)
      let cloud = parseSnapshot(raw) || emptySnapshot()
      while (cloud.updatedAt === since && Date.now() < deadline) {
        const remaining = deadline - Date.now()
        if (remaining <= 0) break
        await sleep(Math.min(LONG_POLL_STEP_MS, remaining))
        raw = await redisGet(key)
        cloud = parseSnapshot(raw) || emptySnapshot()
      }
      const changed = Boolean(cloud.updatedAt && cloud.updatedAt !== since)
      const quota = await getUserFreeQuotaStatus(auth.user.userId)
      res.status(200).json({ cloud, quota, changed })
      return
    }

    const raw = await redisGet(key)
    const cloud = parseSnapshot(raw) || emptySnapshot()
    const quota = await getUserFreeQuotaStatus(auth.user.userId)
    res.status(200).json({ cloud, quota, changed: true })
    return
  }

  const quota = await getUserFreeQuotaStatus(auth.user.userId)

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
