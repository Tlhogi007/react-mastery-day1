import { type JSX, type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  title?: string
  icon?: string
  badge?: string
  style?: React.CSSProperties
  onClick?: () => void
}

function Card({ children, title, icon, badge, style, onClick }: CardProps): JSX.Element {
  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 0.2s ease',
    cursor: onClick ? 'pointer' : 'default',
    ...style
  }

  return (
    <div
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
          marginBottom: '16px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-light)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {icon && <span style={{ fontSize: '24px' }}>{icon}</span>}
            {title && <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{title}</h3>}
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
