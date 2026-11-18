import { useState, type JSX } from 'react'
import type { RealWorldScenario } from '../types/challenges'

interface RealWorldScenariosProps {
  scenarios: RealWorldScenario[]
  currentDay: number
}

function RealWorldScenarios({ scenarios }: RealWorldScenariosProps): JSX.Element {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const containerStyle: React.CSSProperties = {
    border: '2px solid var(--border-warning)',
    borderRadius: '8px',
    padding: 'clamp(12px, 3vw, 20px)',
    background: 'var(--bg-card)',
    marginTop: '20px',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  }

  const scenarioStyle: React.CSSProperties = {
    padding: 'clamp(10px, 2.5vw, 15px)',
    margin: '10px 0',
    background: 'var(--bg-section)',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    minWidth: 0,
    boxSizing: 'border-box',
  }

  const codeBlockStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)',
    padding: '12px',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontSize: '12px',
    overflowX: 'auto',
    overflowWrap: 'anywhere',
    whiteSpace: 'pre-wrap',
    marginTop: '10px',
    border: '1px solid var(--border-color)',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  }

  return (
    <div style={containerStyle}>
      <h3 style={{ margin: 0, fontSize: 'clamp(1rem, 3.2vw, 1.2rem)' }}>
        🌍 Real-World Scenarios
      </h3>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '5px', lineHeight: 1.45 }}>
        Production problems you might encounter and how to solve them
      </p>

      <div style={{ marginTop: '20px' }}>
        {scenarios.map((scenario) => {
          const isExpanded = expandedId === scenario.id
          return (
            <div key={scenario.id} style={scenarioStyle}>
              <div
                onClick={() => setExpandedId(isExpanded ? null : scenario.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 10,
                  minWidth: 0,
                }}
              >
                <div style={{ flex: '1 1 auto', minWidth: 0, overflowWrap: 'anywhere' }}>
                  <strong>{scenario.title}</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>
                    {scenario.description}
                  </div>
                </div>
                <div style={{ fontSize: '18px', flexShrink: 0, lineHeight: 1.2 }} aria-hidden>
                  {isExpanded ? '▼' : '▶'}
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--border-color)', minWidth: 0 }}>
                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: 'var(--text-on-warning)' }}>Problem:</strong>
                    <p style={{ marginTop: '5px', lineHeight: 1.45, overflowWrap: 'anywhere' }}>{scenario.problem}</p>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: 'var(--text-on-success)' }}>Solution:</strong>
                    <p style={{ marginTop: '5px', lineHeight: 1.45, overflowWrap: 'anywhere' }}>{scenario.solution}</p>
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <strong>Code Example:</strong>
                    <pre style={codeBlockStyle}>
                      <code style={{ color: 'var(--text-primary)' }}>{scenario.codeExample}</code>
                    </pre>
                  </div>

                  {scenario.relatedDays.length > 0 && (
                    <div style={{
                      marginTop: '10px',
                      padding: '8px',
                      background: 'var(--bg-info)',
                      color: 'var(--text-on-info)',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      Related to: Day {scenario.relatedDays.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default RealWorldScenarios
