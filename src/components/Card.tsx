import { type JSX, type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  title?: string
  icon?: string
  badge?: string
  style?: React.CSSProperties
  className?: string
  onClick?: () => void
}

function Card({ children, title, icon, badge, style, className, onClick }: CardProps): JSX.Element {
  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: 'clamp(14px, 3vw, 20px)',
    boxShadow: 'none',
    transition: 'background 0.15s ease',
    cursor: onClick ? 'pointer' : 'default',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    minWidth: 0,
    ...style
  }

  return (
    <div
      className={className}
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = 'var(--shadow-md)'
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        }
      }}
    >
      {(title || icon || badge) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: '1px solid var(--border-color)',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {icon && <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>}
            {title && (
              <h3 style={{
                margin: 0,
                fontSize: 'clamp(0.95rem, 2.8vw, 1.05rem)',
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                minWidth: 0,
              }}
              >
                {title}
              </h3>
            )}
          </div>
          {badge && (
            <span style={{
              padding: '4px 12px',
              background: 'var(--bg-section)',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '500',
              color: 'var(--text-primary)'
            }}>
              {badge}
            </span>
          )}
        </div>
      )}
      <div>{children}</div>
    </div>
  )
}

export default Card
