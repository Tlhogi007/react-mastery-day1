/**
 * Study Mode — distraction-free focus chrome
 */

import { useState, useEffect, type JSX } from 'react'

interface StudyModeProps {
  isActive: boolean
  onToggle: () => void
  children: React.ReactNode
}

function StudyMode({ isActive, onToggle, children }: StudyModeProps): JSX.Element {
  const [timer, setTimer] = useState<number>(0)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [focusGoal, setFocusGoal] = useState<number>(25)

  useEffect(() => {
    if (!isActive || !isRunning) return

    const interval = setInterval(() => {
      setTimer((prev) => {
        const next = prev + 1
        if (next >= focusGoal * 60) setIsRunning(false)
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, isRunning, focusGoal])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!isActive) {
    return <>{children}</>
  }

  const progress = Math.min(100, (timer / (focusGoal * 60)) * 100)

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          background: 'var(--bg-elevated)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: '1px solid var(--border-color)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          zIndex: 100,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span
            style={{
              padding: '5px 10px',
              background: 'var(--bg-info)',
              color: 'var(--text-on-info)',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            Studying
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setIsRunning(!isRunning)}
              style={{
                padding: '6px 12px',
                background: isRunning ? 'var(--bg-section)' : 'var(--button-primary)',
                color: isRunning ? 'var(--text-primary)' : 'var(--button-text)',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <div
              style={{
                fontVariantNumeric: 'tabular-nums',
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                minWidth: 56,
              }}
            >
              {formatTime(timer)}
            </div>
            <button
              onClick={() => setTimer(0)}
              style={{
                padding: '6px 10px',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Reset
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            Goal
            <input
              type="number"
              value={focusGoal}
              onChange={(e) => setFocusGoal(Math.max(1, parseInt(e.target.value) || 25))}
              min={1}
              max={120}
              style={{
                width: 48,
                padding: '5px 6px',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            />
            min
          </label>
          <button
            onClick={onToggle}
            style={{
              padding: '6px 12px',
              background: 'var(--bg-section)',
              color: 'var(--text-primary)',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Done
          </button>
        </div>
      </div>

      <div
        style={{
          padding: 'clamp(20px, 4vw, 40px)',
          maxWidth: 1040,
          margin: '0 auto',
        }}
      >
        {children}
      </div>

      {focusGoal > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-elevated)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border-color)',
            borderRadius: 14,
            padding: '10px 16px',
            boxShadow: 'var(--shadow-md)',
            zIndex: 100,
            minWidth: 200,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--text-muted)',
              marginBottom: 6,
              letterSpacing: '0.02em',
            }}
          >
            Focus
          </div>
          <div
            style={{
              width: 200,
              height: 3,
              background: 'var(--bg-section)',
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'var(--progress-success)',
                transition: 'width 0.3s ease',
                borderRadius: 999,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default StudyMode
