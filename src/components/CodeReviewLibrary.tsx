/**
 * Code Review Library Component
 * Browse and practice code review exercises
 */

import { useState, type JSX } from 'react'
import { codeReviewExercises } from '../services/codeReviewExercises'
import CodeReviewExerciseComponent from './CodeReviewExercise'
import Card from './Card'

function CodeReviewLibrary(): JSX.Element {
    const [selectedExercise, setSelectedExercise] = useState<string | null>(null)
    const [filterDay, setFilterDay] = useState<number | 'all'>('all')
    const [filterDifficulty, setFilterDifficulty] = useState<string>('all')

    const filteredExercises = codeReviewExercises.filter(exercise => {
        if (filterDay !== 'all' && exercise.day !== filterDay) return false
        if (filterDifficulty !== 'all' && exercise.difficulty !== filterDifficulty) return false
        return true
    })

    const selectedExerciseData = selectedExercise
        ? codeReviewExercises.find(e => e.id === selectedExercise)
        : null

    const containerStyle: React.CSSProperties = {
        color: 'var(--text-primary)',
        padding: '20px'
    }

    return (
        <div style={containerStyle}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ marginBottom: '10px' }}>🔍 Code Review Library</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Practice reviewing real-world React code. Find bugs and compare with expert solutions.
                </p>
            </div>

            {!selectedExerciseData ? (
                <Card
                    title="Code Review Exercises"
                    icon="📚"
                    style={{ marginBottom: '24px' }}
                >
                    <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Day</label>
                            <select
                                value={filterDay}
                                onChange={(e) => setFilterDay(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-primary)',
                                    background: 'var(--bg-section)',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                <option value="all">All Days</option>
                                {[1, 2, 3, 4, 5, 6, 7].map(d => (
                                    <option key={d} value={d}>Day {d}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Difficulty</label>
                            <select
                                value={filterDifficulty}
                                onChange={(e) => setFilterDifficulty(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-primary)',
                                    background: 'var(--bg-section)',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                <option value="all">All Difficulties</option>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Found {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {filteredExercises.map(exercise => (
                            <div
                                key={exercise.id}
                                onClick={() => setSelectedExercise(exercise.id)}
                                style={{
                                    padding: '16px',
                                    background: 'var(--bg-section)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-primary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--bg-info)'
                                    e.currentTarget.style.color = 'var(--text-on-info)'
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = 'var(--text-primary)'
                                    e.currentTarget.style.background = 'var(--bg-section)'
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = 'none'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                    <h3 style={{ margin: 0, fontSize: '16px' }}>{exercise.title}</h3>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        background: exercise.difficulty === 'easy' ? 'var(--bg-success)' :
                                                   exercise.difficulty === 'medium' ? 'var(--bg-warning)' : 'var(--bg-error)',
                                        color: exercise.difficulty === 'easy' ? 'var(--text-on-success)' :
                                               exercise.difficulty === 'medium' ? 'var(--text-on-warning)' : 'var(--text-on-error)',
                                        fontSize: '11px',
                                        fontWeight: 'bold'
                                    }}>
                                        {exercise.difficulty}
                                    </span>
                                </div>
                                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                    {exercise.description}
                                </p>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '12px' }}>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        background: 'var(--bg-card)'
                                    }}>
                                        Day {exercise.day}
                                    </span>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        background: 'var(--bg-card)'
                                    }}>
                                        {exercise.category}
                                    </span>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        background: 'var(--bg-card)'
                                    }}>
                                        {exercise.bugs.length} bug{exercise.bugs.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            ) : (
                <div>
                    <button
                        onClick={() => setSelectedExercise(null)}
                        style={{
                            marginBottom: '20px',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-primary)',
                            background: 'var(--bg-section)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        ← Back to Library
                    </button>
                    <CodeReviewExerciseComponent
                        exercise={selectedExerciseData}
                        onComplete={() => {}}
                    />
                </div>
            )}
        </div>
    )
}

export default CodeReviewLibrary
