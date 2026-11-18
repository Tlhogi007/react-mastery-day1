/**
 * Clerk webhooks — purge Upstash learner data when an account is deleted/merged.
 *
 * Dashboard: Webhooks → endpoint
 *   URL: https://<your-app>/api/clerk-webhook
 *   Events: user.deleted, user.merged
 *   Signing secret → CLERK_WEBHOOK_SIGNING_SECRET
 */
/// <reference types="node" />
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyWebhook } from '@clerk/backend/webhooks'
import { purgeUserData } from './_lib/purgeUserData.js'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  if (Buffer.isBuffer(req.body)) return req.body
  if (typeof req.body === 'string') return Buffer.from(req.body)
  if (req.body && typeof req.body === 'object') {
    // Fallback when the platform already parsed JSON (signature may fail).
    return Buffer.from(JSON.stringify(req.body))
  }

  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

function headerValue(
  headers: VercelRequest['headers'],
  name: string,
): string | null {
  const raw = headers[name] ?? headers[name.toLowerCase()]
  if (Array.isArray(raw)) return raw[0] ?? null
  return typeof raw === 'string' ? raw : null
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!process.env.CLERK_WEBHOOK_SIGNING_SECRET) {
    res.status(503).json({ error: 'CLERK_WEBHOOK_SIGNING_SECRET is not configured' })
    return
  }

  try {
    const rawBody = await readRawBody(req)
    const svixId = headerValue(req.headers, 'svix-id')
    const svixTimestamp = headerValue(req.headers, 'svix-timestamp')
    const svixSignature = headerValue(req.headers, 'svix-signature')
    if (!svixId || !svixTimestamp || !svixSignature) {
      res.status(400).json({ error: 'Missing Svix signature headers' })
      return
    }

    const origin =
      process.env.APP_ORIGIN ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost')

    const request = new Request(`${origin.replace(/\/$/, '')}/api/clerk-webhook`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      },
      body: rawBody,
    })

    const evt = await verifyWebhook(request, {
      signingSecret: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
    })

    const purged: Array<{ userId: string; deleted: number }> = []

    if (evt.type === 'user.deleted') {
      const id = (evt.data as { id?: string | null }).id
      if (id) {
        const result = await purgeUserData(id)
        purged.push({ userId: id, deleted: result.deleted })
      }
    }

    if (evt.type === 'user.merged') {
      const deletedUser = (evt.data as { deleted_user?: { id?: string } }).deleted_user
      const deletedId = deletedUser?.id
      if (deletedId) {
        const result = await purgeUserData(deletedId)
        purged.push({ userId: deletedId, deleted: result.deleted })
      }
    }

    res.status(200).json({ ok: true, type: evt.type, purged })
  } catch (err) {
    console.error('[clerk-webhook]', err instanceof Error ? err.message : err)
    res.status(400).json({ error: 'Webhook verification failed' })
  }
}
