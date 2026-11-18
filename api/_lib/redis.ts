/**
 * Minimal Upstash Redis REST helpers shared by AI quota + user cloud sync.
 */

export function redisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

function redisBase(): { base: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return { base: url.replace(/\/$/, ''), token }
}

async function redisCommand(args: unknown[]): Promise<unknown | null> {
  const cfg = redisBase()
  if (!cfg) return null
  try {
    const res = await fetch(cfg.base, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { result?: unknown }
    return data.result ?? null
  } catch {
    return null
  }
}

export async function redisGet(key: string): Promise<string | null> {
  const result = await redisCommand(['GET', key])
  return typeof result === 'string' ? result : result == null ? null : String(result)
}

export async function redisSet(key: string, value: string, expireSeconds?: number): Promise<boolean> {
  const args: unknown[] =
    expireSeconds && expireSeconds > 0
      ? ['SET', key, value, 'EX', expireSeconds]
      : ['SET', key, value]
  const result = await redisCommand(args)
  return result === 'OK' || result === true
}

export async function redisIncr(key: string, expireSeconds = 172800): Promise<number | null> {
  const countRaw = await redisCommand(['INCR', key])
  const count = Number(countRaw)
  if (!Number.isFinite(count)) return null
  if (count === 1 && expireSeconds > 0) {
    void redisCommand(['EXPIRE', key, expireSeconds])
  }
  return count
}
