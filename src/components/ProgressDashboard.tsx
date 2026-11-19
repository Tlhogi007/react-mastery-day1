import { useEffect, useState, type JSX } from 'react'
import type { ExercisesRegistry } from '../types/exercises'
import { progressStorage } from '../services/progressStorage'
import {
  getWeakQuizTopics,
  getWeek1Completion,
  getWeightedProgressPercent,
} from '../lib/learningPath'
import { USER_CLOUD_SYNCED_EVENT } from '../services/userCloudSync'

interface ProgressDashboardProps {
  exercises: ExercisesRegistry
  onOpenCertificate?: () => void
  onJumpToDay?: (day: number) => void
}

function readDashboardState(totalDays: number) {
  return {
    completedDays: progressStorage.getCompletedDaysCount(),
    completedQuizzes: progressStorage.getCompletedQuizzesCount(),
    currentStreak: progressStorage.getCurrentStreak(),
    weak: getWeakQuizTopics(totalDays),
    week1: getWeek1Completion(totalDays),
    overallProgress: getWeightedProgressPercent(totalDays),
  }
}

function ProgressDashboard({
  exercises,
  onOpenCertificate,
  onJumpToDay,
}: ProgressDashboardProps): JSX.Element {
  const totalDays = Object.keys(exercises).length
  const [snap, setSnap] = useState(() => readDashboardState(totalDays))
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const refresh = () => setSnap(readDashboardState(totalDays))
    refresh()
    window.addEventListener('rm-progress-changed', refresh)
    window.addEventListener(USER_CLOUD_SYNCED_EVENT, refresh)
    return () => {
      window.removeEventListener('rm-progress-changed', refresh)
      window.removeEventListener(USER_CLOUD_SYNCED_EVENT, refresh)
    }
  }, [totalDays])

  const { completedDays, completedQuizzes, currentStreak, weak, week1, overallProgress } = snap
  const totalQuizzes = totalDays

  const rows = [
    { label: 'Days finished', value: `${completedDays} / ${totalDays}`, pct: totalDays ? (completedDays / totalDays) * 100 : 0 },
    { label: 'Quizzes passed', value: `${completedQuizzes} / ${totalQuizzes}`, pct: totalQuizzes ? (completedQuizzes / totalQuizzes) * 100 : 0 },
    { label: 'Study streak', value: `${currentStreak} day${currentStreak === 1 ? '' : 's'}`, pct: Math.min(currentStreak * 12, 100) },
    { label: 'Week 1 completion', value: `${week1.pct}%`, pct: week1.pct },
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
          {weak.length > 0 && (
            <li style={{ padding: '12px 14px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
                Weak quiz topics (under 70%)
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {weak.map((w) => {
                  const title =
                    Object.values(exercises).find((e) => e.day === w.day)?.title.replace(/^Day \d+:\s*/i, '') ||
                    `Day ${w.day}`
                  return (
                    <li key={w.dayKey}>
                      <button
                        type="button"
                        onClick={() => onJumpToDay?.(w.day)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 8,
                          padding: '8px 10px',
                          borderRadius: 8,
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-section)',
                          cursor: onJumpToDay ? 'pointer' : 'default',
                          color: 'var(--text-primary)',
                          fontSize: 13,
                        }}
                      >
                        <span>
                          Day {w.day}: {title}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{w.score}%</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </li>
          )}
          {onOpenCertificate && (
            <li style={{ padding: '12px 14px', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={onOpenCertificate}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                }}
              >
                Week 1 summary card
              </button>
            </li>
          )}
        </ul>
      )}
    </section>
  )
}

export default ProgressDashboard
