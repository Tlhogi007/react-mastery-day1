import { useState, useEffect, useRef, type JSX, type ChangeEvent } from 'react'
import { settingsStorage } from '../services/settingsStorage'
import { byoAiKeys, type ByoAiKeys } from '../services/byoAiKeys'
import {
    downloadLearnerDataBackup,
    importLearnerData,
    readBackupFile,
    resetLearnerData,
    summarizeImport,
} from '../services/learnerData'
import { Z_INDEX } from '../constants'

interface SettingsModalProps {
    isOpen: boolean
    onClose: () => void
    onReplayTour?: () => void
}

function SettingsModal({ isOpen, onClose, onReplayTour }: SettingsModalProps): JSX.Element {
    const modalRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [dataStatus, setDataStatus] = useState<string | null>(null)
    const [byoStatus, setByoStatus] = useState<string | null>(null)
    const [byo, setByo] = useState<ByoAiKeys>(() => byoAiKeys.get())
    const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(() => {
        // Load theme from localStorage on mount
        return settingsStorage.getTheme()
    })

    const handleSaveByo = (): void => {
        byoAiKeys.set(byo)
        setByo(byoAiKeys.get())
        setByoStatus(
            byoAiKeys.hasAny()
                ? 'Saved — AI quizzes will use your keys (hosted quota skipped).'
                : 'Cleared — AI quizzes will use the shared free providers when available.',
        )
    }

    const handleClearByo = (): void => {
        byoAiKeys.clear()
        setByo({})
        setByoStatus('Your API keys were removed from this browser.')
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

    const handleExportData = (): void => {
        downloadLearnerDataBackup()
        setDataStatus('Backup downloaded')
    }

    const handleImportClick = (): void => {
        fileInputRef.current?.click()
    }

    const handleImportFile = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return

        try {
            const backup = await readBackupFile(file)
            const result = importLearnerData(backup)
            const summary = summarizeImport(result)
            const shouldReload = result.restoredKeys.length > 0
            setDataStatus(shouldReload ? `${summary}. Reloading…` : summary)
            if (shouldReload) {
                window.setTimeout(() => window.location.reload(), 1200)
            }
        } catch (err) {
            setDataStatus(err instanceof Error ? err.message : 'Import failed')
        }
    }

    const handleResetData = (): void => {
        const ok = window.confirm(
            'Reset all learner data on this device?\n\nThis clears progress, notes, reflections, flashcards, snippets, and local analytics. This cannot be undone unless you exported a backup first.'
        )
        if (!ok) return
        resetLearnerData()
        setDataStatus('All data cleared — reloading…')
        window.setTimeout(() => window.location.reload(), 600)
    }

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
                        Quizzes use local questions by default. AI is opt-in. Paste your own free keys to avoid the shared
                        host quota — keys stay in this browser only and are never uploaded to our server.
                    </p>
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
                                placeholder="sk-… (optional)"
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
                        Clear AI keys
                    </button>
                    {byoStatus && (
                        <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                            {byoStatus}
                        </p>
                    )}
                </div>

                <div style={sectionStyle}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: '600' }}>Your data</h3>
                    <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Progress, notes, and tools data stay in this browser. Export a backup before switching devices or clearing site data.
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/json,.json"
                        style={{ display: 'none' }}
                        onChange={handleImportFile}
                    />
                    <button type="button" onClick={handleExportData} style={buttonBaseStyle}>
                        Export backup
                        <div style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginTop: 4 }}>
                            Download all learner data as JSON
                        </div>
                    </button>
                    <button type="button" onClick={handleImportClick} style={buttonBaseStyle}>
                        Import backup
                        <div style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginTop: 4 }}>
                            Restore from a previous export (reloads the app)
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={handleResetData}
                        style={{
                            ...buttonBaseStyle,
                            marginBottom: 0,
                            borderColor: 'var(--bg-error)',
                            color: 'var(--text-primary)',
                        }}
                    >
                        Reset all data
                        <div style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginTop: 4 }}>
                            Clears progress, notes, reflections, and local analytics on this device
                        </div>
                    </button>
                    {dataStatus && (
                        <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                            {dataStatus}
                        </p>
                    )}
                </div>

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
                            <strong style={{ color: 'var(--text-primary)' }}>Privacy.</strong> Learner progress, notes, reflections, tool data, and optional BYO AI keys stay in your browser (local storage) unless you export a backup. Usage analytics may be sent to Google Analytics when configured. Crash/error reports may be sent to Sentry when configured — no account signup required.
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
