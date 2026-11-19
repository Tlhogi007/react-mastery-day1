import type { CSSProperties, JSX } from 'react'

const SUPPORT_EMAIL =
  import.meta.env.VITE_SUPPORT_EMAIL?.trim() || 'lsekwati97@gmail.com'
const APP_ISSUES_URL = 'https://github.com/Tlhogi007/react-mastery-day1/issues/new/choose'
const CONTENT_REPO_URL =
  import.meta.env.VITE_CONTENT_REPO_URL?.trim() ||
  'https://github.com/Tlhogi007/react-mastery-content'

interface SupportPageProps {
  onBack: () => void
}

const TOPICS: {
  id: string
  title: string
  blurb: string
  subject: string
  repoHref?: string
  repoLabel?: string
}[] = [
  {
    id: 'bug',
    title: 'Bug or broken UI',
    blurb: 'Something looks wrong, crashes, or doesn’t match what you expect.',
    subject: 'React Mastery — bug report',
  },
  {
    id: 'account',
    title: 'Account & cloud sync',
    blurb: 'Sign-in, progress restore, or data missing across devices.',
    subject: 'React Mastery — account / sync',
  },
  {
    id: 'ai',
    title: 'AI quiz & quota',
    blurb: 'Hosted AI limits, keys in Settings, or generation failures.',
    subject: 'React Mastery — AI quiz',
  },
  {
    id: 'content',
    title: 'Curriculum or Community',
    blurb: 'Day content, contributions, or article issues.',
    subject: 'React Mastery — content',
    repoHref: CONTENT_REPO_URL,
    repoLabel: 'Contribute on GitHub',
  },
]

function mailto(subject: string): string {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`
}

const linkRowStyle: CSSProperties = {
  marginTop: 8,
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px 16px',
  fontSize: 12,
  fontWeight: 600,
}

const actionLinkStyle: CSSProperties = {
  color: 'var(--link-color)',
  textDecoration: 'none',
}

export default function SupportPage({ onBack }: SupportPageProps): JSX.Element {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '8px 4px 48px',
        width: '100%',
        boxSizing: 'border-box',
        color: 'var(--text-primary)',
      }}
    >
      <button
        type="button"
        onClick={onBack}
        style={{
          marginBottom: 16,
          padding: '6px 10px',
          minHeight: 36,
          borderRadius: 8,
          border: '1px solid var(--border-color)',
          background: 'transparent',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 13,
          fontFamily: 'inherit',
        }}
      >
        ← Back to lab
      </button>

      <header style={{ marginBottom: 28 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.5rem, 4vw, 1.85rem)',
            letterSpacing: '-0.02em',
          }}
        >
          Support
        </h1>
        <p
          style={{
            margin: '10px 0 0',
            color: 'var(--text-secondary)',
            fontSize: 15,
            lineHeight: 1.5,
          }}
        >
          Reach out about bugs, account sync, AI quota, or content. Prefer a public issue when it
          helps other learners too.
        </p>
      </header>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 17 }}>Contact</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TOPICS.map((topic) => (
            <div
              key={topic.id}
              style={{
                padding: '14px 16px',
                borderRadius: 10,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-section)',
              }}
            >
              <div style={{ fontWeight: 650, fontSize: 14, marginBottom: 4 }}>{topic.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {topic.blurb}
              </div>
              <div style={linkRowStyle}>
                <a href={mailto(topic.subject)} style={actionLinkStyle}>
                  Email
                </a>
                {topic.repoHref && topic.repoLabel && (
                  <a
                    href={topic.repoHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={actionLinkStyle}
                  >
                    {topic.repoLabel}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
          Or write directly:{' '}
          <a href={mailto('React Mastery — support')} style={{ color: 'var(--link-color)' }}>
            {SUPPORT_EMAIL}
          </a>
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 17 }}>Public trackers</h2>
        <ul
          style={{
            margin: 0,
            padding: '0 0 0 1.1em',
            color: 'var(--text-secondary)',
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          <li style={{ marginBottom: 8 }}>
            <a href={APP_ISSUES_URL} target="_blank" rel="noopener noreferrer">
              Open a GitHub issue
            </a>{' '}
            on the app repo (bugs, feature ideas).
          </li>
          <li>
            Community articles:{' '}
            <a href={CONTENT_REPO_URL} target="_blank" rel="noopener noreferrer">
              react-mastery-content
            </a>
          </li>
        </ul>
      </section>

      <section>
        <h2 style={{ margin: '0 0 12px', fontSize: 17 }}>Quick FAQ</h2>
        <dl style={{ margin: 0 }}>
          <Faq
            q="Do I need an account?"
            a="No for Week 1 learning. Sign in only for hosted AI quizzes and cross-device cloud sync."
          />
          <Faq
            q="Where are my BYO AI keys stored?"
            a="Only in this browser (Settings). They are never uploaded with cloud sync."
          />
          <Faq
            q="Hosted AI ran out?"
            a="Free daily generations reset with the quota day. Add your own key in Settings to keep going."
          />
          <Faq
            q="Progress missing on another device?"
            a="Sign in on both devices and open the lab once so sync can pull. Export a backup from Account if you need a snapshot."
          />
        </dl>
      </section>
    </div>
  )
}

function Faq({ q, a }: { q: string; a: string }): JSX.Element {
  return (
    <div style={{ marginBottom: 16 }}>
      <dt style={{ fontWeight: 650, fontSize: 14, marginBottom: 4 }}>{q}</dt>
      <dd style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {a}
      </dd>
    </div>
  )
}
