import { useState, type JSX } from 'react'
import { Z_INDEX } from '../constants'
import SlideUp from './animations/SlideUp'

interface FloatingActionsProps {
    onSearch?: () => void
    onProgress?: () => void
    onSettings?: () => void
    onAnalytics?: () => void
    onTools?: () => void
}

function FloatingActions({ onSearch, onProgress, onSettings, onAnalytics, onTools }: FloatingActionsProps): JSX.Element {
    // onTools is used in the button onClick handler below
    const [isOpen, setIsOpen] = useState<boolean>(false)

    const containerStyle: React.CSSProperties = {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: Z_INDEX.FLOATING_ACTIONS
    }

    const buttonStyle: React.CSSProperties = {
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        border: 'none',
        background: 'var(--button-primary)',
        color: 'var(--button-text)',
        fontSize: '28px',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '300',
        position: 'relative' as const
    }

    const actionButtonStyle = (index: number, isVisible: boolean): React.CSSProperties => {
        const spacing = 68 // Space between buttons
        const buttonHeight = 56 // Main button height
        const bottomOffset = buttonHeight + (index + 1) * spacing

        return {
            position: 'absolute' as const,
            bottom: `${bottomOffset}px`,
            right: '0',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(10px)',
            pointerEvents: isVisible ? 'auto' : 'none',
            boxShadow: isVisible ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1001 - index // Ensure proper stacking
        }
    }

    return (
        <div style={containerStyle}>
            <div style={{ position: 'relative' }}>
                {isOpen && (
                    <>
                        <SlideUp delay={0.1}>
                            <button
                                onClick={() => {
                                    onSearch?.()
                                    setIsOpen(false)
                                }}
                                style={actionButtonStyle(0, isOpen)}
                                title="Search"
                                onMouseEnter={(e) => {
                                    if (isOpen) {
                                        e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)'
                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (isOpen) {
                                        e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                                    }
                                }}
                            >
                                🔍
                            </button>
                        </SlideUp>
                        <SlideUp delay={0.15}>
                            <button
                                onClick={() => {
                                    onProgress?.()
                                    setIsOpen(false)
                                }}
                                style={actionButtonStyle(1, isOpen)}
                                title="Progress"
                                onMouseEnter={(e) => {
                                    if (isOpen) {
                                        e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)'
                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (isOpen) {
                                        e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                                    }
                                }}
                            >
                                📊
                            </button>
                        </SlideUp>
                        <SlideUp delay={0.2}>
                            <button
                                onClick={() => {
                                    onAnalytics?.()
                                    setIsOpen(false)
                                }}
                                style={actionButtonStyle(2, isOpen)}
                                title="Analytics"
                                onMouseEnter={(e) => {
                                    if (isOpen) {
                                        e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)'
                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (isOpen) {
                                        e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                                    }
                                }}
                            >
                                📈
                            </button>
                        </SlideUp>
                        <SlideUp delay={0.25}>
                            <button
                                onClick={() => {
                                    onTools?.()
                                    setIsOpen(false)
                                }}
                                style={actionButtonStyle(3, isOpen)}
                                title="Learning Tools"
                                onMouseEnter={(e) => {
                                    if (isOpen) {
                                        e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)'
                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (isOpen) {
                                        e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                                    }
                                }}
                            >
                                🛠️
                            </button>
                        </SlideUp>
                        <SlideUp delay={0.3}>
                            <button
                                onClick={() => {
                                    onSettings?.()
                                    setIsOpen(false)
                                }}
                                style={actionButtonStyle(4, isOpen)}
                                title="Settings"
                                onMouseEnter={(e) => {
                                    if (isOpen) {
                                        e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)'
                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (isOpen) {
                                        e.currentTarget.style.transform = 'scale(1) translateY(0)'
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                                    }
                                }}
                            >
                                ⚙️
                            </button>
                        </SlideUp>
                    </>
                )}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = isOpen ? 'rotate(45deg) scale(1.1)' : 'rotate(0deg) scale(1.1)'
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = isOpen ? 'rotate(45deg) scale(1)' : 'rotate(0deg) scale(1)'
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'
                    }}
                    style={{
                        ...buttonStyle,
                        transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)'
                    }}
                    title={isOpen ? 'Close' : 'Menu'}
                >
                    {isOpen ? '✕' : '+'}
                </button>
            </div>
        </div>
    )
}

export default FloatingActions
