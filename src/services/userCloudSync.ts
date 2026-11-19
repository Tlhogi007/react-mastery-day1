/**
 * Sync learner progress / notes / tools data to /api/user-data when signed in.
 */
import { progressStorage, type LiveDayProgress, type ProgressData } from './progressStorage'
import { getActiveTab, normalizeLabView, writeLabSession } from './authReturnTo'
import { waitForAiAuthToken } from './aiAuthBridge'
import { mergeSnapshots } from '../../api/_lib/userCloud'

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
  view: 'exercises' | 'community' | 'settings'
  tools: boolean
  tab?: string
}

export type UserCloudSnapshot = {
  version: 1
  updatedAt: string
  progress: ProgressData
  lab?: LabCloudState | null
  /** Mid-quiz day bar — syncs across signed-in devices */
  liveProgress?: LiveDayProgress | null
  notes?: unknown
  annotations?: unknown
  reflections?: unknown
  flashcards?: unknown
  snippets?: unknown
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

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    progress: progressStorage.getProgress(),
    lab,
    liveProgress: progressStorage.getLiveDayProgressState(),
    notes: readJsonKey('react-mastery-notes'),
    annotations: readJsonKey('react-mastery-annotations'),
    reflections: readJsonKey('react-mastery-reflections'),
    flashcards: readJsonKey('react-mastery-flashcards'),
    snippets: readJsonKey('react-mastery-snippets'),
  }
}

function applySnapshotLocally(cloud: UserCloudSnapshot): void {
  progressStorage.saveProgress(cloud.progress)
  // Concrete state only (active % or tombstone). Skip null/absent so empty cloud
  // does not wipe a device that has not pushed live progress yet.
  if (cloud.liveProgress != null) {
    progressStorage.applyLiveDayProgressState(cloud.liveProgress)
  }
  if (Array.isArray(cloud.notes)) writeJsonKey('react-mastery-notes', cloud.notes)
  if (Array.isArray(cloud.annotations)) writeJsonKey('react-mastery-annotations', cloud.annotations)
  if (Array.isArray(cloud.reflections)) writeJsonKey('react-mastery-reflections', cloud.reflections)
  if (Array.isArray(cloud.flashcards)) writeJsonKey('react-mastery-flashcards', cloud.flashcards)
  if (Array.isArray(cloud.snippets)) writeJsonKey('react-mastery-snippets', cloud.snippets)
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

export async function fetchUserCloud(): Promise<UserDataResponse | null> {
  const headers = await authHeaders()
  if (!headers) return null
  try {
    const res = await fetch('/api/user-data', { method: 'GET', headers, cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as UserDataResponse
    if (data.quota) emitAiQuota(data.quota)
    return data
  } catch {
    // Offline / Vite restart / transient network — local progress still works
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
    if (data.cloud) applySnapshotLocally(data.cloud)
    if (data.quota) emitAiQuota(data.quota)
    return data
  } catch {
    return null
  }
}

/** Compare progress fields that should live-update across devices. */
export function progressSyncFingerprint(snapshot: UserCloudSnapshot): string {
  return JSON.stringify({
    progress: snapshot.progress,
    liveProgress: snapshot.liveProgress ?? null,
  })
}

/**
 * Pull cloud and merge into local without PUT.
 * Used by the idle-device poll so phone updates appear on laptop live.
 */
export async function pullAndMergeUserCloud(
  lab?: Partial<LabCloudState>,
): Promise<{ changed: boolean; data: UserDataResponse | null }> {
  const remote = await fetchUserCloud()
  if (!remote?.cloud) return { changed: false, data: null }
  const local = buildLocalSnapshot(lab)
  const merged = mergeSnapshots(local, remote.cloud) as UserCloudSnapshot
  if (progressSyncFingerprint(local) === progressSyncFingerprint(merged)) {
    return { changed: false, data: remote }
  }
  applySnapshotLocally(merged)
  return { changed: true, data: { ...remote, cloud: merged } }
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
