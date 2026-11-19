import { useState, type CSSProperties, type JSX } from 'react'
import { shareDay, type ShareDayInfo } from '../lib/shareDay'
import { tracking } from '../lib/googleAnalytics'

interface ShareDayButtonProps {
  info: ShareDayInfo
  compact?: boolean
}

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
  whiteSpace: 'nowrap',
}

/** Copy / system-share a per-day link (static /share/{key}/ for OG crawlers). */
export function ShareDayButton({ info, compact }: ShareDayButtonProps): JSX.Element {
  const [status, setStatus] = useState<'idle' | 'copied' | 'shared'>('idle')

  return (
    <button
      type="button"
      title="Share this day"
      aria-label={`Share Day ${info.day}`}
      style={btnStyle}
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
      {status === 'copied' ? 'Copied' : status === 'shared' ? 'Shared' : compact ? 'Share' : 'Share day'}
    </button>
  )
}
