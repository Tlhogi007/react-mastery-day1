/**
 * Remembers where the user was before Clerk OAuth remounts the SPA,
 * and encodes it in the URL hash so redirect targets stay dynamic.
 */

export const ACTIVE_TAB_KEY = 'rm-active-tab'
export const LAB_SESSION_KEY = 'rm-lab-session'

export type AuthReturnView = 'exercises' | 'community'

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

/** Clear lab/OAuth return state (e.g. after sign-out → landing). */
export function clearLabNavigationState(): void {
  safeRemove(LAB_SESSION_KEY)
  safeRemove(ACTIVE_TAB_KEY)
  if (typeof window === 'undefined') return
  try {
    const path = `${window.location.pathname}${window.location.search}`
    window.history.replaceState(null, '', path)
  } catch {
    /* ignore */
  }
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
      view: parsed.view === 'community' ? 'community' : 'exercises',
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

function parseHash(): Partial<AuthReturnTo> | null {
  if (typeof window === 'undefined') return null
  const raw = window.location.hash.replace(/^#/, '')
  if (!raw || !raw.includes('rm=')) return null
  const params = new URLSearchParams(raw)
  const rm = params.get('rm')
  if (rm !== 'lab' && rm !== 'landing') return null
  return {
    inLab: rm === 'lab',
    exercise: params.get('ex') || undefined,
    tab: params.get('tab') || undefined,
    view: params.get('view') === 'community' ? 'community' : 'exercises',
    tools: params.get('tools') === '1',
  }
}

/** Capture current UI, sync hash, return absolute URL for Clerk redirect props. */
export function prepareAuthReturnUrl(overrides?: Partial<AuthReturnTo>): string {
  const state = snapshotFromStorage(overrides)
  persistSnapshot(state)
  const hash = encodeHash(state)
  if (typeof window === 'undefined') return '/'
  const next = `${window.location.pathname}${window.location.search}${hash}`
  try {
    window.history.replaceState(null, '', next)
  } catch {
    /* ignore */
  }
  return `${window.location.origin}${next}`
}

/** Prefer URL hash (OAuth return), else sessionStorage. */
export function readAuthReturnTo(
  validExercises: Record<string, unknown>,
): AuthReturnTo | null {
  const fromHash = parseHash()
  if (fromHash) {
    const exercise =
      fromHash.exercise && fromHash.exercise in validExercises
        ? fromHash.exercise
        : readLabSession(validExercises)?.exercise
    if (fromHash.inLab && !exercise) return null
    const state: AuthReturnTo = {
      inLab: Boolean(fromHash.inLab),
      exercise: exercise || 'day01-rendering-pipeline',
      view: fromHash.view === 'community' ? 'community' : 'exercises',
      tools: Boolean(fromHash.tools),
      tab: fromHash.tab || getActiveTab() || 'learn',
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
