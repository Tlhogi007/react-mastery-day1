import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  applyHelpfulVotes,
  fetchHelpfulCounts,
  getCachedHelpfulCounts,
  getLocalHelpfulVotes,
  hasMarkedHelpful,
  setLocalHelpful,
  subscribeHelpfulCounts,
  toggleHelpful,
} from './communityHelpful'

const jsonRes = (body: unknown, ok = true) =>
  ({ ok, json: async () => body }) as unknown as Response

beforeEach(async () => {
  // reset module-level cache
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({ counts: {} })))
  await fetchHelpfulCounts()
  vi.unstubAllGlobals()
})

describe('local votes', () => {
  it('sets and clears votes', () => {
    expect(hasMarkedHelpful('a')).toBe(false)
    setLocalHelpful('a', true)
    expect(hasMarkedHelpful('a')).toBe(true)
    expect(getLocalHelpfulVotes()).toEqual({ a: true })
    setLocalHelpful('a', false)
    expect(getLocalHelpfulVotes()).toEqual({})
  })

  it('tolerates corrupt/odd storage', () => {
    localStorage.setItem('rm-community-helpful-votes', '{bad')
    expect(getLocalHelpfulVotes()).toEqual({})
    localStorage.setItem('rm-community-helpful-votes', 'null')
    expect(getLocalHelpfulVotes()).toEqual({})
  })

  it('swallows write and dispatch failures', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('x')
    })
    vi.spyOn(window, 'dispatchEvent').mockImplementation(() => {
      throw new Error('x')
    })
    expect(() => setLocalHelpful('a', true)).not.toThrow()
  })

  it('applyHelpfulVotes ORs cloud into local and emits counts', () => {
    setLocalHelpful('a', true)
    const cb = vi.fn()
    const unsub = subscribeHelpfulCounts(cb)
    applyHelpfulVotes({ b: true, c: false })
    expect(getLocalHelpfulVotes()).toEqual({ a: true, b: true })
    expect(cb).toHaveBeenCalledTimes(1)
    unsub()
    applyHelpfulVotes({ d: true })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('applyHelpfulVotes ignores null/invalid', () => {
    applyHelpfulVotes(null)
    applyHelpfulVotes(undefined)
    applyHelpfulVotes('x' as never)
    expect(getLocalHelpfulVotes()).toEqual({})
  })
})

describe('fetchHelpfulCounts', () => {
  it('caches counts on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({ counts: { a: 3 } })))
    expect(await fetchHelpfulCounts()).toEqual({ a: 3 })
    expect(getCachedHelpfulCounts()).toEqual({ a: 3 })
  })

  it('handles missing counts field', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({})))
    expect(await fetchHelpfulCounts()).toEqual({})
  })

  it('returns cache on non-ok and on network errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({ counts: { a: 2 } })))
    await fetchHelpfulCounts()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({}, false)))
    expect(await fetchHelpfulCounts()).toEqual({ a: 2 })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')))
    expect(await fetchHelpfulCounts()).toEqual({ a: 2 })
  })

  it('subscriber ignores events without detail', () => {
    const cb = vi.fn()
    const unsub = subscribeHelpfulCounts(cb)
    window.dispatchEvent(new CustomEvent('rm-community-helpful-counts'))
    expect(cb).not.toHaveBeenCalled()
    unsub()
  })
})

describe('toggleHelpful', () => {
  it('toggles on with optimistic count and server count', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({ count: 7 })))
    const res = await toggleHelpful('a')
    expect(res).toEqual({ helpful: true, count: 7 })
    expect(hasMarkedHelpful('a')).toBe(true)
    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe('/api/community-helpful')
    expect(JSON.parse(init.body)).toEqual({ slug: 'a', helpful: true })
  })

  it('uses full counts payload when provided', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({ counts: { a: 1, b: 9 } })))
    const res = await toggleHelpful('a')
    expect(res.count).toBe(1)
    expect(getCachedHelpfulCounts()).toEqual({ a: 1, b: 9 })
  })

  it('keeps optimistic value on network failure and non-ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')))
    expect(await toggleHelpful('a')).toEqual({ helpful: true, count: 1 })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({}, false)))
    // toggling off: 1 -> 0 (never below 0)
    expect(await toggleHelpful('a')).toEqual({ helpful: false, count: 0 })
    expect(await toggleHelpful('a')).toEqual({ helpful: true, count: 1 })
  })

  it('does not go below zero when un-voting an unknown slug', async () => {
    setLocalHelpful('z', true)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({})))
    expect(await toggleHelpful('z')).toEqual({ helpful: false, count: 0 })
  })
})
