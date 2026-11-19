import type { ExerciseKey } from '../types/exercises'

export type ShareDayInfo = {
  key: ExerciseKey | string
  day: number
  week: number
  title: string
  description?: string
}

const SITE_NAME = 'React Mastery Lab'
const DEFAULT_DESCRIPTION =
  'Hands-on React internals lab — rendering, Fiber, effects, and deliberate practice.'

function absoluteOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return 'https://react-mastery-day1.vercel.app'
}

/** Public share page crawlers can read (static OG) before opening the lab. */
export function sharePathForExercise(exerciseKey: string): string {
  return `/share/${exerciseKey}/`
}

/** Deep link into the SPA lab for a given day. */
export function labDeepLink(exerciseKey: string, tab = 'learn'): string {
  const params = new URLSearchParams({
    rm: 'lab',
    ex: exerciseKey,
    tab,
    view: 'exercises',
  })
  return `/?${params.toString()}`
}

export function shareUrlForExercise(exerciseKey: string): string {
  return `${absoluteOrigin()}${sharePathForExercise(exerciseKey)}`
}

export function shareText(info: ShareDayInfo): string {
  return `Day ${info.day}: ${info.title} — ${SITE_NAME}`
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  if (typeof document === 'undefined') return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/** Client-side title/OG updates for in-app browsers and bookmarks. */
export function applyDocumentMeta(info: ShareDayInfo | 'landing'): void {
  if (typeof document === 'undefined') return

  if (info === 'landing') {
    document.title = SITE_NAME
    upsertMeta('name', 'description', DEFAULT_DESCRIPTION)
    upsertMeta('property', 'og:title', SITE_NAME)
    upsertMeta('property', 'og:description', DEFAULT_DESCRIPTION)
    upsertMeta('property', 'og:url', absoluteOrigin() + '/')
    return
  }

  const title = `Day ${info.day}: ${info.title} · ${SITE_NAME}`
  const description =
    info.description?.trim() ||
    `Week ${info.week} · Day ${info.day} of the React internals lab.`
  const url = shareUrlForExercise(info.key)

  document.title = title
  upsertMeta('name', 'description', description)
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:url', url)
  upsertMeta('property', 'twitter:title', title)
  upsertMeta('property', 'twitter:description', description)
}

export async function shareDay(info: ShareDayInfo): Promise<'shared' | 'copied'> {
  const url = shareUrlForExercise(info.key)
  const title = shareText(info)
  const text = info.description?.trim() || DEFAULT_DESCRIPTION

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url })
      return 'shared'
    } catch (err) {
      // User cancel — don't fall through to clipboard noise
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err
      }
    }
  }

  await navigator.clipboard.writeText(url)
  return 'copied'
}
