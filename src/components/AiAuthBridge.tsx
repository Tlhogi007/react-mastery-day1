import { useEffect, type JSX } from 'react'
import { useAuth, useClerk } from '@clerk/react'
import { registerAiAuthTokenGetter, subscribeAiGate } from '../services/aiAuthBridge'
import { prepareAuthReturnUrl } from '../services/authReturnTo'
import { markAiResumePending, peekAiResumePending } from '../services/quizResume'

interface AiAuthBridgeProps {
  onGate: (event: { mode: 'auth' | 'quota'; message: string } | null) => void
}

/** Registers Clerk getToken for AI proxy + opens sign-in when needed. */
export function AiAuthBridge({ onGate }: AiAuthBridgeProps): JSX.Element {
  const { getToken, isSignedIn } = useAuth()
  const { openSignIn } = useClerk()

  useEffect(() => {
    registerAiAuthTokenGetter(async () => {
      if (!isSignedIn) return null
      return getToken()
    })
    return () => registerAiAuthTokenGetter(null)
  }, [getToken, isSignedIn])

  // Drop stale "session expired" UI once Clerk reports signed-in
  useEffect(() => {
    if (isSignedIn) onGate(null)
  }, [isSignedIn, onGate])

  useEffect(() => {
    return subscribeAiGate((event) => {
      if (event.mode === 'clear') {
        onGate(null)
        return
      }

      // Already signed in — ignore auth noise from token race after OAuth
      if (event.mode === 'auth' && isSignedIn) {
        return
      }

      onGate(event)
      if (event.mode === 'auth') {
        const pending = peekAiResumePending()
        if (!pending) {
          const ex = sessionStorage.getItem('rm-lab-session')
          let day = 1
          try {
            const parsed = ex ? (JSON.parse(ex) as { exercise?: string }) : null
            const m = parsed?.exercise?.match(/day0*(\d+)/i)
            if (m) day = Number(m[1]) || 1
          } catch {
            /* ignore */
          }
          markAiResumePending({ day, mode: 'toggle' })
        }
        const url = prepareAuthReturnUrl({ inLab: true, tab: 'quiz' })
        openSignIn?.({
          forceRedirectUrl: url,
          fallbackRedirectUrl: url,
        })
      }
    })
  }, [onGate, openSignIn, isSignedIn])

  return <></>
}
