import { useLayoutEffect, useRef, type JSX } from 'react'

interface PerformanceMonitorProps {
  componentName: string
}

/**
 * Lightweight render counter for lesson demos.
 * Uses refs only — never setState in an every-render effect (that loops).
 * Values refresh when the parent re-renders (the thing being measured).
 */
function PerformanceMonitor({ componentName }: PerformanceMonitorProps): JSX.Element {
  const renderCountRef = useRef(0)
  const lastRenderTimeRef = useRef(0)
  const renderTimesRef = useRef<number[]>([])
  const renderStartRef = useRef(performance.now())

  // Mark start of this render
  renderStartRef.current = performance.now()
  renderCountRef.current += 1

  useLayoutEffect(() => {
    const duration = performance.now() - renderStartRef.current
    lastRenderTimeRef.current = duration
    renderTimesRef.current = [...renderTimesRef.current, duration].slice(-10)
  })

  const renderCount = renderCountRef.current
  const lastRenderTime = lastRenderTimeRef.current
  const times = renderTimesRef.current
  const averageRenderTime =
    times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0

  const getPerformanceColor = (time: number): string => {
    // Foreground colors (bg-* tokens are unreadable as text on grey tiles)
    if (time < 5) return 'var(--link-color)'
    if (time < 16) return 'var(--accent-a)'
    return 'var(--button-primary)'
  }

  const containerStyle: React.CSSProperties = {
    border: '2px solid var(--border-primary)',
    borderRadius: '8px',
    padding: 'clamp(12px, 3vw, 15px)',
    background: 'var(--bg-card)',
    marginTop: '20px',
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '13px',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
  }

  return (
    <div style={containerStyle}>
      <h4 style={{ marginTop: 0, fontSize: 'clamp(0.95rem, 3vw, 1.05rem)' }}>
        Performance Monitor: {componentName}
      </h4>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))',
          gap: '10px',
          marginTop: '15px',
        }}
      >
        <div style={{ padding: '10px', background: 'var(--bg-section)', borderRadius: '4px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Render Count</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{renderCount}</div>
        </div>
        <div style={{ padding: '10px', background: 'var(--bg-section)', borderRadius: '4px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Last Render</div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: getPerformanceColor(lastRenderTime),
            }}
          >
            {lastRenderTime.toFixed(2)}ms
          </div>
        </div>
        <div style={{ padding: '10px', background: 'var(--bg-section)', borderRadius: '4px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Avg Render</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {averageRenderTime.toFixed(2)}ms
          </div>
        </div>
        <div style={{ padding: '10px', background: 'var(--bg-section)', borderRadius: '4px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Status</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
            {averageRenderTime < 16 ? 'Good' : 'Slow'}
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: '15px',
          padding: '10px',
          background: 'var(--bg-info)',
          color: 'var(--text-on-info)',
          borderRadius: '4px',
          fontSize: '11px',
          lineHeight: 1.4,
        }}
      >
        Target: &lt;16ms/render (60fps). This counter only advances when the lesson
        re-renders (for example the Learn-tab count button) — it does not sample in a loop.
      </div>
    </div>
  )
}

export default PerformanceMonitor
