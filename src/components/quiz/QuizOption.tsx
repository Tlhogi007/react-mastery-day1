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

  return (
    <div
      className={`quiz-option${isSelected ? ' quiz-option--selected' : ''}${isSelected && isCorrect ? ' quiz-option--correct' : ''}${isSelected && !isCorrect ? ' quiz-option--wrong' : ''}`}
      onClick={() => !completed && onSelect(index)}
      role="button"
      tabIndex={completed ? -1 : 0}
      aria-label={`Option ${String.fromCharCode(65 + index)}: ${option}`}
      style={{ cursor: completed ? 'default' : 'pointer' }}
      onKeyDown={(e) => {
        if (!completed && (e.key === 'Enter' || e.key === ' ')) {
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
        {isSelected && (
          <div className="quiz-option__mark" aria-hidden>
            {isCorrect ? '✅' : '❌'}
          </div>
        )}
      </div>
    </div>
  )
}

export default QuizOption
