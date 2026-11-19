#!/usr/bin/env node
/**
 * Static /share/{exercise}/index.html pages so OG crawlers get per-day titles
 * without running the SPA. Deep-links into /?rm=lab&ex=...
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ORIGIN = process.env.SHARE_ORIGIN || 'https://react-mastery-day1.vercel.app'
const OG = `${ORIGIN}/og.jpg`

const DAYS = [
  {
    key: 'day01-rendering-pipeline',
    day: 1,
    week: 1,
    title: 'Rendering Pipeline',
    description: 'Render phase vs Commit phase, Virtual DOM, and diffing basics.',
  },
  {
    key: 'day02-reconciliation',
    day: 2,
    week: 1,
    title: 'Reconciliation Deep Dive',
    description: 'Keys, type comparison, and list diffing complexity.',
  },
  {
    key: 'day03-fiber',
    day: 3,
    week: 1,
    title: 'Fiber Architecture',
    description: 'Fiber nodes, current vs workInProgress, unit of work.',
  },
  {
    key: 'day04-memoization',
    day: 4,
    week: 1,
    title: 'Bailouts & Memoization',
    description: 'React.memo, useMemo, useCallback, and referential equality.',
  },
  {
    key: 'day05-effects',
    day: 5,
    week: 1,
    title: 'Effects & Closures',
    description: 'useEffect timing, cleanup, stale closures, dependency traps.',
  },
  {
    key: 'day06-context',
    day: 6,
    week: 1,
    title: 'Context & Re-render Propagation',
    description: 'Why consumers re-render, splitting contexts, memoizing values.',
  },
  {
    key: 'day07-reflection',
    day: 7,
    week: 1,
    title: 'Weekly Deep Reflection',
    description: 'Teach-back Week 1: reconciliation, Fiber, effects, bailouts.',
  },
]

function escapeHtml(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

for (const d of DAYS) {
  const lab = `${ORIGIN}/?rm=lab&ex=${encodeURIComponent(d.key)}&tab=learn&view=exercises`
  const shareUrl = `${ORIGIN}/share/${d.key}/`
  const pageTitle = `Day ${d.day}: ${d.title} · React Mastery Lab`
  const dir = join(ROOT, 'public', 'share', d.key)
  mkdirSync(dir, { recursive: true })
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(d.description)}" />
    <link rel="canonical" href="${escapeHtml(lab)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="React Mastery Lab" />
    <meta property="og:title" content="${escapeHtml(pageTitle)}" />
    <meta property="og:description" content="${escapeHtml(d.description)}" />
    <meta property="og:url" content="${escapeHtml(shareUrl)}" />
    <meta property="og:image" content="${escapeHtml(OG)}" />
    <meta property="og:image:width" content="1280" />
    <meta property="og:image:height" content="720" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(d.description)}" />
    <meta name="twitter:image" content="${escapeHtml(OG)}" />
    <meta http-equiv="refresh" content="0;url=${escapeHtml(lab)}" />
    <script>location.replace(${JSON.stringify(lab)})</script>
  </head>
  <body style="font-family:system-ui,sans-serif;padding:2rem;background:#14151a;color:#f2f1ed">
    <p>Opening <strong>Day ${d.day}: ${escapeHtml(d.title)}</strong>…</p>
    <p><a href="${escapeHtml(lab)}" style="color:#e23d2b">Continue to the lab</a></p>
  </body>
</html>
`
  writeFileSync(join(dir, 'index.html'), html)
  console.log(`wrote public/share/${d.key}/index.html`)
}

console.log(`Generated ${DAYS.length} share pages.`)
