/**
 * Load .env for Vite API middleware without empty process.env placeholders
 * (common when an IDE injects blank secret slots) shadowing real file values.
 */
import fs from 'node:fs'
import path from 'node:path'
import { loadEnv } from 'vite'

const ENV_FILES = ['.env', '.env.local', '.env.development', '.env.development.local'] as const

function parseEnvFile(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key) out[key] = value
  }
  return out
}

function readEnvFiles(root: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const name of ENV_FILES) {
    const file = path.join(root, name)
    if (!fs.existsSync(file)) continue
    try {
      Object.assign(out, parseEnvFile(fs.readFileSync(file, 'utf8')))
    } catch {
      /* ignore unreadable env file */
    }
  }
  return out
}

/** Prefer non-empty .env file values over blank process.env placeholders. */
export function loadDevServerEnv(mode: string, root: string): Record<string, string> {
  const fromFiles = readEnvFiles(root)

  // Clear empty placeholders so Vite loadEnv + helpers see real values.
  for (const [key, fileVal] of Object.entries(fromFiles)) {
    if (fileVal && process.env[key] === '') {
      delete process.env[key]
    }
  }

  const fromVite = loadEnv(mode, root, '')
  const merged: Record<string, string> = { ...fromVite }

  for (const [key, fileVal] of Object.entries(fromFiles)) {
    if (!fileVal) continue
    if (!merged[key]) merged[key] = fileVal
  }

  for (const [key, value] of Object.entries(merged)) {
    if (value && (!process.env[key] || process.env[key] === '')) {
      process.env[key] = value
    }
  }

  return merged
}
