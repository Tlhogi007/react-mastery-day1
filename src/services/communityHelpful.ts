/**
 * Client helpers for “Helpful” votes on community posts.
 * Local vote state + remote Redis counts via /api/community-helpful.
 */

const LOCAL_KEY = 'rm-community-helpful-votes'
const COUNTS_EVENT = 'rm-community-helpful-counts'

export type HelpfulCounts = Record<string, number>

function readLocalVotes(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, boolean>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeLocalVotes(votes: Record<string, boolean>): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(votes))
  } catch {
    /* ignore */
  }
}

function bumpCloudDirty(): void {
  try {
    window.dispatchEvent(new CustomEvent('rm-progress-changed'))
  } catch {
    /* ignore */
  }
}

export function getLocalHelpfulVotes(): Record<string, boolean> {
  return readLocalVotes()
}

export function hasMarkedHelpful(slug: string): boolean {
  return Boolean(readLocalVotes()[slug])
}

export function setLocalHelpful(slug: string, helpful: boolean): void {
  const votes = readLocalVotes()
  if (helpful) votes[slug] = true
  else delete votes[slug]
  writeLocalVotes(votes)
  bumpCloudDirty()
}

/** Merge cloud votes into local (OR). */
export function applyHelpfulVotes(votes: Record<string, boolean> | null | undefined): void {
  if (!votes || typeof votes !== 'object') return
  const merged = { ...readLocalVotes() }
  for (const [slug, helpful] of Object.entries(votes)) {
    if (helpful) merged[slug] = true
  }
  writeLocalVotes(merged)
  window.dispatchEvent(new CustomEvent(COUNTS_EVENT, { detail: cachedCounts }))
}

let cachedCounts: HelpfulCounts = {}

export function getCachedHelpfulCounts(): HelpfulCounts {
  return cachedCounts
}

export function subscribeHelpfulCounts(cb: (counts: HelpfulCounts) => void): () => void {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<HelpfulCounts>).detail
    if (detail) cb(detail)
  }
  window.addEventListener(COUNTS_EVENT, handler)
  return () => window.removeEventListener(COUNTS_EVENT, handler)
}

export async function fetchHelpfulCounts(): Promise<HelpfulCounts> {
  try {
    const res = await fetch('/api/community-helpful', { cache: 'no-store' })
    if (!res.ok) return cachedCounts
    const data = (await res.json()) as { counts?: HelpfulCounts }
    cachedCounts = data.counts || {}
    window.dispatchEvent(new CustomEvent(COUNTS_EVENT, { detail: cachedCounts }))
    return cachedCounts
  } catch {
    return cachedCounts
  }
}

/** Toggle helpful; returns new count for slug (optimistic). */
export async function toggleHelpful(slug: string): Promise<{ helpful: boolean; count: number }> {
  const next = !hasMarkedHelpful(slug)
  setLocalHelpful(slug, next)
  const prev = cachedCounts[slug] || 0
  const optimistic = Math.max(0, prev + (next ? 1 : -1))
  cachedCounts = { ...cachedCounts, [slug]: optimistic }
  window.dispatchEvent(new CustomEvent(COUNTS_EVENT, { detail: cachedCounts }))

  try {
    const res = await fetch('/api/community-helpful', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, helpful: next }),
    })
    if (res.ok) {
      const data = (await res.json()) as { count?: number; counts?: HelpfulCounts }
      if (typeof data.count === 'number') {
        cachedCounts = { ...cachedCounts, [slug]: data.count }
      }
      if (data.counts) cachedCounts = data.counts
      window.dispatchEvent(new CustomEvent(COUNTS_EVENT, { detail: cachedCounts }))
      return { helpful: next, count: cachedCounts[slug] || 0 }
    }
  } catch {
    /* keep optimistic */
  }
  return { helpful: next, count: cachedCounts[slug] || 0 }
}
