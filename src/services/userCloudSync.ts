/**
 * Sync learner progress / notes / tools data to /api/user-data when signed in.
 */
import {
  mergeSnapshots,
  type CloudQuizResume,
  type CloudSettings,
  type UserCloudSnapshot as SharedCloudSnapshot,
} from '../../api/_lib/userCloud'
import { progressStorage, type LiveDayProgress, type ProgressData } from './progressStorage'
import { questionHistory } from './questionHistory'
import { getActiveTab, normalizeLabView, writeLabSession } from './authReturnTo'
import { waitForAiAuthToken } from './aiAuthBridge'
import { settingsStorage } from './settingsStorage'
import { applyQuizProgress, peekQuizProgress } from './quizResume'
import { analytics } from './analytics'
import { applyHelpfulVotes, getLocalHelpfulVotes } from './communityHelpful'
import { applyAppTheme, THEME_CHANGE_EVENT, type AppTheme } from './theme'

export const USER_CLOUD_SYNCED_EVENT = 'rm-user-cloud-synced'
export const AI_QUOTA_UPDATED_EVENT = 'rm-ai-quota-updated'

export type AiQuotaStatus = {
  used: number
  limit: number
  remaining: number
  day: string
  available: boolean
}

export type LabCloudState = {
  exercise: string
  view: 'exercises' | 'community' | 'settings' | 'support'
  tools: boolean
  tab?: string
}

export type UserCloudSnapshot = SharedCloudSnapshot & {
  progress: ProgressData
  lab?: LabCloudState | null
  liveProgress?: LiveDayProgress | null
}

type UserDataResponse = {
  cloud: UserCloudSnapshot
  quota: AiQuotaStatus
}

function readJsonKey(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    return JSON.parse(raw) as unknown
  } catch {
    return []
  }
}

function writeJsonKey(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

function readLabFromStorage(): LabCloudState | null {
  try {
    const raw = sessionStorage.getItem('rm-lab-session')
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<LabCloudState>
    if (!parsed.exercise || typeof parsed.exercise !== 'string') return null
    return {
      exercise: parsed.exercise,
      view: normalizeLabView(parsed.view),
      tools: Boolean(parsed.tools),
      tab: getActiveTab() || undefined,
    }
  } catch {
    return null
  }
}

function readLocalSettings(): CloudSettings {
  const s = settingsStorage.getSettings()
  return {
    theme: s.theme,
    onboardingComplete: Boolean(s.onboardingComplete),
    studyMode: Boolean(s.studyMode),
    updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : '',
  }
}

export function buildLocalSnapshot(
  labOverride?: Partial<LabCloudState> | null,
): UserCloudSnapshot {
  const session = readLabFromStorage()
  const lab: LabCloudState | null = labOverride
    ? {
        exercise: labOverride.exercise || session?.exercise || 'day01-rendering-pipeline',
        view: labOverride.view || session?.view || 'exercises',
        tools: labOverride.tools ?? session?.tools ?? false,
        tab: labOverride.tab || getActiveTab() || undefined,
      }
    : session

  const quiz = peekQuizProgress()
  const quizResume: CloudQuizResume | null = quiz
    ? {
        day: quiz.day,
        currentQuestionIndex: quiz.currentQuestionIndex,
        selectedAnswer: quiz.selectedAnswer,
        score: quiz.score,
        completed: quiz.completed,
        localQuestionsCompleted: quiz.localQuestionsCompleted,
        aiEnabled: quiz.aiEnabled,
        aiQuestionsLoaded: quiz.aiQuestionsLoaded,
        allQuestions: quiz.allQuestions.slice(0, 40),
        usedLocalQuestionIds: quiz.usedLocalQuestionIds.slice(0, 200),
        incorrectAnswerIds: quiz.incorrectAnswerIds.slice(0, 200),
        totalTimeSpent: quiz.totalTimeSpent,
        at: quiz.at,
      }
    : null

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    progress: progressStorage.getProgress(),
    lab,
    liveProgress: progressStorage.getLiveDayProgressState(),
    questionHistory: questionHistory.toJSON(),
    notes: readJsonKey('react-mastery-notes'),
    annotations: readJsonKey('react-mastery-annotations'),
    reflections: readJsonKey('react-mastery-reflections'),
    flashcards: readJsonKey('react-mastery-flashcards'),
    snippets: readJsonKey('react-mastery-snippets'),
    settings: readLocalSettings(),
    quizResume,
    // Prefer storage so e2e / multi-tab writes are included; fall back to in-memory.
    analytics: (() => {
      const stored = readJsonKey('react-mastery-analytics')
      if (Array.isArray(stored) && stored.length > 0) return stored.slice(-400)
      return analytics.toCloudJSON()
    })(),
    helpfulVotes: getLocalHelpfulVotes(),
  }
}

function applySnapshotLocally(cloud: UserCloudSnapshot): void {
  progressStorage.saveProgress(cloud.progress)
  // Concrete state only (active % or tombstone). Skip null/absent so empty cloud
  // does not wipe a device that has not pushed live progress yet.
  if (cloud.liveProgress != null) {
    progressStorage.applyLiveDayProgressState(cloud.liveProgress)
  }
  if (cloud.questionHistory != null) {
    questionHistory.mergeFromEntries(cloud.questionHistory)
  }
  if (Array.isArray(cloud.notes)) writeJsonKey('react-mastery-notes', cloud.notes)
  if (Array.isArray(cloud.annotations)) writeJsonKey('react-mastery-annotations', cloud.annotations)
  if (Array.isArray(cloud.reflections)) writeJsonKey('react-mastery-reflections', cloud.reflections)
  if (Array.isArray(cloud.flashcards)) writeJsonKey('react-mastery-flashcards', cloud.flashcards)
  if (Array.isArray(cloud.snippets)) writeJsonKey('react-mastery-snippets', cloud.snippets)

  if (cloud.settings) {
    settingsStorage.applyCloudSettings({
      theme: cloud.settings.theme,
      onboardingComplete: cloud.settings.onboardingComplete,
      studyMode: cloud.settings.studyMode,
      updatedAt: cloud.settings.updatedAt,
    })
    applyAppTheme(cloud.settings.theme)
    window.dispatchEvent(
      new CustomEvent<AppTheme>(THEME_CHANGE_EVENT, { detail: cloud.settings.theme }),
    )
  }

  if (cloud.quizResume !== undefined) {
    applyQuizProgress(
      cloud.quizResume
        ? {
            day: cloud.quizResume.day,
            currentQuestionIndex: cloud.quizResume.currentQuestionIndex,
            selectedAnswer: cloud.quizResume.selectedAnswer,
            score: cloud.quizResume.score,
            completed: cloud.quizResume.completed,
            localQuestionsCompleted: cloud.quizResume.localQuestionsCompleted,
            aiEnabled: cloud.quizResume.aiEnabled,
            aiQuestionsLoaded: cloud.quizResume.aiQuestionsLoaded,
            allQuestions: cloud.quizResume.allQuestions as never,
            usedLocalQuestionIds: cloud.quizResume.usedLocalQuestionIds,
            incorrectAnswerIds: cloud.quizResume.incorrectAnswerIds,
            totalTimeSpent: cloud.quizResume.totalTimeSpent,
            at: cloud.quizResume.at,
          }
        : null,
    )
  }

  if (cloud.analytics != null) {
    analytics.mergeFromCloud(cloud.analytics)
  }

  if (cloud.helpfulVotes != null) {
    applyHelpfulVotes(cloud.helpfulVotes)
  }

  if (cloud.lab?.exercise) {
    writeLabSession({
      exercise: cloud.lab.exercise,
      view: normalizeLabView(cloud.lab.view),
      tools: Boolean(cloud.lab.tools),
    })
    if (cloud.lab.tab) {
      try {
        sessionStorage.setItem('rm-active-tab', cloud.lab.tab)
      } catch {
        /* ignore */
      }
    }
  }
  window.dispatchEvent(new CustomEvent(USER_CLOUD_SYNCED_EVENT, { detail: cloud }))
}

export function emitAiQuota(quota: AiQuotaStatus): void {
  window.dispatchEvent(new CustomEvent(AI_QUOTA_UPDATED_EVENT, { detail: quota }))
}

async function authHeaders(): Promise<HeadersInit | null> {
  // Bounded wait — AiAuthBridge must be mounted (including on landing) for tokens
  const token = await waitForAiAuthToken(40, 100)
  if (!token) return null
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export async function fetchUserCloud(
  signal?: AbortSignal,
): Promise<UserDataResponse | null> {
  const headers = await authHeaders()
  if (!headers) return null
  try {
    const res = await fetch('/api/user-data', {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal,
    })
    if (!res.ok) return null
    const data = (await res.json()) as UserDataResponse
    if (data.quota) emitAiQuota(data.quota)
    return data
  } catch {
    // Offline / Vite restart / transient network — local progress still works
    return null
  }
}

/**
 * Long-poll until cloud.updatedAt differs from `since` (or server times out ~12s).
 * Unused by the low-data client (event-driven pull only); kept for a future mode.
 */
export async function fetchUserCloudWait(
  since: string,
  signal?: AbortSignal,
): Promise<(UserDataResponse & { changed?: boolean }) | null> {
  if (!since) return fetchUserCloud(signal)
  const headers = await authHeaders()
  if (!headers) return null
  try {
    const q = new URLSearchParams({ wait: '1', since })
    const res = await fetch(`/api/user-data?${q}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal,
    })
    if (!res.ok) return null
    const data = (await res.json()) as UserDataResponse & { changed?: boolean }
    if (data.quota) emitAiQuota(data.quota)
    return data
  } catch {
    return null
  }
}

export async function pushUserCloud(
  snapshot: UserCloudSnapshot = buildLocalSnapshot(),
): Promise<UserDataResponse | null> {
  const headers = await authHeaders()
  if (!headers) return null
  try {
    const res = await fetch('/api/user-data', {
      method: 'PUT',
      headers,
      body: JSON.stringify(snapshot),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = (await res.json()) as UserDataResponse
    // Do not re-apply cloud locally — that re-emitted sync events and looped PUTs.
    if (data.quota) emitAiQuota(data.quota)
    return data
  } catch {
    return null
  }
}

/** Compare fields that should live-update across devices. */
export function progressSyncFingerprint(snapshot: UserCloudSnapshot): string {
  const historyIds = Array.isArray(snapshot.questionHistory)
    ? snapshot.questionHistory
        .map((row) =>
          row && typeof row === 'object' && 'questionId' in row
            ? String((row as { questionId: unknown }).questionId)
            : '',
        )
        .filter(Boolean)
        .sort()
    : []
  // Omit liveProgress.updatedAt — it changes every tick and was burning uploads on Quiz.
  const live = snapshot.liveProgress
  const helpfulKeys = Object.keys(snapshot.helpfulVotes || {})
    .filter((k) => snapshot.helpfulVotes?.[k])
    .sort()
  return JSON.stringify({
    progress: snapshot.progress,
    live: live == null ? null : { day: live.day, percent: live.percent },
    historyIds,
    settings: snapshot.settings ?? null,
    quizResume: snapshot.quizResume
      ? {
          day: snapshot.quizResume.day,
          at: snapshot.quizResume.at,
          index: snapshot.quizResume.currentQuestionIndex,
          score: snapshot.quizResume.score,
          completed: snapshot.quizResume.completed,
        }
      : null,
    helpfulKeys,
  })
}

/**
 * Pull cloud and merge into local without PUT.
 * Used by the idle-device live sync so phone updates appear on laptop.
 */
export async function pullAndMergeUserCloud(
  lab?: Partial<LabCloudState>,
  options?: { since?: string; signal?: AbortSignal },
): Promise<{ changed: boolean; data: UserDataResponse | null; updatedAt: string }> {
  const remote = options?.since
    ? await fetchUserCloudWait(options.since, options.signal)
    : await fetchUserCloud(options?.signal)
  if (!remote?.cloud) return { changed: false, data: null, updatedAt: options?.since ?? '' }
  const updatedAt =
    typeof remote.cloud.updatedAt === 'string' ? remote.cloud.updatedAt : options?.since ?? ''
  const local = buildLocalSnapshot(lab)
  const merged = mergeSnapshots(local, remote.cloud) as UserCloudSnapshot
  if (progressSyncFingerprint(local) === progressSyncFingerprint(merged)) {
    return { changed: false, data: remote, updatedAt }
  }
  applySnapshotLocally(merged)
  return { changed: true, data: { ...remote, cloud: merged }, updatedAt }
}

/**
 * Pull cloud, merge into local (so empty devices restore immediately), then PUT.
 * Server merges again for multi-device safety.
 */
export async function syncUserCloudOnSignIn(lab?: Partial<LabCloudState>): Promise<UserDataResponse | null> {
  const local = buildLocalSnapshot(lab)
  // Token can lag Clerk.user by a tick after OAuth / testing sign-in
  let remote = await fetchUserCloud()
  if (!remote) {
    await new Promise((r) => setTimeout(r, 400))
    remote = await fetchUserCloud()
  }
  const seeded =
    remote?.cloud != null
      ? (mergeSnapshots(local, remote.cloud) as UserCloudSnapshot)
      : local
  if (remote?.cloud) {
    applySnapshotLocally(seeded)
  }
  return pushUserCloud(seeded)
}
