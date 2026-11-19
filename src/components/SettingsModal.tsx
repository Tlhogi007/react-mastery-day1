import { useState, useEffect, useRef, type JSX } from 'react'
import { settingsStorage } from '../services/settingsStorage'
import {
  applyAppTheme,
  setAppTheme,
  THEME_CHANGE_EVENT,
  type AppTheme,
} from '../services/theme'
import { byoAiKeys, type ByoAiKeys } from '../services/byoAiKeys'
import { tracking } from '../lib/googleAnalytics'
import { Z_INDEX } from '../constants'

interface SettingsModalProps {
    isOpen: boolean
    onClose: () => void
    onReplayTour?: () => void
    onOpenAccountPage?: () => void
}

function SettingsModal({
    isOpen,
    onClose,
    onReplayTour,
    onOpenAccountPage,
}: SettingsModalProps): JSX.Element {
    const modalRef = useRef<HTMLDivElement>(null)
    const [byoStatus, setByoStatus] = useState<string | null>(null)
    const [byo, setByo] = useState<ByoAiKeys>(() => byoAiKeys.get())
    const [theme, setTheme] = useState<AppTheme>(() => settingsStorage.getTheme())

    const selectTheme = (next: AppTheme): void => {
        setAppTheme(next)
        tracking.themeChanged(next)
    }

    const handleSaveByo = (): void => {
        byoAiKeys.set(byo)
        setByo(byoAiKeys.get())
        setByoStatus(
            byoAiKeys.hasAny()
                ? 'Saved on this device only — AI will use your key (not React Mastery servers or shared quota).'
                : 'No keys saved — signed-in users can still use the shared free AI allowance.',
        )
    }

    const handleClearByo = (): void => {
        byoAiKeys.clear()
        setByo({})
        setByoStatus('Keys removed from this browser. They were never stored on our servers.')
    }

    const buttonBaseStyle: React.CSSProperties = {
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
        marginBottom: 8,
    }

    useEffect(() => {
        if (!isOpen) return

        const previouslyFocused = document.activeElement as HTMLElement | null
        const root = modalRef.current
        root?.focus()

        const focusables = (): HTMLElement[] => {
            if (!root) return []
            return Array.from(
                root.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
                ),
            ).filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true')
        }

        const handleKey = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') {
                onClose()
                return
            }
            if (e.key !== 'Tab') return
            const list = focusables()
            if (list.length === 0) return
            const first = list[0]
            const last = list[list.length - 1]
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault()
                last.focus()
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault()
                first.focus()
            }
        }

        document.addEventListener('keydown', handleKey)
        return () => {
            document.removeEventListener('keydown', handleKey)
            previouslyFocused?.focus?.()
        }
    }, [isOpen, onClose])

    useEffect(() => {
        if (isOpen) {
            setTheme(settingsStorage.getTheme())
        }
    }, [isOpen])

    useEffect(() => {
        applyAppTheme(theme)

        if (theme !== 'auto') return

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = (): void => applyAppTheme('auto')
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [theme])

    useEffect(() => {
        const sync = (event: Event): void => {
            const next = (event as CustomEvent<AppTheme>).detail
            if (next === 'light' || next === 'dark' || next === 'auto') {
                setTheme(next)
            }
        }
        window.addEventListener(THEME_CHANGE_EVENT, sync)
        return () => window.removeEventListener(THEME_CHANGE_EVENT, sync)
    }, [])

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
        padding: 'max(12px, env(safe-area-inset-top, 0px)) 12px max(12px, env(safe-area-inset-bottom, 0px))',
    }

    const modalStyle: React.CSSProperties = {
        background: 'var(--bg-card)',
        borderRadius: '16px',
        padding: 'clamp(20px, 4vw, 32px)',
        maxWidth: '500px',
        width: '100%',
        maxHeight: 'min(90dvh, 90vh)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        border: '1px solid var(--border-color)',
        marginBottom: 'max(0px, env(safe-area-inset-bottom, 0px))',
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
                className="settings-modal"
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
                        onClick={() => selectTheme('auto')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                selectTheme('auto')
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
                        onClick={() => selectTheme('light')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                selectTheme('light')
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
                        onClick={() => selectTheme('dark')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                selectTheme('dark')
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
                            style={buttonBaseStyle}
                        >
                            Replay tour
                            <div style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginTop: 4 }}>
                                Full product walkthrough — days, progress, tabs, search, focus, tools, settings
                            </div>
                        </button>
                    </div>
                )}

                <div style={sectionStyle}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: '600' }}>AI quiz keys (optional)</h3>
                    <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Quizzes use local questions by default. AI is opt-in. Signed-in users get a small shared free
                        allowance; paste your own key only if you want unlimited AI on your provider account.
                    </p>
                    <div
                        style={{
                            marginBottom: 14,
                            padding: '12px 14px',
                            borderRadius: 8,
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-section)',
                            fontSize: 13,
                            lineHeight: 1.5,
                            color: 'var(--text-secondary)',
                        }}
                    >
                        <strong style={{ color: 'var(--text-primary)' }}>Your keys stay on this device.</strong>
                        {' '}
                        Stored only in this browser. Never sent to React Mastery servers. Calls go straight to
                        Groq, Gemini, or Together. Same whether you are signed in or not. Clear anytime below.
                    </div>
                    {byoAiKeys.hasAny() && (
                        <p
                            style={{
                                margin: '0 0 12px',
                                padding: '8px 12px',
                                borderRadius: 8,
                                background: 'var(--bg-info)',
                                color: 'var(--text-primary)',
                                fontSize: 13,
                                fontWeight: 600,
                            }}
                        >
                            Using your key · not using shared quota
                            {byoAiKeys.activeProviders().length > 0 && (
                                <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                                    {' '}
                                    ({byoAiKeys.activeProviders().join(', ')})
                                </span>
                            )}
                        </p>
                    )}
                    {(
                        [
                            ['groq', 'Groq API key', 'https://console.groq.com'],
                            ['gemini', 'Gemini API key', 'https://aistudio.google.com/apikey'],
                            ['together', 'Together API key', 'https://api.together.xyz'],
                        ] as const
                    ).map(([field, label, href]) => (
                        <label key={field} style={{ display: 'block', marginBottom: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
                            <input
                                type="password"
                                autoComplete="off"
                                spellCheck={false}
                                placeholder="Paste key — stays in this browser only"
                                value={byo[field] || ''}
                                onChange={(e) => setByo((prev) => ({ ...prev, [field]: e.target.value }))}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    marginTop: 6,
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-section)',
                                    color: 'var(--text-primary)',
                                    fontSize: 13,
                                    boxSizing: 'border-box',
                                }}
                            />
                            <a
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: 12, color: 'var(--text-muted)' }}
                            >
                                Get a free key
                            </a>
                        </label>
                    ))}
                    <button type="button" onClick={handleSaveByo} style={buttonBaseStyle}>
                        Save AI keys
                    </button>
                    <button type="button" onClick={handleClearByo} style={{ ...buttonBaseStyle, marginBottom: 0 }}>
                        Clear AI keys from this browser
                    </button>
                    {byoStatus && (
                        <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                            {byoStatus}
                        </p>
                    )}
                </div>

                {onOpenAccountPage && (
                    <div style={sectionStyle}>
                        <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: '600' }}>
                            Account &amp; data
                        </h3>
                        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Export/import backups, reset this device, and admin AI usage live on a separate page.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                onOpenAccountPage()
                                onClose()
                            }}
                            style={{ ...buttonBaseStyle, marginBottom: 0 }}
                        >
                            Open account &amp; data
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
                        <p style={{ margin: '0 0 12px' }}>
                            This course covers React fundamentals, performance optimization, architecture patterns, and interview preparation.
                        </p>
                        <p style={{ margin: 0, paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Privacy.</strong> BYO AI keys stay in this browser only and are never uploaded. When signed in, progress, notes, reflections, flashcards, snippets, quiz resume, theme, tour/focus prefs, helpful votes, learning analytics, and last lab location sync to your Clerk account for cross-device restore. Usage analytics may also go to Google Analytics when configured; crash reports to Sentry when configured.
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
