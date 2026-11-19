import { useEffect, useRef, type JSX } from 'react'
import { useAuth } from '@clerk/react'
import {
  buildLocalSnapshot,
  pullAndMergeUserCloud,
  pushUserCloud,
  syncUserCloudOnSignIn,
} from '../services/userCloudSync'
import { normalizeLabView, type AuthReturnView } from '../services/authReturnTo'
import { tracking } from '../lib/googleAnalytics'

/** How often idle devices pull cloud progress for live cross-device updates. */
const PULL_INTERVAL_MS = 2_000

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

/** Pull/push signed-in learner data; debounce saves after local progress changes. */
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

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn || !userId) {
      syncedForUser.current = null
      return
    }
    if (syncedForUser.current === userId) return

    let cancelled = false
    let retryTimer: number | null = null
    let attempts = 0

    const run = async () => {
      const { exercise: ex, view: v, tools: t, tab: tb } = labRef.current
      const result = await syncUserCloudOnSignIn({ exercise: ex, view: v, tools: t, tab: tb })
      if (cancelled) return
      // Token bridge can lag behind Clerk on landing — retry until one sync succeeds
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
      if (userId) tracking.identifyUser(userId)
      if (result.cloud.lab && onRestoredLab) {
        onRestoredLab({
          exercise: result.cloud.lab.exercise,
          view: normalizeLabView(result.cloud.lab.view),
          tools: Boolean(result.cloud.lab.tools),
          tab: result.cloud.lab.tab,
        })
      }
    }

    void run()

    return () => {
      cancelled = true
      if (retryTimer) window.clearTimeout(retryTimer)
    }
    // Initial sign-in sync once per userId (with retries on token lag)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, userId])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    // Short debounce so mid-quiz live % reaches other devices quickly
    saveTimer.current = window.setTimeout(() => {
      const { exercise: ex, view: v, tools: t, tab: tb } = labRef.current
      void pushUserCloud(buildLocalSnapshot({ exercise: ex, view: v, tools: t, tab: tb }))
    }, 600)
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
  }, [isLoaded, isSignedIn, exercise, view, tools, tab, progressEpoch])

  // Live cross-device: idle tabs pull + merge on an interval (and on tab focus)
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return

    let cancelled = false
    let inFlight = false

    const pull = async () => {
      if (cancelled || inFlight) return
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      inFlight = true
      try {
        const { exercise: ex, view: v, tools: t, tab: tb } = labRef.current
        await pullAndMergeUserCloud({ exercise: ex, view: v, tools: t, tab: tb })
      } finally {
        inFlight = false
      }
    }

    const intervalId = window.setInterval(() => {
      void pull()
    }, PULL_INTERVAL_MS)

    const onVisible = () => {
      if (document.visibilityState === 'visible') void pull()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    // First pull shortly after mount so a second device catches up without waiting a full interval
    const kickoff = window.setTimeout(() => {
      void pull()
    }, 400)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.clearTimeout(kickoff)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [isLoaded, isSignedIn, userId])

  return <></>
}
