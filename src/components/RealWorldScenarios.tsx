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
    padding: '20px',
    background: 'var(--bg-card)',
    marginTop: '20px'
  }

  const scenarioStyle: React.CSSProperties = {
    padding: '15px',
    margin: '10px 0',
    background: 'var(--bg-section)',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    cursor: 'pointer'
  }

  const codeBlockStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)',
    padding: '12px',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontSize: '12px',
    overflow: 'auto',
    marginTop: '10px',
    border: '1px solid var(--border-color)'
  }

  return (
    <div style={containerStyle}>
      <h3>🌍 Real-World Scenarios</h3>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '5px' }}>
        Production problems you might encounter and how to solve them
      </p>

      <div style={{ marginTop: '20px' }}>
        {scenarios.map((scenario) => {
          const isExpanded = expandedId === scenario.id
          return (
            <div key={scenario.id} style={scenarioStyle}>
              <div
                onClick={() => setExpandedId(isExpanded ? null : scenario.id)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <strong>{scenario.title}</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {scenario.description}
                  </div>
                </div>
                <div style={{ fontSize: '20px' }}>
                  {isExpanded ? '▼' : '▶'}
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: 'var(--text-on-warning)' }}>Problem:</strong>
                    <p style={{ marginTop: '5px' }}>{scenario.problem}</p>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: 'var(--text-on-success)' }}>Solution:</strong>
                    <p style={{ marginTop: '5px' }}>{scenario.solution}</p>
                  </div>

                  <div>
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
