import { type JSX } from 'react'
import { useUser } from '@clerk/react'

interface CommunityAttributionProps {
  author: string
  github?: string
  compact?: boolean
}

export function useViewerGithubLogin(): string | null {
  const { user } = useUser()
  return (
    user?.externalAccounts?.find((a) => a.provider === 'github')?.username || null
  )
}

/** Byline with GitHub avatar; “You · signed” when the viewer’s GitHub matches. */
export function CommunityAttribution({
  author,
  github,
  compact = false,
}: CommunityAttributionProps): JSX.Element {
  const { isSignedIn } = useUser()
  const viewerGithub = useViewerGithubLogin()

  const signed =
    Boolean(isSignedIn && github && viewerGithub) &&
    github!.toLowerCase() === viewerGithub!.toLowerCase()

  const avatar = github ? `https://github.com/${github}.png?size=80` : null

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 6 : 8,
        flexWrap: 'wrap',
      }}
    >
      {avatar && (
        <img
          src={avatar}
          alt=""
          width={compact ? 20 : 28}
          height={compact ? 20 : 28}
          style={{ borderRadius: '50%', border: '1px solid var(--border-color)' }}
        />
      )}
      <span>
        {author}
        {github && (
          <>
            {' '}
            <a
              href={`https://github.com/${github}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ color: 'var(--link-color)' }}
            >
              @{github}
            </a>
          </>
        )}
      </span>
      {github && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1.2,
            padding: '0.15rem 0.45rem',
            borderRadius: 3,
            background: signed ? 'var(--bg-success)' : 'var(--bg-section)',
            color: signed ? 'var(--text-on-success)' : 'var(--text-muted)',
            border: '1px solid var(--border-color)',
          }}
          title={
            signed
              ? 'Your signed-in GitHub matches this byline'
              : 'Attributed via GitHub username in article frontmatter'
          }
        >
          {signed ? 'You · signed' : 'GitHub'}
        </span>
      )}
    </span>
  )
}
