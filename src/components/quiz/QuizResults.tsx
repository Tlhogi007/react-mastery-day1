/**
 * Quiz Results Component
 * Single Responsibility: Display quiz completion results
 */

import { type JSX, useEffect, useState } from 'react'
import { QUIZ_THRESHOLDS } from '../../constants'
import { formatTime } from '../../utils/timeFormatter'
import type { QuizQuestion } from '../../types/challenges'

interface QuizResultsProps {
    score: number
    totalQuestions: number
    percentage: number
    localQuestionsCount: number
    aiQuestionsLoaded: boolean
    incorrectAnswers: QuizQuestion[]
    incorrectAnswersWithSelection: Array<{ question: QuizQuestion; selectedIndex: number }>
    /** Honest miss count: total − score (includes skips). */
    missedCount: number
    totalTimeSpent: number
    skippedCount: number
    onRetake: () => void
    onRetakeIncorrectOnly?: () => void
}

function QuizResults({
    score,
    totalQuestions,
    percentage,
    localQuestionsCount,
    aiQuestionsLoaded,
    incorrectAnswers,
    incorrectAnswersWithSelection,
    missedCount,
    totalTimeSpent,
    skippedCount,
    onRetake,
    onRetakeIncorrectOnly
}: QuizResultsProps): JSX.Element {
    const [showReview, setShowReview] = useState<boolean>(false)
    const reviewCount = Math.max(missedCount, incorrectAnswers.length)
    const aiCount = Math.max(0, totalQuestions - localQuestionsCount)
    // Trigger confetti if passed
    useEffect(() => {
        if (percentage >= QUIZ_THRESHOLDS.PASSING_SCORE) {
            const event = new CustomEvent('showConfetti')
            window.dispatchEvent(event)
        }
    }, [percentage])

    return (
        <div style={{
            textAlign: 'center',
            padding: '30px',
            background: percentage >= QUIZ_THRESHOLDS.PASSING_SCORE ? 'var(--bg-success)' : 'var(--bg-warning)',
            color: percentage >= QUIZ_THRESHOLDS.PASSING_SCORE ? 'var(--text-on-success)' : 'var(--text-on-warning)',
            borderRadius: '8px',
            marginTop: '20px'
        }}>
            <h2>Quiz Complete!</h2>
            <div style={{ fontSize: '48px', margin: '20px 0' }}>
                {score} / {totalQuestions}
            </div>
            <div style={{ fontSize: '24px', marginBottom: '20px' }}>
                {percentage}%
            </div>
            {aiQuestionsLoaded && aiCount > 0 && (
                <div style={{
                    marginBottom: '15px',
                    padding: '10px',
                    background: 'var(--bg-info)',
                    color: 'var(--text-on-info)',
                    borderRadius: '4px',
                    fontSize: '14px'
                }}>
                    ✨ {aiCount} AI-generated · {localQuestionsCount} local
                </div>
            )}
            {reviewCount > 0 && (
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    background: 'var(--bg-section)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: 'var(--text-primary)'
                }}>
                    <strong>📝 Review Mode:</strong> You missed {reviewCount} question{reviewCount !== 1 ? 's' : ''}
                    {skippedCount > 0 ? ` (${skippedCount} skipped)` : ''}.
                    {incorrectAnswers.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowReview(!showReview)}
                            style={{
                                marginLeft: '10px',
                                padding: '8px 14px',
                                background: 'var(--button-primary)',
                                color: 'var(--button-text)',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 600
                            }}
                        >
                            {showReview ? 'Hide' : 'Show'} Review
                        </button>
                    )}
                </div>
            )}

            {showReview && incorrectAnswers.length > 0 && (
                <div style={{
                    marginTop: '15px',
                    padding: '15px',
                    background: 'var(--bg-section)',
                    borderRadius: '6px',
                    textAlign: 'left',
                    color: 'var(--text-primary)'
                }}>
                    <h4 style={{ marginTop: 0 }}>Questions to Review:</h4>
                    {incorrectAnswers.map((q, idx) => {
                        const withSelection = incorrectAnswersWithSelection.find(item => item.question.id === q.id)
                        const selectedIndex = withSelection?.selectedIndex ?? null
                        const wasSkipped = selectedIndex === -1

                        return (
                            <div key={q.id} style={{
                                marginTop: idx > 0 ? '15px' : '0',
                                padding: '12px',
                                background: 'var(--bg-card)',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ fontWeight: '500', marginBottom: '12px' }}>
                                    {idx + 1}. {q.question}
                                    {wasSkipped && (
                                        <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.8 }}>(Skipped)</span>
                                    )}
                                </div>

                                {/* Show options with highlighting */}
                                <div style={{ marginBottom: '10px' }}>
                                    {q.options.map((option, optIdx) => {
                                        const isCorrect = optIdx === q.correctAnswer
                                        const isSelected = selectedIndex === optIdx
                                        const isWrong = isSelected && !isCorrect

                                        return (
                                            <div
                                                key={optIdx}
                                                style={{
                                                    padding: '8px 12px',
                                                    marginBottom: '6px',
                                                    borderRadius: '4px',
                                                    background: isCorrect
                                                        ? 'var(--bg-success)'
                                                        : isWrong
                                                            ? 'var(--bg-error)'
                                                            : 'var(--bg-section)',
                                                    border: isCorrect || isWrong ? '2px solid' : '1px solid',
                                                    borderColor: isCorrect
                                                        ? 'var(--border-success)'
                                                        : isWrong
                                                            ? 'var(--border-error)'
                                                            : 'var(--border-color)',
                                                    fontSize: '13px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                <span style={{ fontWeight: '600', minWidth: '20px' }}>
                                                    {String.fromCharCode(65 + optIdx)})
                                                </span>
                                                <span style={{ flex: 1 }}>{option}</span>
                                                {isCorrect && <span style={{ fontSize: '16px' }}>✅</span>}
                                                {isWrong && <span style={{ fontSize: '16px' }}>❌</span>}
                                                {isCorrect && <span style={{ fontSize: '11px', opacity: 0.8 }}>(Correct)</span>}
                                                {isWrong && <span style={{ fontSize: '11px', opacity: 0.8 }}>(Your Answer)</span>}
                                            </div>
                                        )
                                    })}
                                </div>

                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                                    <strong>Explanation:</strong> {q.explanation}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {totalTimeSpent > 0 && (
                <div style={{
                    marginTop: '15px',
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    alignItems: 'center'
                }}>
                    <div>
                        ⏱️ Total Time: {formatTime(totalTimeSpent)}
                        {totalQuestions > 0 && ` (Avg: ${formatTime(Math.floor(totalTimeSpent / totalQuestions))} per question)`}
                    </div>
                    {skippedCount > 0 && (
                        <div>⏭️ Skipped: {skippedCount} question{skippedCount !== 1 ? 's' : ''}</div>
                    )}
                </div>
            )}

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                    onClick={onRetake}
                    style={{
                        padding: '10px 20px',
                        background: 'var(--button-primary)',
                        color: 'var(--button-text)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                    aria-label="Retake quiz"
                >
                    🔄 Retake Quiz
                </button>
                {onRetakeIncorrectOnly && incorrectAnswers.length > 0 && (
                    <button
                        onClick={onRetakeIncorrectOnly}
                        style={{
                            padding: '10px 20px',
                            background: 'var(--button-secondary)',
                            color: 'var(--button-text)',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                        aria-label="Retake incorrect questions only"
                    >
                        📝 Retake Incorrect Only ({incorrectAnswers.length})
                    </button>
                )}
            </div>
        </div>
    )
}

export default QuizResults
