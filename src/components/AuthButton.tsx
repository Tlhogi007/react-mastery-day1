import { type CSSProperties, type JSX } from 'react'
import { UserButton, useAuth, useClerk } from '@clerk/react'
import { prepareAuthReturnUrl } from '../services/authReturnTo'

const btnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}

/** Shown only when Clerk publishable key is configured. Appearance comes from ThemedClerkProvider. */
export function AuthButton(): JSX.Element {
  const { openSignIn } = useClerk()
  const { isLoaded, isSignedIn } = useAuth()

  // Clerk `<Show>` renders nothing while loading — after sign-out that left the
  // landing chrome blank. Prefer an explicit Sign in whenever we are not signed in.
  if (isLoaded && isSignedIn) {
    return (
      <UserButton
        userProfileMode="modal"
        appearance={{
          elements: {
            rootBox: { display: 'inline-flex', alignItems: 'center' },
            userButtonAvatarBox: { width: 32, height: 32 },
            userButtonPopoverCard: {
              width: 'min(280px, calc(100vw - 24px))',
              maxWidth: 'calc(100vw - 24px)',
            },
          },
        }}
      />
    )
  }

  return (
    <button
      type="button"
      style={btnStyle}
      disabled={!isLoaded}
      onClick={() => {
        const url = prepareAuthReturnUrl()
        openSignIn?.({
          forceRedirectUrl: url,
          fallbackRedirectUrl: url,
        })
      }}
    >
      Sign in
    </button>
  )
}
