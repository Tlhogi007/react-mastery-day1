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
const { spawnSync } = require('child_process');

const APP_ROOT = path.join(__dirname, '..');
const CONTENT_DEST = path.join(APP_ROOT, 'content');
const DEFAULT_LOCAL = path.resolve(APP_ROOT, '..', 'react-mastery-content');
const DEFAULT_GITHUB = 'https://github.com/Tlhogi007/react-mastery-content.git';
const CACHE_DIR = path.join(APP_ROOT, '.content-cache');

/** Only these remote repos are allowed (prevents shell/URL injection). */
const ALLOWED_GIT_URLS = new Set([
  DEFAULT_GITHUB,
  'https://github.com/Tlhogi007/react-mastery-content',
  'git@github.com:Tlhogi007/react-mastery-content.git',
]);

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

function assertAllowedGitUrl(repoUrl) {
  const normalized = repoUrl.replace(/\/+$/, '');
  if (!ALLOWED_GIT_URLS.has(repoUrl) && !ALLOWED_GIT_URLS.has(normalized)) {
    throw new Error(
      `Refusing content repo URL (not allowlisted): ${repoUrl}\n` +
        `Allowed: ${[...ALLOWED_GIT_URLS].join(', ')}`,
    );
  }
}

function assertSafeLocalPath(sourcePath) {
  const resolved = path.resolve(sourcePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Content source not found: ${resolved}`);
  }
  // Block path tricks that escape into unexpected locations via symlink abuse later;
  // require the path to be a directory we can read.
  const stat = fs.statSync(resolved);
  if (!stat.isDirectory()) {
    throw new Error(`Content source must be a directory: ${resolved}`);
  }
  return resolved;
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

function runGit(args, options = {}) {
  const result = spawnSync('git', args, {
    stdio: 'inherit',
    encoding: 'utf8',
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed (exit ${result.status})`);
  }
}

function syncFromLocal(sourcePath) {
  const resolved = assertSafeLocalPath(sourcePath);
  console.log(`📂 Syncing from local path:\n   ${resolved}\n`);
  ensureDir(CONTENT_DEST);
  copyDir(resolved, CONTENT_DEST);
}

function syncFromGit(repoUrl) {
  assertAllowedGitUrl(repoUrl);
  const cloneUrl = repoUrl.endsWith('.git') || repoUrl.startsWith('git@')
    ? repoUrl
    : `${repoUrl}.git`;

  console.log(`🌐 Syncing from git:\n   ${cloneUrl}\n`);
  ensureDir(path.dirname(CACHE_DIR));

  if (fs.existsSync(path.join(CACHE_DIR, '.git'))) {
    const fetch = spawnSync('git', ['fetch', 'origin'], {
      cwd: CACHE_DIR,
      stdio: 'inherit',
    });
    if (fetch.status !== 0) {
      throw new Error('git fetch origin failed');
    }
    const hardMain = spawnSync('git', ['reset', '--hard', 'origin/main'], {
      cwd: CACHE_DIR,
      stdio: 'inherit',
    });
    if (hardMain.status !== 0) {
      runGit(['reset', '--hard', 'origin/master'], { cwd: CACHE_DIR });
    }
  } else {
    if (fs.existsSync(CACHE_DIR)) {
      fs.rmSync(CACHE_DIR, { recursive: true, force: true });
    }
    runGit(['clone', '--depth', '1', cloneUrl, CACHE_DIR]);
  }

  ensureDir(CONTENT_DEST);
  copyDir(CACHE_DIR, CONTENT_DEST);
}

function countMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += countMarkdownFiles(full);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      count += 1;
    }
  }
  return count;
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
    syncFromLocal(source);
  }

  const communityDir = path.join(CONTENT_DEST, 'community');
  const count = countMarkdownFiles(communityDir);

  console.log(`✅ Content synced to ${CONTENT_DEST}`);
  console.log(`📊 Community markdown files: ${count}\n`);
}

try {
  main();
} catch (error) {
  console.error('❌ Content sync failed:', error.message);
  process.exit(1);
}
