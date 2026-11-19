import { type JSX } from 'react'
import type { Exercise } from '../types/exercises'
import '../exercises/exerciseLayout.css'

interface BreadcrumbsProps {
  exercise: Exercise
  isDayCompleted?: boolean
  onMarkComplete?: () => void
}

function Breadcrumbs({
  isDayCompleted = false,
  onMarkComplete,
}: BreadcrumbsProps): JSX.Element {
  // Day description lives on HeroSection only — avoid repeating it here.
  if (!onMarkComplete) return <></>

  return (
    <div className="mark-complete-row mark-complete-row--action-only">
      <button
        type="button"
        className="mark-complete-btn"
        data-tutorial="mark-complete"
        onClick={onMarkComplete}
        disabled={isDayCompleted}
        title={
          isDayCompleted
            ? 'This day is already marked complete'
            : 'Mark this day complete in your progress'
        }
        style={{
          background: isDayCompleted ? 'var(--bg-success)' : 'var(--button-primary)',
          color: isDayCompleted ? 'var(--text-on-success)' : 'var(--button-text)',
          borderColor: isDayCompleted ? 'var(--border-color)' : 'transparent',
          cursor: isDayCompleted ? 'default' : 'pointer',
        }}
      >
        {isDayCompleted ? 'Completed' : 'Mark complete'}
      </button>
    </div>
  )
}

export default Breadcrumbs
