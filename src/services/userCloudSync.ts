/**
 * Sync learner progress / notes / lab location to /api/user-data when signed in.
 */
import { progressStorage, type ProgressData } from './progressStorage'
import { getActiveTab, writeLabSession } from './authReturnTo'
import { waitForAiAuthToken } from './aiAuthBridge'

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
  view: 'exercises' | 'community'
  tools: boolean
  tab?: string
}

export type UserCloudSnapshot = {
  version: 1
  updatedAt: string
  progress: ProgressData
  lab?: LabCloudState | null
  notes?: unknown
  annotations?: unknown
  reflections?: unknown
}

type UserDataResponse = {
  cloud: UserCloudSnapshot
  quota: AiQuotaStatus
}

function readJsonKey(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return key.includes('notes') || key.includes('reflection') || key.includes('annotation') ? [] : null
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
      view: parsed.view === 'community' ? 'community' : 'exercises',
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
    notes: readJsonKey('react-mastery-notes') ?? [],
    annotations: readJsonKey('react-mastery-annotations') ?? [],
    reflections: readJsonKey('react-mastery-reflections') ?? [],
  }
}

function applySnapshotLocally(cloud: UserCloudSnapshot): void {
  progressStorage.saveProgress(cloud.progress)
  if (Array.isArray(cloud.notes)) writeJsonKey('react-mastery-notes', cloud.notes)
  if (Array.isArray(cloud.annotations)) writeJsonKey('react-mastery-annotations', cloud.annotations)
  if (Array.isArray(cloud.reflections)) writeJsonKey('react-mastery-reflections', cloud.reflections)
  if (cloud.lab?.exercise) {
    writeLabSession({
      exercise: cloud.lab.exercise,
      view: cloud.lab.view || 'exercises',
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
  const token = await waitForAiAuthToken(2500)
  if (!token) return null
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export async function fetchUserCloud(): Promise<UserDataResponse | null> {
  const headers = await authHeaders()
  if (!headers) return null
  const res = await fetch('/api/user-data', { method: 'GET', headers, cache: 'no-store' })
  if (!res.ok) return null
  const data = (await res.json()) as UserDataResponse
  if (data.quota) emitAiQuota(data.quota)
  return data
}

export async function pushUserCloud(
  snapshot: UserCloudSnapshot = buildLocalSnapshot(),
): Promise<UserDataResponse | null> {
  const headers = await authHeaders()
  if (!headers) return null
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
}

/** Pull cloud quota, then PUT local snapshot (server merges with existing cloud). */
export async function syncUserCloudOnSignIn(lab?: Partial<LabCloudState>): Promise<UserDataResponse | null> {
  const local = buildLocalSnapshot(lab)
  // Seed quota badge + ensure we have a token before PUT
  await fetchUserCloud()
  return pushUserCloud(local)
}
