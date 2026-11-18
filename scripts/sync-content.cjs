#!/usr/bin/env node

/**
 * Sync community content from the separate content repository
 * into this app's content/ folder, then ready for generate:content.
 *
 * Sources (first match wins):
 * 1. CONTENT_REPO_URL env var (git URL or local path)
 * 2. .content-repo file in project root (single line URL/path)
 * 3. ../react-mastery-content (local sibling repo)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const APP_ROOT = path.join(__dirname, '..');
const CONTENT_DEST = path.join(APP_ROOT, 'content');
const DEFAULT_LOCAL = path.resolve(APP_ROOT, '..', 'react-mastery-content');
const DEFAULT_GITHUB = 'https://github.com/Tlhogi007/react-mastery-content.git';
const CACHE_DIR = path.join(APP_ROOT, '.content-cache');

function readConfigUrl() {
  if (process.env.CONTENT_REPO_URL) {
    return process.env.CONTENT_REPO_URL.trim();
  }

  const configFile = path.join(APP_ROOT, '.content-repo');
  if (fs.existsSync(configFile)) {
    const line = fs.readFileSync(configFile, 'utf-8').split('\n').find((l) => l.trim() && !l.trim().startsWith('#'));
    if (line) return line.trim();
  }

  if (fs.existsSync(DEFAULT_LOCAL)) {
    return DEFAULT_LOCAL;
  }

  // Production / Vercel: no local sibling — pull from the public content repo
  return DEFAULT_GITHUB;
}

function isGitUrl(source) {
  return (
    source.startsWith('git@') ||
    source.startsWith('https://') ||
    source.startsWith('http://') ||
    source.startsWith('ssh://') ||
    source.endsWith('.git')
  );
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

function syncFromLocal(sourcePath) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Content source not found: ${sourcePath}`);
  }

  console.log(`📂 Syncing from local path:\n   ${sourcePath}\n`);
  ensureDir(CONTENT_DEST);
  copyDir(sourcePath, CONTENT_DEST);
}

function syncFromGit(repoUrl) {
  console.log(`🌐 Syncing from git:\n   ${repoUrl}\n`);
  ensureDir(path.dirname(CACHE_DIR));

  if (fs.existsSync(path.join(CACHE_DIR, '.git'))) {
    execSync('git fetch origin && git reset --hard origin/main || git reset --hard origin/master', {
      cwd: CACHE_DIR,
      stdio: 'inherit',
    });
  } else {
    if (fs.existsSync(CACHE_DIR)) {
      fs.rmSync(CACHE_DIR, { recursive: true, force: true });
    }
    execSync(`git clone --depth 1 "${repoUrl}" "${CACHE_DIR}"`, { stdio: 'inherit' });
  }

  ensureDir(CONTENT_DEST);
  copyDir(CACHE_DIR, CONTENT_DEST);
}

function main() {
  console.log('🔄 Syncing content repo into app...\n');

  const source = readConfigUrl();

  if (!source) {
    console.log('⚠️  No content repo configured.');
    console.log('   Set CONTENT_REPO_URL, create .content-repo, or clone');
    console.log('   react-mastery-content next to this project.');
    console.log('\n   Keeping existing content/ folder as-is.\n');
    if (!fs.existsSync(path.join(CONTENT_DEST, 'community'))) {
      console.error('❌ No content/community found. Sync or add markdown files.');
      process.exit(1);
    }
    return;
  }

  if (isGitUrl(source)) {
    syncFromGit(source);
  } else {
    syncFromLocal(path.resolve(source));
  }

  const communityDir = path.join(CONTENT_DEST, 'community');
  const count = fs.existsSync(communityDir)
    ? execSync(`find "${communityDir}" -name "*.md" | wc -l`).toString().trim()
    : '0';

  console.log(`✅ Content synced to ${CONTENT_DEST}`);
  console.log(`📊 Community markdown files: ${count}\n`);
}

try {
  main();
} catch (error) {
  console.error('❌ Content sync failed:', error.message);
  process.exit(1);
}
