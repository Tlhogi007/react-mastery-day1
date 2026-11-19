import { useEffect, type JSX } from 'react'
import { useAuth, useClerk } from '@clerk/react'
import { registerAiAuthTokenGetter, subscribeAiGate } from '../services/aiAuthBridge'
import { prepareAuthReturnUrl } from '../services/authReturnTo'
import { markAiResumePending, peekAiResumePending } from '../services/quizResume'

interface AiAuthBridgeProps {
  onGate: (event: { mode: 'auth' | 'quota'; message: string } | null) => void
  /** Expose openSignIn so the AI gate modal can show a working Sign in button. */
  onSignInReady?: (openSignIn: () => void) => void
}

/** Registers Clerk getToken for AI proxy + opens sign-in when needed. */
export function AiAuthBridge({ onGate, onSignInReady }: AiAuthBridgeProps): JSX.Element {
  const { getToken, isSignedIn } = useAuth()
  const { openSignIn } = useClerk()

  useEffect(() => {
    registerAiAuthTokenGetter(async () => {
      if (!isSignedIn) return null
      // Prefer a fresh session JWT — cached tokens can fail azp/verify after remount
      try {
        return (await getToken({ skipCache: true })) || (await getToken())
      } catch {
        return getToken()
      }
    })
    return () => registerAiAuthTokenGetter(null)
  }, [getToken, isSignedIn])

  // Drop stale "session expired" UI once Clerk reports signed-in
  useEffect(() => {
    if (isSignedIn) onGate(null)
  }, [isSignedIn, onGate])

  useEffect(() => {
    if (!onSignInReady) return
    onSignInReady(() => {
      const url = prepareAuthReturnUrl({ inLab: true, tab: 'quiz' })
      void openSignIn?.({
        forceRedirectUrl: url,
        fallbackRedirectUrl: url,
      })
    })
  }, [onSignInReady, openSignIn])

  useEffect(() => {
    return subscribeAiGate((event) => {
      if (event.mode === 'clear' || event.mode === 'dismiss-local') {
        onGate(null)
        return
      }

      if (event.mode !== 'auth' && event.mode !== 'quota') return

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
        // Don't auto-open Clerk here — our gate overlay (z-index 2000) covers it.
        // User taps Sign in on AiQuotaModal instead.
      }
    })
  }, [onGate, isSignedIn])

  return <></>
}
