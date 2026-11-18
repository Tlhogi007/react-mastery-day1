/**
 * Fiber Demo App Component
 * Single Responsibility: Visualize Fiber tree structure and processing
 */

import { type JSX } from 'react'

interface FiberDemoAppProps {
    currentFiber: string | null
    onInterrupt: () => void
}

function FiberDemoApp({ currentFiber, onInterrupt }: FiberDemoAppProps): JSX.Element {
    const isProcessing = (name: string) => currentFiber === name

    const fiberStyle = (name: string): React.CSSProperties => ({
        padding: '10px',
        background: isProcessing(name) ? 'var(--bg-warning)' : 'var(--bg-section)',
        margin: '5px',
        borderRadius: '4px',
        border: isProcessing(name) ? '3px solid var(--border-warning)' : '1px solid var(--border-color)',
        transition: 'all 0.3s',
        position: 'relative' as const
    })

    const processingBadge: React.CSSProperties = {
        position: 'absolute' as const,
        top: '-8px',
        right: '-8px',
        background: 'var(--button-primary)',
        color: 'var(--button-text)',
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold'
    }

    return (
        <div style={{ border: '2px solid var(--border-primary)', padding: '20px', borderRadius: '8px', background: 'var(--bg-card)' }}>
            <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Component Tree (What React Renders):</div>
            <div style={fiberStyle('App')}>
                {isProcessing('App') && <div style={processingBadge}>⚡</div>}
                <strong>App</strong>
                <div style={{ marginLeft: '20px', marginTop: '10px' }}>
                    <div style={fiberStyle('Header')}>
                        {isProcessing('Header') && <div style={processingBadge}>⚡</div>}
                        <strong>Header</strong>
                        <div style={{ marginLeft: '20px', marginTop: '10px' }}>
                            <div style={fiberStyle('Logo')}>
                                {isProcessing('Logo') && <div style={processingBadge}>⚡</div>}
                                <strong>Logo</strong>
                            </div>
                        </div>
                    </div>
                    <div style={fiberStyle('Content')}>
                        {isProcessing('Content') && <div style={processingBadge}>⚡</div>}
                        <strong>Content</strong>
                    </div>
                    <div style={fiberStyle('Footer')}>
                        {isProcessing('Footer') && <div style={processingBadge}>⚡</div>}
                        <strong>Footer</strong>
                    </div>
                </div>
            </div>
            <button
                onClick={onInterrupt}
                style={{
                    marginTop: '15px',
                    padding: '8px 16px',
                    background: 'var(--bg-warning)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-warning)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}
            >
                ⚠️ Interrupt!
            </button>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px' }}>
                Click "Interrupt!" to see how Fiber can pause processing for urgent work
            </p>
        </div>
    )
}

export default FiberDemoApp
