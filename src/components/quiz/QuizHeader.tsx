/**
 * Quiz Header Component
 * Single Responsibility: Display quiz header with title, AI toggle, and progress
 */

import { type JSX } from 'react'

interface QuizHeaderProps {
    title: string
    currentQuestionIndex: number
    totalQuestions: number
    localQuestionsCount: number
    enableAI?: boolean
    day?: number
    aiEnabled: boolean
    loadingAI: boolean
    aiQuestionsLoaded: boolean
    onToggleAI: () => void
}

function QuizHeader({
    title,
    currentQuestionIndex,
    totalQuestions,
    localQuestionsCount,
    enableAI = false,
    day,
    aiEnabled,
    loadingAI,
    aiQuestionsLoaded,
    onToggleAI
}: QuizHeaderProps): JSX.Element {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '10px'
        }}>
            <h3 style={{ margin: 0 }}>{title}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                {enableAI && day && (
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: loadingAI ? 'not-allowed' : 'pointer',
                        opacity: loadingAI ? 0.6 : 1,
                        fontSize: '14px'
                    }}>
                        <input
                            type="checkbox"
                            checked={aiEnabled}
                            onChange={onToggleAI}
                            disabled={loadingAI}
                            style={{
                                width: '18px',
                                height: '18px',
                                cursor: loadingAI ? 'not-allowed' : 'pointer'
                            }}
                        />
                        <span>
                            {loadingAI ? '🔄 Loading AI questions...' : '✨ Enable AI Questions'}
                        </span>
                    </label>
                )}
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                    {aiQuestionsLoaded && (
                        <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                            ({localQuestionsCount} local + {totalQuestions - localQuestionsCount} AI)
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

export default QuizHeader
