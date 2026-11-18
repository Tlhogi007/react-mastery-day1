/**
 * Admin AI usage + ban controls.
 * Auth: Bearer Clerk JWT + ADMIN_USER_IDS or metadata.role === 'admin'
 *
 * GET  → today's (and recent) per-user free-tier usage from Redis + Clerk profile
 * POST → { userId, aiBanned: boolean } updates privateMetadata.aiBanned
 */
/// <reference types="node" />
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clerkClient, requireAdminUser } from './_lib/auth.js'
import { freePerUserDayLimit } from './_lib/aiQuizGuard.js'
import { redisConfigured, redisGet, redisKeys } from './_lib/redis.js'

function utcDay(offset = 0): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + offset)
  return d.toISOString().slice(0, 10)
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const admin = await requireAdminUser(req)
  if (!admin.ok) {
    res.status(admin.status).json({ error: admin.error, code: admin.code })
    return
  }

  if (!redisConfigured()) {
    res.status(503).json({ error: 'Redis is not configured', code: 'quota_unavailable' })
    return
  }

  const limit = freePerUserDayLimit()
  const client = clerkClient()

  if (req.method === 'GET') {
    const keys = await redisKeys('ai-quiz:user:*')
    const byUser = new Map<
      string,
      { userId: string; days: Array<{ day: string; used: number }>; usedToday: number }
    >()

    for (const key of keys) {
      const parts = key.split(':')
      // ai-quiz:user:{userId}:{day}
      if (parts.length < 4) continue
      const day = parts[parts.length - 1]
      const userId = parts.slice(2, -1).join(':')
      if (!userId || !/^\d{4}-\d{2}-\d{2}$/.test(day)) continue
      const used = Math.max(0, Number(await redisGet(key)) || 0)
      const row = byUser.get(userId) || { userId, days: [], usedToday: 0 }
      row.days.push({ day, used })
      if (day === utcDay()) row.usedToday = used
      byUser.set(userId, row)
    }

    const users = []
    for (const row of byUser.values()) {
      let email: string | null = null
      let name: string | null = null
      let aiBanned = false
      try {
        const u = await client.users.getUser(row.userId)
        email = u.primaryEmailAddress?.emailAddress || u.emailAddresses[0]?.emailAddress || null
        name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || null
        const priv = u.privateMetadata as Record<string, unknown>
        const pub = u.publicMetadata as Record<string, unknown>
        aiBanned = priv?.aiBanned === true || pub?.aiBanned === true
      } catch {
        /* user may be deleted */
      }
      users.push({
        userId: row.userId,
        email,
        name,
        aiBanned,
        usedToday: row.usedToday,
        limit,
        remainingToday: Math.max(0, limit - row.usedToday),
        days: row.days.sort((a, b) => b.day.localeCompare(a.day)).slice(0, 7),
      })
    }

    users.sort((a, b) => b.usedToday - a.usedToday || (a.email || '').localeCompare(b.email || ''))

    res.status(200).json({
      day: utcDay(),
      limit,
      users,
      adminUserId: admin.user.id,
    })
    return
  }

  let body: Record<string, unknown> = {}
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  } catch {
    res.status(400).json({ error: 'Invalid JSON' })
    return
  }

  const userId = typeof body.userId === 'string' ? body.userId.trim() : ''
  const aiBanned = body.aiBanned === true
  if (!userId) {
    res.status(400).json({ error: 'Missing userId' })
    return
  }

  try {
    const existing = await client.users.getUser(userId)
    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        ...existing.privateMetadata,
        aiBanned,
      },
    })
    res.status(200).json({ ok: true, userId, aiBanned })
  } catch {
    res.status(404).json({ error: 'User not found' })
  }
}
