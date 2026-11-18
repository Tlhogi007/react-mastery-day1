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
      fontFamily: 'monospace',
      fontSize: '14px',
      marginTop: '10px',
      padding: '10px',
      background: 'var(--bg-card)',
      borderRadius: '4px'
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
          Click "Start Processing" to see the traversal path
        </div>
      )}
    </div>
  )
}

export default FiberTraversalPath
