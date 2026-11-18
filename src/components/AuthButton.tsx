import { type JSX } from 'react'
import { Show, UserButton, useClerk } from '@clerk/react'
import { prepareAuthReturnUrl } from '../services/authReturnTo'

const btnStyle: React.CSSProperties = {
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

  return (
    <>
      <Show when="signed-out">
        <button
          type="button"
          style={btnStyle}
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
      </Show>
      <Show when="signed-in">
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
      </Show>
    </>
  )
}
