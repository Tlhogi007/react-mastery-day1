import { useEffect, useRef, type JSX } from 'react'
import { useAuth } from '@clerk/react'
import {
  buildLocalSnapshot,
  progressSyncFingerprint,
  pullAndMergeUserCloud,
  pushUserCloud,
  syncUserCloudOnSignIn,
  type UserCloudSnapshot,
} from '../services/userCloudSync'
import { normalizeLabView, type AuthReturnView } from '../services/authReturnTo'
import { tracking } from '../lib/googleAnalytics'

/** Wait until progress settles before uploading (quiz ticks are chatty). */
const PUSH_DEBOUNCE_MS = 20_000
/** Don’t re-pull on every focus flap — once per window is enough for low-data. */
const PULL_THROTTLE_MS = 5 * 60_000

interface UserCloudSyncProps {
  exercise: string
  view: AuthReturnView
  tools: boolean
  tab?: string
  /** Bumps when day/quiz progress changes so we push sooner. */
  progressEpoch: number
  onRestoredLab?: (lab: {
    exercise: string
    view: AuthReturnView
    tools: boolean
    tab?: string
  }) => void
}

function syncFingerprint(snapshot: UserCloudSnapshot): string {
  // Lab/tab alone must not upload — only meaningful progress (see progressSyncFingerprint).
  return progressSyncFingerprint(snapshot)
}

/**
 * Low-data cloud sync: no idle polling.
 * Push only when progress actually changed (debounced) or when leaving the tab.
 * Pull only on sign-in and throttled return-to-tab / online.
 * Push and pull share one in-flight mutex so they never race.
 */
export function UserCloudSync({
  exercise,
  view,
  tools,
  tab,
  progressEpoch,
  onRestoredLab,
}: UserCloudSyncProps): JSX.Element {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const syncedForUser = useRef<string | null>(null)
  const saveTimer = useRef<number | null>(null)
  const labRef = useRef({ exercise, view, tools, tab })
  labRef.current = { exercise, view, tools, tab }
  const lastPushedFp = useRef<string>('')
  const lastPullAt = useRef(0)
  /** Shared mutex — only one network sync at a time. */
  const syncGate = useRef<Promise<void>>(Promise.resolve())
  const runExclusive = (task: () => Promise<void>): Promise<void> => {
    const next = syncGate.current.then(task, task)
    // Keep the chain alive even if a task rejects
    syncGate.current = next.then(
      () => undefined,
      () => undefined,
    )
    return next
  }

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn || !userId) {
      syncedForUser.current = null
      lastPushedFp.current = ''
      return
    }
    if (syncedForUser.current === userId) return

    let cancelled = false
    let retryTimer: number | null = null
    let attempts = 0

    const run = async () => {
      await runExclusive(async () => {
        if (cancelled) return
        const { exercise: ex, view: v, tools: t, tab: tb } = labRef.current
        const result = await syncUserCloudOnSignIn({ exercise: ex, view: v, tools: t, tab: tb })
        if (cancelled) return
        if (!result) {
          attempts += 1
          if (attempts < 12) {
            retryTimer = window.setTimeout(() => {
              void run()
            }, 500)
          }
          return
        }
        syncedForUser.current = userId
        lastPullAt.current = Date.now()
        if (result.cloud) {
          lastPushedFp.current = syncFingerprint(result.cloud as UserCloudSnapshot)
        }
        if (userId) tracking.identifyUser(userId)
        if (result.cloud.lab && onRestoredLab) {
          onRestoredLab({
            exercise: result.cloud.lab.exercise,
            view: normalizeLabView(result.cloud.lab.view),
            tools: Boolean(result.cloud.lab.tools),
            tab: result.cloud.lab.tab,
          })
        }
      })
    }

    void run()

    return () => {
      cancelled = true
      if (retryTimer) window.clearTimeout(retryTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, userId])

  // Progress-only pushes (not every Learn/Quiz tab switch). Skip if nothing meaningful changed.
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return

    const schedulePush = (immediate: boolean) => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
      const run = () => {
        saveTimer.current = null
        void runExclusive(async () => {
          const { exercise: ex, view: v, tools: t, tab: tb } = labRef.current
          const snapshot = buildLocalSnapshot({ exercise: ex, view: v, tools: t, tab: tb })
          const fp = syncFingerprint(snapshot)
          if (fp === lastPushedFp.current) return
          const res = await pushUserCloud(snapshot)
          if (res?.cloud) {
            lastPushedFp.current = syncFingerprint(res.cloud as UserCloudSnapshot)
          } else {
            lastPushedFp.current = fp
          }
        })
      }
      if (immediate) run()
      else saveTimer.current = window.setTimeout(run, PUSH_DEBOUNCE_MS)
    }

    schedulePush(false)

    const onHide = () => {
      if (document.visibilityState === 'hidden') schedulePush(true)
    }
    const onPageHide = () => schedulePush(true)

    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onPageHide)

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [isLoaded, isSignedIn, progressEpoch])

  // Throttled pull when returning to the tab / coming online (not on every focus blip)
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return

    let cancelled = false

    const isVisible = () =>
      typeof document === 'undefined' || document.visibilityState === 'visible'

    const pull = async (force: boolean): Promise<void> => {
      if (cancelled) return
      if (!isVisible()) return
      const now = Date.now()
      if (!force && now - lastPullAt.current < PULL_THROTTLE_MS) return
      await runExclusive(async () => {
        if (cancelled || !isVisible()) return
        const nowInner = Date.now()
        if (!force && nowInner - lastPullAt.current < PULL_THROTTLE_MS) return
        try {
          const { exercise: ex, view: v, tools: t, tab: tb } = labRef.current
          await pullAndMergeUserCloud({ exercise: ex, view: v, tools: t, tab: tb })
          lastPullAt.current = Date.now()
          lastPushedFp.current = syncFingerprint(
            buildLocalSnapshot({ exercise: ex, view: v, tools: t, tab: tb }),
          )
        } catch {
          // Offline / transient
        }
      })
    }

    const onVisibility = () => {
      if (isVisible()) void pull(false)
    }
    const onFocus = () => {
      if (isVisible()) void pull(false)
    }
    const onOnline = () => {
      if (isVisible()) void pull(true)
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onFocus)
    window.addEventListener('online', onOnline)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('online', onOnline)
    }
  }, [isLoaded, isSignedIn, userId])

  return <></>
}
