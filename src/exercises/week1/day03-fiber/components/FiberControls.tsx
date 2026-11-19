/**
 * Fiber Controls Component
 * Single Responsibility: Control buttons and status messages for Fiber demo
 */

import { type JSX } from 'react'
import { buttonStyle, quietButtonStyle } from '../../../../utils/styles'
import '../../../exerciseLayout.css'

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
            <div className="fiber-controls-row lesson-action-stack">
                <button
                    type="button"
                    className="lesson-full-btn"
                    onClick={onStart}
                    disabled={isProcessing}
                    style={{
                        ...buttonStyle,
                        opacity: isProcessing ? 0.5 : 1,
                        width: undefined,
                        marginRight: undefined,
                    }}
                >
                    {isProcessing ? 'Processing…' : 'Start processing'}
                </button>
                <button
                    type="button"
                    className="lesson-full-btn"
                    onClick={onReset}
                    style={{
                        ...quietButtonStyle,
                        width: undefined,
                    }}
                >
                    Reset
                </button>
            </div>
            {wasInterrupted && (
                <div style={{
                    marginTop: '15px',
                    padding: 'clamp(10px, 2.5vw, 12px)',
                    background: 'var(--bg-warning)',
                    color: 'var(--text-on-warning)',
                    borderRadius: '4px',
                    lineHeight: 1.45,
                    overflowWrap: 'anywhere',
                }}>
                    ⚠️ Processing was interrupted! Fiber paused to handle urgent work.
                    Processed: {processedFibers.join(' → ')}
                </div>
            )}
            {!isProcessing && processedFibers.length === fiberOrder.length && !wasInterrupted && (
                <div style={{
                    marginTop: '15px',
                    padding: 'clamp(10px, 2.5vw, 12px)',
                    background: 'var(--bg-success)',
                    color: 'var(--text-on-success)',
                    borderRadius: '4px',
                    lineHeight: 1.45,
                    overflowWrap: 'anywhere',
                }}>
                    ✅ All Fibers processed! Ready for commit phase.
                    Processed: {processedFibers.join(' → ')}
                </div>
            )}
        </div>
    )
}

export default FiberControls
