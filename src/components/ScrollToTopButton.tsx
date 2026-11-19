import { useEffect, useState, type JSX } from 'react'
import { Z_INDEX } from '../constants'

const SHOW_AFTER_PX = 320

/** Fixed control that smooth-scrolls back to the top after the page is scrolled. */
export function ScrollToTopButton(): JSX.Element | null {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const update = () => {
      const y =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0
      setVisible(y > SHOW_AFTER_PX)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      className="scroll-to-top"
      aria-label="Scroll to top"
      title="Scroll to top"
      onClick={() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
      }}
      style={{
        position: 'fixed',
        right: 'max(12px, env(safe-area-inset-right, 0px))',
        bottom: 'max(16px, env(safe-area-inset-bottom, 0px))',
        zIndex: Z_INDEX.FLOATING_ACTIONS,
        width: 40,
        height: 40,
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        border: '1px solid var(--border-color)',
        background: 'color-mix(in srgb, var(--bg-card) 92%, transparent)',
        color: 'var(--text-secondary)',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 19V5M12 5l-6 6M12 5l6 6"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
