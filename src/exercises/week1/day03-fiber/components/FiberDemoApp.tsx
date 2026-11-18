/**
 * Fiber Demo App Component
 * Single Responsibility: Visualize Fiber tree structure and processing
 */

import { type JSX } from 'react'
import '../../../exerciseLayout.css'

interface FiberDemoAppProps {
    currentFiber: string | null
    onInterrupt: () => void
}

function FiberDemoApp({ currentFiber, onInterrupt }: FiberDemoAppProps): JSX.Element {
    const isProcessing = (name: string) => currentFiber === name

    const fiberStyle = (name: string, nested = false): React.CSSProperties => ({
        padding: nested ? 'clamp(6px, 2vw, 10px)' : 'clamp(8px, 2.2vw, 12px)',
        background: isProcessing(name) ? 'var(--bg-warning)' : 'var(--bg-section)',
        margin: nested ? '4px 0' : '0',
        borderRadius: '4px',
        border: isProcessing(name) ? '2px solid var(--border-warning)' : '1px solid var(--border-color)',
        transition: 'background 0.3s, border-color 0.3s',
        position: 'relative' as const,
        minWidth: 0,
        boxSizing: 'border-box',
    })

    const processingBadge: React.CSSProperties = {
        position: 'absolute' as const,
        top: '-6px',
        right: '-6px',
        background: 'var(--button-primary)',
        color: 'var(--button-text)',
        borderRadius: '50%',
        width: '22px',
        height: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        fontWeight: 'bold',
    }

    return (
        <div
            className="fiber-demo-card"
            style={{
                border: '2px solid var(--border-primary)',
                padding: 'clamp(12px, 3vw, 20px)',
                borderRadius: '8px',
                background: 'var(--bg-card)',
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
            }}
        >
            <div style={{ marginBottom: '10px', fontWeight: 600, fontSize: 'clamp(0.9rem, 3vw, 1rem)' }}>
                Component Tree (What React Renders):
            </div>
            <div style={fiberStyle('App')}>
                {isProcessing('App') && <div style={processingBadge}>⚡</div>}
                <strong>App</strong>
                <div className="fiber-demo-children">
                    <div style={fiberStyle('Header', true)}>
                        {isProcessing('Header') && <div style={processingBadge}>⚡</div>}
                        <strong>Header</strong>
                        <div className="fiber-demo-children">
                            <div style={fiberStyle('Logo', true)}>
                                {isProcessing('Logo') && <div style={processingBadge}>⚡</div>}
                                <strong>Logo</strong>
                            </div>
                        </div>
                    </div>
                    <div style={fiberStyle('Content', true)}>
                        {isProcessing('Content') && <div style={processingBadge}>⚡</div>}
                        <strong>Content</strong>
                    </div>
                    <div style={fiberStyle('Footer', true)}>
                        {isProcessing('Footer') && <div style={processingBadge}>⚡</div>}
                        <strong>Footer</strong>
                    </div>
                </div>
            </div>

            <div className="lesson-action-stack" style={{ marginTop: '14px' }}>
                <button
                    type="button"
                    className="lesson-full-btn"
                    onClick={onInterrupt}
                    style={{
                        background: 'var(--bg-warning)',
                        color: 'var(--text-on-warning)',
                        border: '1px solid var(--border-warning)',
                        cursor: 'pointer',
                        fontWeight: 600,
                    }}
                >
                    ⚠️ Interrupt!
                </button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px', lineHeight: 1.4 }}>
                Click &quot;Interrupt!&quot; to see how Fiber can pause processing for urgent work
            </p>
        </div>
    )
}

export default FiberDemoApp
