import { useEffect, useState, type JSX } from 'react'
import type { ExercisesRegistry } from '../types/exercises'
import { progressStorage } from '../services/progressStorage'

interface ProgressDashboardProps {
  exercises: ExercisesRegistry
}

function ProgressDashboard({ exercises }: ProgressDashboardProps): JSX.Element {
  const totalDays = Object.keys(exercises).length
  const [completedDays, setCompletedDays] = useState(0)
  const [completedQuizzes, setCompletedQuizzes] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setCompletedDays(progressStorage.getCompletedDaysCount())
    setCompletedQuizzes(progressStorage.getCompletedQuizzesCount())
    setCurrentStreak(progressStorage.getCurrentStreak())
  }, [])

  const totalQuizzes = totalDays
  const overallProgress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

  const rows = [
    { label: 'Days finished', value: `${completedDays} / ${totalDays}`, pct: totalDays ? (completedDays / totalDays) * 100 : 0 },
    { label: 'Quizzes passed', value: `${completedQuizzes} / ${totalQuizzes}`, pct: totalQuizzes ? (completedQuizzes / totalQuizzes) * 100 : 0 },
    { label: 'Study streak', value: `${currentStreak} day${currentStreak === 1 ? '' : 's'}`, pct: Math.min(currentStreak * 12, 100) },
  ]

  return (
    <section
      aria-label="Study progress"
      data-tutorial="progress"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-4)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--text-primary)',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}>Progress</span>
        <span
          style={{
            flex: 1,
            height: 3,
            background: 'var(--bg-section)',
            borderRadius: 2,
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          <span
            style={{
              display: 'block',
              height: '100%',
              width: `${overallProgress}%`,
              background: 'var(--button-primary)',
              transition: 'width 0.3s ease',
            }}
          />
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            flexShrink: 0,
          }}
        >
          {overallProgress}%
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
          {expanded ? 'Hide' : 'Details'}
        </span>
      </button>

      {expanded && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, borderTop: '1px solid var(--border-color)' }}>
          {rows.map((row, i) => (
            <li
              key={row.label}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 12,
                alignItems: 'center',
                padding: '10px 14px',
                borderTop: i === 0 ? 'none' : '1px solid var(--border-color)',
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>
                  {row.label}
                </div>
                <div style={{ height: 2, background: 'var(--bg-section)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${row.pct}%`,
                      background: 'var(--button-primary)',
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.value}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default ProgressDashboard
