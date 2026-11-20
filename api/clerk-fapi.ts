/**
 * Proxies Clerk Frontend API through this origin.
 * Required on vercel.app with pk_live_ — you cannot CNAME clerk.*.vercel.app.
 *
 * Browser → /__clerk/*  (rewrite) → /api/clerk-fapi?clerkPath=* → frontend-api.clerk.dev
 *
 * Bodies must stay raw (Clerk uses form-urlencoded for sign_ins). Re-JSON-stringifying
 * parsed bodies causes 422 Unprocessable Content.
 *
 * Enable explicitly with CLERK_FAPI_PROXY_ENABLED=1 (fail closed by default).
 */
/// <reference types="node" />
import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { IncomingMessage } from 'http'
import { clerkAuthorizedParties } from './_lib/auth.js'

const FAPI_ORIGIN = 'https://frontend-api.clerk.dev'
const MAX_BODY_BYTES = 1_000_000

export const config = {
  api: {
    bodyParser: false,
  },
}

function clientIp(req: VercelRequest): string {
  const vercel = req.headers['x-vercel-forwarded-for']
  if (typeof vercel === 'string' && vercel.trim()) {
    return vercel.split(',')[0]!.trim()
  }
  const real = req.headers['x-real-ip']
  if (typeof real === 'string' && real.trim()) return real.trim()
  const xff = req.headers['x-forwarded-for']
  if (typeof xff === 'string' && xff.trim()) return xff.split(',')[0]!.trim()
  return '0.0.0.0'
}

/** Relative FAPI path only — blocks scheme / traversal / userinfo SSRF tricks. */
function clerkPath(req: VercelRequest): string | null {
  const q = req.query.clerkPath
  const raw =
    typeof q === 'string'
      ? q
      : Array.isArray(q) && q[0]
        ? String(q[0])
        : ''
  if (!raw) return null
  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return null
  }
  const path = decoded.replace(/^\/+/, '')
  if (
    !path ||
    path.includes('..') ||
    path.includes('\\') ||
    path.includes('://') ||
    path.includes('@') ||
    !/^[a-zA-Z0-9._~/-]+$/.test(path)
  ) {
    return null
  }
  return path
}

function readRawBody(req: IncomingMessage, maxBytes: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let total = 0
    req.on('data', (chunk: Buffer | string) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      total += buf.length
      if (total > maxBytes) {
        reject(new Error('BODY_TOO_LARGE'))
        req.destroy()
        return
      }
      chunks.push(buf)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

const SKIP_REQ_HEADERS = new Set([
  'host',
  'connection',
  'content-length',
  'transfer-encoding',
  'keep-alive',
  'expect',
])

function requestAllowed(req: VercelRequest): boolean {
  const originHeader = req.headers.origin
  const origin = typeof originHeader === 'string' ? originHeader.trim().replace(/\/$/, '') : ''
  if (origin) {
    const parties = new Set(clerkAuthorizedParties().map((p) => p.replace(/\/$/, '')))
    return parties.has(origin)
  }
  // Same-origin browser requests sometimes omit Origin on GET.
  const site = req.headers['sec-fetch-site']
  if (site === 'same-origin' || site === 'none') return true
  if (req.method === 'GET' || req.method === 'HEAD') return true
  return false
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    // Fail closed: proxy is only for pk_live_ on vercel.app — opt in via env.
    if (process.env.CLERK_FAPI_PROXY_ENABLED !== '1') {
      res.status(404).json({ error: 'Not found' })
      return
    }

    const secret = process.env.CLERK_SECRET_KEY
    if (!secret) {
      res.status(503).json({ error: 'CLERK_SECRET_KEY is not configured' })
      return
    }

    if (!requestAllowed(req)) {
      res.status(403).json({ error: 'Forbidden origin' })
      return
    }

    const contentLength = Number(req.headers['content-length'] || 0)
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      res.status(413).json({ error: 'Payload too large' })
      return
    }

    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '')
      .split(',')[0]!
      .trim()
    const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0]!.trim()
    const proxyUrl = `${proto}://${host}/__clerk`

    const suffix = clerkPath(req)
    if (!suffix) {
      res.status(400).json({ error: 'Invalid or missing clerkPath' })
      return
    }

    const incoming = req.url || ''
    const searchIdx = incoming.indexOf('?')
    let search = ''
    if (searchIdx >= 0) {
      const params = new URLSearchParams(incoming.slice(searchIdx + 1))
      params.delete('clerkPath')
      const qs = params.toString()
      search = qs ? `?${qs}` : ''
    }
    const target = `${FAPI_ORIGIN}/${suffix}${search}`

    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (value == null) continue
      const lower = key.toLowerCase()
      if (SKIP_REQ_HEADERS.has(lower)) continue
      if (lower.startsWith('x-vercel-') || lower.startsWith('x-forwarded-')) continue
      if (Array.isArray(value)) {
        for (const v of value) headers.append(key, v)
      } else {
        headers.set(key, value)
      }
    }
    headers.set('Clerk-Proxy-Url', proxyUrl)
    headers.set('Clerk-Secret-Key', secret)
    headers.set('X-Forwarded-For', clientIp(req))

    let body: Buffer | undefined
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      try {
        body = await readRawBody(req, MAX_BODY_BYTES)
      } catch (err) {
        if (err instanceof Error && err.message === 'BODY_TOO_LARGE') {
          res.status(413).json({ error: 'Payload too large' })
          return
        }
        throw err
      }
    }

    const upstream = await fetch(target, {
      method: req.method || 'GET',
      headers,
      body: body ? new Uint8Array(body) : undefined,
      redirect: 'manual',
    })

    res.status(upstream.status)

    const setCookies: string[] = []
    upstream.headers.forEach((value, key) => {
      const lower = key.toLowerCase()
      if (lower === 'transfer-encoding' || lower === 'connection' || lower === 'content-length') {
        return
      }
      if (lower === 'set-cookie') {
        setCookies.push(value)
        return
      }
      res.setHeader(key, value)
    })
    if (setCookies.length === 1) res.setHeader('set-cookie', setCookies[0]!)
    else if (setCookies.length > 1) res.setHeader('set-cookie', setCookies)

    res.end(Buffer.from(await upstream.arrayBuffer()))
  } catch (err) {
    console.error('[clerk-fapi proxy]', err)
    res.status(502).json({ error: 'Clerk Frontend API proxy failed' })
  }
}
