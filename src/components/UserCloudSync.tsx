import { useEffect, useRef, type JSX } from 'react'
import { useAuth } from '@clerk/react'
import {
  buildLocalSnapshot,
  pushUserCloud,
  syncUserCloudOnSignIn,
} from '../services/userCloudSync'
import { tracking } from '../lib/googleAnalytics'

interface UserCloudSyncProps {
  exercise: string
  view: 'exercises' | 'community'
  tools: boolean
  tab?: string
  /** Bumps when day/quiz progress changes so we push sooner. */
  progressEpoch: number
  onRestoredLab?: (lab: {
    exercise: string
    view: 'exercises' | 'community'
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

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn || !userId) {
      syncedForUser.current = null
      return
    }
    if (syncedForUser.current === userId) return
    syncedForUser.current = userId

    let cancelled = false
    void (async () => {
      const result = await syncUserCloudOnSignIn({ exercise, view, tools, tab })
      if (cancelled || !result) return
      if (userId) tracking.identifyUser(userId)
      if (result.cloud.lab && onRestoredLab) {
        onRestoredLab({
          exercise: result.cloud.lab.exercise,
          view: result.cloud.lab.view || 'exercises',
          tools: Boolean(result.cloud.lab.tools),
          tab: result.cloud.lab.tab,
        })
      }
    })()

    return () => {
      cancelled = true
    }
    // Initial sign-in sync only once per userId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, userId])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      void pushUserCloud(buildLocalSnapshot({ exercise, view, tools, tab }))
    }, 1200)
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
  }, [isLoaded, isSignedIn, exercise, view, tools, tab, progressEpoch])

  return <></>
}
