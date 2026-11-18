/**
 * Analytics Panel Component
 * Shows analytics data with export functionality and charts
 */

import { useState, useMemo, type JSX } from 'react'
import { analytics } from '../services/analytics'
import { progressStorage } from '../services/progressStorage'
import { questionHistory } from '../services/questionHistory'
import { formatTimeMinutes } from '../utils/timeFormatter'

interface AnalyticsPanelProps {
    onClose: () => void
}

function AnalyticsPanel({ onClose }: AnalyticsPanelProps): JSX.Element {
    const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json')
    const [showWeakAreas, setShowWeakAreas] = useState<boolean>(false)
    const summary = analytics.getSummary()
    const userProgress = analytics.getUserProgress()
    const questionStats = questionHistory.getStats()
    const streak = progressStorage.getCurrentStreak()
    const weakAreas = questionHistory.getQuestionsNeedingReview()

    // Calculate progress data for charts
    const progressData = useMemo(() => {
        const events = summary.recentEvents
        const exerciseCompletions = events.filter(e => e.event === 'exercise_complete')
        const quizCompletions = events.filter(e => e.event === 'quiz_complete')

        // Group by day
        const byDay: Record<number, { exercises: number; quizzes: number; scores: number[] }> = {}

        exerciseCompletions.forEach(e => {
            const day = e.properties?.day as number
            if (day) {
                if (!byDay[day]) byDay[day] = { exercises: 0, quizzes: 0, scores: [] }
                byDay[day].exercises++
            }
        })

        quizCompletions.forEach(e => {
            const day = e.properties?.day as number
            const score = e.properties?.percentage as number
            if (day) {
                if (!byDay[day]) byDay[day] = { exercises: 0, quizzes: 0, scores: [] }
                byDay[day].quizzes++
                if (typeof score === 'number') byDay[day].scores.push(score)
            }
        })

        return Object.entries(byDay)
            .map(([day, data]) => ({
                day: parseInt(day, 10),
                exercises: data.exercises,
                quizzes: data.quizzes,
                avgScore: data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0
            }))
            .sort((a, b) => a.day - b.day)
    }, [summary])

    const handleExport = (): void => {
        const data = analytics.export()

        if (exportFormat === 'json') {
            const blob = new Blob([data], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `react-mastery-analytics-${new Date().toISOString().split('T')[0]}.json`
            a.click()
            URL.revokeObjectURL(url)
        } else {
            // CSV format
            const csv = convertToCSV(data)
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `react-mastery-analytics-${new Date().toISOString().split('T')[0]}.csv`
            a.click()
            URL.revokeObjectURL(url)
        }

        analytics.trackFeatureUsage('analytics_export', { format: exportFormat })
    }

    const convertToCSV = (jsonData: string): string => {
        try {
            const data = JSON.parse(jsonData)
            const events = data.events || []

            if (events.length === 0) return 'No events to export'

            // CSV header
            const headers = ['Timestamp', 'Event', 'Properties']
            const rows = events.map((event: { timestamp: number; event: string; properties?: Record<string, unknown> }) => {
                const date = new Date(event.timestamp).toISOString()
                const props = event.properties ? JSON.stringify(event.properties) : ''
                return [date, event.event, props]
            })

            return [
                headers.join(','),
                ...rows.map((row: string[]) => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            ].join('\n')
        } catch {
            return 'Error converting to CSV'
        }
    }

    const containerStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
    }

    const panelStyle: React.CSSProperties = {
        background: 'var(--bg-card)',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '2px solid var(--border-primary)'
    }

    const statCardStyle: React.CSSProperties = {
        padding: '15px',
        background: 'var(--bg-section)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        marginBottom: '15px'
    }

    return (
        <div style={containerStyle} onClick={onClose}>
            <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>📊 Analytics Dashboard</h2>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 12px',
                            background: 'var(--bg-section)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                    <div style={statCardStyle}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Exercises Completed</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{userProgress.exercisesCompleted}</div>
                    </div>
                    <div style={statCardStyle}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Quizzes Passed</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{userProgress.quizzesPassed}</div>
                    </div>
                    <div style={statCardStyle}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Current Streak</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>🔥 {streak} days</div>
                    </div>
                    <div style={statCardStyle}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Total Time</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatTimeMinutes(userProgress.totalTimeSpent)}</div>
                    </div>
                    <div style={statCardStyle}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Question Accuracy</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{questionStats.accuracy.toFixed(1)}%</div>
                    </div>
                    <div style={statCardStyle}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>Total Events</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{summary.totalEvents}</div>
                    </div>
                </div>

                {/* Export Section */}
                <div style={{
                    padding: '20px',
                    background: 'var(--bg-section)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    marginBottom: '20px'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Export Analytics</h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                checked={exportFormat === 'json'}
                                onChange={() => setExportFormat('json')}
                            />
                            JSON
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                checked={exportFormat === 'csv'}
                                onChange={() => setExportFormat('csv')}
                            />
                            CSV
                        </label>
                        <button
                            onClick={handleExport}
                            style={{
                                padding: '8px 16px',
                                background: 'var(--button-primary)',
                                color: 'var(--button-text)',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                marginLeft: 'auto'
                            }}
                        >
                            📥 Export
                        </button>
                    </div>
                </div>

                {/* Progress Chart */}
                {progressData.length > 0 && (
                    <div style={{
                        padding: '20px',
                        background: 'var(--bg-section)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        marginBottom: '20px'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Progress by Day</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {progressData.map(({ day, exercises, quizzes, avgScore }) => (
                                <div key={day} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px',
                                    background: 'var(--bg-card)',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ minWidth: '60px', fontWeight: '600' }}>Day {day}</div>
                                    <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {exercises > 0 && (
                                            <div style={{
                                                padding: '4px 8px',
                                                background: 'var(--bg-success)',
                                                color: 'var(--text-on-success)',
                                                borderRadius: '4px',
                                                fontSize: '12px'
                                            }}>
                                                ✓ {exercises} exercise{exercises !== 1 ? 's' : ''}
                                            </div>
                                        )}
                                        {quizzes > 0 && (
                                            <div style={{
                                                padding: '4px 8px',
                                                background: avgScore >= 70 ? 'var(--bg-success)' : 'var(--bg-warning)',
                                                color: avgScore >= 70 ? 'var(--text-on-success)' : 'var(--text-on-warning)',
                                                borderRadius: '4px',
                                                fontSize: '12px'
                                            }}>
                                                📝 {quizzes} quiz{quizzes !== 1 ? 'zes' : ''} ({avgScore > 0 ? `${Math.round(avgScore)}%` : 'N/A'})
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Review Weak Areas */}
                {weakAreas.length > 0 && (
                    <div style={{
                        padding: '20px',
                        background: 'var(--bg-section)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        marginBottom: '20px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ marginTop: 0 }}>📚 Review Weak Areas</h3>
                            <button
                                onClick={() => setShowWeakAreas(!showWeakAreas)}
                                style={{
                                    padding: '6px 12px',
                                    background: 'var(--button-secondary)',
                                    color: 'var(--button-text)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '13px'
                                }}
                            >
                                {showWeakAreas ? 'Hide' : 'Show'} ({weakAreas.length})
                            </button>
                        </div>
                        {showWeakAreas && (
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {weakAreas.slice(0, 10).map((entry, idx) => (
                                    <div key={entry.questionId} style={{
                                        padding: '10px',
                                        background: 'var(--bg-card)',
                                        borderRadius: '4px',
                                        marginBottom: '8px',
                                        fontSize: '13px',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: '500' }}>Question {idx + 1}</span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                {entry.attempts} attempt{entry.attempts !== 1 ? 's' : ''} |
                                                Last seen: {new Date(entry.lastSeen).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {entry.difficulty && (
                                            <span style={{
                                                padding: '2px 6px',
                                                background: entry.difficulty === 'easy' ? 'var(--bg-success)' : entry.difficulty === 'medium' ? 'var(--bg-warning)' : 'var(--bg-error)',
                                                color: entry.difficulty === 'easy' ? 'var(--text-on-success)' : entry.difficulty === 'medium' ? 'var(--text-on-warning)' : 'var(--text-on-error)',
                                                borderRadius: '3px',
                                                fontSize: '11px',
                                                textTransform: 'uppercase'
                                            }}>
                                                {entry.difficulty}
                                            </span>
                                        )}
                                    </div>
                                ))}
                                {weakAreas.length > 10 && (
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'center' }}>
                                        ... and {weakAreas.length - 10} more questions
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Recent Events */}
                <div style={{
                    padding: '20px',
                    background: 'var(--bg-section)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Recent Activity</h3>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {summary.recentEvents.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No recent activity</p>
                        ) : (
                            summary.recentEvents.map((event, idx) => (
                                <div key={idx} style={{
                                    padding: '8px',
                                    background: 'var(--bg-card)',
                                    borderRadius: '4px',
                                    marginBottom: '8px',
                                    fontSize: '13px'
                                }}>
                                    <strong>{event.event}</strong> - {new Date(event.timestamp).toLocaleString()}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AnalyticsPanel
