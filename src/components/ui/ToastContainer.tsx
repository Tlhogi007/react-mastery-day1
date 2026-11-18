/**
 * Toast Container Component
 * Manages multiple toast notifications
 */

import { useState, useCallback, useEffect, type JSX } from 'react'
import ToastComponent, { type Toast, type ToastType } from './Toast'

interface ToastContainerProps {
  children?: React.ReactNode
}

let toastIdCounter = 0
let toastHandlers: {
  show: (message: string, type?: ToastType, duration?: number) => void
  hide: (id: string) => void
} | null = null

export const toast = {
  show: (message: string, type: ToastType = 'info', duration?: number): void => {
    toastHandlers?.show(message, type, duration)
  },
  success: (message: string, duration?: number): void => {
    toast.show(message, 'success', duration)
  },
  error: (message: string, duration?: number): void => {
    toast.show(message, 'error', duration)
  },
  warning: (message: string, duration?: number): void => {
    toast.show(message, 'warning', duration)
  },
  info: (message: string, duration?: number): void => {
    toast.show(message, 'info', duration)
  }
}

function ToastContainer({ children }: ToastContainerProps): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info', duration?: number): void => {
    const id = `toast-${++toastIdCounter}`
    const newToast: Toast = {
      id,
      message,
      type,
      duration
    }
    setToasts(prev => [...prev, newToast])
  }, [])

  const hideToast = useCallback((id: string): void => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  // Register handlers
  useEffect(() => {
    toastHandlers = { show: showToast, hide: hideToast }
    return () => {
      toastHandlers = null
    }
  }, [showToast, hideToast])

  return (
    <>
      {children}
      {toasts.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            pointerEvents: 'none'
          }}
        >
          {toasts.map(toast => (
            <div key={toast.id} style={{ pointerEvents: 'auto' }}>
              <ToastComponent toast={toast} onClose={() => hideToast(toast.id)} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default ToastContainer
