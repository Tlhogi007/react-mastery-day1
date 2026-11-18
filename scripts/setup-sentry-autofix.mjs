#!/usr/bin/env node
/**
 * Guide + verify Sentry Seer → Cursor Cloud Agent autofix setup.
 *
 * Usage:
 *   npm run sentry:autofix
 *   SENTRY_AUTH_TOKEN=... npm run sentry:autofix
 *
 * Org/project defaults match vite.config.ts / Vercel:
 *   SENTRY_ORG=react-mastery-day-1
 *   SENTRY_PROJECT=react-mastery-day1
 */

import { spawnSync } from 'node:child_process'

const ORG = process.env.SENTRY_ORG || 'react-mastery-day-1'
const PROJECT = process.env.SENTRY_PROJECT || 'react-mastery-day1'
const TOKEN = process.env.SENTRY_AUTH_TOKEN || ''

const URLS = {
  cursorApiKeys: 'https://cursor.com/dashboard?tab=integrations',
  sentryCursorAgent: `https://sentry.io/settings/${ORG}/integrations/cursor-agent/`,
  sentrySeer: `https://sentry.io/settings/${ORG}/projects/${PROJECT}/seer/`,
  sentryGithub: `https://sentry.io/settings/${ORG}/integrations/github/`,
  sentryIntegrations: `https://sentry.io/settings/${ORG}/integrations/`,
}

function openUrl(url) {
  const cmd =
    process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
  spawnSync(cmd, [url], { shell: process.platform === 'win32', stdio: 'ignore' })
}

async function sentryGet(path) {
  const res = await fetch(`https://sentry.io/api/0${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }
  return { ok: res.ok, status: res.status, body }
}

console.log('Sentry Seer → Cursor Cloud Agent setup')
console.log(`Org: ${ORG}  Project: ${PROJECT}\n`)

console.log('Manual steps (Sentry UI — required once):')
console.log('  1. Cursor → Dashboard → Integrations → create a User API Key')
console.log('  2. Sentry → Integrations → Cursor Agent → Install → paste that key')
console.log('  3. Sentry → Project → Seer → enable automation')
console.log('     Coding agent / stopping point: Hand off to Cursor Cloud Agent')
console.log('  4. Sentry → Integrations → GitHub → connect Tlhogi007/react-mastery-day1')
console.log('')

if (process.argv.includes('--open') || process.argv.includes('-o')) {
  for (const url of Object.values(URLS)) openUrl(url)
  console.log('Opened setup URLs in your browser.\n')
} else {
  console.log('URLs:')
  for (const [k, url] of Object.entries(URLS)) console.log(`  ${k}: ${url}`)
  console.log('\nRe-run with --open to launch these pages.\n')
}

if (!TOKEN) {
  console.log('Verification skipped — set SENTRY_AUTH_TOKEN to verify via API.')
  console.log('  (Vercel has SENTRY_ORG/PROJECT/DSN; add a non-empty SENTRY_AUTH_TOKEN')
  console.log('   with org:read, project:read, project:write, event:read scopes.)')
  process.exit(0)
}

console.log('Verifying with Sentry API…')
const failures = []

const org = await sentryGet(`/organizations/${ORG}/`)
if (!org.ok) {
  failures.push(`org ${ORG}: HTTP ${org.status}`)
} else {
  console.log(`  ✓ org ${ORG}`)
}

const project = await sentryGet(`/projects/${ORG}/${PROJECT}/`)
if (!project.ok) {
  failures.push(`project ${PROJECT}: HTTP ${project.status}`)
} else {
  console.log(`  ✓ project ${PROJECT}`)
}

const repos = await sentryGet(`/organizations/${ORG}/repos/`)
if (!repos.ok || !Array.isArray(repos.body)) {
  failures.push(`repos: HTTP ${repos.status}`)
} else {
  const names = repos.body.map((r) => r.name || r.fullName || '').filter(Boolean)
  const hit = names.some((n) => /react-mastery-day1/i.test(n))
  if (hit) console.log(`  ✓ GitHub repo linked (${names.filter((n) => /react-mastery/i.test(n)).join(', ')})`)
  else {
    failures.push(
      `GitHub repo react-mastery-day1 not linked (found: ${names.slice(0, 8).join(', ') || 'none'})`,
    )
  }
}

const integs = await sentryGet(`/organizations/${ORG}/integrations/`)
if (!integs.ok || !Array.isArray(integs.body)) {
  failures.push(`integrations: HTTP ${integs.status}`)
} else {
  const keys = integs.body.map((i) => i.provider?.key || i.provider?.slug || i.name || '')
  const cursor = keys.some((k) => /cursor/i.test(String(k)))
  const github = keys.some((k) => /github/i.test(String(k)))
  if (cursor) console.log('  ✓ Cursor Agent integration installed')
  else failures.push('Cursor Agent integration not found — Install in Sentry → Integrations')
  if (github) console.log('  ✓ GitHub integration installed')
  else failures.push('GitHub integration not found')
  console.log(`  integrations: ${keys.filter(Boolean).slice(0, 12).join(', ') || '(none)'}`)
}

console.log('')
if (failures.length) {
  console.error('NOT READY:')
  for (const f of failures) console.error(`  ✗ ${f}`)
  console.error('\nFinish the manual steps above, then re-run with SENTRY_AUTH_TOKEN set.')
  process.exit(1)
}

console.log('READY — Seer can hand off to Cursor Cloud Agent once Seer project')
console.log('settings use “Hand off to Cursor Cloud Agent” (verify in the Seer UI).')
process.exit(0)
