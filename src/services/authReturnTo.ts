/**
 * Remembers where the user was before Clerk OAuth remounts the SPA,
 * and encodes it in the URL hash so redirect targets stay dynamic.
 */

export const ACTIVE_TAB_KEY = 'rm-active-tab'
export const LAB_SESSION_KEY = 'rm-lab-session'
/** Set before Clerk sign-out so a remount still opens landing, not the lab. */
export const FORCE_LANDING_KEY = 'rm-force-landing'

export type AuthReturnView = 'exercises' | 'community' | 'settings'

export function normalizeLabView(view: unknown): AuthReturnView {
  if (view === 'community' || view === 'settings') return view
  return 'exercises'
}

export type AuthReturnTo = {
  inLab: boolean
  exercise: string
  view: AuthReturnView
  tools: boolean
  tab: string
}

type LabSession = {
  exercise: string
  view: AuthReturnView
  tools: boolean
}

function safeGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

function safeRemove(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/** Strip SPA restore markers from the URL (query + hash) without a navigation. */
function stripReturnMarkersFromUrl(): void {
  if (typeof window === 'undefined') return
  try {
    const url = new URL(window.location.href)
    url.searchParams.delete('rm')
    url.searchParams.delete('ex')
    url.searchParams.delete('tab')
    url.searchParams.delete('view')
    url.searchParams.delete('tools')
    url.hash = ''
    const next = `${url.pathname}${url.search}`
    window.history.replaceState(null, '', next || '/')
  } catch {
    /* ignore */
  }
}

/** Clear lab/OAuth return state (e.g. after sign-out → landing). */
export function clearLabNavigationState(): void {
  safeRemove(LAB_SESSION_KEY)
  safeRemove(ACTIVE_TAB_KEY)
  safeRemove(FORCE_LANDING_KEY)
  stripReturnMarkersFromUrl()
}

/**
 * Call synchronously when the Clerk session ends (or right before signOut).
 * Survives a full remount via session flag + `?rm=landing` (hash-free for Clerk).
 */
export function prepareLandingAfterSignOut(): void {
  safeSet(FORCE_LANDING_KEY, '1')
  safeRemove(LAB_SESSION_KEY)
  safeRemove(ACTIVE_TAB_KEY)
  if (typeof window === 'undefined') return
  try {
    const url = new URL(window.location.href)
    url.searchParams.set('rm', 'landing')
    url.hash = ''
    window.history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}`)
  } catch {
    /* ignore */
  }
}

export function landingAfterSignOutUrl(): string {
  if (typeof window === 'undefined') return '/?rm=landing'
  return `${window.location.origin}/?rm=landing`
}

/** Drop remount flag after SPA already showed landing (keeps `#rm=landing` for Clerk redirect). */
export function clearForceLandingFlag(): void {
  safeRemove(FORCE_LANDING_KEY)
}

export function getActiveTab(): string | null {
  return safeGet(ACTIVE_TAB_KEY)
}

export function setActiveTab(tab: string): void {
  safeSet(ACTIVE_TAB_KEY, tab)
}

export function readLabSession(validExercises: Record<string, unknown>): LabSession | null {
  try {
    const raw = safeGet(LAB_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<LabSession>
    if (!parsed.exercise || !(parsed.exercise in validExercises)) return null
    return {
      exercise: parsed.exercise,
      view: normalizeLabView(parsed.view),
      tools: Boolean(parsed.tools),
    }
  } catch {
    return null
  }
}

export function writeLabSession(session: LabSession): void {
  safeSet(LAB_SESSION_KEY, JSON.stringify(session))
}

function snapshotFromStorage(overrides?: Partial<AuthReturnTo>): AuthReturnTo {
  let lab: LabSession | null = null
  try {
    const raw = safeGet(LAB_SESSION_KEY)
    if (raw) lab = JSON.parse(raw) as LabSession
  } catch {
    lab = null
  }

  const inLab = overrides?.inLab ?? Boolean(lab)
  return {
    inLab,
    exercise: overrides?.exercise ?? lab?.exercise ?? 'day01-rendering-pipeline',
    view: overrides?.view ?? lab?.view ?? 'exercises',
    tools: overrides?.tools ?? Boolean(lab?.tools),
    tab: overrides?.tab ?? getActiveTab() ?? 'learn',
  }
}

function persistSnapshot(state: AuthReturnTo): void {
  setActiveTab(state.tab)
  if (state.inLab) {
    writeLabSession({
      exercise: state.exercise,
      view: state.view,
      tools: state.tools,
    })
  }
}

function encodeHash(state: AuthReturnTo): string {
  const params = new URLSearchParams()
  params.set('rm', state.inLab ? 'lab' : 'landing')
  if (state.inLab) {
    params.set('ex', state.exercise)
    params.set('tab', state.tab)
    params.set('view', state.view)
    if (state.tools) params.set('tools', '1')
  }
  return `#${params.toString()}`
}

function parseReturnParams(params: URLSearchParams): Partial<AuthReturnTo> | null {
  const rm = params.get('rm')
  if (rm !== 'lab' && rm !== 'landing') return null
  return {
    inLab: rm === 'lab',
    exercise: params.get('ex') || undefined,
    tab: params.get('tab') || undefined,
    view: normalizeLabView(params.get('view')),
    tools: params.get('tools') === '1',
  }
}

/** Query first (Clerk afterSignOutUrl), then hash (local SPA restore). */
function parseReturnMarker(): Partial<AuthReturnTo> | null {
  if (typeof window === 'undefined') return null
  const fromQuery = parseReturnParams(new URLSearchParams(window.location.search))
  if (fromQuery) return fromQuery
  const raw = window.location.hash.replace(/^#/, '')
  if (!raw || !raw.includes('rm=')) return null
  return parseReturnParams(new URLSearchParams(raw))
}

/**
 * Capture current UI for post-auth restore.
 * Writes hash + sessionStorage for the SPA, but returns a hash-free absolute URL
 * for Clerk — OAuth allowlists reject fragments, and `#rm=landing` after sign-out
 * was blocking the next openSignIn.
 */
export function prepareAuthReturnUrl(overrides?: Partial<AuthReturnTo>): string {
  const state = snapshotFromStorage(overrides)
  persistSnapshot(state)
  if (typeof window === 'undefined') return '/'
  const pathSearch = `${window.location.pathname}${window.location.search}` || '/'
  const hash = encodeHash(state)
  try {
    // Keep SPA restore marker locally; never hand the fragment to Clerk.
    window.history.replaceState(null, '', `${pathSearch}${hash}`)
  } catch {
    /* ignore */
  }
  return `${window.location.origin}${pathSearch}`
}

/** Prefer URL marker (query/hash), else sessionStorage. */
export function readAuthReturnTo(
  validExercises: Record<string, unknown>,
): AuthReturnTo | null {
  const forceLanding = safeGet(FORCE_LANDING_KEY) === '1'
  const fromMarker = parseReturnMarker()

  // Sign-out remount: never restore the lab from a stale session key.
  if (forceLanding || fromMarker?.inLab === false) {
    safeRemove(FORCE_LANDING_KEY)
    safeRemove(LAB_SESSION_KEY)
    safeRemove(ACTIVE_TAB_KEY)
    stripReturnMarkersFromUrl()
    return {
      inLab: false,
      exercise: 'day01-rendering-pipeline',
      view: 'exercises',
      tools: false,
      tab: 'learn',
    }
  }

  if (fromMarker) {
    const exercise =
      fromMarker.exercise && fromMarker.exercise in validExercises
        ? fromMarker.exercise
        : readLabSession(validExercises)?.exercise
    if (fromMarker.inLab && !exercise) return null
    const state: AuthReturnTo = {
      inLab: Boolean(fromMarker.inLab),
      exercise: exercise || 'day01-rendering-pipeline',
      view: normalizeLabView(fromMarker.view),
      tools: Boolean(fromMarker.tools),
      tab: fromMarker.tab || getActiveTab() || 'learn',
    }
    persistSnapshot(state)
    return state
  }

  const lab = readLabSession(validExercises)
  if (!lab) return null
  return {
    inLab: true,
    exercise: lab.exercise,
    view: lab.view,
    tools: lab.tools,
    tab: getActiveTab() || 'learn',
  }
}
