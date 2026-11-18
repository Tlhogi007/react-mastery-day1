/**
 * Connections Graph Component
 * Visualizes cross-day connections between React concepts
 */

import { type JSX } from 'react'

export interface Connection {
  fromDay: number
  toDay: number
  connection: string
  explanation: string
}

interface ConnectionsGraphProps {
  connections: Connection[]
  currentDay: number
}

function ConnectionsGraph({ connections, currentDay }: ConnectionsGraphProps): JSX.Element {
  if (connections.length === 0) {
    return <></>
  }

  return (
    <div style={{ 
      padding: '24px', 
      background: 'var(--bg-card)', 
      borderRadius: '12px',
      border: '1px solid var(--border-color)',
      marginTop: '24px'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '8px' }}>🔗 Cross-Day Connections</h3>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
        See how concepts from different days connect and build upon each other
      </p>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px'
      }}>
        {connections.map((conn, i) => (
          <div 
            key={i} 
            style={{
              padding: '16px',
              background: 'var(--bg-section)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-section)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '12px' 
            }}>
              <div style={{
                padding: '4px 8px',
                background: conn.fromDay === currentDay ? 'var(--button-primary)' : 'var(--bg-tertiary)',
                color: conn.fromDay === currentDay ? 'var(--button-text)' : 'var(--text-primary)',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                Day {conn.fromDay}
              </div>
              <span style={{ fontSize: '18px' }}>→</span>
              <div style={{
                padding: '4px 8px',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                Day {conn.toDay}
              </div>
            </div>
            
            <div style={{ 
              fontWeight: 'bold', 
              marginBottom: '8px',
              color: 'var(--text-primary)'
            }}>
              {conn.connection}
            </div>
            
            <div style={{ 
              fontSize: '13px', 
              color: 'var(--text-secondary)',
              lineHeight: '1.5'
            }}>
              {conn.explanation}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ConnectionsGraph
