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
    padding: '20px',
    background: 'var(--bg-card)',
    marginTop: '20px'
  }

  const connectionStyle: React.CSSProperties = {
    padding: '12px',
    margin: '10px 0',
    background: 'var(--bg-section)',
    borderRadius: '6px'
  }

  return (
    <div style={containerStyle}>
      <h3>🔗 Connections to Other Days</h3>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '5px' }}>
        See how concepts from Day {currentDay} relate to other days
      </p>

      <div style={{ marginTop: '15px' }}>
        {relevantConnections.map((conn, idx) => (
          <div key={idx} style={connectionStyle}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
              Day {conn.fromDay} → Day {conn.toDay}: {conn.connection}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
              {conn.explanation}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CrossDayConnections
