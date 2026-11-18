/**
 * Local-dev middleware mirroring /api/ai-quiz so Vite can run without `vercel dev`.
 * Reads GROQ_API_KEY / GEMINI_API_KEY / TOGETHER_API_KEY from env (never VITE_*).
 */
import type { Plugin, Connect } from 'vite'
import { loadEnv } from 'vite'
import {
  generateQuizContent,
  providerAvailability,
  type Provider,
} from './api/_lib/generateQuiz'
import { allowAiQuizRequest, clampQuestionCount } from './api/_lib/aiQuizGuard'

function readBody(req: Connect.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

export function aiQuizDevPlugin(): Plugin {
  return {
    name: 'ai-quiz-dev',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, '')
      const keys = {
        groq: env.GROQ_API_KEY || process.env.GROQ_API_KEY,
        gemini: env.GEMINI_API_KEY || process.env.GEMINI_API_KEY,
        together: env.TOGETHER_API_KEY || process.env.TOGETHER_API_KEY,
      }

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url !== '/api/ai-quiz') {
          next()
          return
        }

        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')

        if (req.method === 'GET') {
          res.statusCode = 200
          res.end(JSON.stringify(providerAvailability(keys)))
          return
        }

        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        const ip = req.socket.remoteAddress || 'local'
        const guard = await allowAiQuizRequest(ip)
        if (!guard.ok) {
          if (guard.retryAfterSec) {
            res.setHeader('Retry-After', String(guard.retryAfterSec))
          }
          res.statusCode = guard.status
          res.end(JSON.stringify({ error: guard.error }))
          return
        }

        try {
          const raw = await readBody(req)
          const body = JSON.parse(raw || '{}') as {
            provider?: Provider
            topic?: string
            count?: number
          }
          const provider: Provider =
            body.provider === 'groq' ||
            body.provider === 'gemini' ||
            body.provider === 'together' ||
            body.provider === 'auto'
              ? body.provider
              : 'auto'
          const topic = body.topic || ''
          const count = clampQuestionCount(body.count)

          if (!topic.trim()) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Missing topic' }))
            return
          }

          const result = await generateQuizContent(provider, topic, count, keys)
          if (!result.ok) {
            res.statusCode = result.status
            res.end(JSON.stringify({ error: result.error }))
            return
          }
          res.statusCode = 200
          res.end(JSON.stringify({ content: result.content, provider: result.used || provider }))
        } catch {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Proxy error' }))
        }
      })
    },
  }
}
