import { useMemo, type JSX } from 'react'
import { useAuth, useUser } from '@clerk/react'
import { progressStorage } from '../services/progressStorage'
import { readLabSession, writeLabSession } from '../services/authReturnTo'
import { getSuggestedDay } from '../lib/learningPath'
import type { ExercisesRegistry } from '../types/exercises'

interface LandingResumeProps {
  exercises: ExercisesRegistry
  onResume: (exerciseKey: string) => void
}

/** Signed-in “continue where you left off” on the landing page. */
export function LandingResume({ exercises, onResume }: LandingResumeProps): JSX.Element {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()

  const resume = useMemo(() => {
    if (!isSignedIn) return null
    const lab = readLabSession(exercises)
    const suggestedDay = getSuggestedDay(7)
    const suggestedEntry = Object.entries(exercises).find(([, e]) => e.day === suggestedDay)
    const exercise = lab?.exercise && lab.exercise in exercises
      ? lab.exercise
      : suggestedEntry?.[0]
    if (!exercise) return null
    const day = exercises[exercise as keyof typeof exercises]?.day ?? suggestedDay
    const completed = progressStorage.getCompletedDaysCount()
    const fromLab = Boolean(lab?.exercise && lab.exercise in exercises)
    return {
      exercise,
      label: fromLab ? `Continue Day ${day}` : `Start Day ${day}`,
      detail:
        completed > 0
          ? `${completed} day${completed === 1 ? '' : 's'} completed`
          : fromLab
            ? 'Pick up your last lab session'
            : 'Suggested next step in Week 1',
    }
  }, [isSignedIn, exercises])

  if (!isLoaded || !isSignedIn || !resume) return <></>

  const first = user?.firstName || user?.username

  return (
    <section
      className="resume-section"
      style={{
        marginTop: 'var(--space-5)',
        padding: 'var(--space-4) var(--space-5)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)',
      }}
    >
      <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--text-muted)' }}>
        {first ? `Welcome back, ${first}` : 'Welcome back'}
      </p>
      <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: 18 }}>
        {resume.label}
      </h3>
      <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-secondary)' }}>{resume.detail}</p>
      <button
        type="button"
        className="cta-unique"
        style={{ padding: '10px 16px' }}
        onClick={() => {
          writeLabSession({
            exercise: resume.exercise,
            view: 'exercises',
            tools: false,
          })
          onResume(resume.exercise)
        }}
      >
        <span className="cta-text">Resume</span>
        <span className="cta-arrow">→</span>
      </button>
    </section>
  )
}
