import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  redisConfigured,
  redisDel,
  redisGet,
  redisIncr,
  redisKeys,
  redisSet,
} from './redis'

const ok = (result: unknown) =>
  ({ ok: true, json: async () => ({ result }) }) as unknown as Response

function configure() {
  vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.com/')
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'tok')
}

beforeEach(() => {
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('redisConfigured', () => {
  it('requires both url and token', () => {
    expect(redisConfigured()).toBe(false)
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://x')
    expect(redisConfigured()).toBe(false)
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 't')
    expect(redisConfigured()).toBe(true)
  })
})

describe('without config', () => {
  it('never calls fetch and returns neutral values', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await redisGet('k')).toBeNull()
    expect(await redisSet('k', 'v')).toBe(false)
    // NOTE: Number(null) === 0, so a failed INCR currently yields 0 (not null)
    expect(await redisIncr('k')).toBe(0)
    expect(await redisDel('k')).toBe(0)
    expect(await redisKeys('*')).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('with config', () => {
  beforeEach(configure)

  it('redisGet posts GET command with bearer auth and trims trailing slash', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok('hello'))
    vi.stubGlobal('fetch', fetchMock)
    expect(await redisGet('k')).toBe('hello')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://redis.example.com')
    expect(init.method).toBe('POST')
    expect(init.headers.Authorization).toBe('Bearer tok')
    expect(JSON.parse(init.body)).toEqual(['GET', 'k'])
  })

  it('redisGet stringifies non-strings and maps null/undefined to null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(ok(42)).mockResolvedValueOnce(ok(null)))
    expect(await redisGet('k')).toBe('42')
    expect(await redisGet('k')).toBeNull()
  })

  it('returns null on http error or network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false } as Response))
    expect(await redisGet('k')).toBeNull()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')))
    expect(await redisGet('k')).toBeNull()
  })

  it('redisSet with and without expiry', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok('OK'))
    vi.stubGlobal('fetch', fetchMock)
    expect(await redisSet('k', 'v')).toBe(true)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(['SET', 'k', 'v'])
    expect(await redisSet('k', 'v', 60)).toBe(true)
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual(['SET', 'k', 'v', 'EX', 60])
    expect(await redisSet('k', 'v', 0)).toBe(true)
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual(['SET', 'k', 'v'])
  })

  it('redisSet accepts true and rejects other results', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(ok(true)).mockResolvedValueOnce(ok('NOPE')))
    expect(await redisSet('k', 'v')).toBe(true)
    expect(await redisSet('k', 'v')).toBe(false)
  })

  it('redisIncr sets expiry on first increment only', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(ok(1)).mockResolvedValue(ok(1))
    vi.stubGlobal('fetch', fetchMock)
    expect(await redisIncr('k', 100)).toBe(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual(['EXPIRE', 'k', 100])

    const second = vi.fn().mockResolvedValue(ok(2))
    vi.stubGlobal('fetch', second)
    expect(await redisIncr('k')).toBe(2)
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('redisIncr skips expiry when expireSeconds is 0 and returns null on garbage', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok(1))
    vi.stubGlobal('fetch', fetchMock)
    expect(await redisIncr('k', 0)).toBe(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok('abc')))
    expect(await redisIncr('k')).toBeNull()
  })

  it('redisDel dedupes keys, ignores empties, parses count', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok(2))
    vi.stubGlobal('fetch', fetchMock)
    expect(await redisDel('a', 'a', '', 'b')).toBe(2)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(['DEL', 'a', 'b'])
    expect(await redisDel()).toBe(0)
    expect(await redisDel('')).toBe(0)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('redisDel returns 0 for non-numeric result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok('x')))
    expect(await redisDel('a')).toBe(0)
  })

  it('redisKeys filters to strings and tolerates non-arrays', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(ok(['a', 1, 'b'])).mockResolvedValueOnce(ok('x')))
    expect(await redisKeys('p:*')).toEqual(['a', 'b'])
    expect(await redisKeys('p:*')).toEqual([])
  })
})
