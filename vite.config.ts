import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { aiQuizDevPlugin } from './vite-plugin-ai-quiz'

const root = path.dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf-8')) as {
  version: string
  author?: string | { name?: string }
}

const author =
  typeof pkg.author === 'string'
    ? pkg.author.replace(/\s*<[^>]*>\s*/g, '').trim()
    : pkg.author?.name ?? 'Letlhogonolo Sekwati'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const sentryAuthToken = env.SENTRY_AUTH_TOKEN || process.env.SENTRY_AUTH_TOKEN
  const sentryOrg = env.SENTRY_ORG || process.env.SENTRY_ORG || 'react-mastery-day-1'
  const sentryProject = env.SENTRY_PROJECT || process.env.SENTRY_PROJECT || 'react-mastery-day1'
  const releaseName = `react-mastery@${pkg.version}`

  return {
    plugins: [
      react(),
      aiQuizDevPlugin(),
      // After other plugins; only uploads when auth token is present (CI/production builds)
      ...(sentryAuthToken
        ? [
            sentryVitePlugin({
              org: sentryOrg,
              project: sentryProject,
              authToken: sentryAuthToken,
              release: {
                name: releaseName,
              },
              sourcemaps: {
                filesToDeleteAfterUpload: ['./dist/**/*.map'],
              },
            }),
          ]
        : []),
    ],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __APP_AUTHOR__: JSON.stringify(author),
    },
    build: {
      sourcemap: 'hidden',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            motion: ['framer-motion'],
            markdown: ['react-markdown'],
          },
        },
      },
    },
    server: {
      watch: {
        usePolling: true,
      },
    },
  }
})
