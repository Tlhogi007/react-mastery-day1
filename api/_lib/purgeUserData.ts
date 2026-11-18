/**
 * Remove all Upstash data tied to a Clerk userId (cloud snapshot + AI quota keys).
 */

import { userFreeQuotaRedisKey } from './aiQuizGuard.js'
import { redisDel, redisKeys } from './redis.js'
import { userCloudKey } from './userCloud.js'

function nearbyUtcDays(around = new Date(), radius = 3): string[] {
  const days: string[] = []
  for (let i = -radius; i <= radius; i++) {
    const d = new Date(around)
    d.setUTCDate(d.getUTCDate() + i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

export async function purgeUserData(userId: string): Promise<{ deleted: number; keys: string[] }> {
  if (!userId || userId === 'anonymous') {
    return { deleted: 0, keys: [] }
  }

  const keys = new Set<string>([userCloudKey(userId)])

  // Prefer KEYS for any lingering daily quota counters
  for (const k of await redisKeys(`ai-quiz:user:${userId}:*`)) {
    keys.add(k)
  }
  // Also delete a window of explicit day keys if KEYS is restricted
  for (const day of nearbyUtcDays()) {
    keys.add(userFreeQuotaRedisKey(userId, day))
  }

  const list = [...keys]
  const deleted = await redisDel(...list)
  return { deleted, keys: list }
}
