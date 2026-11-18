/**
 * Learning Path Recommendations Component
 * AI-suggested next steps based on quiz performance
 */

import { useState, useEffect, type JSX } from 'react'
import { learningPathService, type LearningRecommendation } from '../services/learningPathService'
import Card from './Card'

interface LearningPathRecommendationsProps {
    onNavigateToDay?: (day: number) => void
}

function LearningPathRecommendations({ onNavigateToDay }: LearningPathRecommendationsProps): JSX.Element {
    const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([])
    const [path, setPath] = useState(learningPathService.getPersonalizedPath())

    useEffect(() => {
        loadRecommendations()
    }, [])

    const loadRecommendations = (): void => {
        const recs = learningPathService.getRecommendations()
        setRecommendations(recs)
        setPath(learningPathService.getPersonalizedPath())
    }

    const getTypeIcon = (type: LearningRecommendation['type']): string => {
        const icons: Record<LearningRecommendation['type'], string> = {
            review: '📚',
            practice: '💪',
            advance: '➡️',
            focus: '🎯'
        }
        return icons[type]
    }

    const getPriorityColor = (priority: LearningRecommendation['priority']): string => {
        const colors: Record<LearningRecommendation['priority'], string> = {
            high: 'var(--bg-error)',
            medium: 'var(--bg-warning)',
            low: 'var(--bg-success)'
        }
        return colors[priority]
    }

    const goToDay = (day: number): void => {
        onNavigateToDay?.(day)
    }

    const containerStyle: React.CSSProperties = {
        color: 'var(--text-primary)',
        width: '100%',
        minWidth: 0,
        padding: 0,
    }

    return (
        <div className="tool-panel" style={containerStyle}>
            <Card
                title="Learning Path"
                icon="🧭"
                style={{ marginBottom: '24px' }}
            >
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '12px' }}>Your Learning Path</h3>
                    <div style={{
                        padding: '16px',
                        background: 'var(--bg-section)',
                        borderRadius: '8px',
                        marginBottom: '16px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                    Current Progress
                                </div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                    Day {path.currentDay} / 7
                                </div>
                            </div>
                            {path.nextDay && (
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                        Suggested Next
                                    </div>
                                    {onNavigateToDay ? (
                                        <button
                                            type="button"
                                            onClick={() => goToDay(path.nextDay!)}
                                            style={{
                                                fontSize: '24px',
                                                fontWeight: 'bold',
                                                color: 'var(--button-primary)',
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: 0,
                                            }}
                                        >
                                            Day {path.nextDay}
                                        </button>
                                    ) : (
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--button-primary)' }}>
                                            Day {path.nextDay}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <h3 style={{ marginBottom: '12px' }}>Recommendations</h3>
                    {recommendations.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '40px' }}>
                            Complete some quizzes to get personalized recommendations!
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {recommendations.map(rec => (
                                <div
                                    key={rec.id}
                                    style={{
                                        padding: '16px',
                                        background: 'var(--bg-section)',
                                        borderRadius: '8px',
                                        border: `2px solid ${getPriorityColor(rec.priority)}`,
                                        borderLeftWidth: '4px'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8, marginBottom: '8px', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                            <span style={{ fontSize: '24px', flexShrink: 0 }}>{getTypeIcon(rec.type)}</span>
                                            <div style={{ minWidth: 0 }}>
                                                <h4 style={{ margin: 0, fontSize: '16px' }}>{rec.title}</h4>
                                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                    {rec.type.charAt(0).toUpperCase() + rec.type.slice(1)} • {rec.priority} priority
                                                </div>
                                            </div>
                                        </div>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            background: getPriorityColor(rec.priority),
                                            color: rec.priority === 'high' ? 'var(--text-on-error)' :
                                                rec.priority === 'medium' ? 'var(--text-on-warning)' :
                                                    'var(--text-on-success)',
                                            fontSize: '11px',
                                            fontWeight: 'bold'
                                        }}>
                                            {rec.priority}
                                        </span>
                                    </div>
                                    <p style={{ margin: '0 0 8px 0', lineHeight: '1.6' }}>{rec.description}</p>
                                    <div style={{
                                        padding: '8px',
                                        background: 'var(--bg-card)',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        <strong>Why:</strong> {rec.reason}
                                    </div>
                                    {rec.day && onNavigateToDay && (
                                        <div style={{ marginTop: '12px' }}>
                                            <button
                                                type="button"
                                                onClick={() => goToDay(rec.day!)}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: 'var(--button-primary)',
                                                    color: 'var(--button-text)',
                                                    cursor: 'pointer',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                Go to Day {rec.day}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}

export default LearningPathRecommendations
