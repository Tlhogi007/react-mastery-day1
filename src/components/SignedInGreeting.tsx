import { type JSX } from 'react'
import { Show, useUser } from '@clerk/react'

/** Compact hello next to the auth control when signed in. */
export function SignedInGreeting(): JSX.Element {
  const { user, isLoaded } = useUser()
  if (!isLoaded || !user) return <></>

  const name =
    user.firstName ||
    user.username ||
    user.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    'there'

  return (
    <Show when="signed-in">
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          maxWidth: 140,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={user.primaryEmailAddress?.emailAddress || name}
      >
        Hi, {name}
      </span>
    </Show>
  )
}
