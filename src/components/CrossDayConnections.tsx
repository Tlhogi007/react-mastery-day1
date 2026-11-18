import { type JSX } from 'react'

interface Connection {
  fromDay: number
  toDay: number
  connection: string
  explanation: string
}

interface CrossDayConnectionsProps {
  currentDay: number
  connections: Connection[]
}

function CrossDayConnections({ currentDay, connections }: CrossDayConnectionsProps): JSX.Element {
  const relevantConnections = connections.filter(
    conn => conn.fromDay === currentDay || conn.toDay === currentDay
  )

  if (relevantConnections.length === 0) return <></>

  const containerStyle: React.CSSProperties = {
    border: '2px solid var(--border-primary)',
    borderRadius: '8px',
    padding: 'clamp(12px, 3vw, 20px)',
    background: 'var(--bg-card)',
    marginTop: '20px',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  }

  const connectionStyle: React.CSSProperties = {
    padding: 'clamp(10px, 2.5vw, 12px)',
    margin: '10px 0',
    background: 'var(--bg-section)',
    borderRadius: '6px',
    minWidth: 0,
    boxSizing: 'border-box',
  }

  return (
    <div style={containerStyle}>
      <h3 style={{ margin: 0, fontSize: 'clamp(1rem, 3.2vw, 1.2rem)' }}>
        🔗 Connections to Other Days
      </h3>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '5px', lineHeight: 1.45 }}>
        See how concepts from Day {currentDay} relate to other days
      </p>

      <div style={{ marginTop: '15px' }}>
        {relevantConnections.map((conn, idx) => (
          <div key={idx} style={connectionStyle}>
            <div style={{
              fontWeight: 'bold',
              marginBottom: '5px',
              lineHeight: 1.35,
              overflowWrap: 'anywhere',
            }}>
              Day {conn.fromDay} → Day {conn.toDay}: {conn.connection}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.45, overflowWrap: 'anywhere' }}>
              {conn.explanation}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CrossDayConnections
