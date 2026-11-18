import { useState, type JSX } from 'react'
import '../exercises/exerciseLayout.css'

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

  return (
    <div className="visual-diagram-card">
      <div className="diagram-header">
        <h3>{title}</h3>
        {steps.length > 1 && (
          <div className="diagram-nav visual-diagram-nav">
            <button
              type="button"
              className="visual-diagram-nav__btn"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              aria-label="Previous step"
            >
              ←
            </button>
            <span className="visual-diagram-nav__count">
              {currentStep + 1} / {steps.length}
            </span>
            <button
              type="button"
              className="visual-diagram-nav__btn"
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
              aria-label="Next step"
            >
              →
            </button>
          </div>
        )}
      </div>

      <div style={{ minWidth: 0 }}>
        <h4 style={{ margin: '0 0 8px', fontSize: 'clamp(0.95rem, 3vw, 1.05rem)', overflowWrap: 'break-word' }}>
          {steps[currentStep].title}
        </h4>
        <p className="diagram-step-copy" style={{ color: 'var(--text-primary)', marginBottom: 10 }}>
          {steps[currentStep].content}
        </p>
        <div className="lesson-code visual-diagram-visual">
          {steps[currentStep].visual}
        </div>
      </div>
    </div>
  )
}

export default VisualDiagram
