import { type JSX, useEffect, useRef } from 'react'

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

type Shortcut = { keys: string[]; action: string }

const SECTIONS: { title: string; items: Shortcut[] }[] = [
  {
    title: 'Move around',
    items: [
      { keys: ['J', '→'], action: 'Next lesson' },
      { keys: ['K', '←'], action: 'Previous lesson' },
      { keys: ['R'], action: 'Shuffle lesson' },
      { keys: ['C'], action: 'Continue where you left off' },
    ],
  },
  {
    title: 'Quiz',
    items: [
      { keys: ['1–4'], action: 'Pick an answer' },
      { keys: ['Space'], action: 'Next question' },
      { keys: ['S'], action: 'Skip' },
    ],
  },
  {
    title: 'Desk',
    items: [
      { keys: ['?'], action: 'Open this list' },
      { keys: ['Esc'], action: 'Close panels' },
    ],
  },
]

function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps): JSX.Element {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    modalRef.current?.focus()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [isOpen, onClose])

  if (!isOpen) return <></>

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28, 25, 22, 0.45)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          maxWidth: 420,
          width: '100%',
          maxHeight: 'min(90vh, 560px)',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <h2
            id="shortcuts-title"
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 17,
              fontWeight: 550,
            }}
          >
            Keyboard
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              border: '1px solid var(--border-color)',
              background: 'var(--bg-section)',
              color: 'var(--text-secondary)',
              padding: '4px 10px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '12px 14px 16px' }}>
          {SECTIONS.map((section) => (
            <section key={section.title} style={{ marginBottom: 14 }}>
              <h3
                style={{
                  margin: '6px 4px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                {section.title}
              </h3>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 4, overflow: 'hidden' }}>
                {section.items.map((item, i) => (
                  <div
                    key={item.action}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderTop: i === 0 ? 'none' : '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                    }}
                  >
                    <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{item.action}</span>
                    <span style={{ display: 'flex', gap: 4 }}>
                      {item.keys.map((key) => (
                        <kbd
                          key={key}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            padding: '2px 6px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-section)',
                            color: 'var(--text-secondary)',
                            borderRadius: 3,
                          }}
                        >
                          {key}
                        </kbd>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
          <p style={{ margin: '8px 4px 0', fontSize: 12, color: 'var(--text-muted)' }}>
            Shortcuts pause while you type in a field.
          </p>
        </div>
      </div>
    </div>
  )
}

export default KeyboardShortcutsHelp
