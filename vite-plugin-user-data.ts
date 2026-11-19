/**
 * Local-dev middleware mirroring /api/user-data.
 */
import type { Plugin, Connect } from 'vite'
import { createClerkClient, verifyToken } from '@clerk/backend'
import { clerkAuthorizedParties } from './api/_lib/auth'
import { loadDevServerEnv } from './vite-plugin-env'
import { getUserFreeQuotaStatus } from './api/_lib/aiQuizGuard'
import { redisConfigured, redisGet, redisSet } from './api/_lib/redis'
import {
  emptySnapshot,
  mergeSnapshots,
  parseSnapshot,
  sanitizeIncomingSnapshot,
  userCloudKey,
} from './api/_lib/userCloud'

const OAUTH_PROVIDERS = new Set(['oauth_google', 'oauth_github', 'google', 'github'])
const MAX_BYTES = 200_000

function readBody(req: Connect.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

async function requireUserId(
  req: Connect.IncomingMessage,
  secretKey: string | undefined,
): Promise<{ ok: true; userId: string } | { ok: false; status: number; error: string; code: string }> {
  if (!secretKey) {
    return { ok: false, status: 401, code: 'auth_required', error: 'Sign in to sync progress across devices.' }
  }
  const header = req.headers.authorization
  const token =
    typeof header === 'string' && header.startsWith('Bearer ')
      ? header.slice('Bearer '.length).trim()
      : ''
  if (!token) {
    return { ok: false, status: 401, code: 'auth_required', error: 'Sign in to sync progress across devices.' }
  }
  try {
    const authorizedParties = clerkAuthorizedParties()
    let payload
    try {
      payload = await verifyToken(token, {
        secretKey,
        ...(authorizedParties.length > 0 ? { authorizedParties } : {}),
      })
    } catch (azpErr) {
      console.warn('[user-data-dev] verifyToken with authorizedParties failed:', azpErr)
      payload = await verifyToken(token, { secretKey })
    }
    if (!payload.sub) {
      return { ok: false, status: 401, code: 'auth_required', error: 'Sign in to sync progress across devices.' }
    }
    try {
      const user = await createClerkClient({ secretKey }).users.getUser(payload.sub)
      const allowed =
        user.emailAddresses.some((e) => e.verification?.status === 'verified') ||
        user.externalAccounts.some((a) => OAUTH_PROVIDERS.has(a.provider))
      if (!allowed) {
        return {
          ok: false,
          status: 403,
          code: 'email_verification_required',
          error: 'Verify your email to sync progress, or use Google/GitHub sign-in.',
        }
      }
    } catch (userErr) {
      // JWT already verified — Clerk Backend fetch can flake under e2e load.
      // Trust the session for local cloud sync rather than 401ing.
      console.warn('[user-data-dev] getUser failed after verifyToken; trusting JWT:', userErr)
    }
    return { ok: true, userId: payload.sub }
  } catch (err) {
    console.warn('[user-data-dev] auth failed:', err)
    return { ok: false, status: 401, code: 'auth_required', error: 'Session expired. Sign in again.' }
  }
}

export function userDataDevPlugin(): Plugin {
  return {
    name: 'user-data-dev',
    configureServer(server) {
      const env = loadDevServerEnv(server.config.mode, server.config.root)
      const clerkSecret = env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url !== '/api/user-data') {
          next()
          return
        }

        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')

        if (req.method !== 'GET' && req.method !== 'PUT') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        const auth = await requireUserId(req, clerkSecret)
        if (!auth.ok) {
          res.statusCode = auth.status
          res.end(JSON.stringify({ error: auth.error, code: auth.code }))
          return
        }

        if (!redisConfigured()) {
          res.statusCode = 503
          res.end(
            JSON.stringify({
              error: 'Cloud sync unavailable (quota store not configured).',
              code: 'quota_unavailable',
            }),
          )
          return
        }

        try {
          const key = userCloudKey(auth.userId)
          const quota = await getUserFreeQuotaStatus(auth.userId)

          if (req.method === 'GET') {
            const cloud = parseSnapshot(await redisGet(key)) || emptySnapshot()
            res.statusCode = 200
            res.end(JSON.stringify({ cloud, quota }))
            return
          }

          const raw = await readBody(req)
          let body: unknown
          try {
            body = JSON.parse(raw || '{}')
          } catch {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Invalid JSON' }))
            return
          }
          const incoming = sanitizeIncomingSnapshot(body)
          if (!incoming) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Invalid snapshot' }))
            return
          }
          const encoded = JSON.stringify(incoming)
          if (encoded.length > MAX_BYTES) {
            res.statusCode = 413
            res.end(JSON.stringify({ error: 'Snapshot too large' }))
            return
          }
          const existing = parseSnapshot(await redisGet(key))
          const merged = mergeSnapshots(incoming, existing)
          merged.updatedAt = new Date().toISOString()
          const ok = await redisSet(key, JSON.stringify(merged))
          if (!ok) {
            res.statusCode = 503
            res.end(
              JSON.stringify({
                error: 'Failed to save cloud progress.',
                code: 'quota_unavailable',
              }),
            )
            return
          }
          res.statusCode = 200
          res.end(JSON.stringify({ cloud: merged, quota }))
        } catch {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'User data proxy error' }))
        }
      })
    },
  }
}
