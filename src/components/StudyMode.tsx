/**
 * Study Mode Component
 * Single Responsibility: Provide distraction-free study environment
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
    const [focusGoal, setFocusGoal] = useState<number>(25) // minutes

    useEffect(() => {
        if (!isActive || !isRunning) return

        const interval = setInterval(() => {
            setTimer(prev => {
                const newTime = prev + 1
                // Check if goal reached
                if (newTime >= focusGoal * 60) {
                    setIsRunning(false)
                    // Could trigger confetti here
                }
                return newTime
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

    return (
        <div style={{
            position: 'relative',
            minHeight: '100vh',
            background: 'var(--bg-primary)'
        }}>
            {/* Study Mode Header */}
            <div style={{
                position: 'sticky',
                top: 0,
                background: 'var(--bg-card)',
                borderBottom: '1px solid var(--border-color)',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 100,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                        padding: '6px 12px',
                        background: 'var(--bg-success)',
                        color: 'var(--text-on-success)',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}>
                        🎯 Study Mode
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            onClick={() => setIsRunning(!isRunning)}
                            style={{
                                padding: '6px 12px',
                                background: isRunning ? 'var(--bg-warning)' : 'var(--button-primary)',
                                color: 'var(--button-text)',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}
                        >
                            {isRunning ? '⏸️ Pause' : '▶️ Start'}
                        </button>
                        <div style={{
                            fontFamily: 'monospace',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: 'var(--text-primary)',
                            minWidth: '80px'
                        }}>
                            {formatTime(timer)}
                        </div>
                        <button
                            onClick={() => setTimer(0)}
                            style={{
                                padding: '6px 12px',
                                background: 'var(--bg-section)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            🔄 Reset
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                        Goal:
                        <input
                            type="number"
                            value={focusGoal}
                            onChange={(e) => setFocusGoal(Math.max(1, parseInt(e.target.value) || 25))}
                            min="1"
                            max="120"
                            style={{
                                width: '50px',
                                padding: '4px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                background: 'var(--bg-card)',
                                color: 'var(--text-primary)'
                            }}
                        />
                        min
                    </label>
                    <button
                        onClick={onToggle}
                        style={{
                            padding: '6px 12px',
                            background: 'var(--bg-warning)',
                            color: 'var(--text-on-warning)',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Exit Study Mode
                    </button>
                </div>
            </div>

            {/* Study Content - Full Screen */}
            <div style={{
                padding: '40px',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                {children}
            </div>

            {/* Progress Indicator */}
            {focusGoal > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 100
                }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Focus Progress
                    </div>
                    <div style={{
                        width: '200px',
                        height: '6px',
                        background: 'var(--bg-section)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${Math.min(100, (timer / (focusGoal * 60)) * 100)}%`,
                            height: '100%',
                            background: 'var(--bg-success)',
                            transition: 'width 0.3s',
                            borderRadius: '3px'
                        }} />
                    </div>
                </div>
            )}
        </div>
    )
}

export default StudyMode
