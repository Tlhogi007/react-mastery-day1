import { useEffect, useState, type CSSProperties, type JSX } from 'react'
import { progressStorage } from '../services/progressStorage'
import '../exercises/exerciseLayout.css'

interface HeroSectionProps {
  day: number
  title: string
  description: string
  /** Optional override; defaults to real progress from local storage */
  progress?: number
}

function getDayProgress(day: number): number {
  if (progressStorage.isDayCompleted(day)) return 100

  const dayKey = `day${String(day).padStart(2, '0')}`
  const quizScore = progressStorage.getQuizScore(dayKey)
  const scored =
    typeof quizScore === 'number'
      ? Math.min(80, Math.max(0, Math.round(quizScore * 0.8)))
      : 0
  const live = progressStorage.getLiveDayProgress(day) ?? 0
  // Live in-quiz progress or best saved quiz contribution
  return Math.max(scored, live)
}

function HeroSection({ day, title, description, progress }: HeroSectionProps): JSX.Element {
  const [storedProgress, setStoredProgress] = useState(() => getDayProgress(day))

  useEffect(() => {
    const refresh = () => setStoredProgress(getDayProgress(day))
    refresh()
    window.addEventListener('rm-progress-changed', refresh)
    return () => window.removeEventListener('rm-progress-changed', refresh)
  }, [day])

  const displayProgress = progress ?? storedProgress

  const containerStyle: CSSProperties = {
    background: 'var(--bg-card)',
    padding: 'clamp(14px, 3vw, 28px) clamp(14px, 3vw, 24px)',
    borderRadius: 12,
    marginBottom: 'clamp(12px, 2.5vw, 24px)',
    border: '1px solid var(--border-color)',
    boxShadow: 'none',
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
  }

  const dayBadgeStyle: CSSProperties = {
    width: 'clamp(36px, 7vw, 48px)',
    height: 'clamp(36px, 7vw, 48px)',
    borderRadius: 10,
    background: 'var(--button-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'clamp(1rem, 3.5vw, 1.25rem)',
    fontWeight: 'bold',
    color: 'var(--button-text)',
    flexShrink: 0,
  }

  return (
    <div className="hero-section" style={containerStyle}>
      <div
        className="hero-section__main"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'clamp(10px, 2.5vw, 16px)',
          marginBottom: 12,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={dayBadgeStyle}>{day}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            className="hero-section__title"
            style={{
              margin: 0,
              fontSize: 'clamp(1.2rem, 4vw, 1.65rem)',
              fontWeight: 700,
              lineHeight: 1.2,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h1>
          <p
            className="hero-section__description"
            style={{
              margin: '6px 0 0',
              fontSize: 'clamp(0.85rem, 2.5vw, 0.98rem)',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description}
          </p>
        </div>
      </div>

      <div className="hero-section__progress" style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          <span>Day progress</span>
          <span>{displayProgress}%</span>
        </div>
        <div
          style={{
            height: 4,
            background: 'var(--bg-section)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${displayProgress}%`,
              background: 'var(--button-primary)',
              transition: 'width 0.3s',
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default HeroSection
