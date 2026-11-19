/**
 * Cloud learner snapshot stored per Clerk userId in Upstash.
 */

export type ProgressData = {
  completedDays: number[]
  completedQuizzes: Record<string, boolean>
  currentStreak: number
  lastActivityDate: string
  quizScores: Record<string, number>
}

export type LabCloudState = {
  exercise: string
  view: 'exercises' | 'community' | 'settings'
  tools: boolean
  tab?: string
}

/** In-progress day bar (mid-quiz). percent null = cleared. */
export type LiveProgressState = {
  day: number
  percent: number | null
  updatedAt: string
}

export type UserCloudSnapshot = {
  version: 1
  updatedAt: string
  progress: ProgressData
  lab?: LabCloudState | null
  liveProgress?: LiveProgressState | null
  notes?: unknown
  annotations?: unknown
  reflections?: unknown
  flashcards?: unknown
  snippets?: unknown
}

export const USER_CLOUD_KEY_PREFIX = 'rm:user:'

export function userCloudKey(userId: string): string {
  return `${USER_CLOUD_KEY_PREFIX}${userId}:v1`
}

export function emptyProgress(): ProgressData {
  return {
    completedDays: [],
    completedQuizzes: {},
    currentStreak: 0,
    lastActivityDate: '',
    quizScores: {},
  }
}

export function emptySnapshot(): UserCloudSnapshot {
  return {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    progress: emptyProgress(),
    lab: null,
    liveProgress: null,
    notes: [],
    annotations: [],
    reflections: [],
    flashcards: [],
    snippets: [],
  }
}

export function normalizeLiveProgress(raw: unknown): LiveProgressState | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const day = Number(o.day)
  if (!Number.isFinite(day) || day < 1) return null
  const updatedAt = typeof o.updatedAt === 'string' ? o.updatedAt : ''
  if (!updatedAt) return null
  if (o.percent == null) {
    return { day, percent: null, updatedAt }
  }
  const percent = Number(o.percent)
  if (!Number.isFinite(percent)) return null
  return {
    day,
    percent: Math.min(80, Math.max(0, Math.round(percent))),
    updatedAt,
  }
}

export function mergeLiveProgress(
  a: LiveProgressState | null | undefined,
  b: LiveProgressState | null | undefined,
): LiveProgressState | null {
  const left = a ?? null
  const right = b ?? null
  if (!left) return right
  if (!right) return left
  return (left.updatedAt || '') >= (right.updatedAt || '') ? left : right
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

export function normalizeProgress(raw: unknown): ProgressData {
  const o = asRecord(raw)
  const completedDays = Array.isArray(o.completedDays)
    ? o.completedDays.filter((d): d is number => typeof d === 'number')
    : []
  const completedQuizzes = asRecord(o.completedQuizzes)
  const quizScores = asRecord(o.quizScores)
  const quizzes: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(completedQuizzes)) {
    if (v === true) quizzes[k] = true
  }
  const scores: Record<string, number> = {}
  for (const [k, v] of Object.entries(quizScores)) {
    const n = Number(v)
    if (Number.isFinite(n)) scores[k] = n
  }
  return {
    completedDays: [...new Set(completedDays)].sort((a, b) => a - b),
    completedQuizzes: quizzes,
    currentStreak: Math.max(0, Math.floor(Number(o.currentStreak) || 0)),
    lastActivityDate: typeof o.lastActivityDate === 'string' ? o.lastActivityDate : '',
    quizScores: scores,
  }
}

export function mergeProgress(a: ProgressData, b: ProgressData): ProgressData {
  const completedDays = [...new Set([...a.completedDays, ...b.completedDays])].sort((x, y) => x - y)
  const completedQuizzes = { ...a.completedQuizzes, ...b.completedQuizzes }
  const quizScores = { ...a.quizScores }
  for (const [k, v] of Object.entries(b.quizScores)) {
    quizScores[k] = Math.max(quizScores[k] ?? 0, v)
  }
  const lastActivityDate =
    (a.lastActivityDate || '') >= (b.lastActivityDate || '')
      ? a.lastActivityDate || b.lastActivityDate
      : b.lastActivityDate || a.lastActivityDate
  return {
    completedDays,
    completedQuizzes,
    quizScores,
    currentStreak: Math.max(a.currentStreak, b.currentStreak),
    lastActivityDate,
  }
}

function itemStamp(row: Record<string, unknown>): string {
  for (const key of ['updatedAt', 'lastReviewDate', 'createdAt'] as const) {
    const v = row[key]
    if (typeof v === 'string' && v) return v
  }
  return ''
}

function mergeById(local: unknown, cloud: unknown): unknown[] {
  const a = Array.isArray(local) ? local : []
  const b = Array.isArray(cloud) ? cloud : []
  const map = new Map<string, Record<string, unknown>>()
  for (const item of [...b, ...a]) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const id = typeof row.id === 'string' ? row.id : null
    if (!id) continue
    const prev = map.get(id)
    if (!prev) {
      map.set(id, row)
      continue
    }
    map.set(id, itemStamp(row) >= itemStamp(prev) ? row : prev)
  }
  return [...map.values()]
}

export function mergeSnapshots(
  local: Partial<UserCloudSnapshot> | null | undefined,
  cloud: UserCloudSnapshot | null | undefined,
): UserCloudSnapshot {
  const base = emptySnapshot()
  const l = local || {}
  const c = cloud || emptySnapshot()
  const progress = mergeProgress(
    normalizeProgress(l.progress ?? base.progress),
    normalizeProgress(c.progress),
  )
  const localNewer = (l.updatedAt || '') > (c.updatedAt || '')
  const lab = localNewer ? (l.lab ?? c.lab ?? null) : (c.lab ?? l.lab ?? null)
  const liveProgress = mergeLiveProgress(
    normalizeLiveProgress(l.liveProgress),
    normalizeLiveProgress(c.liveProgress),
  )
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    progress,
    lab: lab || null,
    liveProgress,
    notes: mergeById(l.notes, c.notes),
    annotations: mergeById(l.annotations, c.annotations),
    reflections: mergeById(l.reflections, c.reflections),
    flashcards: mergeById(l.flashcards, c.flashcards),
    snippets: mergeById(l.snippets, c.snippets),
  }
}

export function parseSnapshot(raw: string | null): UserCloudSnapshot | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<UserCloudSnapshot>
    if (!parsed || typeof parsed !== 'object') return null
    return {
      version: 1,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date(0).toISOString(),
      progress: normalizeProgress(parsed.progress),
      lab: parsed.lab ?? null,
      liveProgress: normalizeLiveProgress(parsed.liveProgress),
      notes: parsed.notes ?? [],
      annotations: parsed.annotations ?? [],
      reflections: parsed.reflections ?? [],
      flashcards: parsed.flashcards ?? [],
      snippets: parsed.snippets ?? [],
    }
  } catch {
    return null
  }
}

function cappedArray(value: unknown, max: number): unknown[] {
  return Array.isArray(value) ? value.slice(0, max) : []
}

export function sanitizeIncomingSnapshot(body: unknown): UserCloudSnapshot | null {
  if (!body || typeof body !== 'object') return null
  const o = body as Partial<UserCloudSnapshot>
  const snap: UserCloudSnapshot = {
    version: 1,
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : new Date().toISOString(),
    progress: normalizeProgress(o.progress),
    lab: o.lab ?? null,
    liveProgress: normalizeLiveProgress(o.liveProgress),
    notes: cappedArray(o.notes, 500),
    annotations: cappedArray(o.annotations, 500),
    reflections: cappedArray(o.reflections, 500),
    flashcards: cappedArray(o.flashcards, 1000),
    snippets: cappedArray(o.snippets, 500),
  }
  // Cap JSON size roughly by stringifying later; reject huge payloads in handler.
  return snap
}
