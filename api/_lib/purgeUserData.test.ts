import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  redisDel: vi.fn(),
  redisKeys: vi.fn(),
}))

vi.mock('./redis.js', () => ({
  redisDel: mocks.redisDel,
  redisKeys: mocks.redisKeys,
}))
vi.mock('./userCloud.js', () => ({
  userCloudKey: (id: string) => `cloud:${id}`,
}))
vi.mock('./aiQuizGuard.js', () => ({
  userFreeQuotaRedisKey: (id: string, day: string) => `quota:${id}:${day}`,
}))

import { purgeUserData } from './purgeUserData'

beforeEach(() => {
  mocks.redisDel.mockReset()
  mocks.redisKeys.mockReset()
  vi.useRealTimers()
})

describe('purgeUserData', () => {
  it('no-ops for empty and anonymous user ids', async () => {
    expect(await purgeUserData('')).toEqual({ deleted: 0, keys: [] })
    expect(await purgeUserData('anonymous')).toEqual({ deleted: 0, keys: [] })
    expect(mocks.redisDel).not.toHaveBeenCalled()
    expect(mocks.redisKeys).not.toHaveBeenCalled()
  })

  it('deletes cloud key, discovered quota keys and a 7-day window', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-19T12:00:00Z'))
    mocks.redisKeys.mockResolvedValue(['ai-quiz:user:u1:2020-01-01', 'quota:u1:2026-11-19'])
    mocks.redisDel.mockResolvedValue(9)

    const res = await purgeUserData('u1')

    expect(mocks.redisKeys).toHaveBeenCalledWith('ai-quiz:user:u1:*')
    expect(res.deleted).toBe(9)
    expect(res.keys).toContain('cloud:u1')
    expect(res.keys).toContain('ai-quiz:user:u1:2020-01-01')
    for (const day of [
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
    ]) {
      expect(res.keys).toContain(`quota:u1:${day}`)
    }
    // duplicate (KEYS result overlapping window) is de-duplicated: cloud + 1 discovered + 7 window
    expect(res.keys).toHaveLength(9)
    expect(mocks.redisDel).toHaveBeenCalledWith(...res.keys)
  })

  it('still deletes explicit keys when KEYS returns nothing', async () => {
    mocks.redisKeys.mockResolvedValue([])
    mocks.redisDel.mockResolvedValue(0)
    const res = await purgeUserData('u2')
    expect(res.deleted).toBe(0)
    expect(res.keys).toHaveLength(8)
  })
})
