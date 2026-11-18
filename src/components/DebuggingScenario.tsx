import { useState, type JSX } from 'react'
import type { DebuggingScenario as DebugScenario } from '../types/challenges'

interface DebuggingScenarioProps {
    scenario: DebugScenario
}

function DebuggingScenario({ scenario }: DebuggingScenarioProps): JSX.Element {
    const [showHint, setShowHint] = useState<number>(0)
    const [showSolution, setShowSolution] = useState<boolean>(false)

    const containerStyle: React.CSSProperties = {
        border: '2px solid var(--border-warning)',
        borderRadius: '8px',
        padding: '20px',
        background: 'var(--bg-card)',
        marginTop: '20px'
    }

    const codeBlockStyle: React.CSSProperties = {
        background: 'var(--bg-secondary)',
        padding: '20px',
        borderRadius: '8px',
        fontFamily: '"Fira Code", "Consolas", "Monaco", "Courier New", monospace',
        fontSize: '14px',
        lineHeight: '1.7',
        overflow: 'auto',
        marginTop: '10px',
        border: '1px solid var(--border-color)',
        color: 'var(--text-primary)'
    }

    return (
        <div style={containerStyle}>
            <h3>🐛 Debugging Challenge: {scenario.title}</h3>
            <p style={{ marginTop: '10px', color: 'var(--text-primary)' }}>{scenario.description}</p>

            <div style={{ marginTop: '20px' }}>
                <h4>Buggy Code:</h4>
                <pre style={codeBlockStyle}>
                    <code style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{scenario.buggyCode}</code>
                </pre>
            </div>

            <div style={{ marginTop: '20px' }}>
                <h4>Your Task:</h4>
                <ul>
                    <li>Identify the bug</li>
                    <li>Understand why it happens</li>
                    <li>Fix it</li>
                </ul>
            </div>

            {scenario.hints.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h4>Hints:</h4>
                    <button
                        onClick={() => setShowHint(prev => Math.min(prev + 1, scenario.hints.length))}
                        disabled={showHint >= scenario.hints.length}
                        style={{
                            padding: '8px 16px',
                            background: 'var(--button-primary)',
                            color: 'var(--button-text)',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: showHint >= scenario.hints.length ? 'not-allowed' : 'pointer',
                            opacity: showHint >= scenario.hints.length ? 0.5 : 1
                        }}
                    >
                        {showHint === 0 ? 'Show First Hint' : `Show Hint ${showHint + 1}`}
                    </button>
                    {showHint > 0 && (
                        <div style={{
                            marginTop: '10px',
                            padding: '10px',
                            background: 'var(--bg-info)',
                            color: 'var(--text-on-info)',
                            borderRadius: '6px'
                        }}>
                            {scenario.hints.slice(0, showHint).map((hint, idx) => (
                                <div key={idx} style={{ marginTop: idx > 0 ? '8px' : '0' }}>
                                    <strong>Hint {idx + 1}:</strong> {hint}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div style={{ marginTop: '20px' }}>
                <button
                    onClick={() => setShowSolution(!showSolution)}
                    style={{
                        padding: '10px 20px',
                        background: showSolution ? 'var(--bg-warning)' : 'var(--button-primary)',
                        color: 'var(--button-text)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    {showSolution ? 'Hide Solution' : 'Show Solution'}
                </button>

                {showSolution && (
                    <div style={{ marginTop: '20px' }}>
                        <h4>Fixed Code:</h4>
                        <pre style={codeBlockStyle}>
                            <code style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{scenario.fixedCode}</code>
                        </pre>
                        <div style={{
                            marginTop: '15px',
                            padding: '15px',
                            background: 'var(--bg-success)',
                            color: 'var(--text-on-success)',
                            borderRadius: '6px'
                        }}>
                            <strong style={{ color: 'var(--text-on-success)' }}>Explanation:</strong>
                            <p style={{ marginTop: '8px', color: 'var(--text-on-success)' }}>{scenario.bugExplanation}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default DebuggingScenario
