/**
 * Type comparison rule: same type → update; different type → remount (state reset).
 */

import { useState, type JSX } from 'react'

function CounterBox({ label }: { label: string }): JSX.Element {
  const [n, setN] = useState(0)
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        background: 'var(--bg-section)',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <button
        type="button"
        onClick={() => setN((x) => x + 1)}
        style={{
          padding: '8px 14px',
          borderRadius: 6,
          border: 'none',
          background: 'var(--button-primary)',
          color: 'var(--button-text)',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Count: {n}
      </button>
      <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
        Local state on this component instance.
      </p>
    </div>
  )
}

function TypeComparisonDemo(): JSX.Element {
  const [asButton, setAsButton] = useState(false)

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Type comparison rule</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
        Increment the counter, then toggle the wrapper type. Same type updates in place; different type
        unmounts and remounts (count resets).
      </p>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={asButton}
          onChange={(e) => setAsButton(e.target.checked)}
        />
        <span>
          Render counter inside a <code>{asButton ? '<section>' : '<div>'}</code> → switch to{' '}
          <code>{asButton ? '<div>' : '<section>'}</code>
        </span>
      </label>

      {asButton ? (
        <section>
          <CounterBox label="Inside <section>" />
        </section>
      ) : (
        <div>
          <CounterBox label="Inside <div>" />
        </div>
      )}

      <div
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 8,
          background: 'var(--bg-warning)',
          fontSize: 14,
        }}
      >
        React sees <code>div</code> vs <code>section</code> as different types → tear down old tree,
        mount new → <code>useState(0)</code> runs again.
      </div>
    </div>
  )
}

export default TypeComparisonDemo
