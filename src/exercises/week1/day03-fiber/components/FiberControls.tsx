/**
 * Fiber Controls Component
 * Single Responsibility: Control buttons and status messages for Fiber demo
 */

import { type JSX } from 'react'
import { buttonStyle } from '../../../../utils/styles'

interface FiberControlsProps {
    isProcessing: boolean
    wasInterrupted: boolean
    processedFibers: string[]
    fiberOrder: string[]
    onStart: () => void
    onReset: () => void
}

function FiberControls({
    isProcessing,
    wasInterrupted,
    processedFibers,
    fiberOrder,
    onStart,
    onReset
}: FiberControlsProps): JSX.Element {
    return (
        <div style={{ marginTop: '15px' }}>
            <button
                onClick={onStart}
                disabled={isProcessing}
                style={{
                    ...buttonStyle,
                    opacity: isProcessing ? 0.5 : 1,
                    marginRight: '10px'
                }}
            >
                {isProcessing ? 'Processing...' : '▶️ Start Processing'}
            </button>
            <button
                onClick={onReset}
                style={buttonStyle}
            >
                🔄 Reset
            </button>
            {wasInterrupted && (
                <div style={{
                    marginTop: '15px',
                    padding: '10px',
                    background: 'var(--bg-warning)',
                    borderRadius: '4px'
                }}>
                    ⚠️ Processing was interrupted! Fiber paused to handle urgent work.
                    Processed: {processedFibers.join(' → ')}
                </div>
            )}
            {!isProcessing && processedFibers.length === fiberOrder.length && !wasInterrupted && (
                <div style={{
                    marginTop: '15px',
                    padding: '10px',
                    background: 'var(--bg-success)',
                    borderRadius: '4px'
                }}>
                    ✅ All Fibers processed! Ready for commit phase.
                    Processed: {processedFibers.join(' → ')}
                </div>
            )}
        </div>
    )
}

export default FiberControls
