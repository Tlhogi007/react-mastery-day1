/**
 * Question Prompt — after the first 3 questions, choose local/AI and count
 */

import { useState, type JSX } from 'react'
import SlideUp from '../animations/SlideUp'
import '../../exercises/exerciseLayout.css'

interface QuestionPromptProps {
  onSelectType: (type: 'local' | 'ai' | null) => void
  onCancel: () => void
  selectedType: 'local' | 'ai' | null
  onSelectCount: (type: 'local' | 'ai', count: number) => void
  generating: boolean
  errorMessage: string | null
}

const COUNT_OPTIONS = [5, 10, 15, 20] as const

function QuestionPrompt({
  onSelectType,
  onCancel,
  selectedType,
  onSelectCount,
  generating,
  errorMessage,
}: QuestionPromptProps): JSX.Element {
  const [selectedCount, setSelectedCount] = useState(5)

  if (!selectedType) {
    return (
      <SlideUp>
        <div className="quiz-panel" role="region" aria-label="More questions">
          <h2 className="quiz-panel__title">Want more questions?</h2>
          <p className="quiz-panel__lead">
            You’ve finished 3. Keep going with local or AI-generated questions.
          </p>

          <div className="quiz-actions">
            <button
              type="button"
              className="quiz-btn quiz-btn--primary"
              onClick={() => onSelectType('local')}
              disabled={generating}
            >
              Local questions
            </button>
            <button
              type="button"
              className="quiz-btn quiz-btn--ghost"
              onClick={() => onSelectType('ai')}
              disabled={generating}
            >
              AI questions
            </button>
            <button
              type="button"
              className="quiz-btn quiz-btn--link"
              onClick={onCancel}
              disabled={generating}
            >
              Skip — finish remaining
            </button>
          </div>
        </div>
      </SlideUp>
    )
  }

  const title = selectedType === 'local' ? 'Local questions' : 'AI questions'
  const primaryLabel = generating
    ? 'Loading…'
    : `Continue with ${selectedCount}`

  return (
    <SlideUp>
      <div className="quiz-panel" role="region" aria-label={title}>
        <h2 className="quiz-panel__title">{title}</h2>
        <p className="quiz-panel__lead">
          How many {selectedType === 'local' ? 'local' : 'AI'} questions would you like?
        </p>

        {errorMessage && (
          <p className="quiz-count-prompt__error" role="alert">
            {errorMessage}
          </p>
        )}

        <div
          className="quiz-segment"
          role="radiogroup"
          aria-label="Number of questions"
        >
          {COUNT_OPTIONS.map((count) => (
            <button
              key={count}
              type="button"
              role="radio"
              aria-checked={selectedCount === count}
              className={`quiz-segment__opt${selectedCount === count ? ' quiz-segment__opt--active' : ''}`}
              onClick={() => setSelectedCount(count)}
              disabled={generating}
            >
              {count}
            </button>
          ))}
        </div>

        <div className="quiz-actions">
          <button
            type="button"
            className="quiz-btn quiz-btn--primary"
            onClick={() => onSelectCount(selectedType, selectedCount)}
            disabled={generating}
          >
            {primaryLabel}
          </button>
          <button
            type="button"
            className="quiz-btn quiz-btn--ghost"
            onClick={() => onSelectType(null)}
            disabled={generating}
          >
            Back
          </button>
        </div>
      </div>
    </SlideUp>
  )
}

export default QuestionPrompt
