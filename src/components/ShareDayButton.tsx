import { useState, type CSSProperties, type JSX } from 'react'
import { shareDay, type ShareDayInfo } from '../lib/shareDay'
import { tracking } from '../lib/googleAnalytics'

interface ShareDayButtonProps {
  info: ShareDayInfo
  /** Icon-only control (default for header). */
  compact?: boolean
}

function quietIconStyle(size: number): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    width: size,
    height: size,
    minWidth: size,
    borderRadius: 8,
    border: '1px solid transparent',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background 0.15s ease, color 0.15s ease',
  }
}

function ShareIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 3v12M12 3l-4 4M12 3l4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12l5 5L20 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Copy / system-share a per-day link (static /share/{key}/ for OG crawlers). */
export function ShareDayButton({ info, compact }: ShareDayButtonProps): JSX.Element {
  const [status, setStatus] = useState<'idle' | 'copied' | 'shared'>('idle')
  const [hovered, setHovered] = useState(false)
  const size = compact ? 40 : 36

  const label =
    status === 'copied'
      ? 'Link copied'
      : status === 'shared'
        ? 'Day shared'
        : `Share Day ${info.day}`

  return (
    <button
      type="button"
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...quietIconStyle(size),
        ...(hovered ? { background: 'var(--bg-section)', color: 'var(--text-primary)' } : {}),
        ...(status !== 'idle' ? { color: 'var(--button-primary)' } : {}),
      }}
      onClick={() => {
        void (async () => {
          try {
            const result = await shareDay(info)
            tracking.dayShared(info.day, info.key, result)
            setStatus(result)
            window.setTimeout(() => setStatus('idle'), 1800)
          } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') return
            setStatus('idle')
          }
        })()
      }}
    >
      {status === 'idle' ? <ShareIcon /> : <CheckIcon />}
    </button>
  )
}
