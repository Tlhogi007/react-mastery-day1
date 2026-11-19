import { useEffect, useRef, type JSX } from 'react'
import { useAuth } from '@clerk/react'
import { markSkipIntroAfterAuth } from '../services/authReturnTo'

interface DismissIntroOnSignInProps {
  /** Enter the lab dashboard after a fresh sign-in (modal path, no remount). */
  onEnterLab: () => void
}

/**
 * Modal / soft sign-in does not remount the SPA — send signed-in users to the
 * lab dashboard instead of leaving them on marketing landing + intro.
 */
export function DismissIntroOnSignIn({ onEnterLab }: DismissIntroOnSignInProps): JSX.Element | null {
  const { isLoaded, isSignedIn } = useAuth()
  const wasSignedIn = useRef<boolean | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    const signedIn = Boolean(isSignedIn)
    if (wasSignedIn.current === null) {
      wasSignedIn.current = signedIn
      return
    }
    if (signedIn && !wasSignedIn.current) {
      markSkipIntroAfterAuth()
      onEnterLab()
    }
    wasSignedIn.current = signedIn
  }, [isLoaded, isSignedIn, onEnterLab])

  return null
}
