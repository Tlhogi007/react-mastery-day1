/**
 * Quiz Option Component
 * Single Responsibility: Display a single quiz option with styling and interaction
 */

import { type JSX } from 'react'
import type { QuizQuestion } from '../../types/challenges'

interface QuizOptionProps {
  option: string
  index: number
  question: QuizQuestion
  selectedAnswer: number | null
  completed: boolean
  onSelect: (index: number) => void
}

function QuizOption({
  option,
  index,
  question,
  selectedAnswer,
  completed,
  onSelect
}: QuizOptionProps): JSX.Element {
  const isSelected = selectedAnswer === index
  const isCorrect = index === question.correctAnswer
  const answered = selectedAnswer !== null
  const showAsCorrect = answered && isCorrect
  const showAsWrong = answered && isSelected && !isCorrect

  return (
    <div
      className={`quiz-option${isSelected ? ' quiz-option--selected' : ''}${showAsCorrect ? ' quiz-option--correct' : ''}${showAsWrong ? ' quiz-option--wrong' : ''}`}
      onClick={() => !completed && selectedAnswer === null && onSelect(index)}
      role="button"
      tabIndex={completed || answered ? -1 : 0}
      aria-label={`Option ${String.fromCharCode(65 + index)}: ${option}`}
      style={{ cursor: completed || answered ? 'default' : 'pointer' }}
      onKeyDown={(e) => {
        if (!completed && selectedAnswer === null && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onSelect(index)
        }
      }}
    >
      <div className="quiz-option__inner">
        <div className="quiz-option__letter">
          {String.fromCharCode(65 + index)}
        </div>
        <div className="quiz-option__text">{option}</div>
        {showAsCorrect && (
          <div className="quiz-option__mark" aria-hidden>
            ✓
          </div>
        )}
        {showAsWrong && (
          <div className="quiz-option__mark" aria-hidden>
            ✕
          </div>
        )}
      </div>
    </div>
  )
}

export default QuizOption
