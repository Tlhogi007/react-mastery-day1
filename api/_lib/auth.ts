/**
 * Clerk JWT verification for API routes.
 * - requireAiUser: hosted AI (verified email/OAuth + not aiBanned; anonymous if Clerk unset)
 * - requireCloudUser: learner sync (verified email/OAuth; bans do NOT apply)
 * - requireAdminUser: ADMIN_USER_IDS or metadata.role=admin
 */

import { createClerkClient, verifyToken } from '@clerk/backend'
import type { User } from '@clerk/backend'
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
  if (process.env.VERCEL_URL) {
    parties.add(`https://${process.env.VERCEL_URL.replace(/\/$/, '')}`)
  }
  if (process.env.NODE_ENV !== 'production') {
    parties.add('http://localhost:5173')
    parties.add('http://127.0.0.1:5173')
  }
  return [...parties]
}

export function clerkClient() {
  return createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })
}

export function isAiBanned(user: User): boolean {
  const priv = user.privateMetadata as Record<string, unknown> | undefined
  const pub = user.publicMetadata as Record<string, unknown> | undefined
  return priv?.aiBanned === true || pub?.aiBanned === true
}

export function isAdminUser(user: User): boolean {
  const allow = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (allow.includes(user.id)) return true
  const priv = user.privateMetadata as Record<string, unknown> | undefined
  const pub = user.publicMetadata as Record<string, unknown> | undefined
  return pub?.role === 'admin' || priv?.role === 'admin'
}

function userMayUseHostedAi(user: User): boolean {
  if (user.emailAddresses.some((e) => e.verification?.status === 'verified')) {
    return true
  }
  return user.externalAccounts.some((a) => OAUTH_PROVIDERS.has(a.provider))
}

async function verifyBearerUser(req: VercelRequest): Promise<
  | { ok: true; user: User }
  | {
      ok: false
      status: 401 | 403
      error: string
      code: 'auth_required' | 'email_verification_required' | 'ai_banned'
    }
> {
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
      error: 'Sign in to continue.',
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
        error: 'Sign in to continue.',
      }
    }
    const user = await clerkClient().users.getUser(userId)
    return { ok: true, user }
  } catch {
    return {
      ok: false,
      status: 401,
      code: 'auth_required',
      error: 'Session expired. Sign in again.',
    }
  }
}

export async function requireAiUser(req: VercelRequest): Promise<
  | { ok: true; user: AuthUser }
  | {
      ok: false
      status: 401 | 403
      error: string
      code: 'auth_required' | 'email_verification_required' | 'ai_banned'
    }
> {
  if (!clerkConfigured()) {
    return { ok: true, user: { userId: 'anonymous' } }
  }

  const verified = await verifyBearerUser(req)
  if (!verified.ok) return verified

  if (isAiBanned(verified.user)) {
    return {
      ok: false,
      status: 403,
      code: 'ai_banned',
      error: 'Hosted AI access is disabled for this account. Use your own API key in Settings.',
    }
  }

  if (!userMayUseHostedAi(verified.user)) {
    return {
      ok: false,
      status: 403,
      code: 'email_verification_required',
      error:
        'Verify your email to use free hosted AI, or add your own API key in Settings.',
    }
  }

  return { ok: true, user: { userId: verified.user.id } }
}

/**
 * Cloud sync / account data — signed-in verified users only.
 * Intentionally ignores aiBanned so an AI ban cannot lock progress sync.
 */
export async function requireCloudUser(req: VercelRequest): Promise<
  | { ok: true; user: AuthUser }
  | {
      ok: false
      status: 401 | 403
      error: string
      code: 'auth_required' | 'email_verification_required'
    }
> {
  if (!clerkConfigured()) {
    return {
      ok: false,
      status: 401,
      code: 'auth_required',
      error: 'Sign in to sync progress across devices.',
    }
  }

  const verified = await verifyBearerUser(req)
  if (!verified.ok) {
    return {
      ok: false,
      status: verified.status === 401 ? 401 : 403,
      code: verified.status === 401 ? 'auth_required' : 'email_verification_required',
      error:
        verified.code === 'auth_required'
          ? 'Sign in to sync progress across devices.'
          : verified.error,
    }
  }

  if (!userMayUseHostedAi(verified.user)) {
    return {
      ok: false,
      status: 403,
      code: 'email_verification_required',
      error: 'Verify your email to sync progress, or use Google/GitHub sign-in.',
    }
  }

  return { ok: true, user: { userId: verified.user.id } }
}

export async function requireAdminUser(req: VercelRequest): Promise<
  | { ok: true; user: User }
  | {
      ok: false
      status: 401 | 403
      error: string
      code: 'auth_required' | 'admin_required'
    }
> {
  if (!clerkConfigured()) {
    return {
      ok: false,
      status: 401,
      code: 'auth_required',
      error: 'Clerk is not configured.',
    }
  }

  const verified = await verifyBearerUser(req)
  if (!verified.ok) {
    return {
      ok: false,
      status: verified.status === 401 ? 401 : 403,
      code: verified.status === 401 ? 'auth_required' : 'admin_required',
      error: verified.error,
    }
  }

  if (!isAdminUser(verified.user)) {
    return {
      ok: false,
      status: 403,
      code: 'admin_required',
      error: 'Admin access required.',
    }
  }

  return { ok: true, user: verified.user }
}
