import type { User } from '@clerk/backend'
import type { VercelRequest } from '@vercel/node'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const clerk = vi.hoisted(() => ({
  verifyToken: vi.fn(),
  getUser: vi.fn(),
  createClerkClient: vi.fn(),
}))

vi.mock('@clerk/backend', () => ({
  verifyToken: clerk.verifyToken,
  createClerkClient: clerk.createClerkClient,
}))

import {
  clerkAuthorizedParties,
  clerkClient,
  clerkConfigured,
  isAdminUser,
  isAiBanned,
  requireAdminUser,
  requireAiUser,
  requireCloudUser,
} from './auth'

const ENV_KEYS = [
  'CLERK_SECRET_KEY',
  'CLERK_AUTHORIZED_PARTIES',
  'APP_ORIGIN',
  'VERCEL_PROJECT_PRODUCTION_URL',
  'VERCEL_URL',
  'VERCEL_ENV',
  'NODE_ENV',
  'ADMIN_USER_IDS',
]

const fakeUser = (p: Partial<Record<string, unknown>> = {}): User =>
  ({
    id: 'user_1',
    privateMetadata: {},
    publicMetadata: {},
    emailAddresses: [{ verification: { status: 'verified' } }],
    externalAccounts: [],
    ...p,
  }) as unknown as User

const req = (authorization?: string) =>
  ({ headers: authorization === undefined ? {} : { authorization } }) as unknown as VercelRequest

beforeEach(() => {
  for (const k of ENV_KEYS) vi.stubEnv(k, '')
  vi.stubEnv('NODE_ENV', 'test')
  clerk.verifyToken.mockReset()
  clerk.getUser.mockReset()
  clerk.createClerkClient.mockReset().mockReturnValue({ users: { getUser: clerk.getUser } })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('clerkConfigured', () => {
  it('reflects CLERK_SECRET_KEY', () => {
    expect(clerkConfigured()).toBe(false)
    vi.stubEnv('CLERK_SECRET_KEY', 'sk')
    expect(clerkConfigured()).toBe(true)
  })
})

describe('clerkAuthorizedParties', () => {
  it('includes localhost origins outside production', () => {
    expect(clerkAuthorizedParties()).toEqual(['http://localhost:5173', 'http://127.0.0.1:5173'])
  })

  it('parses explicit list (trims, strips trailing slash, dedupes)', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('CLERK_AUTHORIZED_PARTIES', ' https://a.com/ , https://b.com,, https://a.com ')
    expect(clerkAuthorizedParties()).toEqual(['https://a.com', 'https://b.com'])
  })

  it('falls back to APP_ORIGIN and adds Vercel URLs', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('APP_ORIGIN', 'https://app.com/')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'prod.vercel.app/')
    vi.stubEnv('VERCEL_URL', 'preview.vercel.app')
    expect(clerkAuthorizedParties()).toEqual([
      'https://app.com',
      'https://prod.vercel.app',
      'https://preview.vercel.app',
    ])
  })

  it('is empty in production with no config', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(clerkAuthorizedParties()).toEqual([])
  })
})

describe('clerkClient', () => {
  it('creates a client with the secret key', () => {
    vi.stubEnv('CLERK_SECRET_KEY', 'sk')
    clerkClient()
    expect(clerk.createClerkClient).toHaveBeenCalledWith({ secretKey: 'sk' })
  })
})

describe('isAiBanned', () => {
  it('detects ban in private or public metadata', () => {
    expect(isAiBanned(fakeUser())).toBe(false)
    expect(isAiBanned(fakeUser({ privateMetadata: { aiBanned: true } }))).toBe(true)
    expect(isAiBanned(fakeUser({ publicMetadata: { aiBanned: true } }))).toBe(true)
    expect(isAiBanned(fakeUser({ publicMetadata: { aiBanned: 'true' } }))).toBe(false)
    expect(isAiBanned(fakeUser({ privateMetadata: undefined, publicMetadata: undefined }))).toBe(false)
  })
})

describe('isAdminUser', () => {
  it('matches ADMIN_USER_IDS allowlist', () => {
    vi.stubEnv('ADMIN_USER_IDS', 'x, user_1 ,y')
    expect(isAdminUser(fakeUser())).toBe(true)
    vi.stubEnv('ADMIN_USER_IDS', 'x,y')
    expect(isAdminUser(fakeUser())).toBe(false)
  })

  it('matches role=admin metadata', () => {
    expect(isAdminUser(fakeUser({ publicMetadata: { role: 'admin' } }))).toBe(true)
    expect(isAdminUser(fakeUser({ privateMetadata: { role: 'admin' } }))).toBe(true)
    expect(isAdminUser(fakeUser({ publicMetadata: { role: 'user' } }))).toBe(false)
    expect(isAdminUser(fakeUser({ privateMetadata: undefined, publicMetadata: undefined }))).toBe(false)
  })
})

describe('requireAiUser', () => {
  it('allows anonymous in dev when clerk is unset', async () => {
    expect(await requireAiUser(req())).toEqual({ ok: true, user: { userId: 'anonymous' } })
  })

  it('fails closed in production when clerk is unset', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(await requireAiUser(req())).toMatchObject({ ok: false, status: 401, code: 'auth_required' })
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(await requireAiUser(req())).toMatchObject({ ok: false, status: 401 })
  })

  describe('with clerk configured', () => {
    beforeEach(() => vi.stubEnv('CLERK_SECRET_KEY', 'sk'))

    it('requires a bearer token', async () => {
      expect(await requireAiUser(req())).toMatchObject({ ok: false, status: 401, code: 'auth_required' })
      expect(await requireAiUser(req('Basic abc'))).toMatchObject({ ok: false, status: 401 })
      expect(await requireAiUser(req('Bearer   '))).toMatchObject({ ok: false, status: 401 })
      expect(clerk.verifyToken).not.toHaveBeenCalled()
    })

    it('succeeds for verified users', async () => {
      clerk.verifyToken.mockResolvedValue({ sub: 'user_1' })
      clerk.getUser.mockResolvedValue(fakeUser())
      expect(await requireAiUser(req('Bearer tok'))).toEqual({ ok: true, user: { userId: 'user_1' } })
      expect(clerk.verifyToken).toHaveBeenCalledWith('tok', {
        secretKey: 'sk',
        authorizedParties: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      })
    })

    it('omits authorizedParties when none are configured', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      clerk.verifyToken.mockResolvedValue({ sub: 'user_1' })
      clerk.getUser.mockResolvedValue(fakeUser())
      await requireAiUser(req('Bearer tok'))
      expect(clerk.verifyToken).toHaveBeenCalledWith('tok', { secretKey: 'sk' })
    })

    it('retries without azp allowlist when first verification fails', async () => {
      clerk.verifyToken.mockRejectedValueOnce(new Error('azp')).mockResolvedValueOnce({ sub: 'user_1' })
      clerk.getUser.mockResolvedValue(fakeUser())
      expect((await requireAiUser(req('Bearer tok'))).ok).toBe(true)
      expect(clerk.verifyToken).toHaveBeenCalledTimes(2)
      expect(clerk.verifyToken.mock.calls[1][1]).toEqual({ secretKey: 'sk' })
    })

    it('does not retry when no azp list and verification fails', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      clerk.verifyToken.mockRejectedValue(new Error('bad'))
      expect(await requireAiUser(req('Bearer tok'))).toMatchObject({
        ok: false,
        status: 401,
        error: 'Session expired. Sign in again.',
      })
      expect(clerk.verifyToken).toHaveBeenCalledTimes(1)
    })

    it('rejects when both verifications fail', async () => {
      clerk.verifyToken.mockRejectedValue(new Error('bad'))
      expect(await requireAiUser(req('Bearer tok'))).toMatchObject({ ok: false, status: 401 })
      expect(clerk.verifyToken).toHaveBeenCalledTimes(2)
    })

    it('rejects tokens without sub', async () => {
      clerk.verifyToken.mockResolvedValue({})
      expect(await requireAiUser(req('Bearer tok'))).toMatchObject({
        ok: false,
        status: 401,
        error: 'Sign in to continue.',
      })
    })

    it('rejects when user lookup fails', async () => {
      clerk.verifyToken.mockResolvedValue({ sub: 'user_1' })
      clerk.getUser.mockRejectedValue(new Error('404'))
      expect(await requireAiUser(req('Bearer tok'))).toMatchObject({ ok: false, status: 401 })
    })

    it('blocks AI-banned users with 403', async () => {
      clerk.verifyToken.mockResolvedValue({ sub: 'user_1' })
      clerk.getUser.mockResolvedValue(fakeUser({ privateMetadata: { aiBanned: true } }))
      expect(await requireAiUser(req('Bearer tok'))).toMatchObject({
        ok: false,
        status: 403,
        code: 'ai_banned',
      })
    })

    it('requires verified email or OAuth', async () => {
      clerk.verifyToken.mockResolvedValue({ sub: 'user_1' })
      clerk.getUser.mockResolvedValue(
        fakeUser({ emailAddresses: [{ verification: { status: 'unverified' } }, {}] }),
      )
      expect(await requireAiUser(req('Bearer tok'))).toMatchObject({
        ok: false,
        status: 403,
        code: 'email_verification_required',
      })
      clerk.getUser.mockResolvedValue(
        fakeUser({
          emailAddresses: [],
          externalAccounts: [{ provider: 'oauth_github' }],
        }),
      )
      expect((await requireAiUser(req('Bearer tok'))).ok).toBe(true)
      clerk.getUser.mockResolvedValue(
        fakeUser({ emailAddresses: [], externalAccounts: [{ provider: 'oauth_other' }] }),
      )
      expect((await requireAiUser(req('Bearer tok'))).ok).toBe(false)
    })
  })
})

describe('requireCloudUser', () => {
  it('fails when clerk is not configured', async () => {
    expect(await requireCloudUser(req('Bearer t'))).toMatchObject({
      ok: false,
      status: 401,
      code: 'auth_required',
    })
  })

  describe('with clerk configured', () => {
    beforeEach(() => vi.stubEnv('CLERK_SECRET_KEY', 'sk'))

    it('maps missing token to 401 with sync message', async () => {
      expect(await requireCloudUser(req())).toMatchObject({
        ok: false,
        status: 401,
        code: 'auth_required',
        error: 'Sign in to sync progress across devices.',
      })
    })

    it('ignores aiBanned and succeeds for verified users', async () => {
      clerk.verifyToken.mockResolvedValue({ sub: 'user_1' })
      clerk.getUser.mockResolvedValue(fakeUser({ privateMetadata: { aiBanned: true } }))
      expect(await requireCloudUser(req('Bearer tok'))).toEqual({
        ok: true,
        user: { userId: 'user_1' },
      })
    })

    it('rejects unverified users with 403', async () => {
      clerk.verifyToken.mockResolvedValue({ sub: 'user_1' })
      clerk.getUser.mockResolvedValue(fakeUser({ emailAddresses: [], externalAccounts: [] }))
      expect(await requireCloudUser(req('Bearer tok'))).toMatchObject({
        ok: false,
        status: 403,
        code: 'email_verification_required',
      })
    })
  })
})

describe('requireAdminUser', () => {
  it('fails when clerk is not configured', async () => {
    expect(await requireAdminUser(req('Bearer t'))).toMatchObject({
      ok: false,
      status: 401,
      error: 'Clerk is not configured.',
    })
  })

  describe('with clerk configured', () => {
    beforeEach(() => vi.stubEnv('CLERK_SECRET_KEY', 'sk'))

    it('propagates auth failure', async () => {
      expect(await requireAdminUser(req())).toMatchObject({
        ok: false,
        status: 401,
        code: 'auth_required',
      })
    })

    it('rejects non-admins', async () => {
      clerk.verifyToken.mockResolvedValue({ sub: 'user_1' })
      clerk.getUser.mockResolvedValue(fakeUser())
      expect(await requireAdminUser(req('Bearer tok'))).toMatchObject({
        ok: false,
        status: 403,
        code: 'admin_required',
      })
    })

    it('accepts admins and returns the user', async () => {
      clerk.verifyToken.mockResolvedValue({ sub: 'user_1' })
      const user = fakeUser({ publicMetadata: { role: 'admin' } })
      clerk.getUser.mockResolvedValue(user)
      expect(await requireAdminUser(req('Bearer tok'))).toEqual({ ok: true, user })
    })
  })
})
