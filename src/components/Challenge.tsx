import { useState, type JSX } from 'react'
import type { Challenge } from '../types/challenges'
import CodePlayground from './CodePlayground'
import '../exercises/exerciseLayout.css'

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
    padding: 'clamp(12px, 3vw, 20px)',
    background: 'var(--bg-card)',
    marginTop: '20px',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    overflow: 'hidden',
  }

  const difficultyColors: Record<string, string> = {
    easy: 'var(--bg-success)',
    medium: 'var(--bg-warning)',
    hard: 'var(--bg-warning)'
  }

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 10, marginBottom: '15px', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: '1 1 200px' }}>
          <h3 style={{ margin: 0, fontSize: 'clamp(1rem, 3.2vw, 1.2rem)', lineHeight: 1.3 }}>
            Practice Challenge: {challenge.title}
          </h3>
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

      <div className="lesson-action-stack challenge-actions" style={{ marginTop: '20px' }}>
        {challenge.hints.length > 0 && (
          <button
            type="button"
            className="lesson-full-btn"
            onClick={() => setShowHint(prev => Math.min(prev + 1, challenge.hints.length))}
            disabled={showHint >= challenge.hints.length}
            style={{
              background: 'var(--button-primary)',
              color: 'var(--button-text)',
              cursor: showHint >= challenge.hints.length ? 'not-allowed' : 'pointer',
              opacity: showHint >= challenge.hints.length ? 0.5 : 1,
            }}
          >
            {showHint === 0 ? 'Show Hint' : `Show Hint ${showHint + 1}`}
          </button>
        )}
        <button
          type="button"
          className="lesson-full-btn"
          onClick={() => setShowSolution(!showSolution)}
          style={{
            background: showSolution ? 'var(--bg-warning)' : 'var(--button-primary)',
            color: showSolution ? 'var(--text-on-warning)' : 'var(--button-text)',
            cursor: 'pointer',
          }}
        >
          {showSolution ? 'Hide Solution' : 'Show Solution'}
        </button>
      </div>

      {showHint > 0 && challenge.hints.length > 0 && (
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
  )
}

export default Challenge
