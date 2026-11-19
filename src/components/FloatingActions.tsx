import { useState, type JSX } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Z_INDEX } from '../constants'

interface FloatingActionsProps {
  onSearch?: () => void
  onProgress?: () => void
  onSettings?: () => void
  onAnalytics?: () => void
  onTools?: () => void
}

interface FabAction {
  id: string
  label: string
  icon: string
  onClick?: () => void
}

function FloatingActions({
  onSearch,
  onProgress,
  onSettings,
  onAnalytics,
  onTools,
}: FloatingActionsProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const actions: FabAction[] = [
    { id: 'search', label: 'Search', icon: '🔍', onClick: onSearch },
    { id: 'progress', label: 'Progress', icon: '📊', onClick: onProgress },
    { id: 'analytics', label: 'Analytics', icon: '📈', onClick: onAnalytics },
    { id: 'tools', label: 'Learning tools', icon: '🛠️', onClick: onTools },
    { id: 'settings', label: 'Settings', icon: '⚙️', onClick: onSettings },
  ]

  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    right: 'calc(100% + 10px)',
    top: '50%',
    transform: 'translateY(-50%)',
    whiteSpace: 'nowrap',
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'var(--font-ui)',
    pointerEvents: 'none',
    boxShadow: 'var(--shadow-md)',
    zIndex: 2,
  }

  return (
    <div
      className="floating-actions"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: Z_INDEX.FLOATING_ACTIONS,
      }}
    >
      <div style={{ position: 'relative' }}>
        <AnimatePresence>
          {isOpen &&
            actions.map((action, index) => {
              const bottom = 52 + (index + 1) * 60
              return (
                <motion.button
                  key={action.id}
                  type="button"
                  aria-label={action.label}
                  initial={{ opacity: 0, y: 12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.9 }}
                  transition={{ duration: 0.18, delay: index * 0.04 }}
                  onClick={() => {
                    action.onClick?.()
                    setIsOpen(false)
                    setHoveredId(null)
                  }}
                  onMouseEnter={() => setHoveredId(action.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    position: 'absolute',
                    bottom,
                    right: 0,
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background:
                      hoveredId === action.id ? 'var(--bg-section)' : 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: 18,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-md)',
                    zIndex: 1001 - index,
                  }}
                >
                  {action.icon}
                  {hoveredId === action.id && (
                    <span style={tooltipStyle} role="tooltip">
                      {action.label}
                    </span>
                  )}
                </motion.button>
              )
            })}
        </AnimatePresence>

        <button
          type="button"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          onClick={() => {
            setIsOpen((open) => !open)
            setHoveredId(null)
          }}
          onMouseEnter={() => setHoveredId('menu')}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            width: 44,
            height: 44,
            borderRadius: 6,
            border: '1px solid var(--border-color)',
            background: 'var(--button-primary)',
            color: 'var(--button-text)',
            fontSize: 20,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
            transition: 'background 0.15s ease, transform 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        >
          {isOpen ? '✕' : '+'}
          {hoveredId === 'menu' && (
            <span
              style={{
                ...tooltipStyle,
                transform: isOpen
                  ? 'translateY(-50%) rotate(-45deg)'
                  : 'translateY(-50%)',
              }}
              role="tooltip"
            >
              {isOpen ? 'Close' : 'Menu'}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}

export default FloatingActions
