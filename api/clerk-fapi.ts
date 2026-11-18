/**
 * Proxies Clerk Frontend API through this origin.
 * Required on vercel.app production — you cannot CNAME clerk.*.vercel.app.
 *
 * Browser → /__clerk/*  (rewrite) → /api/clerk-fapi?clerkPath=* → frontend-api.clerk.dev
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
  return '0.0.0.0'
}

function clerkPath(req: VercelRequest): string {
  const q = req.query.clerkPath
  if (typeof q === 'string') return decodeURIComponent(q).replace(/^\/+/, '')
  if (Array.isArray(q) && q[0]) return decodeURIComponent(String(q[0])).replace(/^\/+/, '')
  return ''
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
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

    const suffix = clerkPath(req)
    if (!suffix) {
      res.status(400).json({ error: 'Missing clerkPath' })
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

    const headers: Record<string, string> = {
      'Clerk-Proxy-Url': proxyUrl,
      'Clerk-Secret-Key': secret,
      'X-Forwarded-For': clientIp(req),
    }
    const accept = req.headers.accept
    if (typeof accept === 'string') headers.Accept = accept
    const contentType = req.headers['content-type']
    if (typeof contentType === 'string') headers['Content-Type'] = contentType
    const cookie = req.headers.cookie
    if (typeof cookie === 'string') headers.Cookie = cookie
    const authorization = req.headers.authorization
    if (typeof authorization === 'string') headers.Authorization = authorization

    let body: string | undefined
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body != null) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
      if (!headers['Content-Type']) headers['Content-Type'] = 'application/json'
    }

    const upstream = await fetch(target, {
      method: req.method || 'GET',
      headers,
      body,
      redirect: 'manual',
    })

    res.status(upstream.status)
    const passHeaders = ['content-type', 'cache-control', 'location', 'set-cookie']
    for (const key of passHeaders) {
      const value = upstream.headers.get(key)
      if (value) res.setHeader(key, value)
    }

    const buf = Buffer.from(await upstream.arrayBuffer())
    res.end(buf)
  } catch (err) {
    console.error('[clerk-fapi proxy]', err)
    res.status(502).json({
      error: 'Clerk Frontend API proxy failed',
      detail: err instanceof Error ? err.message : String(err),
    })
  }
}
