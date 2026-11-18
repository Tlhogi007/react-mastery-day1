import { type JSX } from 'react'
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
  if (typeof quizScore === 'number') {
    // Quiz score contributes up to 80% until the day is marked complete
    return Math.min(80, Math.max(0, Math.round(quizScore * 0.8)))
  }

  return 0
}

function HeroSection({ day, title, description, progress }: HeroSectionProps): JSX.Element {
  const displayProgress = progress ?? getDayProgress(day)

  const containerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-card) 100%)',
    padding: 'clamp(20px, 4vw, 60px) clamp(16px, 4vw, 40px)',
    borderRadius: '16px',
    marginBottom: 'clamp(16px, 3vw, 40px)',
    border: '2px solid var(--border-primary)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
  }

  const dayBadgeStyle: React.CSSProperties = {
    width: 'clamp(44px, 8vw, 60px)',
    height: 'clamp(44px, 8vw, 60px)',
    borderRadius: '12px',
    background: 'var(--button-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
    fontWeight: 'bold',
    color: 'var(--button-text)',
    flexShrink: 0
  }

  return (
    <div className="hero-section" style={containerStyle}>
      <div
        className="hero-section__main"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'clamp(12px, 3vw, 20px)',
          marginBottom: '20px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={dayBadgeStyle}>
          {day}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            className="hero-section__title"
            style={{
              margin: 0,
              fontSize: 'clamp(1.35rem, 4.5vw, 2rem)',
              fontWeight: 'bold',
              lineHeight: '1.2',
            }}
          >
            {title}
          </h1>
          <p
            className="hero-section__description"
            style={{
              margin: '12px 0 0',
              fontSize: 'clamp(0.95rem, 2.8vw, 1.125rem)',
              color: 'var(--text-secondary)',
              lineHeight: '1.5',
            }}
          >
            {description}
          </p>
        </div>
      </div>

      <div className="hero-section__progress" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          fontSize: '14px',
          color: 'var(--text-secondary)'
        }}>
          <span>Progress</span>
          <span>{displayProgress}%</span>
        </div>
        <div style={{
          height: '8px',
          background: 'var(--bg-section)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${displayProgress}%`,
            background: 'linear-gradient(90deg, var(--button-primary), var(--link-color))',
            transition: 'width 0.3s',
            borderRadius: '4px',
            boxShadow: displayProgress > 0 ? '0 2px 8px rgba(33, 150, 243, 0.3)' : 'none'
          }} />
        </div>
      </div>
    </div>
  )
}

export default HeroSection
