/**
 * Study Mode — distraction-free focus chrome
 * Mobile: full-width stack (layout 2)
 * Desktop: split bar (layout 4)
 */

import { useState, useEffect, type CSSProperties, type JSX } from 'react'

interface StudyModeProps {
  isActive: boolean
  onToggle: () => void
  children: React.ReactNode
}

function useIsDesktop(breakpoint = 769): boolean {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(`(min-width: ${breakpoint}px)`).matches : false
  )

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`)
    const onChange = (): void => setIsDesktop(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [breakpoint])

  return isDesktop
}

function StudyMode({ isActive, onToggle, children }: StudyModeProps): JSX.Element {
  const [timer, setTimer] = useState<number>(0)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [focusGoal, setFocusGoal] = useState<number>(25)
  const isDesktop = useIsDesktop()

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

  const barBtn: CSSProperties = {
    padding: isDesktop ? '6px 12px' : '10px 14px',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    minHeight: isDesktop ? 36 : 44,
    boxSizing: 'border-box',
  }

  const studyingBadge = (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: isDesktop ? '6px 12px' : '8px 14px',
        background: 'var(--bg-section)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        fontSize: isDesktop ? 12 : 13,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        textAlign: 'center',
        width: isDesktop ? 'auto' : '100%',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--button-primary)',
          flexShrink: 0,
        }}
      />
      Studying
    </div>
  )

  const startBtn = (
    <button
      type="button"
      onClick={() => setIsRunning(!isRunning)}
      style={{
        ...barBtn,
        width: isDesktop ? 'auto' : '100%',
        flexShrink: 0,
        background: isRunning ? 'var(--bg-section)' : 'transparent',
        border: isRunning
          ? '1px solid transparent'
          : '1px solid var(--button-primary)',
        color: isRunning ? 'var(--text-primary)' : 'var(--button-primary)',
      }}
    >
      {isRunning ? 'Pause' : 'Start'}
    </button>
  )

  const timerDisplay = (
    <div
      style={{
        fontVariantNumeric: 'tabular-nums',
        fontSize: isDesktop ? 17 : 22,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: 'var(--text-primary)',
        minWidth: isDesktop ? 56 : 72,
        textAlign: 'center',
        padding: '0 4px',
        flexShrink: 0,
      }}
    >
      {formatTime(timer)}
    </div>
  )

  const resetBtn = (
    <button
      type="button"
      onClick={() => setTimer(0)}
      style={{
        padding: 0,
        border: 'none',
        background: 'transparent',
        color: 'var(--text-muted)',
        fontSize: 11,
        fontWeight: 500,
        cursor: 'pointer',
        lineHeight: 1.2,
        letterSpacing: '0.01em',
      }}
    >
      Reset
    </button>
  )

  const resetBtnMobile = (
    <button
      type="button"
      onClick={() => setTimer(0)}
      style={{
        ...barBtn,
        width: '100%',
        background: 'var(--bg-section)',
        color: 'var(--text-primary)',
      }}
    >
      Reset
    </button>
  )

  const timerCluster = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      {timerDisplay}
      {resetBtn}
    </div>
  )

  const goalField = (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        color: 'var(--text-secondary)',
        minWidth: 0,
        flexShrink: 0,
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
          width: 56,
          padding: isDesktop ? '5px 6px' : '10px 6px',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          fontSize: 13,
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          minHeight: isDesktop ? 36 : 44,
          textAlign: 'center',
        }}
      />
      min
    </label>
  )

  const doneBtn = (
    <button
      type="button"
      onClick={onToggle}
      style={{
        ...barBtn,
        background: 'var(--bg-section)',
        color: 'var(--text-primary)',
        minWidth: isDesktop ? undefined : 88,
        flexShrink: 0,
      }}
    >
      Done
    </button>
  )

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100dvh',
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
          padding: isDesktop ? '12px 20px' : '14px 16px',
          paddingTop: `max(${isDesktop ? 12 : 14}px, env(safe-area-inset-top, 0px))`,
          zIndex: 100,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 1040,
            margin: '0 auto',
          }}
        >
          {isDesktop ? (
            /* Layout 4 — Studying/Start | Timer/Reset | Goal/Done */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                gap: 16,
                width: '100%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  justifyContent: 'flex-start',
                  minWidth: 0,
                  flexWrap: 'wrap',
                }}
              >
                {studyingBadge}
                {startBtn}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>{timerCluster}</div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  justifyContent: 'flex-end',
                  flexWrap: 'wrap',
                }}
              >
                {goalField}
                {doneBtn}
              </div>
            </div>
          ) : (
            /* Mobile — dense stack: Studying, then Start | Timer | Reset, then Goal | Done */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
              {studyingBadge}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                }}
              >
                <div style={{ justifySelf: 'stretch' }}>{startBtn}</div>
                {timerDisplay}
                <div style={{ justifySelf: 'stretch' }}>{resetBtnMobile}</div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                }}
              >
                {goalField}
                {doneBtn}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* No extra horizontal padding — match header/progress width in the parent main */}
      <div
        style={{
          padding: 0,
          paddingBottom: 'calc(88px + env(safe-area-inset-bottom, 0px))',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>

      {focusGoal > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 'max(16px, env(safe-area-inset-bottom, 0px))',
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
            width: 'min(240px, calc(100vw - 32px))',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--text-muted)',
              marginBottom: 6,
              letterSpacing: '0.02em',
              textAlign: 'center',
            }}
          >
              Studying
            </div>
          <div
            style={{
              width: '100%',
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
