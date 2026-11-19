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
                        <div className="learning-path-recs" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {recommendations.map(rec => (
                                <div
                                    key={rec.id}
                                    className="learning-path-rec"
                                    style={{
                                        padding: '14px',
                                        background: 'var(--bg-section)',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border-color)',
                                        borderLeft: `3px solid ${getPriorityColor(rec.priority)}`,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 10,
                                            marginBottom: 8,
                                        }}
                                    >
                                        <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.2 }}>
                                            {getTypeIcon(rec.type)}
                                        </span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h4
                                                style={{
                                                    margin: 0,
                                                    fontSize: 15,
                                                    fontWeight: 650,
                                                    lineHeight: 1.3,
                                                }}
                                            >
                                                {rec.title}
                                            </h4>
                                            <div
                                                style={{
                                                    marginTop: 6,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    flexWrap: 'wrap',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        color: 'var(--text-secondary)',
                                                    }}
                                                >
                                                    {rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}
                                                </span>
                                                <span
                                                    style={{
                                                        padding: '2px 8px',
                                                        borderRadius: 999,
                                                        background: getPriorityColor(rec.priority),
                                                        color:
                                                            rec.priority === 'high'
                                                                ? 'var(--text-on-error)'
                                                                : rec.priority === 'medium'
                                                                  ? 'var(--text-on-warning)'
                                                                  : 'var(--text-on-success)',
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        textTransform: 'lowercase',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {rec.priority}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p style={{ margin: '0 0 8px', lineHeight: 1.5, fontSize: 14 }}>
                                        {rec.description}
                                    </p>
                                    <div
                                        style={{
                                            padding: '8px 10px',
                                            background: 'var(--bg-card)',
                                            borderRadius: 6,
                                            border: '1px solid var(--border-color)',
                                            fontSize: 12,
                                            color: 'var(--text-secondary)',
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        <strong>Why:</strong> {rec.reason}
                                    </div>
                                    {rec.day && onNavigateToDay && (
                                        <div style={{ marginTop: 12 }}>
                                            <button
                                                type="button"
                                                className="learning-path-rec__cta"
                                                onClick={() => goToDay(rec.day!)}
                                                style={{
                                                    padding: '10px 16px',
                                                    minHeight: 40,
                                                    borderRadius: 8,
                                                    border: 'none',
                                                    background: 'var(--button-primary)',
                                                    color: 'var(--button-text)',
                                                    cursor: 'pointer',
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                    fontFamily: 'inherit',
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
