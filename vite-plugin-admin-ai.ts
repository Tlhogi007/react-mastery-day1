/**
 * Local-dev middleware mirroring /api/admin-ai.
 */
import type { Plugin, Connect } from 'vite'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler from './api/admin-ai'
import { loadDevServerEnv } from './vite-plugin-env'

function readBody(req: Connect.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

export function adminAiDevPlugin(): Plugin {
  return {
    name: 'admin-ai-dev',
    configureServer(server) {
      loadDevServerEnv(server.config.mode, server.config.root)

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url !== '/api/admin-ai') {
          next()
          return
        }

        let body: unknown = undefined
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
          const raw = await readBody(req)
          try {
            body = raw ? JSON.parse(raw) : {}
          } catch {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Invalid JSON' }))
            return
          }
        }

        const vercelReq = {
          method: req.method,
          headers: req.headers,
          body,
          query: {},
        } as unknown as VercelRequest

        const vercelRes = {
          statusCode: 200,
          setHeader(name: string, value: string | number | readonly string[]) {
            res.setHeader(name, value)
            return vercelRes
          },
          status(code: number) {
            res.statusCode = code
            this.statusCode = code
            return this
          },
          json(payload: unknown) {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(payload))
            return this
          },
          end(chunk?: unknown) {
            if (chunk !== undefined) res.end(chunk as string)
            else res.end()
            return this
          },
        } as unknown as VercelResponse

        await handler(vercelReq, vercelRes)
      })
    },
  }
}
