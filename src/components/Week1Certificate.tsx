import { useMemo, type JSX } from 'react'
import { getWeek1Completion } from '../lib/learningPath'
import { shareUrlForExercise } from '../lib/shareDay'

interface Week1CertificateProps {
  learnerName?: string
  onClose?: () => void
}

/** Printable / shareable Week 1 summary card. */
export function Week1Certificate({ learnerName, onClose }: Week1CertificateProps): JSX.Element {
  const stats = useMemo(() => getWeek1Completion(7), [])
  const name = learnerName?.trim() || 'React learner'
  const date = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(560px, 100%)',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 12,
          padding: 28,
        }}
      >
        <div
          id="week1-certificate-card"
          style={{
            border: '2px solid var(--border-color)',
            borderRadius: 10,
            padding: 24,
            textAlign: 'center',
            background: 'var(--bg-section)',
          }}
        >
          <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            React Mastery Lab
          </p>
          <h2 style={{ margin: '12px 0 8px', fontFamily: 'var(--font-display)', fontSize: 28 }}>
            Week 1 progress
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: 16 }}>{name}</p>
          <p style={{ margin: '0 0 8px', fontSize: 15, color: 'var(--text-secondary)' }}>
            Completed <strong>{stats.completedDays}/{stats.totalDays}</strong> days ·{' '}
            <strong>{stats.quizzesPassed}</strong> quizzes passed · <strong>{stats.pct}%</strong>
          </p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{date}</p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--button-primary)',
              color: 'var(--button-text)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Print / Save PDF
          </button>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(
                `${name} — Week 1 ${stats.pct}% complete (${stats.completedDays}/7 days). ${shareUrlForExercise('day01-rendering-pipeline')}`,
              )
            }}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-section)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Copy summary
          </button>
          {onClose && (
            <button type="button" onClick={onClose} style={{ padding: '10px 12px', cursor: 'pointer' }}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
