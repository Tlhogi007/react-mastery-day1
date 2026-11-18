import { type JSX } from 'react'
import type { Exercise } from '../types/exercises'

interface BreadcrumbsProps {
  exercise: Exercise
  isDayCompleted?: boolean
  onMarkComplete?: () => void
}

function Breadcrumbs({
  exercise,
  isDayCompleted = false,
  onMarkComplete,
}: BreadcrumbsProps): JSX.Element {
  return (
    <div
      style={{
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.4,
          minWidth: 0,
        }}
      >
        {exercise.description || `Day ${exercise.day} practice`}
      </p>

      {onMarkComplete && (
        <button
          type="button"
          data-tutorial="mark-complete"
          onClick={onMarkComplete}
          disabled={isDayCompleted}
          title={
            isDayCompleted
              ? 'This day is already marked complete'
              : 'Mark this day complete in your progress'
          }
          style={{
            padding: '7px 12px',
            borderRadius: 8,
            border: '1px solid var(--border-color)',
            background: isDayCompleted ? 'var(--bg-success)' : 'var(--bg-card)',
            color: isDayCompleted ? 'var(--text-on-success)' : 'var(--text-primary)',
            fontSize: 13,
            fontWeight: 600,
            cursor: isDayCompleted ? 'default' : 'pointer',
            flexShrink: 0,
          }}
        >
          {isDayCompleted ? 'Completed' : 'Mark complete'}
        </button>
      )}
    </div>
  )
}

export default Breadcrumbs
