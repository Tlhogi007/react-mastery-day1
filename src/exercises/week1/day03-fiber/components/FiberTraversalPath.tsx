/**
 * Fiber Traversal Path Component
 * Single Responsibility: Display the path Fiber takes through components
 */

import { type JSX } from 'react'

interface FiberTraversalPathProps {
  processedFibers: string[]
  currentFiber: string | null
  isProcessing: boolean
  fiberOrder: string[]
}

function FiberTraversalPath({
  processedFibers,
  currentFiber,
  isProcessing,
  fiberOrder
}: FiberTraversalPathProps): JSX.Element {
  return (
    <div style={{
      fontFamily: 'var(--font-mono, monospace)',
      fontSize: '13px',
      marginTop: '10px',
      padding: 'clamp(10px, 2.5vw, 12px)',
      background: 'var(--bg-section)',
      borderRadius: '4px',
      lineHeight: 1.5,
      overflowWrap: 'anywhere',
      minWidth: 0,
      boxSizing: 'border-box',
    }}>
      {processedFibers.length > 0 ? (
        <div>
          <strong>Processed:</strong> {processedFibers.join(' → ')}
          {currentFiber && (
            <span> → <strong style={{ color: 'var(--button-primary)' }}>{currentFiber}</strong> <span style={{ color: 'var(--text-secondary)' }}>(processing...)</span></span>
          )}
          {!currentFiber && !isProcessing && processedFibers.length === fiberOrder.length && (
            <span> → <strong style={{ color: 'var(--text-on-success)' }}>Complete!</strong></span>
          )}
        </div>
      ) : (
        <div style={{ color: 'var(--text-secondary)' }}>
          Click &quot;Start Processing&quot; to see the traversal path
        </div>
      )}
    </div>
  )
}

export default FiberTraversalPath
