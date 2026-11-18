/**
 * Keyboard Shortcuts Help Modal
 */

import { type JSX, useEffect, useRef } from 'react'

interface KeyboardShortcutsHelpProps {
    isOpen: boolean
    onClose: () => void
}

function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps): JSX.Element {
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isOpen) return

        const handleEscape = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        if (modalRef.current) {
            modalRef.current.focus()
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    if (!isOpen) return <></>

    const containerStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
    }

    const modalStyle: React.CSSProperties = {
        background: 'var(--bg-card)',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '2px solid var(--border-primary)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
    }

    const shortcutRowStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px',
        marginBottom: '8px',
        background: 'var(--bg-section)',
        borderRadius: '6px',
        border: '1px solid var(--border-color)'
    }

    const keyStyle: React.CSSProperties = {
        padding: '4px 8px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '12px',
        fontWeight: '600',
        minWidth: '30px',
        textAlign: 'center'
    }

    return (
        <div style={containerStyle} onClick={onClose}>
            <div
                ref={modalRef}
                style={modalStyle}
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>⌨️ Keyboard Shortcuts</h2>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 12px',
                            background: 'var(--bg-section)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px' }}>Navigation</h3>
                    <div style={shortcutRowStyle}>
                        <span><strong>j</strong> or <strong>→</strong></span>
                        <span style={keyStyle}>j / →</span>
                        <span>Next exercise</span>
                    </div>
                    <div style={shortcutRowStyle}>
                        <span><strong>k</strong> or <strong>←</strong></span>
                        <span style={keyStyle}>k / ←</span>
                        <span>Previous exercise</span>
                    </div>
                    <div style={shortcutRowStyle}>
                        <span><strong>r</strong></span>
                        <span style={keyStyle}>r</span>
                        <span>Random exercise</span>
                    </div>
                    <div style={shortcutRowStyle}>
                        <span><strong>c</strong></span>
                        <span style={keyStyle}>c</span>
                        <span>Continue learning</span>
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px' }}>Quiz</h3>
                    <div style={shortcutRowStyle}>
                        <span><strong>1-4</strong></span>
                        <span style={keyStyle}>1-4</span>
                        <span>Select answer option</span>
                    </div>
                    <div style={shortcutRowStyle}>
                        <span><strong>Space</strong> or <strong>Enter</strong></span>
                        <span style={keyStyle}>Space / Enter</span>
                        <span>Next question</span>
                    </div>
                    <div style={shortcutRowStyle}>
                        <span><strong>s</strong></span>
                        <span style={keyStyle}>s</span>
                        <span>Skip question</span>
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px' }}>General</h3>
                    <div style={shortcutRowStyle}>
                        <span><strong>?</strong></span>
                        <span style={keyStyle}>?</span>
                        <span>Show this help</span>
                    </div>
                    <div style={shortcutRowStyle}>
                        <span><strong>Esc</strong></span>
                        <span style={keyStyle}>Esc</span>
                        <span>Close modals</span>
                    </div>
                </div>

                <div style={{
                    padding: '12px',
                    background: 'var(--bg-info)',
                    color: 'var(--text-on-info)',
                    borderRadius: '6px',
                    fontSize: '13px'
                }}>
                    💡 <strong>Tip:</strong> Shortcuts are disabled when typing in input fields
                </div>
            </div>
        </div>
    )
}

export default KeyboardShortcutsHelp
