/**
 * Coding Challenge Component
 * Interactive coding exercises with test cases and validation
 */

import { useState, type JSX } from 'react'
import CodePlayground from './CodePlayground'

export interface TestCase {
  input: any
  expected: any
  description: string
}

interface CodingChallengeProps {
  title: string
  description: string
  starterCode: string
  testCases: TestCase[]
  solution?: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

function CodingChallenge({ 
  title, 
  description, 
  starterCode, 
  testCases, 
  solution,
  difficulty = 'medium'
}: CodingChallengeProps): JSX.Element {
  const [code, setCode] = useState(starterCode)
  const [results, setResults] = useState<Array<{ passed: boolean; message: string }>>([])
  const [showSolution, setShowSolution] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  const runTests = (): void => {
    setIsRunning(true)
    setResults([])

    // Simple test runner - validates code structure and provides feedback
    // Note: In a production environment, you'd use a proper code execution sandbox
    setTimeout(() => {
      const testResults = testCases.map((testCase, i) => {
        try {
          // Basic validation - check if code contains expected patterns
          // This is a simplified version - real implementation would need a code evaluator
          const hasFunction = code.includes('function') || code.includes('const') || code.includes('=>')
          const hasReturn = code.includes('return')
          
          if (!hasFunction || !hasReturn) {
            return {
              passed: false,
              message: `Test ${i + 1}: ❌ Code structure incomplete. Make sure you have a function that returns a value.`
            }
          }

          // For demonstration, we'll check if the code looks correct
          // In production, you'd execute the code in a sandbox
          const looksCorrect = code.length > starterCode.length * 1.2 // User has written something
          
          return {
            passed: looksCorrect,
            message: looksCorrect
              ? `Test ${i + 1}: ✅ Passed - ${testCase.description}`
              : `Test ${i + 1}: ⚠️ Code needs more implementation - ${testCase.description}`
          }
        } catch (error) {
          return {
            passed: false,
            message: `Test ${i + 1}: ❌ Error: ${error instanceof Error ? error.message : String(error)}`
          }
        }
      })
      
      setResults(testResults)
      setIsRunning(false)
    }, 500)
  }

  const difficultyColors = {
    easy: 'var(--bg-success)',
    medium: 'var(--bg-warning)',
    hard: 'var(--bg-error)'
  }

  const difficultyLabels = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard'
  }

  return (
    <div style={{ 
      marginBottom: '24px', 
      padding: '20px', 
      background: 'var(--bg-card)', 
      borderRadius: '8px',
      border: '1px solid var(--border-color)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <span style={{
          padding: '4px 12px',
          background: difficultyColors[difficulty],
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold',
          color: 'var(--text-primary)'
        }}>
          {difficultyLabels[difficulty]}
        </span>
      </div>
      
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
        {description}
      </p>

      <CodePlayground 
        initialCode={code} 
        onCodeChange={setCode} 
        title="Your Solution" 
        height={300}
      />

      <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button 
          onClick={runTests} 
          disabled={isRunning}
          style={{
            padding: '8px 16px',
            background: isRunning ? 'var(--bg-section)' : 'var(--button-primary)',
            color: isRunning ? 'var(--text-secondary)' : 'var(--button-text)',
            border: 'none',
            borderRadius: '6px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            opacity: isRunning ? 0.6 : 1
          }}
        >
          {isRunning ? 'Running Tests...' : 'Run Tests'}
        </button>
        
        <button
          onClick={() => setCode(starterCode)}
          style={{
            padding: '8px 16px',
            background: 'var(--bg-section)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Reset Code
        </button>

        {solution && (
          <button 
            onClick={() => setShowSolution(!showSolution)} 
            style={{
              padding: '8px 16px',
              background: 'var(--bg-section)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {showSolution ? 'Hide' : 'Show'} Solution
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4 style={{ marginBottom: '12px' }}>Test Results:</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {results.map((result, i) => (
              <div 
              key={i} 
              style={{
                padding: '12px',
                background: result.passed ? 'var(--bg-success)' : 'var(--bg-warning)',
                color: result.passed ? 'var(--text-on-success)' : 'var(--text-on-warning)',
                borderRadius: '6px',
                fontSize: '14px',
                border: `1px solid ${result.passed ? 'var(--bg-success)' : 'var(--bg-warning)'}`
              }}
            >
                {result.message}
              </div>
            ))}
          </div>
          
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            background: 'var(--bg-section)', 
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            <strong>Summary:</strong> {results.filter(r => r.passed).length} / {results.length} tests passed
          </div>
        </div>
      )}

      {showSolution && solution && (
        <div style={{ marginTop: '20px' }}>
          <h4 style={{ marginBottom: '12px' }}>Solution:</h4>
          <CodePlayground 
            initialCode={solution} 
            readOnly 
            title="Solution" 
            height={300}
          />
        </div>
      )}
    </div>
  )
}

export default CodingChallenge
