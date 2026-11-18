import { useState, type JSX } from 'react'
import type { DebuggingScenario as DebugScenario } from '../types/challenges'
import '../exercises/exerciseLayout.css'

interface DebuggingScenarioProps {
    scenario: DebugScenario
}

function DebuggingScenario({ scenario }: DebuggingScenarioProps): JSX.Element {
    const [showHint, setShowHint] = useState<number>(0)
    const [showSolution, setShowSolution] = useState<boolean>(false)

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

    const btnStyle = (disabled = false): React.CSSProperties => ({
        background: 'var(--button-primary)',
        color: 'var(--button-text)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
    })

    return (
        <div className="lesson-prose" style={containerStyle}>
            <h3 style={{ marginTop: 0, fontSize: 'clamp(1rem, 3.2vw, 1.2rem)', lineHeight: 1.3 }}>
                🐛 Debugging Challenge: {scenario.title}
            </h3>
            <p style={{ marginTop: '10px', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                {scenario.description}
            </p>

            <div style={{ marginTop: '20px', minWidth: 0 }}>
                <h4 style={{ marginBottom: 8 }}>Buggy Code:</h4>
                <pre className="lesson-code">
                    <code>{scenario.buggyCode}</code>
                </pre>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'left' }}>
                <h4 style={{ marginBottom: 8, textAlign: 'left' }}>Your Task:</h4>
                <div className="lesson-points">
                    <div className="lesson-points__item"><span>Identify the bug</span></div>
                    <div className="lesson-points__item"><span>Understand why it happens</span></div>
                    <div className="lesson-points__item"><span>Fix it</span></div>
                </div>
            </div>

            <div className="lesson-action-stack" style={{ marginTop: '20px' }}>
                {scenario.hints.length > 0 && (
                    <>
                        <h4 style={{ margin: '0 0 8px' }}>Hints:</h4>
                        <button
                            type="button"
                            className="lesson-full-btn"
                            onClick={() => setShowHint(prev => Math.min(prev + 1, scenario.hints.length))}
                            disabled={showHint >= scenario.hints.length}
                            style={btnStyle(showHint >= scenario.hints.length)}
                        >
                            {showHint === 0 ? 'Show First Hint' : `Show Hint ${showHint + 1}`}
                        </button>
                        {showHint > 0 && (
                            <div style={{
                                padding: '10px',
                                background: 'var(--bg-info)',
                                color: 'var(--text-on-info)',
                                borderRadius: '6px',
                                lineHeight: 1.45,
                            }}>
                                {scenario.hints.slice(0, showHint).map((hint, idx) => (
                                    <div key={idx} style={{ marginTop: idx > 0 ? '8px' : '0' }}>
                                        <strong>Hint {idx + 1}:</strong> {hint}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                <button
                    type="button"
                    className="lesson-full-btn"
                    onClick={() => setShowSolution(!showSolution)}
                    style={{
                        ...btnStyle(),
                        background: showSolution ? 'var(--bg-warning)' : 'var(--button-primary)',
                        color: showSolution ? 'var(--text-on-warning)' : 'var(--button-text)',
                    }}
                >
                    {showSolution ? 'Hide Solution' : 'Show Solution'}
                </button>

                {showSolution && (
                    <div style={{ minWidth: 0 }}>
                        <h4 style={{ marginBottom: 8 }}>Fixed Code:</h4>
                        <pre className="lesson-code">
                            <code>{scenario.fixedCode}</code>
                        </pre>
                        <div style={{
                            marginTop: '15px',
                            padding: '15px',
                            background: 'var(--bg-success)',
                            color: 'var(--text-on-success)',
                            borderRadius: '6px',
                        }}>
                            <strong style={{ color: 'var(--text-on-success)' }}>Explanation:</strong>
                            <p style={{ marginTop: '8px', color: 'var(--text-on-success)', lineHeight: 1.45 }}>
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
