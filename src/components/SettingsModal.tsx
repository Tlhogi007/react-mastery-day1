import { useState, useEffect, useRef, type JSX } from 'react'
import { settingsStorage } from '../services/settingsStorage'
import { Z_INDEX } from '../constants'

interface SettingsModalProps {
    isOpen: boolean
    onClose: () => void
    onReplayTour?: () => void
}

function SettingsModal({ isOpen, onClose, onReplayTour }: SettingsModalProps): JSX.Element {
    const modalRef = useRef<HTMLDivElement>(null)
    const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(() => {
        // Load theme from localStorage on mount
        return settingsStorage.getTheme()
    })

    useEffect(() => {
        if (!isOpen) return

        const handleEscape = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        // Focus trap: focus the modal when it opens
        if (modalRef.current) {
            modalRef.current.focus()
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    useEffect(() => {
        // Save theme preference to localStorage
        settingsStorage.setTheme(theme)

        // Apply theme preference
        const root = document.documentElement
        if (theme === 'light') {
            root.style.colorScheme = 'light'
        } else if (theme === 'dark') {
            root.style.colorScheme = 'dark'
        } else {
            root.style.colorScheme = 'light dark'
        }
    }, [theme])

    if (!isOpen) return <></>

    const overlayStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: Z_INDEX.MODAL_OVERLAY,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
    }

    const modalStyle: React.CSSProperties = {
        background: 'var(--bg-card)',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        border: '1px solid var(--border-color)'
    }

    const sectionStyle: React.CSSProperties = {
        marginBottom: '24px'
    }

    const optionStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px',
        background: 'var(--bg-section)',
        borderRadius: '8px',
        marginBottom: '8px',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    }

    return (
        <div
            style={overlayStyle}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose()
                }
            }}
        >
            <div
                ref={modalRef}
                style={modalStyle}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="settings-modal-title"
                tabIndex={-1}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 id="settings-modal-title" style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>⚙️ Settings</h2>
                    <button
                        onClick={onClose}
                        aria-label="Close settings modal"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            padding: '4px 8px',
                            borderRadius: '4px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-section)'
                            e.currentTarget.style.color = 'var(--text-primary)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = 'var(--text-secondary)'
                        }}
                    >
                        ×
                    </button>
                </div>

                <div style={sectionStyle}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: '600' }}>Theme</h3>
                    <div
                        role="button"
                        tabIndex={0}
                        aria-label="Select auto theme (follows system preference)"
                        aria-pressed={theme === 'auto'}
                        style={{
                            ...optionStyle,
                            background: theme === 'auto' ? 'var(--bg-info)' : 'var(--bg-section)',
                            color: theme === 'auto' ? 'var(--text-on-info)' : 'var(--text-primary)'
                        }}
                        onClick={() => setTheme('auto')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                setTheme('auto')
                            }
                        }}
                        onMouseEnter={(e) => {
                            if (theme !== 'auto') {
                                e.currentTarget.style.background = 'var(--bg-tertiary)'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (theme !== 'auto') {
                                e.currentTarget.style.background = 'var(--bg-section)'
                            }
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: '500' }}>Auto (System Preference)</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                Follows your system theme
                            </div>
                        </div>
                        {theme === 'auto' && <span>✓</span>}
                    </div>
                    <div
                        role="button"
                        tabIndex={0}
                        aria-label="Select light theme"
                        aria-pressed={theme === 'light'}
                        style={{
                            ...optionStyle,
                            background: theme === 'light' ? 'var(--bg-info)' : 'var(--bg-section)',
                            color: theme === 'light' ? 'var(--text-on-info)' : 'var(--text-primary)'
                        }}
                        onClick={() => setTheme('light')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                setTheme('light')
                            }
                        }}
                        onMouseEnter={(e) => {
                            if (theme !== 'light') {
                                e.currentTarget.style.background = 'var(--bg-tertiary)'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (theme !== 'light') {
                                e.currentTarget.style.background = 'var(--bg-section)'
                            }
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: '500' }}>Light Mode</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                Always use light theme
                            </div>
                        </div>
                        {theme === 'light' && <span>✓</span>}
                    </div>
                    <div
                        role="button"
                        tabIndex={0}
                        aria-label="Select dark theme"
                        aria-pressed={theme === 'dark'}
                        style={{
                            ...optionStyle,
                            background: theme === 'dark' ? 'var(--bg-info)' : 'var(--bg-section)',
                            color: theme === 'dark' ? 'var(--text-on-info)' : 'var(--text-primary)'
                        }}
                        onClick={() => setTheme('dark')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                setTheme('dark')
                            }
                        }}
                        onMouseEnter={(e) => {
                            if (theme !== 'dark') {
                                e.currentTarget.style.background = 'var(--bg-tertiary)'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (theme !== 'dark') {
                                e.currentTarget.style.background = 'var(--bg-section)'
                            }
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: '500' }}>Dark Mode</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                Always use dark theme
                            </div>
                        </div>
                        {theme === 'dark' && <span>✓</span>}
                    </div>
                </div>

                {onReplayTour && (
                    <div style={sectionStyle}>
                        <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: '600' }}>Help</h3>
                        <button
                            type="button"
                            onClick={() => {
                                onReplayTour()
                                onClose()
                            }}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                background: 'var(--bg-section)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'left',
                            }}
                        >
                            Replay tour
                            <div style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginTop: 4 }}>
                                Full product walkthrough — days, progress, tabs, search, focus, tools, settings
                            </div>
                        </button>
                    </div>
                )}

                <div style={sectionStyle}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: '600' }}>About</h3>
                    <div style={{
                        padding: '16px',
                        background: 'var(--bg-section)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.6'
                    }}>
                        <p style={{ margin: '0 0 8px' }}>
                            <strong>30-Day Senior React Mastery</strong> is a comprehensive learning platform designed to help you master React internals like a systems engineer.
                        </p>
                        <p style={{ margin: 0 }}>
                            This course covers React fundamentals, performance optimization, architecture patterns, and interview preparation.
                        </p>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: 'var(--button-primary)',
                        color: 'var(--button-text)',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--button-primary-hover)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--button-primary)'
                    }}
                >
                    Close
                </button>
            </div>
        </div>
    )
}

export default SettingsModal
