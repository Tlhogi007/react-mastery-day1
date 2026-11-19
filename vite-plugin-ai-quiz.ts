/**
 * Local-dev middleware mirroring /api/ai-quiz so Vite can run without `vercel dev`.
 */
import type { Plugin, Connect } from 'vite'
import {
  generateQuizContent,
  providerAvailability,
  type Provider,
} from './api/_lib/generateQuiz'
import { loadDevServerEnv } from './vite-plugin-env'
import {
  allowAiQuizRequest,
  allowUserFreeQuota,
  clampQuestionCount,
} from './api/_lib/aiQuizGuard'
import { createClerkClient, verifyToken } from '@clerk/backend'
import { clerkAuthorizedParties, isAiBanned } from './api/_lib/auth'

const OAUTH_PROVIDERS = new Set(['oauth_google', 'oauth_github', 'google', 'github'])

function readBody(req: Connect.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

async function resolveUserId(
  req: Connect.IncomingMessage,
  secretKey: string | undefined,
): Promise<
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403; error: string; code: string }
> {
  if (!secretKey) return { ok: true, userId: 'anonymous' }
  const header = req.headers.authorization
  const token =
    typeof header === 'string' && header.startsWith('Bearer ')
      ? header.slice('Bearer '.length).trim()
      : ''
  if (!token) {
    return {
      ok: false,
      status: 401,
      code: 'auth_required',
      error: 'Sign in to use hosted AI quiz generation.',
    }
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
      // Local/dev: retry without azp allowlist when IDE/proxy origins differ
      console.warn('[ai-quiz-dev] verifyToken with authorizedParties failed:', azpErr)
      payload = await verifyToken(token, { secretKey })
    }
    if (!payload.sub) {
      return {
        ok: false,
        status: 401,
        code: 'auth_required',
        error: 'Sign in to use hosted AI quiz generation.',
      }
    }
    const user = await createClerkClient({ secretKey }).users.getUser(payload.sub)
    if (isAiBanned(user)) {
      return {
        ok: false,
        status: 403,
        code: 'ai_banned',
        error:
          'Hosted AI access is disabled for this account. Use your own API key in Settings.',
      }
    }
    const allowed =
      user.emailAddresses.some((e) => e.verification?.status === 'verified') ||
      user.externalAccounts.some((a) => OAUTH_PROVIDERS.has(a.provider))
    if (!allowed) {
      return {
        ok: false,
        status: 403,
        code: 'email_verification_required',
        error:
          'Verify your email to use free hosted AI, or add your own API key in Settings.',
      }
    }
    return { ok: true, userId: payload.sub }
  } catch (err) {
    console.warn('[ai-quiz-dev] auth failed:', err)
    return {
      ok: false,
      status: 401,
      code: 'auth_required',
      error: 'Session expired. Sign in again to use hosted AI.',
    }
  }
}

export function aiQuizDevPlugin(): Plugin {
  return {
    name: 'ai-quiz-dev',
    configureServer(server) {
      const env = loadDevServerEnv(server.config.mode, server.config.root)
      const keys = {
        groq: env.GROQ_API_KEY || process.env.GROQ_API_KEY,
        gemini: env.GEMINI_API_KEY || process.env.GEMINI_API_KEY,
        together: env.TOGETHER_API_KEY || process.env.TOGETHER_API_KEY,
      }
      const clerkSecret = env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url !== '/api/ai-quiz') {
          next()
          return
        }

        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')

        if (req.method === 'GET') {
          res.statusCode = 200
          res.end(
            JSON.stringify({
              ...providerAvailability(keys),
              authRequired: Boolean(clerkSecret),
              freePerUserDay: Number(env.AI_QUIZ_FREE_PER_USER_DAY || process.env.AI_QUIZ_FREE_PER_USER_DAY) || 5,
            }),
          )
          return
        }

        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        const auth = await resolveUserId(req, clerkSecret)
        if (!auth.ok) {
          res.statusCode = auth.status
          res.end(JSON.stringify({ error: auth.error, code: auth.code }))
          return
        }

        try {
          const raw = await readBody(req)
          let body: {
            provider?: Provider
            topic?: string
            count?: number
          }
          try {
            body = JSON.parse(raw || '{}') as typeof body
          } catch {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Invalid JSON' }))
            return
          }

          const provider: Provider =
            body.provider === 'groq' ||
            body.provider === 'gemini' ||
            body.provider === 'together' ||
            body.provider === 'auto'
              ? body.provider
              : 'auto'
          const topic = body.topic || ''
          const count = clampQuestionCount(body.count)

          if (!topic.trim()) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Missing topic' }))
            return
          }

          const userQuota = await allowUserFreeQuota(auth.userId)
          if (!userQuota.ok) {
            res.statusCode = userQuota.status
            res.end(
              JSON.stringify({
                error: userQuota.error,
                code: userQuota.code || 'quota_exceeded',
              }),
            )
            return
          }

          const ip = req.socket.remoteAddress || 'local'
          const guard = await allowAiQuizRequest(ip)
          if (!guard.ok) {
            if (guard.retryAfterSec) {
              res.setHeader('Retry-After', String(guard.retryAfterSec))
            }
            res.statusCode = guard.status
            res.end(JSON.stringify({ error: guard.error, code: guard.code }))
            return
          }

          const result = await generateQuizContent(provider, topic, count, keys)
          if (!result.ok) {
            res.statusCode = result.status
            res.end(JSON.stringify({ error: result.error }))
            return
          }
          res.statusCode = 200
          res.end(JSON.stringify({ content: result.content, provider: result.used || provider }))
        } catch {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Proxy error' }))
        }
      })
    },
  }
}
