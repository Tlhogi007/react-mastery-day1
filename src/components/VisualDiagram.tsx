import { useState, type JSX } from 'react'

interface DiagramStep {
  title: string
  content: string
  visual: string
}

interface VisualDiagramProps {
  title: string
  steps: DiagramStep[]
  animated?: boolean
}

function VisualDiagram({ title, steps }: VisualDiagramProps): JSX.Element {
  const [currentStep, setCurrentStep] = useState<number>(0)

  const containerStyle: React.CSSProperties = {
    border: '2px solid var(--border-primary)',
    borderRadius: '8px',
    padding: '20px',
    background: 'var(--bg-card)',
    marginTop: '20px'
  }

  const visualStyle: React.CSSProperties = {
    background: 'var(--bg-section)',
    padding: '20px',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '14px',
    whiteSpace: 'pre',
    overflow: 'auto',
    marginTop: '15px',
    minHeight: '200px',
    border: '1px solid var(--border-color)'
  }

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3>{title}</h3>
        {steps.length > 1 && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              style={{
                padding: '6px 12px',
                background: 'var(--button-primary)',
                color: 'var(--button-text)',
                border: 'none',
                borderRadius: '4px',
                cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                opacity: currentStep === 0 ? 0.5 : 1
              }}
            >
              ←
            </button>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {currentStep + 1} / {steps.length}
            </span>
            <button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
              style={{
                padding: '6px 12px',
                background: 'var(--button-primary)',
                color: 'var(--button-text)',
                border: 'none',
                borderRadius: '4px',
                cursor: currentStep === steps.length - 1 ? 'not-allowed' : 'pointer',
                opacity: currentStep === steps.length - 1 ? 0.5 : 1
              }}
            >
              →
            </button>
          </div>
        )}
      </div>

      <div>
        <h4>{steps[currentStep].title}</h4>
        <p style={{ marginTop: '10px', color: 'var(--text-primary)' }}>
          {steps[currentStep].content}
        </p>
        <div style={visualStyle}>
          {steps[currentStep].visual}
        </div>
      </div>
    </div>
  )
}

export default VisualDiagram
