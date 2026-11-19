import { type JSX } from 'react'
import { useUser } from '@clerk/react'
import './CommunityAttribution.css'

interface CommunityAttributionProps {
  author: string
  github?: string
  compact?: boolean
}

function GitHubMark({ size = 12 }: { size?: number }): JSX.Element {
  return (
    <svg
      className="community-attribution__gh-icon"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  )
}

export function useViewerGithubLogin(): string | null {
  const { user } = useUser()
  return (
    user?.externalAccounts?.find((a) => a.provider === 'github')?.username || null
  )
}

/** True when the signed-in GitHub account matches this byline. */
export function useIsSignedAttribution(github?: string): boolean {
  const { isSignedIn } = useUser()
  const viewerGithub = useViewerGithubLogin()
  return Boolean(
    isSignedIn &&
      github &&
      viewerGithub &&
      github.toLowerCase() === viewerGithub.toLowerCase(),
  )
}

/** Byline with GitHub avatar + handle mark. */
export function CommunityAttribution({
  author,
  github,
  compact = false,
}: CommunityAttributionProps): JSX.Element {
  const avatar = github ? `https://github.com/${github}.png?size=80` : null
  const iconSize = compact ? 12 : 13

  return (
    <span className={`community-attribution${compact ? ' community-attribution--compact' : ''}`}>
      {avatar && (
        <img
          className="community-attribution__avatar"
          src={avatar}
          alt=""
          width={compact ? 20 : 28}
          height={compact ? 20 : 28}
        />
      )}
      <span className="community-attribution__byline">
        {author}
        {github && (
          <>
            {' '}
            <a
              className="community-attribution__handle"
              href={`https://github.com/${github}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              @{github}
              <GitHubMark size={iconSize} />
            </a>
          </>
        )}
      </span>
    </span>
  )
}

/** Article-header note when this post matches the viewer’s GitHub. */
export function CommunitySignedNote({ github }: { github?: string }): JSX.Element | null {
  const signed = useIsSignedAttribution(github)
  if (!signed) return null
  return (
    <p className="community-signed-note" role="status">
      This is your signed contribution
    </p>
  )
}
