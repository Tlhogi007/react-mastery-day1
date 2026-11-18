/**
 * Clerk JWT verification for hosted AI routes.
 * Requires a signed-in user with a verified email (or Google/GitHub OAuth).
 * If CLERK_SECRET_KEY is unset, hosted AI stays on IP caps only (legacy).
 */

import { createClerkClient, verifyToken } from '@clerk/backend'
import type { VercelRequest } from '@vercel/node'

export type AuthUser = { userId: string }

const OAUTH_PROVIDERS = new Set([
  'oauth_google',
  'oauth_github',
  'google',
  'github',
])

export function clerkConfigured(): boolean {
  return Boolean(process.env.CLERK_SECRET_KEY)
}

/**
 * Origins allowed in the JWT `azp` claim.
 * Set CLERK_AUTHORIZED_PARTIES or APP_ORIGIN (comma-separated) in production
 * so preview/other-origin tokens cannot burn production AI budget.
 */
export function clerkAuthorizedParties(): string[] {
  const parties = new Set<string>()
  const explicit = process.env.CLERK_AUTHORIZED_PARTIES || process.env.APP_ORIGIN || ''
  for (const part of explicit.split(',')) {
    const trimmed = part.trim().replace(/\/$/, '')
    if (trimmed) parties.add(trimmed)
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    parties.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, '')}`)
  }
  // Current deployment only (prod or this preview) — not every preview URL.
  if (process.env.VERCEL_URL) {
    parties.add(`https://${process.env.VERCEL_URL.replace(/\/$/, '')}`)
  }
  if (process.env.NODE_ENV !== 'production') {
    parties.add('http://localhost:5173')
    parties.add('http://127.0.0.1:5173')
  }
  return [...parties]
}

function clerkClient() {
  return createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })
}

async function userMayUseHostedAi(userId: string): Promise<boolean> {
  const user = await clerkClient().users.getUser(userId)
  if (user.emailAddresses.some((e) => e.verification?.status === 'verified')) {
    return true
  }
  return user.externalAccounts.some((a) => OAUTH_PROVIDERS.has(a.provider))
}

export async function requireAiUser(req: VercelRequest): Promise<
  | { ok: true; user: AuthUser }
  | {
      ok: false
      status: 401 | 403
      error: string
      code: 'auth_required' | 'email_verification_required'
    }
> {
  if (!clerkConfigured()) {
    // Auth not wired yet — caller may still apply IP caps
    return { ok: true, user: { userId: 'anonymous' } }
  }

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
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
      ...(authorizedParties.length > 0 ? { authorizedParties } : {}),
    })
    const userId = payload.sub
    if (!userId) {
      return {
        ok: false,
        status: 401,
        code: 'auth_required',
        error: 'Sign in to use hosted AI quiz generation.',
      }
    }

    const allowed = await userMayUseHostedAi(userId)
    if (!allowed) {
      return {
        ok: false,
        status: 403,
        code: 'email_verification_required',
        error:
          'Verify your email to use free hosted AI, or add your own API key in Settings.',
      }
    }

    return { ok: true, user: { userId } }
  } catch {
    return {
      ok: false,
      status: 401,
      code: 'auth_required',
      error: 'Session expired. Sign in again to use hosted AI.',
    }
  }
}
