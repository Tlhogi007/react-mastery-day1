import { type JSX } from 'react'
import { Show, useUser } from '@clerk/react'

/** Quiet “Hi, Name” above the progress card. */
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
      <p
        className="signed-in-greeting"
        style={{
          margin: '0 0 8px',
          padding: '0 2px',
          textAlign: 'left',
          fontSize: 12,
          fontWeight: 500,
          fontFamily: 'var(--font-ui)',
          color: 'var(--text-muted)',
          letterSpacing: '-0.01em',
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={user.primaryEmailAddress?.emailAddress || name}
      >
        Hi,{' '}
        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{name}</span>
      </p>
    </Show>
  )
}
