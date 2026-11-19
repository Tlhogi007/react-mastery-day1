import { type JSX } from 'react'
import { useUser } from '@clerk/react'
import { getAllCommunityContent, type CommunityContent } from '../lib/contentLoader'
import { useViewerGithubLogin } from './CommunityAttribution'

interface ContributorProfileProps {
  github?: string
  author?: string
  onOpenArticle?: (content: CommunityContent) => void
  onClose?: () => void
}

/** Profile card for a GitHub-attributed contributor (or the signed-in viewer). */
export function ContributorProfile({
  github: githubProp,
  author,
  onOpenArticle,
  onClose,
}: ContributorProfileProps): JSX.Element {
  const { user, isSignedIn } = useUser()
  const viewerGithub = useViewerGithubLogin()
  const github = (githubProp || viewerGithub || '').toLowerCase()
  const posts = getAllCommunityContent().filter(
    (c) => c.github && c.github.toLowerCase() === github,
  )

  const displayName =
    author ||
    posts[0]?.author ||
    user?.fullName ||
    user?.username ||
    (github ? `@${github}` : 'Contributor')

  const isYou =
    Boolean(isSignedIn && viewerGithub && github) &&
    viewerGithub!.toLowerCase() === github

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        padding: 20,
        maxWidth: 480,
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
        {github ? (
          <img
            src={`https://github.com/${github}.png?size=96`}
            alt=""
            width={56}
            height={56}
            style={{ borderRadius: '50%', border: '1px solid var(--border-color)' }}
          />
        ) : (
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--bg-section)',
              border: '1px solid var(--border-color)',
            }}
          />
        )}
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>{displayName}</h3>
          {github && (
            <a
              href={`https://github.com/${github}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--link-color)', fontSize: 14 }}
            >
              @{github}
            </a>
          )}
          {isYou && (
            <div style={{ fontSize: 12, color: 'var(--text-on-success)', fontWeight: 600 }}>
              Signed in as this contributor
            </div>
          )}
        </div>
        {onClose && (
          <button type="button" onClick={onClose} style={{ marginLeft: 'auto', cursor: 'pointer' }}>
            Close
          </button>
        )}
      </div>

      <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-secondary)' }}>
        {posts.length} community article{posts.length === 1 ? '' : 's'}
      </p>
      {posts.length === 0 ? (
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>
          No published articles under this GitHub username yet.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {posts.map((p) => (
            <li key={p.slug} style={{ borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => onOpenArticle?.(p)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 0',
                  border: 'none',
                  background: 'transparent',
                  cursor: onOpenArticle ? 'pointer' : 'default',
                  color: 'var(--text-primary)',
                }}
              >
                <div style={{ fontWeight: 600 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {p.topic} · {p.difficulty} · {p.date}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
