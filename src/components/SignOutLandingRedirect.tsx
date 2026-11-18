import { useCallback, useEffect, useRef, type JSX } from 'react'
import { useAuth, useClerk } from '@clerk/react'
import { prepareLandingAfterSignOut } from '../services/authReturnTo'

interface SignOutLandingRedirectProps {
  onSignedOut: () => void
}

/**
 * When Clerk session ends (UserButton Sign out, or account deletion),
 * clear lab restore state and show the landing page — without relying on
 * a full navigation remount that would re-open the lab from sessionStorage.
 */
export function SignOutLandingRedirect({ onSignedOut }: SignOutLandingRedirectProps): JSX.Element {
  const { isLoaded, isSignedIn } = useAuth()
  const { addListener } = useClerk()
  const wasSignedIn = useRef(false)
  const handled = useRef(false)

  const goLanding = useCallback(() => {
    if (handled.current) return
    handled.current = true
    wasSignedIn.current = false
    // Persist before any Clerk remount so App init opens landing.
    prepareLandingAfterSignOut()
    onSignedOut()
  }, [onSignedOut])

  useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn) {
      wasSignedIn.current = true
      handled.current = false
      return
    }
    if (wasSignedIn.current) goLanding()
  }, [isLoaded, isSignedIn, goLanding])

  // Earlier than React auth state: clear as soon as Clerk drops the session.
  useEffect(() => {
    return addListener(({ session }) => {
      if (session) {
        wasSignedIn.current = true
        handled.current = false
        return
      }
      if (wasSignedIn.current) goLanding()
    })
  }, [addListener, goLanding])

  return <></>
}
