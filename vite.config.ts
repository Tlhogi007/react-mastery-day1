import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
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

export default defineConfig({
  plugins: [react(), aiQuizDevPlugin()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_AUTHOR__: JSON.stringify(author),
  },
  build: {
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
})
