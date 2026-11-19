import { useEffect, useState, type JSX } from 'react'
import {
  fetchHelpfulCounts,
  getCachedHelpfulCounts,
  hasMarkedHelpful,
  subscribeHelpfulCounts,
  toggleHelpful,
} from '../services/communityHelpful'

interface CommunityHelpfulButtonProps {
  slug: string
}

export function CommunityHelpfulButton({ slug }: CommunityHelpfulButtonProps): JSX.Element {
  const [marked, setMarked] = useState(() => hasMarkedHelpful(slug))
  const [count, setCount] = useState(() => getCachedHelpfulCounts()[slug] || 0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setMarked(hasMarkedHelpful(slug))
    setCount(getCachedHelpfulCounts()[slug] || 0)
    void fetchHelpfulCounts()
    return subscribeHelpfulCounts((counts) => setCount(counts[slug] || 0))
  }, [slug])

  return (
    <button
      type="button"
      disabled={busy}
      onClick={(e) => {
        e.stopPropagation()
        setBusy(true)
        void (async () => {
          const result = await toggleHelpful(slug)
          setMarked(result.helpful)
          setCount(result.count)
          setBusy(false)
        })()
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 12px',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        background: marked ? 'var(--bg-success)' : 'var(--bg-section)',
        color: marked ? 'var(--text-on-success)' : 'var(--text-primary)',
        fontWeight: 600,
        fontSize: 13,
        cursor: busy ? 'wait' : 'pointer',
      }}
      aria-pressed={marked}
      title="Mark this article as helpful"
    >
      {marked ? 'Helpful ✓' : 'Mark helpful'}
      <span style={{ opacity: 0.8, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
    </button>
  )
}
