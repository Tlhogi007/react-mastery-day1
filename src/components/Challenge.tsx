import { useState, type JSX } from 'react'
import type { Challenge } from '../types/challenges'
import CodePlayground from './CodePlayground'

interface ChallengeProps {
  challenge: Challenge
}

function Challenge({ challenge }: ChallengeProps): JSX.Element {
  const [showHint, setShowHint] = useState<number>(0)
  const [showSolution, setShowSolution] = useState<boolean>(false)
  const [, setCode] = useState<string>(challenge.starterCode)

  const containerStyle: React.CSSProperties = {
    border: '2px solid var(--border-primary)',
    borderRadius: '8px',
    padding: '20px',
    background: 'var(--bg-card)',
    marginTop: '20px'
  }

  const difficultyColors: Record<string, string> = {
    easy: 'var(--bg-success)',
    medium: 'var(--bg-warning)',
    hard: 'var(--bg-warning)'
  }

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
        <div>
          <h3>💻 Practice Challenge: {challenge.title}</h3>
          <div style={{
            display: 'inline-block',
            padding: '4px 8px',
            background: difficultyColors[challenge.difficulty],
            borderRadius: '4px',
            fontSize: '12px',
            marginTop: '5px',
            textTransform: 'capitalize',
            color: challenge.difficulty === 'easy' ? 'var(--text-on-success)' : 
                   challenge.difficulty === 'medium' ? 'var(--text-on-warning)' : 
                   'var(--text-on-error)'
          }}>
            {challenge.difficulty}
          </div>
        </div>
      </div>

      <p style={{ marginTop: '10px', color: 'var(--text-primary)' }}>
        {challenge.description}
      </p>

      <CodePlayground
        initialCode={challenge.starterCode}
        onCodeChange={setCode}
        title="Your Code"
        height={200}
      />

      {challenge.hints.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => setShowHint(prev => Math.min(prev + 1, challenge.hints.length))}
            disabled={showHint >= challenge.hints.length}
            style={{
              padding: '8px 16px',
              background: 'var(--button-primary)',
              color: 'var(--button-text)',
              border: 'none',
              borderRadius: '4px',
              cursor: showHint >= challenge.hints.length ? 'not-allowed' : 'pointer',
              opacity: showHint >= challenge.hints.length ? 0.5 : 1
            }}
          >
            {showHint === 0 ? '💡 Show Hint' : `💡 Show Hint ${showHint + 1}`}
          </button>
          {showHint > 0 && (
            <div style={{
              marginTop: '10px',
              padding: '12px',
              background: 'var(--bg-info)',
              color: 'var(--text-on-info)',
              borderRadius: '6px'
            }}>
              {challenge.hints.slice(0, showHint).map((hint, idx) => (
                <div key={idx} style={{ marginTop: idx > 0 ? '8px' : '0' }}>
                  <strong>Hint {idx + 1}:</strong> {hint}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => setShowSolution(!showSolution)}
          style={{
            padding: '10px 20px',
            background: showSolution ? 'var(--bg-warning)' : 'var(--button-primary)',
            color: 'var(--button-text)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showSolution ? 'Hide Solution' : 'Show Solution'}
        </button>

        {showSolution && (
          <div style={{ marginTop: '20px' }}>
            <h4>Solution:</h4>
            <CodePlayground
              initialCode={challenge.solution}
              title="Solution Code"
              height={200}
            />
            <div style={{
              marginTop: '15px',
              padding: '15px',
              background: 'var(--bg-success)',
              borderRadius: '6px'
            }}>
              <strong>Explanation:</strong>
              <p style={{ marginTop: '8px' }}>{challenge.explanation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Challenge
