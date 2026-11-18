import { type JSX } from 'react'

interface HeroSectionProps {
  day: number
  title: string
  description: string
  progress?: number
}

function HeroSection({ day, title, description, progress = 0 }: HeroSectionProps): JSX.Element {
  const containerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-card) 100%)',
    padding: '60px 40px',
    borderRadius: '16px',
    marginBottom: '40px',
    border: '2px solid var(--border-primary)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    position: 'relative',
    overflow: 'hidden'
  }

  const dayBadgeStyle: React.CSSProperties = {
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    background: 'var(--button-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'var(--button-text)',
    flexShrink: 0
  }

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
        <div style={dayBadgeStyle}>
          {day}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', lineHeight: '1.2' }}>
            {title}
          </h1>
          <p style={{ 
            margin: '12px 0 0', 
            fontSize: '18px', 
            color: 'var(--text-secondary)',
            lineHeight: '1.6'
          }}>
            {description}
          </p>
        </div>
      </div>

      {progress > 0 && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
            fontSize: '14px',
            color: 'var(--text-secondary)'
          }}>
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div style={{
            height: '8px',
            background: 'var(--bg-section)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--button-primary), var(--link-color))',
              transition: 'width 0.3s',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)'
            }} />
          </div>
        </div>
      )}
    </div>
  )
}

export default HeroSection
