/**
 * Guided Tutorial — short first-run coach
 */

import { useState, useEffect, useRef, type JSX } from 'react'

export interface TutorialStep {
  id: string
  title: string
  content: string
  target?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

interface GuidedTutorialProps {
  tutorialId?: string
  title?: string
  steps: TutorialStep[]
  onComplete?: () => void
  onSkip?: () => void
}

function GuidedTutorial({ steps, onComplete, onSkip }: GuidedTutorialProps): JSX.Element {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [highlightPosition, setHighlightPosition] = useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const currentStep = steps[currentStepIndex]

  useEffect(() => {
    if (!isActive) return

    const updateHighlight = (): void => {
      if (!currentStep?.target) {
        setHighlightPosition(null)
        return
      }
      const element = document.querySelector(currentStep.target)
      if (element) {
        const rect = element.getBoundingClientRect()
        setHighlightPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        })
        element.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      } else {
        setHighlightPosition(null)
      }
    }

    const timer = window.setTimeout(updateHighlight, 80)
    window.addEventListener('resize', updateHighlight)
    window.addEventListener('scroll', updateHighlight, true)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', updateHighlight)
      window.removeEventListener('scroll', updateHighlight, true)
    }
  }, [currentStep, isActive, currentStepIndex])

  const finish = (skipped: boolean): void => {
    setIsActive(false)
    setHighlightPosition(null)
    if (skipped) onSkip?.()
    else onComplete?.()
  }

  const handleNext = (): void => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1)
    } else {
      finish(false)
    }
  }

  const handlePrevious = (): void => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  if (!isActive) return <></>

  const tooltipPosition = ((): React.CSSProperties => {
    if (!highlightPosition || currentStep.position === 'center' || !currentStep.target) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    }

    const gap = 14
    const maxW = 360
    if (currentStep.position === 'right') {
      return {
        top: Math.max(16, highlightPosition.top),
        left: Math.min(
          window.innerWidth - maxW - 16,
          highlightPosition.left + highlightPosition.width + gap
        ),
      }
    }
    if (currentStep.position === 'left') {
      return {
        top: Math.max(16, highlightPosition.top),
        left: Math.max(16, highlightPosition.left - maxW - gap),
      }
    }
    if (currentStep.position === 'top') {
      return {
        top: Math.max(16, highlightPosition.top - gap - 160),
        left: Math.min(
          window.innerWidth - maxW - 16,
          Math.max(16, highlightPosition.left)
        ),
      }
    }
    // bottom
    return {
      top: Math.min(
        window.innerHeight - 200,
        highlightPosition.top + highlightPosition.height + gap
      ),
      left: Math.min(
        window.innerWidth - maxW - 16,
        Math.max(16, highlightPosition.left)
      ),
    }
  })()

  return (
    <div ref={overlayRef} style={{ position: 'fixed', inset: 0, zIndex: 10000 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: highlightPosition ? 'transparent' : 'rgba(20, 21, 26, 0.55)',
        }}
        onClick={() => finish(true)}
      />

      {highlightPosition && (
        <div
          style={{
            position: 'absolute',
            top: highlightPosition.top - 4,
            left: highlightPosition.left - 4,
            width: highlightPosition.width + 8,
            height: highlightPosition.height + 8,
            border: '2px solid var(--button-primary)',
            borderRadius: 10,
            boxShadow: '0 0 0 9999px rgba(20, 21, 26, 0.55)',
            pointerEvents: 'none',
            transition: 'top 0.2s ease, left 0.2s ease, width 0.2s ease, height 0.2s ease',
          }}
        />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        style={{
          position: 'absolute',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          padding: 20,
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
          maxWidth: 360,
          width: 'calc(100% - 32px)',
          zIndex: 10002,
          ...tooltipPosition,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div>
            <h3
              id="tutorial-title"
              style={{
                margin: '0 0 4px',
                fontSize: 17,
                fontFamily: 'var(--font-display)',
              }}
            >
              {currentStep.title}
            </h3>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Step {currentStepIndex + 1} of {steps.length}
            </div>
          </div>
          <button
            type="button"
            onClick={() => finish(true)}
            aria-label="Skip tutorial"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <p style={{ margin: '0 0 16px', lineHeight: 1.55, color: 'var(--text-secondary)', fontSize: 14 }}>
          {currentStep.content}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: currentStepIndex === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
              cursor: currentStepIndex === 0 ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--button-primary)',
              color: 'var(--button-text)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {currentStepIndex === steps.length - 1 ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

export const onboardingTutorial: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to React Mastery Lab',
    content:
      'This is a 30-day internals practice lab — lessons, quizzes, tools, and progress tracking. No signup required. Here’s the 60-second map.',
    position: 'center',
  },
  {
    id: 'pick-day',
    title: '1 · Pick a day',
    content:
      'Days live in the sidebar. Start at 01 and move in order — each day builds on the last.',
    target: '[data-tutorial="sidebar-days"]',
    position: 'right',
  },
  {
    id: 'progress',
    title: '2 · Track progress',
    content:
      'Your overall progress sits up here. Tap Details anytime for days finished, quizzes, and streak.',
    target: '[data-tutorial="progress"]',
    position: 'bottom',
  },
  {
    id: 'use-tabs',
    title: '3 · Study with tabs',
    content:
      'Inside each day: Learn, Practice, Quiz, Debug, Real World, Notes, Reflection. That’s the core loop buyers will use every session.',
    target: '[data-tutorial="tabs"]',
    position: 'bottom',
  },
  {
    id: 'mark-complete',
    title: '4 · Mark a day complete',
    content:
      'When you’re done with the day’s material, hit Mark complete so progress updates.',
    target: '[data-tutorial="mark-complete"]',
    position: 'bottom',
  },
  {
    id: 'search',
    title: '5 · Search topics',
    content:
      'Jump to any concept or day from the search box — useful when revisiting Fiber, keys, effects, and more.',
    target: '[data-tutorial="search"]',
    position: 'bottom',
  },
  {
    id: 'focus',
    title: '6 · Focus mode',
    content:
      'Focus hides chrome so you can practice distraction-free. Exit anytime with the same button.',
    target: '[data-tutorial="focus"]',
    position: 'bottom',
  },
  {
    id: 'tools-community',
    title: '7 · Tools & Community',
    content:
      'Tools = flashcards, snippets, concept map, interview prep, code review. Community = shared notes from contributors.',
    target: '[data-tutorial="tools-community"]',
    position: 'right',
  },
  {
    id: 'help-footer',
    title: '8 · Analytics, Settings, Keys',
    content:
      'Analytics shows usage stats. Settings has theme + Replay tour. Keys lists keyboard shortcuts. You’re set — start Day 01.',
    target: '[data-tutorial="help-links"]',
    position: 'right',
  },
]

export default GuidedTutorial
