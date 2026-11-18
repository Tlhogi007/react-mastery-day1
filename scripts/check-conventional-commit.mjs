#!/usr/bin/env node
/**
 * Enforce Conventional Commits so semantic-release can bump versions.
 *
 * Usage:
 *   node scripts/check-conventional-commit.mjs .git/COMMIT_EDITMSG
 *   echo "fix: thing" | node scripts/check-conventional-commit.mjs
 *   node scripts/check-conventional-commit.mjs --range origin/main..HEAD
 *
 * Matches semantic-release / Angular convention:
 *   type(scope)!: subject
 */

import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const RELEASE_TYPES = new Set(['feat', 'fix', 'perf'])
const ALLOWED_TYPES = [
  'feat',
  'fix',
  'perf',
  'docs',
  'style',
  'refactor',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
]

const HEADER_RE = new RegExp(
  `^(${ALLOWED_TYPES.join('|')})(\\([a-z0-9][a-z0-9._/-]*\\))?(!)?: .+`,
  'i',
)

function help() {
  return `
Conventional commit required (semantic-release will skip prose commits).

  feat:     new feature      → minor bump
  fix:      bug fix          → patch bump
  perf:     performance      → patch bump
  feat!:    breaking change  → major bump
  docs|style|refactor|test|build|ci|chore|revert → no version bump (still valid)

Examples:
  feat(quiz): add timed mode
  fix(ui): make favicon readable in dark browser tabs
  chore: tweak eslint config

Bad (will be rejected):
  Ship security hardening
  fix missing colon
  Updated stuff
`.trim()
}

function normalizeMessage(raw) {
  return raw
    .split(/\r?\n/)
    .filter((line) => !line.startsWith('#'))
    .join('\n')
    .trim()
}

function firstLine(message) {
  return message.split(/\r?\n/)[0]?.trim() ?? ''
}

function isSkippable(line) {
  if (!line) return true
  if (/^Merge /.test(line)) return true
  if (/^Revert "/.test(line)) return true
  // semantic-release's own release commits
  if (/^chore\(release\):/.test(line)) return true
  return false
}

export function validateCommitMessage(raw) {
  const message = normalizeMessage(raw)
  const line = firstLine(message)

  if (isSkippable(line)) {
    return { ok: true, line, skipped: true }
  }

  if (!HEADER_RE.test(line)) {
    return {
      ok: false,
      line,
      reason: 'header must look like: type(scope)?: subject',
    }
  }

  // Subject must not be empty after ": "
  const subject = line.slice(line.indexOf(':') + 1).trim()
  if (!subject) {
    return { ok: false, line, reason: 'subject is empty' }
  }

  const type = line.match(/^([a-z]+)/i)?.[1]?.toLowerCase() ?? ''
  return {
    ok: true,
    line,
    type,
    releases: RELEASE_TYPES.has(type) || line.includes('!:'),
  }
}

function gitLogRange(range) {
  const result = spawnSync(
    'git',
    ['log', '--format=%s', range],
    { encoding: 'utf8' },
  )
  if (result.status !== 0) {
    throw new Error(result.stderr || `git log failed for range ${range}`)
  }
  return result.stdout
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function main() {
  const args = process.argv.slice(2)

  if (args[0] === '--help' || args[0] === '-h') {
    console.log(help())
    process.exit(0)
  }

  // Validate all commit subjects in a git range (CI / pre-push)
  if (args[0] === '--range') {
    const range = args[1]
    if (!range) {
      console.error('Usage: check-conventional-commit.mjs --range <git-range>')
      process.exit(2)
    }
    const subjects = gitLogRange(range)
    if (subjects.length === 0) {
      console.log(`No commits in range ${range}`)
      process.exit(0)
    }

    let failed = 0
    let releaseable = 0
    for (const subject of subjects) {
      const result = validateCommitMessage(subject)
      if (!result.ok) {
        failed += 1
        console.error(`✖ ${subject}`)
        console.error(`  → ${result.reason}`)
      } else if (result.releases) {
        releaseable += 1
        console.log(`✔ ${subject} (release)`)
      } else if (!result.skipped) {
        console.log(`✔ ${subject}`)
      }
    }

    if (failed > 0) {
      console.error(`\n${failed} commit(s) are not conventional.\n`)
      console.error(help())
      process.exit(1)
    }

    if (releaseable === 0) {
      console.warn(
        '\n⚠️  No feat/fix/perf commits in this range — semantic-release will skip a version bump.\n',
      )
    } else {
      console.log(`\n${releaseable} commit(s) can trigger a semantic-release bump.`)
    }
    process.exit(0)
  }

  let raw = ''
  if (args[0] && args[0] !== '-') {
    raw = readFileSync(args[0], 'utf8')
  } else if (!process.stdin.isTTY) {
    raw = readFileSync(0, 'utf8')
  } else {
    console.error('Pass a commit message file, stdin, or --range <git-range>')
    console.error(help())
    process.exit(2)
  }

  const result = validateCommitMessage(raw)
  if (!result.ok) {
    console.error(`✖ Invalid commit message: "${result.line}"`)
    console.error(`  → ${result.reason}\n`)
    console.error(help())
    process.exit(1)
  }

  if (!result.skipped && !result.releases) {
    console.warn(
      `⚠ "${result.line}" is valid but will NOT bump the version (use feat/fix/perf for releases).`,
    )
  }
}

const isDirectRun = import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('check-conventional-commit.mjs')

if (isDirectRun) {
  try {
    main()
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }
}
