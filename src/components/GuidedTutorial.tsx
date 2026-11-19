/**
 * Guided Tutorial — short first-run coach
 */

import { useState, useEffect, useRef, type CSSProperties, type JSX } from 'react'

export interface TutorialStep {
  id: string
  title: string
  content: string
  /** Mobile-specific copy when layout differs (e.g. Menu drawer vs sidebar). */
  mobileContent?: string
  target?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  /** Open the mobile Menu drawer before highlighting this step. */
  needsSidebar?: boolean
}

interface GuidedTutorialProps {
  tutorialId?: string
  title?: string
  steps: TutorialStep[]
  isMobile?: boolean
  /** Ensure target is on-screen (e.g. open mobile drawer) before measuring. */
  onPrepareStep?: (step: TutorialStep) => void | Promise<void>
  onComplete?: () => void
  onSkip?: () => void
}

function clampTooltip(
  preferred: CSSProperties,
  tooltipWidth: number,
  tooltipHeight: number,
): CSSProperties {
  const pad = 12
  const vw = window.innerWidth
  const vh = window.innerHeight
  let top = typeof preferred.top === 'number' ? preferred.top : pad
  let left = typeof preferred.left === 'number' ? preferred.left : pad
  top = Math.max(pad, Math.min(top, vh - tooltipHeight - pad))
  left = Math.max(pad, Math.min(left, vw - tooltipWidth - pad))
  return { top, left, transform: 'none' }
}

function GuidedTutorial({
  steps,
  isMobile = false,
  onPrepareStep,
  onComplete,
  onSkip,
}: GuidedTutorialProps): JSX.Element {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [highlightPosition, setHighlightPosition] = useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const currentStep = steps[currentStepIndex]
  const stepBody =
    isMobile && currentStep.mobileContent ? currentStep.mobileContent : currentStep.content

  useEffect(() => {
    if (!isActive) return

    let cancelled = false
    const timers: number[] = []

    const isUsableRect = (rect: DOMRect): boolean => {
      if (rect.width < 8 || rect.height < 8) return false
      if (rect.bottom < 0 || rect.top > window.innerHeight) return false
      if (rect.right < 0 || rect.left > window.innerWidth) return false
      return true
    }

    const applyHighlight = (element: Element): void => {
      const rect = element.getBoundingClientRect()
      if (!isUsableRect(rect)) {
        setHighlightPosition(null)
        return
      }
      setHighlightPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      })
    }

    const scrollTargetIntoView = (element: Element): void => {
      // Nested drawers (Menu) won't move via window.scrollTo — walk scroll parents.
      let parent: HTMLElement | null = element.parentElement
      while (parent) {
        const { overflowY, overflow } = getComputedStyle(parent)
        const scrollable =
          overflowY === 'auto' ||
          overflowY === 'scroll' ||
          overflow === 'auto' ||
          overflow === 'scroll'
        if (scrollable && parent.scrollHeight > parent.clientHeight + 1) {
          const parentRect = parent.getBoundingClientRect()
          const elRect = element.getBoundingClientRect()
          const delta =
            elRect.top +
            elRect.height / 2 -
            (parentRect.top + parent.clientHeight / 2)
          parent.scrollTop += delta
        }
        parent = parent.parentElement
      }

      // Instant so measure can run immediately (smooth often finishes after highlight)
      element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' })

      const rect = element.getBoundingClientRect()
      const pad = isMobile ? 96 : 48
      if (rect.top < pad || rect.bottom > window.innerHeight - pad) {
        const y = window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2
        window.scrollTo({ top: Math.max(0, y), behavior: 'auto' })
      }
    }

    const measureAfterScroll = (element: Element): void => {
      applyHighlight(element)
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) applyHighlight(element)
        }, 120),
      )
      timers.push(
        window.setTimeout(() => {
          if (cancelled) return
          // Footer targets can still sit under the fold after drawer open — nudge again
          scrollTargetIntoView(element)
          applyHighlight(element)
        }, 320),
      )
    }

    const run = async (): Promise<void> => {
      await onPrepareStep?.(currentStep)
      if (cancelled) return

      const delay = isMobile && currentStep.needsSidebar ? 340 : 60
      timers.push(
        window.setTimeout(() => {
          if (cancelled) return
          if (!currentStep?.target) {
            setHighlightPosition(null)
            return
          }
          const element = document.querySelector(currentStep.target)
          if (!element) {
            setHighlightPosition(null)
            return
          }
          // Last step lives in the Menu footer — pin drawer scroll to the bottom first
          if (currentStep.id === 'help-footer') {
            const sidebar = document.querySelector('[data-tutorial="sidebar"]')
            if (sidebar instanceof HTMLElement) {
              sidebar.scrollTop = sidebar.scrollHeight
            }
          }
          scrollTargetIntoView(element)
          measureAfterScroll(element)
        }, delay),
      )
    }

    void run()

    const onReposition = (): void => {
      if (!currentStep?.target) return
      const element = document.querySelector(currentStep.target)
      if (element) applyHighlight(element)
    }
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)

    return () => {
      cancelled = true
      timers.forEach((id) => window.clearTimeout(id))
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [currentStep, isActive, currentStepIndex, isMobile, onPrepareStep])

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

  const tooltipWidth = Math.min(360, window.innerWidth - 24)
  const tooltipHeight = tooltipRef.current?.offsetHeight ?? 200

  const tooltipPosition = ((): CSSProperties => {
    if (!highlightPosition || currentStep.position === 'center' || !currentStep.target) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    }

    const gap = 14
    const vh = window.innerHeight
    const highlightBottom = highlightPosition.top + highlightPosition.height
    const spaceBelow = vh - highlightBottom - gap
    const spaceAbove = highlightPosition.top - gap

    // On mobile, left/right don't fit — pick above/below without covering the target
    let pos = currentStep.position
    if (isMobile && (pos === 'left' || pos === 'right')) {
      pos =
        spaceAbove >= tooltipHeight || spaceAbove > spaceBelow ? 'top' : 'bottom'
    } else if (pos === 'bottom' && spaceBelow < tooltipHeight && spaceAbove > spaceBelow) {
      pos = 'top'
    } else if (pos === 'top' && spaceAbove < tooltipHeight && spaceBelow > spaceAbove) {
      pos = 'bottom'
    }

    let preferred: CSSProperties
    if (pos === 'right') {
      preferred = {
        top: Math.max(16, highlightPosition.top),
        left: highlightPosition.left + highlightPosition.width + gap,
      }
    } else if (pos === 'left') {
      preferred = {
        top: Math.max(16, highlightPosition.top),
        left: highlightPosition.left - tooltipWidth - gap,
      }
    } else if (pos === 'top') {
      preferred = {
        top: highlightPosition.top - gap - tooltipHeight,
        left: Math.max(12, highlightPosition.left),
      }
    } else {
      preferred = {
        top: highlightPosition.top + highlightPosition.height + gap,
        left: Math.max(12, highlightPosition.left),
      }
    }

    return clampTooltip(preferred, tooltipWidth, tooltipHeight)
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
        ref={tooltipRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        style={{
          position: 'absolute',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          padding: isMobile ? 16 : 20,
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
          maxWidth: 360,
          width: 'calc(100% - 24px)',
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
                fontSize: isMobile ? 16 : 17,
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

        <p
          style={{
            margin: '0 0 16px',
            lineHeight: 1.55,
            color: 'var(--text-secondary)',
            fontSize: 14,
          }}
        >
          {stepBody}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
            style={{
              padding: '10px 14px',
              minHeight: 44,
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
              padding: '10px 14px',
              minHeight: 44,
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
    mobileContent:
      'Days live in the Menu (top left). Open it, then start at 01 and move in order — each day builds on the last.',
    target: '[data-tutorial="sidebar-days"]',
    position: 'right',
    needsSidebar: true,
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
    mobileContent:
      'Open Menu → Tools & Community. Tools = flashcards, snippets, concept map, interview prep. Community = shared notes.',
    target: '[data-tutorial="tools-community"]',
    position: 'right',
    needsSidebar: true,
  },
  {
    id: 'help-footer',
    title: '8 · Analytics, Settings, Keys',
    content:
      'Analytics shows usage stats. Settings has theme + Replay tour. Keys lists keyboard shortcuts. You’re set — start Day 01.',
    mobileContent:
      'In the Menu footer: Analytics, Settings (theme + Replay tour), and Keys. You’re set — start Day 01.',
    target: '[data-tutorial="help-links"]',
    position: 'right',
    needsSidebar: true,
  },
]

export default GuidedTutorial
