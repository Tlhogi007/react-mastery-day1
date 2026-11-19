import { useState, type JSX } from 'react'
import '../exercises/exerciseLayout.css'

interface DevToolsGuideProps {
    day: number
    focusAreas?: string[]
}

function ReactDevToolsGuide({ day, focusAreas = [] }: DevToolsGuideProps): JSX.Element {
    const [activeTab, setActiveTab] = useState<string>('profiler')

    const containerStyle: React.CSSProperties = {
        border: '1px solid var(--border-color)',
        borderRadius: 10,
        padding: 'clamp(12px, 3vw, 20px)',
        background: 'var(--bg-card)',
        marginTop: 0,
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        overflow: 'visible',
    }

    const tabStyle = (isActive: boolean): React.CSSProperties => ({
        padding: '10px 12px',
        background: isActive ? 'var(--bg-card)' : 'var(--bg-section)',
        color: 'var(--text-primary)',
        border: 'none',
        borderBottom: isActive ? '2px solid var(--button-primary)' : '2px solid transparent',
        borderRadius: '4px 4px 0 0',
        cursor: 'pointer',
        fontWeight: isActive ? 600 : 500,
        fontSize: 13,
        flex: '1 1 0',
        minWidth: 0,
        textAlign: 'center',
    })

    const contentStyle: React.CSSProperties = {
        padding: 'clamp(12px, 3vw, 20px)',
        background: 'var(--bg-section)',
        borderRadius: '0 8px 8px 8px',
        marginTop: '-1px',
        minWidth: 0,
        overflowWrap: 'anywhere',
        lineHeight: 1.45,
    }

    return (
        <div style={containerStyle}>
            <h3 style={{ margin: 0, fontSize: 'clamp(1rem, 3.2vw, 1.2rem)' }}>
              React DevTools Integration
            </h3>
            <p style={{ marginTop: '10px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Learn to use React DevTools to debug and profile your components
            </p>

            <div className="devtools-tabs">
                <button
                    type="button"
                    onClick={() => setActiveTab('profiler')}
                    style={tabStyle(activeTab === 'profiler')}
                >
                    Profiler
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('components')}
                    style={tabStyle(activeTab === 'components')}
                >
                    Components
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('setup')}
                    style={tabStyle(activeTab === 'setup')}
                >
                    Setup
                </button>
            </div>

            <div className="devtools-guide-content" style={contentStyle}>
                {activeTab === 'setup' && (
                    <div>
                        <h4>Installation:</h4>
                        <ol>
                            <li><strong>Chrome/Edge:</strong> Install "React Developer Tools" extension</li>
                            <li><strong>Firefox:</strong> Install "React Developer Tools" add-on</li>
                            <li><strong>Safari:</strong> Install via npm: <code>npm install -g react-devtools</code></li>
                        </ol>
                        <p style={{ marginTop: '15px' }}>
                            After installation, you'll see "⚛️ Components" and "⚛️ Profiler" tabs in your browser DevTools.
                        </p>
                    </div>
                )}

                {activeTab === 'profiler' && (
                    <div>
                        <h4>Using the Profiler (Day {day} Focus):</h4>
                        <ol>
                            <li><strong>Start Recording:</strong> Click the record button (circle) in Profiler tab</li>
                            <li><strong>Interact:</strong> Perform the action you want to profile (click button, type, etc.)</li>
                            <li><strong>Stop Recording:</strong> Click record again</li>
                            <li><strong>Analyze:</strong> Look for:
                                <ul style={{ marginTop: '10px' }}>
                                    <li>Components with long render times (red/yellow)</li>
                                    <li>Components that render unnecessarily (gray = no props/state changed)</li>
                                    <li>Render duration (aim for &lt;16ms per component)</li>
                                </ul>
                            </li>
                        </ol>
                        {focusAreas.length > 0 && (
                            <div style={{
                                marginTop: '15px',
                                padding: '10px',
                                background: 'var(--bg-info)',
                                color: 'var(--text-on-info)',
                                borderRadius: '4px'
                            }}>
                                <strong style={{ color: 'var(--text-on-info)' }}>Day {day} Focus Areas:</strong>
                                <ul style={{ marginTop: '5px' }}>
                                    {focusAreas.map((area, idx) => (
                                        <li key={idx}>{area}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div style={{
                            marginTop: '15px',
                            padding: '10px',
                            background: 'var(--bg-warning)',
                            color: 'var(--text-on-warning)',
                            borderRadius: '4px',
                            fontSize: '12px'
                        }}>
                            💡 <strong style={{ color: 'var(--text-on-warning)' }}>Tip:</strong> <span style={{ color: 'var(--text-on-warning)' }}>Use the "Why did this render?" feature to see what caused a re-render.</span>
                        </div>
                    </div>
                )}

                {activeTab === 'components' && (
                    <div>
                        <h4>Using the Components Tab:</h4>
                        <ul>
                            <li><strong>Inspect Props:</strong> Select a component to see its props and state</li>
                            <li><strong>Edit Props:</strong> Double-click values to edit (great for testing)</li>
                            <li><strong>View Hooks:</strong> See all hooks and their current values</li>
                            <li><strong>Highlight Updates:</strong> Enable to see which components update on interactions</li>
                        </ul>
                        <div style={{
                            marginTop: '15px',
                            padding: '10px',
                            background: 'var(--bg-success)',
                            color: 'var(--text-on-success)',
                            borderRadius: '4px',
                            fontSize: '12px'
                        }}>
                            💡 <strong style={{ color: 'var(--text-on-success)' }}>Pro Tip:</strong> <span style={{ color: 'var(--text-on-success)' }}>Use "Highlight updates when components render" to visually see re-renders in real-time.</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ReactDevToolsGuide
