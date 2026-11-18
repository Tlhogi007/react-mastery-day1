/**
 * Toast Notification Component
 * Single Responsibility: Display temporary notifications
 */

import { useEffect, type JSX } from 'react'
import SlideUp from '../animations/SlideUp'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
    id: string
    message: string
    type: ToastType
    duration?: number
}

interface ToastProps {
    toast: Toast
    onClose: () => void
}

function ToastComponent({ toast, onClose }: ToastProps): JSX.Element {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose()
        }, toast.duration || 3000)

        return () => clearTimeout(timer)
    }, [toast.duration, onClose])

    const typeStyles: Record<ToastType, React.CSSProperties> = {
        success: {
            background: 'var(--bg-success)',
            borderColor: 'var(--bg-success)',
            color: 'var(--text-on-success)'
        },
        error: {
            background: 'var(--bg-error)',
            borderColor: 'var(--bg-error)',
            color: 'var(--text-on-error)'
        },
        warning: {
            background: 'var(--bg-warning)',
            borderColor: 'var(--border-warning)',
            color: 'var(--text-on-warning)'
        },
        info: {
            background: 'var(--bg-info)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-on-info)'
        }
    }

    const icons: Record<ToastType, string> = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    }

    return (
        <SlideUp duration={0.3}>
            <div
                style={{
                    ...typeStyles[toast.type],
                    border: '1px solid',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    minWidth: '300px',
                    maxWidth: '500px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    cursor: 'pointer'
                }}
                onClick={onClose}
                role="alert"
                aria-live="polite"
            >
                <span style={{ fontSize: '20px' }}>{icons[toast.type]}</span>
                <span style={{ flex: 1, fontSize: '14px' }}>{toast.message}</span>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onClose()
                    }}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '0',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    aria-label="Close notification"
                >
                    ×
                </button>
            </div>
        </SlideUp>
    )
}

export default ToastComponent
