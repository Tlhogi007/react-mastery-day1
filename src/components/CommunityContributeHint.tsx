import { useMemo, useState, type JSX } from 'react'
import { Show, useUser } from '@clerk/react'
import { useViewerGithubLogin } from './CommunityAttribution'

/** Shows signed-in GitHub byline + copyable frontmatter for content PRs. */
export function CommunityContributeHint(): JSX.Element {
  const { user } = useUser()
  const github = useViewerGithubLogin()
  const [copied, setCopied] = useState(false)

  const author =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.username ||
    github ||
    'Your Name'

  const frontmatter = useMemo(() => {
    const gh = github || 'your-github-username'
    return `---
title: Your article title
author: ${author}
github: ${gh}
topic: Reconciliation
difficulty: intermediate
date: ${new Date().toISOString().slice(0, 10)}
tags: [keys, reconciliation]
estimatedTime: 8 min read
---
`
  }, [author, github])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(frontmatter)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <Show when="signed-out">
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Sign in with <strong>GitHub</strong> so Community can show a signed @{`{username}`} byline on
          your articles.
        </p>
      </Show>
      <Show when="signed-in">
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 8,
            background: 'var(--bg-section)',
            border: '1px solid var(--border-color)',
            textAlign: 'left',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {github ? (
              <>Signed attribution: @{github}</>
            ) : (
              <>Signed in — link GitHub in Clerk account for @{`username`} attribution</>
            )}
          </div>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-secondary)' }}>
            Paste this frontmatter into your content-repo markdown PR:
          </p>
          <pre
            style={{
              margin: 0,
              padding: 10,
              borderRadius: 6,
              background: 'var(--code-bg)',
              color: 'var(--text-primary)',
              fontSize: 12,
              overflow: 'auto',
            }}
          >
            {frontmatter}
          </pre>
          <button
            type="button"
            onClick={() => void copy()}
            style={{
              marginTop: 8,
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid var(--border-color)',
              background: 'var(--button-primary)',
              color: 'var(--button-text)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {copied ? 'Copied' : 'Copy frontmatter'}
          </button>
        </div>
      </Show>
    </>
  )
}
