/**
 * Code Review Exercise Component
 * Review real-world React codebases, find bugs, compare with expert solutions
 */

import { useState, type JSX } from 'react'
import type { CodeReviewExercise, CodeBug } from '../types/codeReview'
import Card from './Card'
import CodePlayground from './CodePlayground'

interface CodeReviewExerciseProps {
    exercise: CodeReviewExercise
    onComplete?: (foundBugs: string[]) => void
}

function CodeReviewExerciseComponent({ exercise, onComplete }: CodeReviewExerciseProps): JSX.Element {
    const [foundBugs, setFoundBugs] = useState<Set<string>>(new Set())
    const [showSolution, setShowSolution] = useState<boolean>(false)
    const [showHints, setShowHints] = useState<boolean>(false)

    const handleBugFound = (bugId: string): void => {
        const newFound = new Set(foundBugs)
        newFound.add(bugId)
        setFoundBugs(newFound)
        onComplete?.(Array.from(newFound))
    }

    const getSeverityColor = (severity: CodeBug['severity']): string => {
        const colors: Record<CodeBug['severity'], string> = {
            low: 'var(--bg-warning)',
            medium: 'var(--bg-warning)',
            high: 'var(--bg-error)',
            critical: 'var(--bg-error)'
        }
        return colors[severity]
    }

    const allBugsFound = exercise.bugs.every(bug => foundBugs.has(bug.id))

    const containerStyle: React.CSSProperties = {
        color: 'var(--text-primary)'
    }

    return (
        <div style={containerStyle}>
            <Card
                title={exercise.title}
                icon="🔍"
                style={{ marginBottom: '24px' }}
            >
                <div style={{ marginBottom: '20px' }}>
                    <p style={{ lineHeight: '1.6', marginBottom: '12px' }}>{exercise.description}</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: 'var(--bg-section)',
                            fontSize: '12px'
                        }}>
                            Day {exercise.day}
                        </span>
                        <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: 'var(--bg-section)',
                            fontSize: '12px'
                        }}>
                            {exercise.category}
                        </span>
                        <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: exercise.difficulty === 'easy' ? 'var(--bg-success)' :
                                exercise.difficulty === 'medium' ? 'var(--bg-warning)' : 'var(--bg-error)',
                            color: exercise.difficulty === 'easy' ? 'var(--text-on-success)' :
                                exercise.difficulty === 'medium' ? 'var(--text-on-warning)' : 'var(--text-on-error)',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}>
                            {exercise.difficulty}
                        </span>
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0 }}>Code to Review</h4>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setShowHints(!showHints)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: showHints ? 'var(--button-primary)' : 'var(--bg-section)',
                                    color: showHints ? 'var(--button-text)' : 'var(--text-primary)',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                {showHints ? 'Hide' : 'Show'} Hints
                            </button>
                            <button
                                onClick={() => setShowSolution(!showSolution)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: showSolution ? 'var(--button-primary)' : 'var(--bg-section)',
                                    color: showSolution ? 'var(--button-text)' : 'var(--text-primary)',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                {showSolution ? 'Hide' : 'Show'} Solution
                            </button>
                        </div>
                    </div>

                    {showHints && (
                        <div style={{
                            padding: '12px',
                            background: 'var(--bg-info)',
                            color: 'var(--text-on-info)',
                            borderRadius: '6px',
                            marginBottom: '12px'
                        }}>
                            <h5 style={{ marginTop: 0, marginBottom: '8px', color: 'var(--text-on-info)' }}>Hints:</h5>
                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                {exercise.hints.map((hint, index) => (
                                    <li key={index} style={{ marginBottom: '4px' }}>{hint}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div style={{ position: 'relative' }}>
                        <CodePlayground
                            initialCode={exercise.code}
                            readOnly={true}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ marginBottom: '12px' }}>
                        Found Bugs ({foundBugs.size} / {exercise.bugs.length})
                    </h4>
                    {foundBugs.size === 0 ? (
                        <div>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                Mark bugs as found when you identify them:
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {exercise.bugs.map(bug => (
                                    <button
                                        key={bug.id}
                                        onClick={() => handleBugFound(bug.id)}
                                        style={{
                                            padding: '12px',
                                            background: 'var(--bg-section)',
                                            borderRadius: '6px',
                                            border: '1px solid var(--border-primary)',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            fontSize: '14px'
                                        }}
                                    >
                                        <strong>Line {bug.line}:</strong> {bug.description}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {exercise.bugs
                                .filter(bug => foundBugs.has(bug.id))
                                .map(bug => (
                                    <div
                                        key={bug.id}
                                        style={{
                                            padding: '12px',
                                            background: 'var(--bg-section)',
                                            borderRadius: '6px',
                                            border: `2px solid ${getSeverityColor(bug.severity)}`
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                            <div>
                                                <strong>Line {bug.line}</strong>
                                                <span style={{
                                                    marginLeft: '8px',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    background: getSeverityColor(bug.severity),
                                                    color: bug.severity === 'critical' || bug.severity === 'high' ?
                                                        'var(--text-on-error)' : 'var(--text-on-warning)',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {bug.severity}
                                                </span>
                                            </div>
                                        </div>
                                        <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>{bug.description}</p>
                                        <div style={{
                                            padding: '8px',
                                            background: 'var(--bg-card)',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontFamily: 'monospace'
                                        }}>
                                            <strong>Fix:</strong> {bug.fix}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

                {allBugsFound && (
                    <div style={{
                        padding: '16px',
                        background: 'var(--bg-success)',
                        color: 'var(--text-on-success)',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎉</div>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-on-success)' }}>All Bugs Found!</div>
                        <div style={{ fontSize: '14px' }}>Great job reviewing this code!</div>
                    </div>
                )}

                {showSolution && (
                    <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ marginBottom: '12px' }}>Expert Solution</h4>
                        <CodePlayground
                            initialCode={exercise.expertSolution}
                            readOnly={true}
                        />
                        <div style={{
                            marginTop: '12px',
                            padding: '12px',
                            background: 'var(--bg-info)',
                            color: 'var(--text-on-info)',
                            borderRadius: '6px'
                        }}>
                            <strong>Explanation:</strong>
                            <p style={{ margin: '8px 0 0 0', lineHeight: '1.6' }}>{exercise.explanation}</p>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    )
}

export default CodeReviewExerciseComponent
