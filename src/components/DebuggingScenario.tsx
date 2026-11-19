import { useState, type CSSProperties, type JSX } from 'react'
import type { DebuggingScenario as DebugScenario } from '../types/challenges'
import '../exercises/exerciseLayout.css'

interface DebuggingScenarioProps {
  scenario: DebugScenario
}

const actionBtnBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '0 0 auto',
  width: 'auto',
  height: 36,
  minHeight: 36,
  maxHeight: 36,
  padding: '0 12px',
  boxSizing: 'border-box',
  border: '1px solid var(--border-color)',
  borderRadius: 8,
  background: 'var(--bg-section)',
  color: 'var(--text-primary)',
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1,
  fontFamily: 'inherit',
  cursor: 'pointer',
}

function DebuggingScenario({ scenario }: DebuggingScenarioProps): JSX.Element {
  const [showHint, setShowHint] = useState<number>(0)
  const [showSolution, setShowSolution] = useState<boolean>(false)

  return (
    <div
      className="lesson-prose"
      style={{
        border: 'none',
        borderRadius: 0,
        padding: 0,
        background: 'transparent',
        marginTop: 0,
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <h3 style={{ marginTop: 0, fontSize: 'clamp(1rem, 3.2vw, 1.2rem)', lineHeight: 1.3 }}>
        Debugging Challenge: {scenario.title}
      </h3>
      <p style={{ marginTop: 10, color: 'var(--text-primary)', lineHeight: 1.45 }}>
        {scenario.description}
      </p>

      <div style={{ marginTop: 20, minWidth: 0 }}>
        <h4 style={{ marginBottom: 8 }}>Buggy Code:</h4>
        <pre className="lesson-code lesson-code--snippet">
          <code>{scenario.buggyCode}</code>
        </pre>
      </div>

      <div style={{ marginTop: 20, textAlign: 'left' }}>
        <h4 style={{ marginBottom: 8, textAlign: 'left' }}>Your Task:</h4>
        <div className="lesson-points">
          <div className="lesson-points__item"><span>Identify the bug</span></div>
          <div className="lesson-points__item"><span>Understand why it happens</span></div>
          <div className="lesson-points__item"><span>Fix it</span></div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        {scenario.hints.length > 0 && (
          <h4 style={{ margin: '0 0 8px' }}>Hints:</h4>
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {scenario.hints.length > 0 && (
            <button
              type="button"
              style={{
                ...actionBtnBase,
                opacity: showHint >= scenario.hints.length ? 0.5 : 1,
                cursor: showHint >= scenario.hints.length ? 'not-allowed' : 'pointer',
              }}
              onClick={() => setShowHint((prev) => Math.min(prev + 1, scenario.hints.length))}
              disabled={showHint >= scenario.hints.length}
            >
              {showHint === 0 ? 'Show First Hint' : `Show Hint ${showHint + 1}`}
            </button>
          )}
          <button
            type="button"
            style={{
              ...actionBtnBase,
              ...(showSolution
                ? {
                    background: 'var(--bg-warning)',
                    color: 'var(--text-on-warning)',
                    borderColor: 'transparent',
                  }
                : null),
            }}
            onClick={() => setShowSolution(!showSolution)}
          >
            {showSolution ? 'Hide Solution' : 'Show Solution'}
          </button>
        </div>

        {showHint > 0 && scenario.hints.length > 0 && (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              background: 'var(--bg-info)',
              color: 'var(--text-on-info)',
              borderRadius: 6,
              lineHeight: 1.45,
            }}
          >
            {scenario.hints.slice(0, showHint).map((hint, idx) => (
              <div key={idx} style={{ marginTop: idx > 0 ? 8 : 0 }}>
                <strong>Hint {idx + 1}:</strong> {hint}
              </div>
            ))}
          </div>
        )}

        {showSolution && (
          <div style={{ marginTop: 16, minWidth: 0 }}>
            <h4 style={{ marginBottom: 8 }}>Fixed Code:</h4>
            <pre className="lesson-code lesson-code--snippet">
              <code>{scenario.fixedCode}</code>
            </pre>
            <div
              style={{
                marginTop: 15,
                padding: 15,
                background: 'var(--bg-success)',
                color: 'var(--text-on-success)',
                borderRadius: 6,
              }}
            >
              <strong style={{ color: 'var(--text-on-success)' }}>Explanation:</strong>
              <p style={{ marginTop: 8, color: 'var(--text-on-success)', lineHeight: 1.45 }}>
                {scenario.bugExplanation}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DebuggingScenario
