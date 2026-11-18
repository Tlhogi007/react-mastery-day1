/**
 * Memoization Demo Component
 * Interactive before/after performance comparison for React.memo, useMemo, useCallback
 */

import { useState, memo, useMemo, useCallback, useRef, type CSSProperties, type JSX } from 'react'

interface MemoizationDemoProps {
  type: 'memo' | 'useMemo' | 'useCallback'
}

function CountBadge({ label, count }: { label: string; count: number }): JSX.Element {
  return (
    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
      {label} {count} times
    </div>
  )
}

/** Unmemoized child — re-renders whenever parent re-renders */
function MemoChildPlain({ value }: { value: number }): JSX.Element {
  const renders = useRef(0)
  renders.current += 1
  return (
    <div style={{ padding: '12px', background: 'var(--bg-section)', borderRadius: '4px' }}>
      <div>Value: {value}</div>
      <CountBadge label="Rendered" count={renders.current} />
    </div>
  )
}

/** Memoized child — skips re-render when `value` is unchanged */
const MemoChildMemoized = memo(function MemoChildMemoized({ value }: { value: number }): JSX.Element {
  const renders = useRef(0)
  renders.current += 1
  return (
    <div style={{ padding: '12px', background: 'var(--bg-section)', borderRadius: '4px' }}>
      <div>Value: {value}</div>
      <CountBadge label="Rendered" count={renders.current} />
    </div>
  )
})

const CallbackButton = memo(function CallbackButton({
  onClick,
  label,
}: {
  onClick: () => void
  label: string
}): JSX.Element {
  const renders = useRef(0)
  renders.current += 1
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 16px',
        background: 'var(--bg-section)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
      }}
    >
      {label} (Rendered: {renders.current})
    </button>
  )
})

const demoShell: CSSProperties = {
  padding: '20px',
  background: 'var(--bg-card)',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
}

const primaryBtn: CSSProperties = {
  padding: '8px 16px',
  background: 'var(--button-primary)',
  color: 'var(--button-text)',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
}

const secondaryBtn: CSSProperties = {
  padding: '8px 16px',
  background: 'var(--bg-section)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
}

const comparisonGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '20px',
}

function MemoDemo(): JSX.Element {
  const [count, setCount] = useState(0)
  const [memoEpoch, setMemoEpoch] = useState(0)
  const value = 42

  return (
    <div style={demoShell}>
      <h3 style={{ marginTop: 0 }}>React.memo Performance Comparison</h3>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
        Click the button to increment count. Notice how the component without React.memo re-renders every time,
        while the memoized component only re-renders when its props change.
      </p>

      <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <button type="button" onClick={() => setCount((c) => c + 1)} style={primaryBtn}>
          Increment Count: {count}
        </button>
        <button type="button" onClick={() => setMemoEpoch((e) => e + 1)} style={secondaryBtn}>
          Reset Counts
        </button>
      </div>

      <div style={comparisonGrid}>
        <div>
          <h4 style={{ color: 'var(--text-on-warning)' }}>❌ Without React.memo</h4>
          <MemoChildPlain key={`plain-${memoEpoch}`} value={value} />
        </div>
        <div>
          <h4 style={{ color: 'var(--text-on-success)' }}>✅ With React.memo</h4>
          <MemoChildMemoized key={`memo-${memoEpoch}`} value={value} />
        </div>
      </div>
    </div>
  )
}

function UseMemoDemo(): JSX.Element {
  const [count, setCount] = useState(0)
  const [filter, setFilter] = useState('')
  const calculationCount = useRef({ without: 0, with: 0 })
  const [items] = useState(() => Array.from({ length: 100 }, (_, i) => ({ id: i, value: i })))

  const filteredWithout = items.filter((item) => {
    calculationCount.current.without++
    return item.value.toString().includes(filter)
  })

  const filteredWith = useMemo(() => {
    calculationCount.current.with++
    return items.filter((item) => item.value.toString().includes(filter))
  }, [items, filter])

  return (
    <div style={demoShell}>
      <h3 style={{ marginTop: 0 }}>useMemo Performance Comparison</h3>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
        Type in the filter input. Notice how without useMemo, the filter calculation runs on every render,
        even when the filter value hasn&apos;t changed.
      </p>

      <div style={{ marginTop: '16px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter items..."
          style={{
            padding: '8px 12px',
            width: '200px',
            maxWidth: '100%',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            background: 'var(--bg-section)',
            color: 'var(--text-primary)',
            fontSize: '14px',
          }}
        />
        <button
          type="button"
          onClick={() => {
            calculationCount.current = { without: 0, with: 0 }
            setCount((c) => c + 1)
          }}
          style={primaryBtn}
        >
          Force Re-render (Count: {count})
        </button>
      </div>

      <div style={comparisonGrid}>
        <div>
          <h4 style={{ color: 'var(--text-on-warning)' }}>❌ Without useMemo</h4>
          <div style={{ padding: '12px', background: 'var(--bg-section)', borderRadius: '4px' }}>
            <div>Filtered items: {filteredWithout.length}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Calculations: {calculationCount.current.without}
            </div>
          </div>
        </div>
        <div>
          <h4 style={{ color: 'var(--text-on-success)' }}>✅ With useMemo</h4>
          <div style={{ padding: '12px', background: 'var(--bg-section)', borderRadius: '4px' }}>
            <div>Filtered items: {filteredWith.length}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Calculations: {calculationCount.current.with}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function UseCallbackDemo(): JSX.Element {
  const [count, setCount] = useState(0)

  const handleClickWithout = () => {
    console.log('Clicked (without useCallback)')
  }

  const handleClickWith = useCallback(() => {
    console.log('Clicked (with useCallback)')
  }, [])

  return (
    <div style={demoShell}>
      <h3 style={{ marginTop: 0 }}>useCallback Performance Comparison</h3>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
        Click the increment button. Notice how the button without useCallback re-renders every time because
        it receives a new function reference, while the button with useCallback doesn&apos;t re-render.
      </p>

      <div style={{ marginTop: '16px', marginBottom: '20px' }}>
        <button type="button" onClick={() => setCount((c) => c + 1)} style={primaryBtn}>
          Increment Count: {count}
        </button>
      </div>

      <div style={comparisonGrid}>
        <div>
          <h4 style={{ color: 'var(--text-on-warning)' }}>❌ Without useCallback</h4>
          <div style={{ padding: '12px', background: 'var(--bg-section)', borderRadius: '4px' }}>
            <CallbackButton onClick={handleClickWithout} label="Click me" />
          </div>
        </div>
        <div>
          <h4 style={{ color: 'var(--text-on-success)' }}>✅ With useCallback</h4>
          <div style={{ padding: '12px', background: 'var(--bg-section)', borderRadius: '4px' }}>
            <CallbackButton onClick={handleClickWith} label="Click me" />
          </div>
        </div>
      </div>
    </div>
  )
}

function MemoizationDemo({ type }: MemoizationDemoProps): JSX.Element {
  if (type === 'memo') return <MemoDemo />
  if (type === 'useMemo') return <UseMemoDemo />
  if (type === 'useCallback') return <UseCallbackDemo />
  return <></>
}

export default MemoizationDemo
