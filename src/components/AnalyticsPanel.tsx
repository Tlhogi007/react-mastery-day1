/**
 * Analytics Panel Component
 * Shows analytics data with export functionality and charts
 */

import { useState, useMemo, type CSSProperties, type JSX } from 'react'
import { analytics } from '../services/analytics'
import { progressStorage } from '../services/progressStorage'
import { questionHistory } from '../services/questionHistory'
import { formatTimeMinutes } from '../utils/timeFormatter'
import '../exercises/exerciseLayout.css'

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

    const containerStyle: CSSProperties = {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding:
            'max(12px, env(safe-area-inset-top, 0px)) max(12px, env(safe-area-inset-right, 0px)) max(12px, env(safe-area-inset-bottom, 0px)) max(12px, env(safe-area-inset-left, 0px))',
        boxSizing: 'border-box',
    }

    const panelStyle: CSSProperties = {
        background: 'var(--bg-card)',
        borderRadius: '12px',
        padding: 'clamp(16px, 4vw, 30px)',
        maxWidth: 'min(800px, 100%)',
        width: '100%',
        minWidth: 0,
        maxHeight: 'min(90dvh, 90vh)',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        border: '2px solid var(--border-primary)',
        boxSizing: 'border-box',
        margin: '0 auto',
        scrollbarGutter: 'stable',
    }

    const sectionStyle: CSSProperties = {
        padding: 'clamp(12px, 3vw, 20px)',
        background: 'var(--bg-section)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        marginBottom: '16px',
        minWidth: 0,
    }

    const detailsStyle: CSSProperties = {
        ...sectionStyle,
    }

    const summaryStyle: CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        cursor: 'pointer',
        listStyle: 'none',
        color: 'var(--text-primary)',
        fontWeight: 600,
        fontSize: '1.05rem',
        lineHeight: 1.3,
        userSelect: 'none',
        WebkitUserSelect: 'none',
    }

    const chipBtnStyle: CSSProperties = {
        padding: '6px 12px',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 500,
        flexShrink: 0,
    }

    const statCardStyle: CSSProperties = {
        padding: '15px',
        background: 'var(--bg-section)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        marginBottom: '15px',
        minWidth: 0,
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px', marginBottom: '24px' }}>
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
                <div style={sectionStyle}>
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
                            type="button"
                            onClick={handleExport}
                            style={{
                                padding: '8px 16px',
                                background: 'var(--button-primary)',
                                color: 'var(--button-text)',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                marginLeft: 'auto',
                            }}
                        >
                            📥 Export
                        </button>
                    </div>
                </div>

                {/* Progress by Day — native details so collapse always works */}
                {progressData.length > 0 && (
                    <details open style={detailsStyle} className="analytics-accordion">
                        <summary style={summaryStyle}>
                            <span>Progress by Day</span>
                        </summary>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 12 }}>
                            {progressData.map(({ day, exercises, quizzes, avgScore }) => (
                                <div
                                    key={day}
                                    style={{
                                        display: 'flex',
                                        flexWrap: 'nowrap',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 12,
                                        padding: '10px 12px',
                                        background: 'var(--bg-card)',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-color)',
                                        minWidth: 0,
                                        width: '100%',
                                        boxSizing: 'border-box',
                                    }}
                                >
                                    <div style={{ fontWeight: 600, flexShrink: 0 }}>Day {day}</div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            justifyContent: 'flex-end',
                                            gap: 8,
                                            minWidth: 0,
                                            marginLeft: 'auto',
                                        }}
                                    >
                                        {exercises > 0 && (
                                            <div
                                                style={{
                                                    padding: '4px 8px',
                                                    background: 'var(--bg-success)',
                                                    color: 'var(--text-on-success)',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                ✓ {exercises} exercise{exercises !== 1 ? 's' : ''}
                                            </div>
                                        )}
                                        {quizzes > 0 && (
                                            <div
                                                style={{
                                                    padding: '4px 8px',
                                                    background: avgScore >= 70 ? 'var(--bg-success)' : 'var(--bg-warning)',
                                                    color: avgScore >= 70 ? 'var(--text-on-success)' : 'var(--text-on-warning)',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                📝 {quizzes} quiz{quizzes !== 1 ? 'zes' : ''} (
                                                {avgScore > 0 ? `${Math.round(avgScore)}%` : 'N/A'})
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </details>
                )}

                {/* Review Weak Areas */}
                {weakAreas.length > 0 && (
                    <div style={sectionStyle}>
                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 10,
                                marginBottom: showWeakAreas ? 12 : 0,
                            }}
                        >
                            <h3 style={{ margin: 0 }}>📚 Review Weak Areas</h3>
                            <button
                                type="button"
                                onClick={() => setShowWeakAreas(!showWeakAreas)}
                                style={chipBtnStyle}
                            >
                                {showWeakAreas ? 'Hide' : 'Show'} ({weakAreas.length})
                            </button>
                        </div>
                        {showWeakAreas && (
                            <div style={{ maxHeight: '300px', overflowY: 'auto', minWidth: 0 }}>
                                {weakAreas.slice(0, 10).map((entry, idx) => (
                                    <div
                                        key={entry.questionId}
                                        style={{
                                            padding: '10px',
                                            background: 'var(--bg-card)',
                                            borderRadius: '4px',
                                            marginBottom: '8px',
                                            fontSize: '13px',
                                            border: '1px solid var(--border-color)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                gap: 6,
                                                marginBottom: '4px',
                                            }}
                                        >
                                            <span style={{ fontWeight: 500 }}>Question {idx + 1}</span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                {entry.attempts} attempt{entry.attempts !== 1 ? 's' : ''} ·{' '}
                                                {new Date(entry.lastSeen).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {entry.difficulty && (
                                            <span
                                                style={{
                                                    padding: '2px 6px',
                                                    background:
                                                        entry.difficulty === 'easy'
                                                            ? 'var(--bg-success)'
                                                            : entry.difficulty === 'medium'
                                                              ? 'var(--bg-warning)'
                                                              : 'var(--bg-error)',
                                                    color:
                                                        entry.difficulty === 'easy'
                                                            ? 'var(--text-on-success)'
                                                            : entry.difficulty === 'medium'
                                                              ? 'var(--text-on-warning)'
                                                              : 'var(--text-on-error)',
                                                    borderRadius: '3px',
                                                    fontSize: '11px',
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                {entry.difficulty}
                                            </span>
                                        )}
                                    </div>
                                ))}
                                {weakAreas.length > 10 && (
                                    <p
                                        style={{
                                            fontSize: '12px',
                                            color: 'var(--text-secondary)',
                                            marginTop: '8px',
                                            textAlign: 'center',
                                        }}
                                    >
                                        ... and {weakAreas.length - 10} more questions
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Recent Events — no nested scroll; outer panel already scrolls */}
                <details open style={{ ...detailsStyle, marginBottom: 0 }} className="analytics-accordion">
                    <summary style={summaryStyle}>
                        <span>Recent Activity</span>
                    </summary>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, minWidth: 0 }}>
                        {summary.recentEvents.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>No recent activity</p>
                        ) : (
                            summary.recentEvents.map((event, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'baseline',
                                        justifyContent: 'space-between',
                                        gap: 12,
                                        padding: '8px 12px',
                                        background: 'var(--bg-card)',
                                        borderRadius: '4px',
                                        fontSize: '13px',
                                        minWidth: 0,
                                        boxSizing: 'border-box',
                                    }}
                                >
                                    <strong style={{ flexShrink: 0 }}>{event.event}</strong>
                                    <span
                                        style={{
                                            color: 'var(--text-secondary)',
                                            textAlign: 'right',
                                            marginLeft: 'auto',
                                            fontSize: '12px',
                                            overflowWrap: 'anywhere',
                                        }}
                                    >
                                        {new Date(event.timestamp).toLocaleString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </details>
            </div>
        </div>
    )
}

export default AnalyticsPanel
