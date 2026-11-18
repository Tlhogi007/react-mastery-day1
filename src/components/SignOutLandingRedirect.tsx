import { useEffect, useRef, type JSX } from 'react'
import { useAuth, useClerk } from '@clerk/react'

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

  useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn) {
      wasSignedIn.current = true
      handled.current = false
      return
    }
    if (wasSignedIn.current && !handled.current) {
      handled.current = true
      wasSignedIn.current = false
      onSignedOut()
    }
  }, [isLoaded, isSignedIn, onSignedOut])

  // Earlier than React auth state: clear as soon as Clerk drops the session.
  useEffect(() => {
    return addListener(({ session }) => {
      if (session) {
        wasSignedIn.current = true
        handled.current = false
        return
      }
      if (wasSignedIn.current && !handled.current) {
        handled.current = true
        wasSignedIn.current = false
        onSignedOut()
      }
    })
  }, [addListener, onSignedOut])

  return <></>
}
