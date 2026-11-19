import { useState, type CSSProperties, type JSX } from 'react'
import MemoizationDemo from './MemoizationDemo'
import PerformanceMonitor from './PerformanceMonitor'

const DEMOS = [
  { id: 'memo' as const, label: 'React.memo' },
  { id: 'useMemo' as const, label: 'useMemo' },
  { id: 'useCallback' as const, label: 'useCallback' },
]

const segmentBtn = (active: boolean): CSSProperties => ({
  flex: '1 1 0',
  minWidth: 0,
  padding: '8px 10px',
  minHeight: 40,
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: active ? 600 : 500,
  fontFamily: 'inherit',
  background: active ? 'var(--bg-card)' : 'transparent',
  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
  boxShadow: active ? 'var(--shadow-sm)' : 'none',
})

/** One memoization demo at a time — cuts Practice vertical weight. */
export function MemoizationPracticeSection(): JSX.Element {
  const [active, setActive] = useState<(typeof DEMOS)[number]['id']>('memo')

  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ margin: '0 0 12px', fontSize: '1.15rem' }}>Interactive demos</h2>
      <div
        role="tablist"
        aria-label="Memoization demos"
        style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          marginBottom: 14,
          background: 'var(--bg-section)',
          borderRadius: 10,
          border: '1px solid var(--border-color)',
        }}
      >
        {DEMOS.map((demo) => (
          <button
            key={demo.id}
            type="button"
            role="tab"
            aria-selected={active === demo.id}
            onClick={() => setActive(demo.id)}
            style={segmentBtn(active === demo.id)}
          >
            {demo.label}
          </button>
        ))}
      </div>
      <MemoizationDemo type={active} />
      <div style={{ marginTop: 16 }}>
        <PerformanceMonitor componentName="Day04Memoization" />
      </div>
    </div>
  )
}
