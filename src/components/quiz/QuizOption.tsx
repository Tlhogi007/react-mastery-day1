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

  const optionStyle: React.CSSProperties = {
    padding: '12px',
    margin: '8px 0',
    background: isSelected
      ? isCorrect
        ? 'var(--bg-success)'
        : 'var(--bg-warning)'
      : 'var(--bg-section)',
    border: `2px solid ${isSelected
      ? isCorrect
        ? 'var(--bg-success)'
        : 'var(--border-warning)'
      : 'var(--border-color)'
    }`,
    borderRadius: '6px',
    cursor: completed ? 'default' : 'pointer',
    transition: 'all 0.2s'
  }

  return (
    <div
      onClick={() => !completed && onSelect(index)}
      style={optionStyle}
      role="button"
      tabIndex={completed ? -1 : 0}
      aria-label={`Option ${String.fromCharCode(65 + index)}: ${option}`}
      onKeyDown={(e) => {
        if (!completed && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onSelect(index)
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: isSelected
            ? isCorrect
              ? 'var(--bg-success)'
              : 'var(--bg-warning)'
            : 'var(--bg-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '12px',
          fontWeight: 'bold'
        }}>
          {String.fromCharCode(65 + index)}
        </div>
        <div>{option}</div>
        {isSelected && (
          <div style={{ marginLeft: 'auto' }}>
            {isCorrect ? '✅' : '❌'}
          </div>
        )}
      </div>
    </div>
  )
}

export default QuizOption
