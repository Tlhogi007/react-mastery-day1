/**
 * Quiz Header Component
 * Single Responsibility: Display quiz header with title, AI toggle, and progress
 */

import { useEffect, useState, type JSX } from 'react'
import { BYO_KEYS_CHANGED_EVENT, byoAiKeys } from '../../services/byoAiKeys'

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
    const [usingByo, setUsingByo] = useState(() => byoAiKeys.hasAny())

    useEffect(() => {
        const sync = () => setUsingByo(byoAiKeys.hasAny())
        sync()
        window.addEventListener(BYO_KEYS_CHANGED_EVENT, sync)
        window.addEventListener('storage', sync)
        return () => {
            window.removeEventListener(BYO_KEYS_CHANGED_EVENT, sync)
            window.removeEventListener('storage', sync)
        }
    }, [])

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
                {usingByo && (
                    <span
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: '4px 8px',
                            borderRadius: 6,
                            background: 'var(--bg-info)',
                            color: 'var(--text-primary)',
                        }}
                        title="Your API key stays in this browser and is never sent to React Mastery servers"
                    >
                        Using your key · not shared quota
                    </span>
                )}
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
                            {loadingAI
                                ? 'Loading AI questions…'
                                : usingByo
                                  ? 'Add AI questions (uses your key)'
                                  : 'Add AI questions (opt-in · shared free quota)'}
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
