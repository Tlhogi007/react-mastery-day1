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
  view: 'exercises' | 'community' | 'settings' | 'support'
  tools: boolean
  tab?: string
}

/** In-progress day bar (mid-quiz). percent null = cleared. */
export type LiveProgressState = {
  day: number
  percent: number | null
  updatedAt: string
}

export type CloudSettings = {
  theme: 'light' | 'dark' | 'auto'
  onboardingComplete?: boolean
  studyMode?: boolean
  /** Last prefs change — last-write-wins for theme/focus (not snapshot.updatedAt). */
  updatedAt?: string
}

/** Mid-quiz session resume (answers, index, loaded questions). */
export type CloudQuizResume = {
  day: number
  currentQuestionIndex: number
  selectedAnswer: number | null
  score: number
  completed: boolean
  localQuestionsCompleted: boolean
  aiEnabled: boolean
  aiQuestionsLoaded: boolean
  allQuestions: unknown[]
  usedLocalQuestionIds: string[]
  incorrectAnswerIds: string[]
  totalTimeSpent: number
  at: number
}

export type UserCloudSnapshot = {
  version: 1
  updatedAt: string
  progress: ProgressData
  lab?: LabCloudState | null
  liveProgress?: LiveProgressState | null
  questionHistory?: unknown
  notes?: unknown
  annotations?: unknown
  reflections?: unknown
  flashcards?: unknown
  snippets?: unknown
  /** Theme / tour / focus — device prefs that should follow the account */
  settings?: CloudSettings | null
  /** In-progress quiz (newest `at` wins). null = cleared */
  quizResume?: CloudQuizResume | null
  /** Local learning-analytics event log (merged by timestamp+event) */
  analytics?: unknown
  /** Community posts this user marked helpful */
  helpfulVotes?: Record<string, boolean>
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

export function emptySettings(): CloudSettings {
  return {
    theme: 'auto',
    onboardingComplete: false,
    studyMode: false,
    updatedAt: '',
  }
}

export function emptySnapshot(): UserCloudSnapshot {
  return {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    progress: emptyProgress(),
    lab: null,
    liveProgress: null,
    questionHistory: [],
    notes: [],
    annotations: [],
    reflections: [],
    flashcards: [],
    snippets: [],
    settings: emptySettings(),
    quizResume: null,
    analytics: [],
    helpfulVotes: {},
  }
}

function mergeQuestionHistory(local: unknown, cloud: unknown): unknown[] {
  const map = new Map<string, Record<string, unknown>>()
  const ingest = (list: unknown) => {
    if (!Array.isArray(list)) return
    for (const item of list) {
      if (!item || typeof item !== 'object') continue
      const row = item as Record<string, unknown>
      const rawId = typeof row.questionId === 'string' ? row.questionId : null
      if (!rawId) continue
      const id = rawId.replace(/-duplicate-\d+-\d+$/i, '')
      const prev = map.get(id)
      const attempts = Math.max(0, Math.floor(Number(row.attempts) || 0))
      const lastSeen = Number(row.lastSeen) || 0
      if (!prev) {
        map.set(id, { ...row, questionId: id, attempts, lastSeen })
        continue
      }
      const prevAttempts = Math.max(0, Math.floor(Number(prev.attempts) || 0))
      const prevLast = Number(prev.lastSeen) || 0
      if (attempts > prevAttempts || (attempts === prevAttempts && lastSeen >= prevLast)) {
        map.set(id, {
          ...prev,
          ...row,
          questionId: id,
          attempts: Math.max(prevAttempts, attempts),
          answeredCorrectly: Boolean(row.answeredCorrectly) || Boolean(prev.answeredCorrectly),
          lastSeen: Math.max(prevLast, lastSeen),
        })
      } else if (row.answeredCorrectly) {
        prev.answeredCorrectly = true
        map.set(id, prev)
      }
    }
  }
  ingest(cloud)
  ingest(local)
  return [...map.values()]
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

export function normalizeSettings(raw: unknown): CloudSettings {
  const o = asRecord(raw)
  const theme =
    o.theme === 'light' || o.theme === 'dark' || o.theme === 'auto' ? o.theme : 'auto'
  return {
    theme,
    onboardingComplete: Boolean(o.onboardingComplete),
    studyMode: Boolean(o.studyMode),
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : '',
  }
}

export function mergeSettings(
  local: CloudSettings | null | undefined,
  cloud: CloudSettings | null | undefined,
): CloudSettings {
  const a = local ? normalizeSettings(local) : emptySettings()
  const b = cloud ? normalizeSettings(cloud) : emptySettings()
  const localPrefsNewer = (a.updatedAt || '') > (b.updatedAt || '')
  // Prefer an explicit light/dark choice over auto when only one side is auto.
  const theme =
    a.theme !== 'auto' && b.theme === 'auto'
      ? a.theme
      : b.theme !== 'auto' && a.theme === 'auto'
        ? b.theme
        : localPrefsNewer
          ? a.theme
          : b.theme
  return {
    theme,
    // Once the tour is done on any device, keep it done.
    onboardingComplete: Boolean(a.onboardingComplete || b.onboardingComplete),
    // Focus mode: prefs stamp last-write-wins.
    studyMode: localPrefsNewer ? a.studyMode : b.studyMode,
    updatedAt:
      (a.updatedAt || '') >= (b.updatedAt || '') ? a.updatedAt || b.updatedAt : b.updatedAt || a.updatedAt,
  }
}

export function normalizeQuizResume(raw: unknown): CloudQuizResume | null {
  if (raw == null) return null
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const day = Number(o.day)
  const at = Number(o.at)
  if (!Number.isFinite(day) || day < 1) return null
  if (!Number.isFinite(at) || at <= 0) return null
  // Stale resume (> 30 min) — treat as cleared for merge/apply
  if (Date.now() - at > 30 * 60_000) return null
  const allQuestions = Array.isArray(o.allQuestions) ? o.allQuestions.slice(0, 40) : []
  if (allQuestions.length === 0) return null
  return {
    day,
    currentQuestionIndex: Math.max(0, Math.floor(Number(o.currentQuestionIndex) || 0)),
    selectedAnswer:
      o.selectedAnswer == null ? null : Math.max(0, Math.floor(Number(o.selectedAnswer) || 0)),
    score: Math.max(0, Math.floor(Number(o.score) || 0)),
    completed: Boolean(o.completed),
    localQuestionsCompleted: Boolean(o.localQuestionsCompleted),
    aiEnabled: Boolean(o.aiEnabled),
    aiQuestionsLoaded: Boolean(o.aiQuestionsLoaded),
    allQuestions,
    usedLocalQuestionIds: Array.isArray(o.usedLocalQuestionIds)
      ? o.usedLocalQuestionIds.filter((id): id is string => typeof id === 'string').slice(0, 200)
      : [],
    incorrectAnswerIds: Array.isArray(o.incorrectAnswerIds)
      ? o.incorrectAnswerIds.filter((id): id is string => typeof id === 'string').slice(0, 200)
      : [],
    totalTimeSpent: Math.max(0, Math.floor(Number(o.totalTimeSpent) || 0)),
    at,
  }
}

export function mergeQuizResume(
  local: CloudQuizResume | null | undefined,
  cloud: CloudQuizResume | null | undefined,
): CloudQuizResume | null {
  const a = normalizeQuizResume(local)
  const b = normalizeQuizResume(cloud)
  if (!a) return b
  if (!b) return a
  return a.at >= b.at ? a : b
}

function mergeAnalytics(local: unknown, cloud: unknown): unknown[] {
  const map = new Map<string, Record<string, unknown>>()
  const ingest = (list: unknown) => {
    if (!Array.isArray(list)) return
    for (const item of list) {
      if (!item || typeof item !== 'object') continue
      const row = item as Record<string, unknown>
      const event = typeof row.event === 'string' ? row.event : ''
      const timestamp = Number(row.timestamp) || 0
      if (!event || !timestamp) continue
      const key = `${event}:${timestamp}`
      if (!map.has(key)) map.set(key, row)
    }
  }
  ingest(cloud)
  ingest(local)
  return [...map.values()]
    .sort((a, b) => (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0))
    .slice(-400)
}

function mergeHelpfulVotes(
  local: Record<string, boolean> | null | undefined,
  cloud: Record<string, boolean> | null | undefined,
): Record<string, boolean> {
  const out: Record<string, boolean> = { ...(cloud || {}) }
  for (const [k, v] of Object.entries(local || {})) {
    if (v) out[k] = true
    else if (!(k in out)) out[k] = false
  }
  // Keep only true votes to stay small
  const trimmed: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(out)) {
    if (v) trimmed[k] = true
  }
  return trimmed
}

function normalizeHelpfulVotes(raw: unknown): Record<string, boolean> {
  const o = asRecord(raw)
  const out: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(o)) {
    if (v === true) out[k] = true
  }
  return out
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
  const settings = mergeSettings(l.settings, c.settings)

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    progress,
    lab: lab || null,
    liveProgress,
    questionHistory: mergeQuestionHistory(l.questionHistory, c.questionHistory),
    notes: mergeById(l.notes, c.notes),
    annotations: mergeById(l.annotations, c.annotations),
    reflections: mergeById(l.reflections, c.reflections),
    flashcards: mergeById(l.flashcards, c.flashcards),
    snippets: mergeById(l.snippets, c.snippets),
    settings,
    quizResume: mergeQuizResume(
      normalizeQuizResume(l.quizResume),
      normalizeQuizResume(c.quizResume),
    ),
    analytics: mergeAnalytics(l.analytics, c.analytics),
    helpfulVotes: mergeHelpfulVotes(
      normalizeHelpfulVotes(l.helpfulVotes),
      normalizeHelpfulVotes(c.helpfulVotes),
    ),
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
      questionHistory: Array.isArray(parsed.questionHistory) ? parsed.questionHistory : [],
      notes: parsed.notes ?? [],
      annotations: parsed.annotations ?? [],
      reflections: parsed.reflections ?? [],
      flashcards: parsed.flashcards ?? [],
      snippets: parsed.snippets ?? [],
      settings: parsed.settings ? normalizeSettings(parsed.settings) : emptySettings(),
      quizResume: normalizeQuizResume(parsed.quizResume),
      analytics: Array.isArray(parsed.analytics) ? parsed.analytics : [],
      helpfulVotes: normalizeHelpfulVotes(parsed.helpfulVotes),
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
    questionHistory: cappedArray(o.questionHistory, 2000),
    notes: cappedArray(o.notes, 500),
    annotations: cappedArray(o.annotations, 500),
    reflections: cappedArray(o.reflections, 500),
    flashcards: cappedArray(o.flashcards, 1000),
    snippets: cappedArray(o.snippets, 500),
    settings: o.settings ? normalizeSettings(o.settings) : emptySettings(),
    quizResume: normalizeQuizResume(o.quizResume),
    analytics: cappedArray(o.analytics, 400),
    helpfulVotes: normalizeHelpfulVotes(o.helpfulVotes),
  }
  return snap
}
