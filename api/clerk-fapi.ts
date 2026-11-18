/**
 * Proxies Clerk Frontend API through this origin.
 * Required on vercel.app production — you cannot CNAME clerk.*.vercel.app.
 *
 * Browser → /__clerk/*  (rewrite) → /api/clerk-fapi?clerkPath=* → frontend-api.clerk.dev
 */
/// <reference types="node" />
import type { VercelRequest, VercelResponse } from '@vercel/node'

const FAPI_ORIGIN = 'https://frontend-api.clerk.dev'

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
  return req.socket?.remoteAddress || '0.0.0.0'
}

function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function clerkPath(req: VercelRequest): string {
  const q = req.query.clerkPath
  if (typeof q === 'string') return q.replace(/^\/+/, '')
  if (Array.isArray(q) && q[0]) return String(q[0]).replace(/^\/+/, '')

  const url = req.url || ''
  const fromApi = url.match(/\/api\/clerk-fapi\/?(.*)$/)
  if (fromApi?.[1]) return fromApi[1].split('?')[0]!.replace(/^\/+/, '')
  const fromProxy = url.match(/\/__clerk\/?(.*)$/)
  if (fromProxy?.[1]) return fromProxy[1].split('?')[0]!.replace(/^\/+/, '')
  return ''
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

  const suffix = clerkPath(req)
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
    body = await readRawBody(req)
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

    res.end(Buffer.from(await upstream.arrayBuffer()))
  } catch (err) {
    console.error('[clerk-fapi proxy]', err)
    res.status(502).json({ error: 'Clerk Frontend API proxy failed' })
  }
}
