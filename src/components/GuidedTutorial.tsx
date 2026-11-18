/**
 * Guided Tutorial / Walkthrough Component
 * Step-by-step interactive tutorials with UI element highlighting
 */

import { useState, useEffect, useRef, type JSX } from 'react'

export interface TutorialStep {
    id: string
    title: string
    content: string
    target?: string // CSS selector for element to highlight
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
    action?: {
        type: 'click' | 'type' | 'scroll'
        selector?: string
        value?: string
    }
}

interface GuidedTutorialProps {
    tutorialId?: string
    title?: string
    steps: TutorialStep[]
    onComplete?: () => void
    onSkip?: () => void
}

function GuidedTutorial({ steps, onComplete, onSkip }: GuidedTutorialProps): JSX.Element {
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
    const [isActive, setIsActive] = useState<boolean>(true)
    const [highlightPosition, setHighlightPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
    const overlayRef = useRef<HTMLDivElement>(null)

    const currentStep = steps[currentStepIndex]

    useEffect(() => {
        if (!isActive || !currentStep?.target) return

        const updateHighlight = (): void => {
            const element = document.querySelector(currentStep.target!)
            if (element) {
                const rect = element.getBoundingClientRect()
                setHighlightPosition({
                    top: rect.top + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                    height: rect.height
                })
            } else {
                setHighlightPosition(null)
            }
        }

        updateHighlight()
        window.addEventListener('resize', updateHighlight)
        window.addEventListener('scroll', updateHighlight)

        return () => {
            window.removeEventListener('resize', updateHighlight)
            window.removeEventListener('scroll', updateHighlight)
        }
    }, [currentStep, isActive])

    const handleNext = (): void => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1)
        } else {
            handleComplete()
        }
    }

    const handlePrevious = (): void => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1)
        }
    }

    const handleComplete = (): void => {
        setIsActive(false)
        setHighlightPosition(null)
        onComplete?.()
    }

    const handleSkip = (): void => {
        setIsActive(false)
        setHighlightPosition(null)
        onSkip?.()
    }

    if (!isActive) return <></>

    const containerStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        pointerEvents: 'none'
    }

    const overlayStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        pointerEvents: 'auto'
    }

    const highlightStyle: React.CSSProperties = highlightPosition ? {
        position: 'absolute',
        top: `${highlightPosition.top}px`,
        left: `${highlightPosition.left}px`,
        width: `${highlightPosition.width}px`,
        height: `${highlightPosition.height}px`,
        border: '3px solid var(--button-primary)',
        borderRadius: '8px',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
        pointerEvents: 'none',
        zIndex: 10001,
        transition: 'all 0.3s ease'
    } : {}

    const tooltipStyle: React.CSSProperties = {
        position: 'absolute',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        maxWidth: '400px',
        zIndex: 10002,
        pointerEvents: 'auto',
        ...(currentStep.position === 'top' && highlightPosition ? {
            bottom: `${window.innerHeight - highlightPosition.top + 20}px`,
            left: `${highlightPosition.left}px`
        } : currentStep.position === 'bottom' && highlightPosition ? {
            top: `${highlightPosition.top + highlightPosition.height + 20}px`,
            left: `${highlightPosition.left}px`
        } : currentStep.position === 'left' && highlightPosition ? {
            top: `${highlightPosition.top}px`,
            right: `${window.innerWidth - highlightPosition.left + 20}px`
        } : currentStep.position === 'right' && highlightPosition ? {
            top: `${highlightPosition.top}px`,
            left: `${highlightPosition.left + highlightPosition.width + 20}px`
        } : {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
        })
    }

    return (
        <div ref={overlayRef} style={containerStyle}>
            <div style={overlayStyle} onClick={handleSkip} />
            {highlightPosition && <div style={highlightStyle} />}
            
            <div style={tooltipStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{currentStep.title}</h3>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Step {currentStepIndex + 1} of {steps.length}
                        </div>
                    </div>
                    <button
                        onClick={handleSkip}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '20px',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            padding: '0',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        ×
                    </button>
                </div>
                
                <p style={{ margin: '0 0 16px 0', lineHeight: '1.6' }}>{currentStep.content}</p>

                {currentStep.action && (
                    <div style={{
                        padding: '12px',
                        background: 'var(--bg-info)',
                        color: 'var(--text-on-info)',
                        borderRadius: '6px',
                        marginBottom: '16px',
                        fontSize: '14px'
                    }}>
                        <strong>Action:</strong> {currentStep.action.type}
                        {currentStep.action.selector && ` on ${currentStep.action.selector}`}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <button
                        onClick={handlePrevious}
                        disabled={currentStepIndex === 0}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: currentStepIndex === 0 ? 'var(--bg-section)' : 'var(--button-primary)',
                            color: currentStepIndex === 0 ? 'var(--text-secondary)' : 'var(--button-text)',
                            cursor: currentStepIndex === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        ← Previous
                    </button>
                    <button
                        onClick={handleNext}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'var(--button-primary)',
                            color: 'var(--button-text)',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}
                    >
                        {currentStepIndex === steps.length - 1 ? 'Complete' : 'Next →'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// Predefined tutorials
export const onboardingTutorial: TutorialStep[] = [
    {
        id: 'welcome',
        title: 'Welcome to React Mastery!',
        content: 'This interactive platform helps you master React internals through hands-on exercises, quizzes, and challenges.',
        position: 'center'
    },
    {
        id: 'sidebar',
        title: 'Navigation Sidebar',
        content: 'Use the sidebar to navigate between days and exercises. Each day builds on previous concepts.',
        target: '[data-tutorial="sidebar"]',
        position: 'right'
    },
    {
        id: 'tabs',
        title: 'Exercise Tabs',
        content: 'Each day has multiple tabs: Learn, Practice, Quiz, Debug, and Real World. Explore them all!',
        target: '[data-tutorial="tabs"]',
        position: 'bottom'
    },
    {
        id: 'quiz',
        title: 'Take Quizzes',
        content: 'Test your understanding with quizzes. You can generate AI questions for more practice!',
        target: '[data-tutorial="quiz"]',
        position: 'top'
    }
]

export default GuidedTutorial
