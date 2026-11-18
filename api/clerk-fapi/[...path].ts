/**
 * Proxies Clerk Frontend API through this origin.
 * Required on vercel.app production — you cannot CNAME clerk.*.vercel.app.
 *
 * Browser → /__clerk/* → this function → https://frontend-api.clerk.dev/*
 */
/// <reference types="node" />
import type { VercelRequest, VercelResponse } from '@vercel/node'

const FAPI_ORIGIN = 'https://frontend-api.clerk.dev'

function clientIp(req: VercelRequest): string {
  const vercel = req.headers['x-vercel-forwarded-for']
  if (typeof vercel === 'string' && vercel.trim()) {
    return vercel.split(',')[0]!.trim()
  }
  const real = req.headers['x-real-ip']
  if (typeof real === 'string' && real.trim()) return real.trim()
  const xff = req.headers['x-forwarded-for']
  if (typeof xff === 'string' && xff.trim()) return xff.split(',')[0]!.trim()
  return req.socket?.remoteAddress || '0.0.0.0'
}

function pathFromReq(req: VercelRequest): string {
  const q = req.query.path
  if (Array.isArray(q)) return q.filter(Boolean).join('/')
  if (typeof q === 'string' && q) return q
  // Fallback when rewrite leaves the original URL on the request
  const url = req.url || ''
  const m = url.match(/\/(?:api\/clerk-fapi|__clerk)\/?(.*)$/)
  return (m?.[1] || '').split('?')[0] || ''
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const secret = process.env.CLERK_SECRET_KEY
  if (!secret) {
    res.status(503).json({ error: 'CLERK_SECRET_KEY is not configured' })
    return
  }

  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '')
    .split(',')[0]!
    .trim()
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0]!.trim()
  const proxyUrl = `${proto}://${host}/__clerk`

  const suffix = pathFromReq(req)
  const search = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
  const target = `${FAPI_ORIGIN}/${suffix}${search}`

  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue
    const lower = key.toLowerCase()
    if (
      lower === 'host' ||
      lower === 'connection' ||
      lower === 'content-length' ||
      lower.startsWith('x-vercel-') ||
      lower.startsWith('x-forwarded-')
    ) {
      continue
    }
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
    const raw = req.body
    if (raw == null) {
      body = undefined
    } else if (Buffer.isBuffer(raw)) {
      body = raw
    } else if (typeof raw === 'string') {
      body = Buffer.from(raw)
    } else {
      body = Buffer.from(JSON.stringify(raw))
      if (!headers.has('content-type')) headers.set('content-type', 'application/json')
    }
  }

  try {
    const upstream = await fetch(target, {
      method: req.method || 'GET',
      headers,
      body,
      redirect: 'manual',
    })

    res.status(upstream.status)
    upstream.headers.forEach((value, key) => {
      const lower = key.toLowerCase()
      if (lower === 'transfer-encoding' || lower === 'connection') return
      res.setHeader(key, value)
    })

    const buf = Buffer.from(await upstream.arrayBuffer())
    res.end(buf)
  } catch (err) {
    console.error('[clerk-fapi proxy]', err)
    res.status(502).json({ error: 'Clerk Frontend API proxy failed' })
  }
}
