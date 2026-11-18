/**
 * Memoization Demo Component
 * Interactive before/after performance comparison for React.memo, useMemo, useCallback
 */

import { useState, memo, useMemo, useCallback, useRef, type JSX } from 'react'

interface MemoizationDemoProps {
  type: 'memo' | 'useMemo' | 'useCallback'
}

function MemoizationDemo({ type }: MemoizationDemoProps): JSX.Element {
  const [count, setCount] = useState(0)
  const [renderCount, setRenderCount] = useState({ without: 0, with: 0 })
  const [data] = useState({ value: 42, items: Array.from({ length: 100 }, (_, i) => ({ id: i, value: i })) })

  // Reset render counts
  const resetCounts = (): void => {
    setRenderCount({ without: 0, with: 0 })
  }

  if (type === 'memo') {
    // Without React.memo
    const ComponentWithout = ({ value }: { value: number }) => {
      setRenderCount(prev => ({ ...prev, without: prev.without + 1 }))
      return (
        <div style={{ padding: '12px', background: 'var(--bg-section)', borderRadius: '4px' }}>
          <div>Value: {value}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Rendered {renderCount.without} times
          </div>
        </div>
      )
    }

    // With React.memo
    const ComponentWith = memo(({ value }: { value: number }) => {
      setRenderCount(prev => ({ ...prev, with: prev.with + 1 }))
      return (
        <div style={{ padding: '12px', background: 'var(--bg-section)', borderRadius: '4px' }}>
          <div>Value: {value}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Rendered {renderCount.with} times
          </div>
        </div>
      )
    })

    return (
      <div style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ marginTop: 0 }}>React.memo Performance Comparison</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Click the button to increment count. Notice how the component without React.memo re-renders every time, 
          while the memoized component only re-renders when its props change.
        </p>
        
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button
            onClick={() => setCount(c => c + 1)}
            style={{
              padding: '8px 16px',
              background: 'var(--button-primary)',
              color: 'var(--button-text)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Increment Count: {count}
          </button>
          <button
            onClick={resetCounts}
            style={{
              padding: '8px 16px',
              background: 'var(--bg-section)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Reset Counts
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h4 style={{ color: 'var(--text-on-warning)' }}>❌ Without React.memo</h4>
            <ComponentWithout value={data.value} />
          </div>
          <div>
            <h4 style={{ color: 'var(--text-on-success)' }}>✅ With React.memo</h4>
            <ComponentWith value={data.value} />
          </div>
        </div>
      </div>
    )
  }

  if (type === 'useMemo') {
    const [filter, setFilter] = useState('')
    const calculationCount = useRef({ without: 0, with: 0 })

    // Without useMemo
    const filteredWithout = data.items.filter(item => {
      calculationCount.current.without++
      return item.value.toString().includes(filter)
    })

    // With useMemo
    const filteredWith = useMemo(() => {
      calculationCount.current.with++
      return data.items.filter(item => item.value.toString().includes(filter))
    }, [data.items, filter])

    return (
      <div style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ marginTop: 0 }}>useMemo Performance Comparison</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Type in the filter input. Notice how without useMemo, the filter calculation runs on every render, 
          even when the filter value hasn't changed.
        </p>
        
        <div style={{ marginTop: '16px', marginBottom: '20px' }}>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter items..."
            style={{
              padding: '8px 12px',
              width: '200px',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              background: 'var(--bg-section)',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          />
          <button
            onClick={() => {
              calculationCount.current = { without: 0, with: 0 }
              setCount(c => c + 1)
            }}
            style={{
              padding: '8px 16px',
              marginLeft: '12px',
              background: 'var(--button-primary)',
              color: 'var(--button-text)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Force Re-render (Count: {count})
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
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

  if (type === 'useCallback') {
    const renderCountWithout = useRef(0)
    const renderCountWith = useRef(0)

    // Without useCallback
    const handleClickWithout = () => {
      console.log('Clicked (without useCallback)')
    }

    // With useCallback
    const handleClickWith = useCallback(() => {
      console.log('Clicked (with useCallback)')
    }, [])

    const ButtonWithout = memo(({ onClick, label }: { onClick: () => void; label: string }) => {
      renderCountWithout.current++
      return (
        <button
          onClick={onClick}
          style={{
            padding: '8px 16px',
            background: 'var(--bg-section)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {label} (Rendered: {renderCountWithout.current})
        </button>
      )
    })

    const ButtonWith = memo(({ onClick, label }: { onClick: () => void; label: string }) => {
      renderCountWith.current++
      return (
        <button
          onClick={onClick}
          style={{
            padding: '8px 16px',
            background: 'var(--bg-section)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {label} (Rendered: {renderCountWith.current})
        </button>
      )
    })

    return (
      <div style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ marginTop: 0 }}>useCallback Performance Comparison</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Click the increment button. Notice how the button without useCallback re-renders every time because 
          it receives a new function reference, while the button with useCallback doesn't re-render.
        </p>
        
        <div style={{ marginTop: '16px', marginBottom: '20px' }}>
          <button
            onClick={() => setCount(c => c + 1)}
            style={{
              padding: '8px 16px',
              background: 'var(--button-primary)',
              color: 'var(--button-text)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Increment Count: {count}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h4 style={{ color: 'var(--text-on-warning)' }}>❌ Without useCallback</h4>
            <div style={{ padding: '12px', background: 'var(--bg-section)', borderRadius: '4px' }}>
              <ButtonWithout onClick={handleClickWithout} label="Click me" />
            </div>
          </div>
          <div>
            <h4 style={{ color: 'var(--text-on-success)' }}>✅ With useCallback</h4>
            <div style={{ padding: '12px', background: 'var(--bg-section)', borderRadius: '4px' }}>
              <ButtonWith onClick={handleClickWith} label="Click me" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <></>
}

export default MemoizationDemo
