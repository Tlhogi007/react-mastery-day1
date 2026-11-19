import { type JSX } from 'react'
import { Z_INDEX } from '../constants'

interface AiQuotaModalProps {
  open: boolean
  message: string
  onClose: () => void
  onOpenSettings: () => void
  onSignIn?: () => void
  mode: 'auth' | 'quota'
}

export function AiQuotaModal({
  open,
  message,
  onClose,
  onOpenSettings,
  onSignIn,
  mode,
}: AiQuotaModalProps): JSX.Element {
  if (!open) return <></>

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: Z_INDEX.MODAL_OVERLAY,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 12,
          padding: 20,
          color: 'var(--text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>
          {mode === 'auth' ? 'Sign in for hosted AI' : 'Free AI limit reached'}
        </h3>
        <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {message}
        </p>
        {mode === 'quota' && (
          <ol style={{ margin: '0 0 16px', paddingLeft: 18, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <li>Add a Groq / Gemini / Together key in Settings (browser-only).</li>
            <li>Or wait until tomorrow UTC for free hosted AI to reset.</li>
            <li>Local quiz questions always stay free — no key needed.</li>
          </ol>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mode === 'auth' && onSignIn && (
            <button
              type="button"
              onClick={onSignIn}
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--button-primary)',
                color: 'var(--button-text)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sign in
            </button>
          )}
          <button
            type="button"
            onClick={onOpenSettings}
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              border: mode === 'quota' ? 'none' : '1px solid var(--border-color)',
              background: mode === 'quota' ? 'var(--button-primary)' : 'var(--bg-section)',
              color: mode === 'quota' ? 'var(--button-text)' : 'var(--text-primary)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {mode === 'quota' ? 'Add your API key in Settings' : 'Or use your own API key'}
          </button>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45 }}>
            Your own key stays in this browser only — never uploaded to React Mastery. Works whether you are signed in or not.
          </p>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Keep using local questions
          </button>
        </div>
      </div>
    </div>
  )
}
