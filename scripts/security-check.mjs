#!/usr/bin/env node
/**
 * Static security gates for auth / secrets / Clerk proxy.
 *
 * Usage:
 *   npm run security
 *   node scripts/security-check.mjs
 *
 * Env:
 *   SECURITY_AUDIT=1  also run `npm audit --omit=dev --audit-level=high`
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative, extname } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(import.meta.url), '..', '..')
const failures = []

function fail(msg) {
  failures.push(msg)
}

function ok(msg) {
  console.log(`  ✓ ${msg}`)
}

function read(rel) {
  return readFileSync(join(ROOT, rel), 'utf8')
}

function trackedFiles() {
  const r = spawnSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'buffer' })
  if (r.status !== 0) {
    fail('git ls-files failed — run inside the git repo')
    return []
  }
  return r.stdout
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
}

const TEXT_EXT = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.yml',
  '.yaml',
  '.md',
  '.css',
  '.html',
  '.env',
  '.txt',
  '.sh',
])

/** Real-looking secrets (not the short prefixes we compare against in source). */
const SECRET_PATTERNS = [
  {
    name: 'Clerk secret key',
    re: /\bsk_(?:live|test)_[A-Za-z0-9]{20,}\b/g,
  },
  {
    name: 'Clerk publishable key literal',
    // Allow startsWith('pk_live_') style checks — require long payload.
    re: /\bpk_(?:live|test)_[A-Za-z0-9]{20,}\b/g,
  },
  {
    name: 'OpenAI-style key',
    re: /\bsk-[A-Za-z0-9]{20,}\b/g,
  },
  {
    name: 'GitHub PAT',
    re: /\bghp_[A-Za-z0-9]{20,}\b/g,
  },
  {
    name: 'AWS access key id',
    re: /\bAKIA[0-9A-Z]{16}\b/g,
  },
  {
    name: 'Private key block',
    re: /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/g,
  },
]

const SKIP_SECRET_SCAN = new Set([
  // Generated / noisy
  'CHANGELOG.md',
  'package-lock.json',
])

console.log('security-check')

// ── 1. No committed env / credential files ─────────────────────────────────
console.log('\n[1] Env & credential files')
const bannedNames = ['.env', '.env.local', '.env.production', '.env.development']
for (const name of bannedNames) {
  if (existsSync(join(ROOT, name))) {
    const tracked = spawnSync('git', ['ls-files', '--error-unmatch', name], {
      cwd: ROOT,
      encoding: 'utf8',
    })
    if (tracked.status === 0) {
      fail(`${name} is tracked by git — secrets must stay untracked`)
    } else {
      ok(`${name} exists locally but is untracked`)
    }
  } else {
    ok(`${name} not present (or gitignored)`)
  }
}

const gi = read('.gitignore')
if (!gi.includes('.env')) {
  fail('.gitignore must ignore .env files')
} else {
  ok('.gitignore covers .env')
}

// ── 2. Secret literals in tracked source ───────────────────────────────────
console.log('\n[2] Secret literals in tracked files')
let secretHits = 0
for (const file of trackedFiles()) {
  if (SKIP_SECRET_SCAN.has(file)) continue
  if (file.startsWith('content/')) continue
  const ext = extname(file)
  if (ext && !TEXT_EXT.has(ext) && !file.endsWith('Dockerfile')) continue
  let text
  try {
    text = read(file)
  } catch {
    continue
  }
  for (const { name, re } of SECRET_PATTERNS) {
    re.lastIndex = 0
    const m = text.match(re)
    if (m?.length) {
      secretHits += m.length
      fail(`${file}: possible ${name} (${m.length} match${m.length > 1 ? 'es' : ''})`)
    }
  }
}
if (secretHits === 0) ok('no high-confidence secret literals in tracked files')

// ── 3. Client bundle must not reference server secrets ─────────────────────
console.log('\n[3] Client / VITE boundary')
const viteEnv = read('src/vite-env.d.ts')
if (/VITE_.*SECRET|VITE_.*PRIVATE|VITE_CLERK_SECRET/i.test(viteEnv)) {
  fail('src/vite-env.d.ts must not expose SECRET/PRIVATE via VITE_')
} else {
  ok('vite-env.d.ts has no VITE_ secret keys')
}

const clientHits = []
for (const file of trackedFiles()) {
  if (!file.startsWith('src/')) continue
  if (!/\.(ts|tsx|js|jsx)$/.test(file)) continue
  const text = read(file)
  if (/import\.meta\.env\.VITE_CLERK_SECRET|CLERK_SECRET_KEY/.test(text)) {
    clientHits.push(file)
  }
  if (/process\.env\.CLERK_SECRET_KEY/.test(text)) {
    clientHits.push(file)
  }
}
if (clientHits.length) {
  fail(`client src must not reference CLERK_SECRET_KEY: ${clientHits.join(', ')}`)
} else {
  ok('src/ does not reference CLERK_SECRET_KEY')
}

// ── 4. Clerk FAPI proxy invariants ─────────────────────────────────────────
console.log('\n[4] Clerk FAPI proxy (api/clerk-fapi.ts)')
const fapi = read('api/clerk-fapi.ts')
if (!fapi.includes("const FAPI_ORIGIN = 'https://frontend-api.clerk.dev'")) {
  fail('clerk-fapi must pin FAPI_ORIGIN to https://frontend-api.clerk.dev')
} else {
  ok('FAPI_ORIGIN pinned to frontend-api.clerk.dev')
}
if (!/path\.includes\('\.\.'\)/.test(fapi) && !/includes\('\.\.'\)/.test(fapi)) {
  fail('clerk-fapi clerkPath must reject ".." traversal')
} else {
  ok('clerkPath rejects path traversal')
}
if (!fapi.includes("includes('://')")) {
  fail('clerk-fapi clerkPath must reject absolute URL schemes')
} else {
  ok('clerkPath rejects URL schemes')
}
if (/detail:\s*err/.test(fapi)) {
  fail('clerk-fapi must not return internal error detail to clients')
} else {
  ok('proxy errors do not leak exception detail')
}
if (!fapi.includes('Clerk-Secret-Key')) {
  fail('clerk-fapi must send Clerk-Secret-Key upstream (Clerk proxy protocol)')
} else {
  ok('Clerk-Secret-Key set on upstream request only')
}
if (!fapi.includes('CLERK_FAPI_PROXY_ENABLED')) {
  fail('clerk-fapi must be opt-in via CLERK_FAPI_PROXY_ENABLED (fail closed)')
} else {
  ok('FAPI proxy requires CLERK_FAPI_PROXY_ENABLED=1')
}
if (!fapi.includes('Forbidden origin') && !fapi.includes('requestAllowed')) {
  fail('clerk-fapi must reject disallowed Origins')
} else {
  ok('FAPI proxy checks request origin')
}
if (!fapi.includes('MAX_BODY_BYTES') && !fapi.includes('Payload too large')) {
  fail('clerk-fapi must enforce a request body size limit')
} else {
  ok('FAPI proxy enforces body size limit')
}

// ── 5. Clerk provider / redirect hygiene ───────────────────────────────────
console.log('\n[5] Clerk provider redirects')
const provider = read('src/components/ThemedClerkProvider.tsx')
if (
  !provider.includes('afterSignOutUrl="/?rm=landing"') &&
  !provider.includes("afterSignOutUrl='/?rm=landing'")
) {
  fail('afterSignOutUrl must be hash-free "/?rm=landing"')
} else {
  ok('afterSignOutUrl is "/?rm=landing"')
}
if (!/startsWith\('\/'\)/.test(provider) || !/startsWith\('\/\/'\)/.test(provider)) {
  fail('VITE_CLERK_PROXY_URL must be validated as a relative same-origin path')
} else {
  ok('proxyUrl requires relative same-origin path')
}

const authReturn = read('src/services/authReturnTo.ts')
if (!/return `\$\{window\.location\.origin\}\$\{pathSearch\}`/.test(authReturn)) {
  // softer check
  if (authReturn.includes('${hash}') && authReturn.includes('return `${window.location.origin}${next}`')) {
    fail('prepareAuthReturnUrl must not return URL hashes to Clerk')
  } else {
    ok('prepareAuthReturnUrl returns hash-free Clerk redirect URL')
  }
} else {
  ok('prepareAuthReturnUrl returns hash-free Clerk redirect URL')
}

// ── 6. Auth helpers present ────────────────────────────────────────────────
console.log('\n[6] API auth helpers')
const auth = read('api/_lib/auth.ts')
for (const fn of ['requireAiUser', 'requireCloudUser', 'requireAdminUser', 'verifyToken']) {
  if (!auth.includes(fn)) fail(`api/_lib/auth.ts missing ${fn}`)
  else ok(`${fn} present`)
}
if (!auth.includes('authorizedParties')) {
  fail('JWT verify should use authorizedParties (azp binding)')
} else {
  ok('authorizedParties used for JWT azp binding')
}
if (
  !auth.includes("VERCEL_ENV === 'production'") ||
  !auth.includes("userId: 'anonymous'")
) {
  fail('requireAiUser must fail closed in production when Clerk is unset')
} else {
  ok('requireAiUser fails closed in production without Clerk')
}

const webhook = read('api/clerk-webhook.ts')
if (!webhook.includes('verifyWebhook') || !webhook.includes('CLERK_WEBHOOK_SIGNING_SECRET')) {
  fail('clerk-webhook must verify Svix signatures')
} else {
  ok('clerk-webhook verifies signing secret')
}

// ── 7. Optional npm audit ──────────────────────────────────────────────────
if (process.env.SECURITY_AUDIT === '1') {
  console.log('\n[7] npm audit (high+)')
  const audit = spawnSync(
    'npm',
    ['audit', '--omit=dev', '--audit-level=high'],
    { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32' },
  )
  if (audit.status !== 0) {
    fail('npm audit reported high/critical issues (SECURITY_AUDIT=1)')
    if (audit.stdout) console.log(audit.stdout.slice(0, 2000))
  } else {
    ok('npm audit clean at high+')
  }
} else {
  console.log('\n[7] npm audit skipped (set SECURITY_AUDIT=1 to enable)')
}

// ── Summary ────────────────────────────────────────────────────────────────
console.log('')
if (failures.length) {
  console.error(`security-check FAILED (${failures.length}):`)
  for (const f of failures) console.error(`  ✗ ${f}`)
  process.exit(1)
}
console.log('security-check PASSED')
process.exit(0)
