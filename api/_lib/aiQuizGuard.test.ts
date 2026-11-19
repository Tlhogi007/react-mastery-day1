import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const redis = vi.hoisted(() => ({
  redisConfigured: vi.fn(),
  redisGet: vi.fn(),
  redisIncr: vi.fn(),
}))

vi.mock('./redis.js', () => redis)

type Guard = typeof import('./aiQuizGuard')

async function load(): Promise<Guard> {
  vi.resetModules()
  return import('./aiQuizGuard')
}

beforeEach(() => {
  redis.redisConfigured.mockReset().mockReturnValue(true)
  redis.redisGet.mockReset()
  redis.redisIncr.mockReset()
  for (const k of [
    'AI_QUIZ_MAX_PER_MINUTE',
    'AI_QUIZ_MAX_PER_DAY',
    'AI_QUIZ_MAX_COUNT',
    'AI_QUIZ_GLOBAL_MAX_PER_DAY',
    'AI_QUIZ_FREE_PER_USER_DAY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ]) {
    vi.stubEnv(k, '')
  }
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe('limits & keys', () => {
  it('freePerUserDayLimit defaults to 5 and honors env', async () => {
    const g = await load()
    expect(g.freePerUserDayLimit()).toBe(5)
    vi.stubEnv('AI_QUIZ_FREE_PER_USER_DAY', '9.7')
    expect(g.freePerUserDayLimit()).toBe(9)
    vi.stubEnv('AI_QUIZ_FREE_PER_USER_DAY', '-3')
    expect(g.freePerUserDayLimit()).toBe(5)
    vi.stubEnv('AI_QUIZ_FREE_PER_USER_DAY', 'abc')
    expect(g.freePerUserDayLimit()).toBe(5)
  })

  it('userFreeQuotaRedisKey uses given or current UTC day', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-19T23:59:00Z'))
    const g = await load()
    expect(g.userFreeQuotaRedisKey('u1')).toBe('ai-quiz:user:u1:2026-11-19')
    expect(g.userFreeQuotaRedisKey('u1', '2020-01-01')).toBe('ai-quiz:user:u1:2020-01-01')
  })

  it('maxQuestionsPerRequest is capped at 8', async () => {
    const g = await load()
    expect(g.maxQuestionsPerRequest()).toBe(5)
    vi.stubEnv('AI_QUIZ_MAX_COUNT', '20')
    expect(g.maxQuestionsPerRequest()).toBe(8)
    vi.stubEnv('AI_QUIZ_MAX_COUNT', '2')
    expect(g.maxQuestionsPerRequest()).toBe(2)
  })

  it('clampQuestionCount handles junk, fractions and bounds', async () => {
    const g = await load()
    expect(g.clampQuestionCount(undefined)).toBe(3)
    expect(g.clampQuestionCount('nope')).toBe(3)
    expect(g.clampQuestionCount(0)).toBe(1)
    expect(g.clampQuestionCount(-4)).toBe(1)
    expect(g.clampQuestionCount(2.9)).toBe(2)
    expect(g.clampQuestionCount('4')).toBe(4)
    expect(g.clampQuestionCount(100)).toBe(5)
    expect(g.clampQuestionCount(Infinity)).toBe(3)
  })
})

describe('getUserFreeQuotaStatus', () => {
  it('is unavailable for anonymous / empty users and when redis is off', async () => {
    const g = await load()
    expect((await g.getUserFreeQuotaStatus('')).available).toBe(false)
    expect((await g.getUserFreeQuotaStatus('anonymous')).available).toBe(false)
    redis.redisConfigured.mockReturnValue(false)
    const s = await g.getUserFreeQuotaStatus('u1')
    expect(s).toMatchObject({ used: 0, limit: 5, remaining: 5, available: false })
    expect(redis.redisGet).not.toHaveBeenCalled()
  })

  it('reads used count without incrementing', async () => {
    const g = await load()
    redis.redisGet.mockResolvedValue('2')
    expect(await g.getUserFreeQuotaStatus('u1')).toMatchObject({
      used: 2,
      limit: 5,
      remaining: 3,
      available: true,
    })
    redis.redisGet.mockResolvedValue('99')
    expect((await g.getUserFreeQuotaStatus('u1')).remaining).toBe(0)
    redis.redisGet.mockResolvedValue(null)
    expect((await g.getUserFreeQuotaStatus('u1')).used).toBe(0)
    redis.redisGet.mockResolvedValue('-5')
    expect((await g.getUserFreeQuotaStatus('u1')).used).toBe(0)
    expect(redis.redisIncr).not.toHaveBeenCalled()
  })
})

describe('allowUserFreeQuota', () => {
  it('allows anonymous without touching redis', async () => {
    const g = await load()
    expect(await g.allowUserFreeQuota('anonymous')).toEqual({ ok: true })
    expect(await g.allowUserFreeQuota('')).toEqual({ ok: true })
    expect(redis.redisIncr).not.toHaveBeenCalled()
  })

  it('fails closed (503) when redis is not configured', async () => {
    const g = await load()
    redis.redisConfigured.mockReturnValue(false)
    const res = await g.allowUserFreeQuota('u1')
    expect(res).toMatchObject({ ok: false, status: 503, code: 'quota_unavailable' })
  })

  it('fails closed (503) when redis is unreachable', async () => {
    const g = await load()
    redis.redisIncr.mockResolvedValue(null)
    const res = await g.allowUserFreeQuota('u1')
    expect(res).toMatchObject({ ok: false, status: 503, code: 'quota_unavailable' })
  })

  it('allows up to the limit then returns 402', async () => {
    const g = await load()
    redis.redisIncr.mockResolvedValue(5)
    expect(await g.allowUserFreeQuota('u1')).toEqual({ ok: true })
    redis.redisIncr.mockResolvedValue(6)
    const res = await g.allowUserFreeQuota('u1')
    expect(res).toMatchObject({ ok: false, status: 402, code: 'quota_exceeded' })
    expect(redis.redisIncr).toHaveBeenCalledWith(expect.stringMatching(/^ai-quiz:user:u1:\d{4}-\d{2}-\d{2}$/))
  })
})

describe('allowAiQuizRequest — per-IP limits (memory global)', () => {
  it('limits per minute and reports retryAfterSec', async () => {
    const g = await load()
    vi.stubEnv('AI_QUIZ_MAX_PER_MINUTE', '2')
    vi.stubEnv('AI_QUIZ_GLOBAL_MAX_PER_DAY', '1000')
    expect((await g.allowAiQuizRequest('1.1.1.1')).ok).toBe(true)
    expect((await g.allowAiQuizRequest('1.1.1.1')).ok).toBe(true)
    const res = await g.allowAiQuizRequest('1.1.1.1')
    expect(res).toMatchObject({ ok: false, status: 429 })
    expect((res as { retryAfterSec: number }).retryAfterSec).toBeGreaterThanOrEqual(1)
    // other IPs unaffected
    expect((await g.allowAiQuizRequest('2.2.2.2')).ok).toBe(true)
  })

  it('minute window resets after 60s', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-19T12:00:00Z'))
    const g = await load()
    vi.stubEnv('AI_QUIZ_MAX_PER_MINUTE', '1')
    vi.stubEnv('AI_QUIZ_GLOBAL_MAX_PER_DAY', '1000')
    expect((await g.allowAiQuizRequest('ip')).ok).toBe(true)
    expect((await g.allowAiQuizRequest('ip')).ok).toBe(false)
    vi.setSystemTime(new Date('2026-11-19T12:01:01Z'))
    expect((await g.allowAiQuizRequest('ip')).ok).toBe(true)
  })

  it('limits per day and resets the next UTC day', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-19T12:00:00Z'))
    const g = await load()
    vi.stubEnv('AI_QUIZ_MAX_PER_MINUTE', '100')
    vi.stubEnv('AI_QUIZ_MAX_PER_DAY', '2')
    vi.stubEnv('AI_QUIZ_GLOBAL_MAX_PER_DAY', '1000')
    expect((await g.allowAiQuizRequest('ip')).ok).toBe(true)
    expect((await g.allowAiQuizRequest('ip')).ok).toBe(true)
    const res = await g.allowAiQuizRequest('ip')
    expect(res).toMatchObject({ ok: false, status: 429 })
    expect((res as { error: string }).error).toMatch(/Daily/)
    vi.setSystemTime(new Date('2026-11-20T12:00:00Z'))
    expect((await g.allowAiQuizRequest('ip')).ok).toBe(true)
  })

  it('uses "unknown" bucket for empty ip', async () => {
    const g = await load()
    vi.stubEnv('AI_QUIZ_MAX_PER_MINUTE', '1')
    vi.stubEnv('AI_QUIZ_GLOBAL_MAX_PER_DAY', '1000')
    expect((await g.allowAiQuizRequest('')).ok).toBe(true)
    expect((await g.allowAiQuizRequest('')).ok).toBe(false)
  })

  it('in-memory global budget caps requests and resets next day', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-19T12:00:00Z'))
    const g = await load()
    vi.stubEnv('AI_QUIZ_MAX_PER_MINUTE', '100')
    vi.stubEnv('AI_QUIZ_MAX_PER_DAY', '100')
    vi.stubEnv('AI_QUIZ_GLOBAL_MAX_PER_DAY', '2')
    expect((await g.allowAiQuizRequest('a')).ok).toBe(true)
    expect((await g.allowAiQuizRequest('b')).ok).toBe(true)
    const res = await g.allowAiQuizRequest('c')
    expect(res).toMatchObject({ ok: false, status: 429 })
    expect((res as { error: string }).error).toMatch(/Global/)
    vi.setSystemTime(new Date('2026-11-20T12:00:00Z'))
    expect((await g.allowAiQuizRequest('c')).ok).toBe(true)
  })

  it('evicts stale entries once maps grow beyond 5000', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-19T12:00:00Z'))
    const g = await load()
    vi.stubEnv('AI_QUIZ_MAX_PER_MINUTE', '100')
    vi.stubEnv('AI_QUIZ_MAX_PER_DAY', '100')
    vi.stubEnv('AI_QUIZ_GLOBAL_MAX_PER_DAY', '1000000')
    for (let i = 0; i < 5001; i++) await g.allowAiQuizRequest(`ip-${i}`)
    vi.setSystemTime(new Date('2026-11-20T12:00:00Z'))
    // Next call triggers cleanup of both maps (all previous entries stale)
    expect((await g.allowAiQuizRequest('fresh')).ok).toBe(true)
    // After eviction an old ip starts from a fresh counter
    expect((await g.allowAiQuizRequest('ip-0')).ok).toBe(true)
  })
})

describe('allowAiQuizRequest — Upstash global budget', () => {
  const upstash = (result: unknown, ok = true) =>
    ({ ok, json: async () => ({ result }) }) as unknown as Response

  beforeEach(() => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.com/')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'tok')
    vi.stubEnv('AI_QUIZ_GLOBAL_MAX_PER_DAY', '3')
  })

  it('sets expiry on first INCR and allows under budget', async () => {
    const g = await load()
    const fetchMock = vi.fn().mockResolvedValue(upstash(1))
    vi.stubGlobal('fetch', fetchMock)
    expect((await g.allowAiQuizRequest('ip')).ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)[0]).toBe('INCR')
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)[0]).toBe('EXPIRE')
    expect(fetchMock.mock.calls[0][0]).toBe('https://redis.example.com')
  })

  it('does not set expiry after the first hit', async () => {
    const g = await load()
    const fetchMock = vi.fn().mockResolvedValue(upstash(2))
    vi.stubGlobal('fetch', fetchMock)
    expect((await g.allowAiQuizRequest('ip')).ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects over budget with 429', async () => {
    const g = await load()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(upstash(4)))
    expect(await g.allowAiQuizRequest('ip')).toMatchObject({ ok: false, status: 429 })
  })

  it('swallows EXPIRE failures', async () => {
    const g = await load()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(upstash(1))
      .mockRejectedValueOnce(new Error('boom'))
    vi.stubGlobal('fetch', fetchMock)
    expect((await g.allowAiQuizRequest('ip')).ok).toBe(true)
  })

  it('falls back to memory when fetch fails or responds non-ok', async () => {
    let g = await load()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
    expect((await g.allowAiQuizRequest('ip')).ok).toBe(true)

    g = await load()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(upstash(null, false)))
    expect((await g.allowAiQuizRequest('ip2')).ok).toBe(true)
  })

  it('treats a missing result as 0 (allowed)', async () => {
    const g = await load()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(upstash(undefined)))
    expect((await g.allowAiQuizRequest('ip')).ok).toBe(true)
  })
})
