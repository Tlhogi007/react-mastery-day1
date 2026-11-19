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
    border: '1px solid var(--border-color)',
    borderRadius: 10,
    padding: 'clamp(12px, 3vw, 18px)',
    background: 'var(--bg-card)',
    marginTop: 0,
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

      <div
        style={{
          marginTop: 16,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {challenge.hints.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHint(prev => Math.min(prev + 1, challenge.hints.length))}
            disabled={showHint >= challenge.hints.length}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 36,
              minHeight: 36,
              padding: '0 12px',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-section)',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: showHint >= challenge.hints.length ? 'not-allowed' : 'pointer',
              opacity: showHint >= challenge.hints.length ? 0.5 : 1,
            }}
          >
            {showHint === 0 ? 'Show Hint' : `Show Hint ${showHint + 1}`}
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowSolution(!showSolution)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 36,
            minHeight: 36,
            padding: '0 12px',
            borderRadius: 8,
            border: showSolution ? '1px solid transparent' : '1px solid var(--border-color)',
            background: showSolution ? 'var(--bg-warning)' : 'var(--bg-section)',
            color: showSolution ? 'var(--text-on-warning)' : 'var(--text-primary)',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit',
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
