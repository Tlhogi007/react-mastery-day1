/**
 * Asset flood stress (no browser).
 * Usage: BASE_URL=http://127.0.0.1:4173 node scripts/stress-http.mjs
 */
import { readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173'
const CONCURRENCY = Number(process.env.CONCURRENCY || 24)
const ROUNDS = Number(process.env.ROUNDS || 5)
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const assetsDir = join(root, 'dist', 'assets')

function listAssets(dir, prefix = '/assets') {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return listAssets(full, `${prefix}/${name}`)
    return [`${prefix}/${name}`]
  })
}

const paths = ['/', '/index.html', ...listAssets(assetsDir)]
const urls = paths.map((p) => BASE + p)

async function hit(url) {
  const t0 = performance.now()
  try {
    const res = await fetch(url, { cache: 'no-store' })
    const buf = await res.arrayBuffer()
    return { url, status: res.status, bytes: buf.byteLength, ms: performance.now() - t0, ok: res.ok }
  } catch (e) {
    return { url, status: 0, bytes: 0, ms: performance.now() - t0, ok: false, error: String(e) }
  }
}

function pct(sorted, p) {
  if (!sorted.length) return 0
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))]
}

const all = []
const tWall = performance.now()
for (let r = 0; r < ROUNDS; r++) {
  const queue = [...urls, ...urls]
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) {
        const u = queue.shift()
        if (!u) break
        all.push(await hit(u))
      }
    }),
  )
}
const wallMs = performance.now() - tWall
const ok = all.filter((x) => x.ok)
const fail = all.filter((x) => !x.ok)
const times = ok.map((x) => x.ms).sort((a, b) => a - b)
const byStatus = {}
for (const x of all) byStatus[x.status] = (byStatus[x.status] || 0) + 1

console.log(
  JSON.stringify(
    {
      base: BASE,
      requests: all.length,
      ok: ok.length,
      fail: fail.length,
      wallMs: Math.round(wallMs),
      rps: +(all.length / (wallMs / 1000)).toFixed(1),
      latencyMs: {
        p50: +pct(times, 50).toFixed(1),
        p95: +pct(times, 95).toFixed(1),
        p99: +pct(times, 99).toFixed(1),
        max: +pct(times, 100).toFixed(1),
      },
      byStatus,
      failures: fail.slice(0, 10),
    },
    null,
    2,
  ),
)

process.exit(fail.length ? 1 : 0)
