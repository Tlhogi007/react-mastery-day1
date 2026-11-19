/**
 * Quiz Header Component
 * Single Responsibility: Display quiz header with title, AI toggle, and progress
 */

import { useEffect, useState, type JSX } from 'react'
import { BYO_KEYS_CHANGED_EVENT, byoAiKeys } from '../../services/byoAiKeys'
import { AiQuotaBadge } from '../AiQuotaBadge'
import '../../exercises/exerciseLayout.css'

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
        <div className="quiz-header">
            <h3 className="quiz-header__title">{title}</h3>
            <div className="quiz-header__progress">
                Question {currentQuestionIndex + 1}/{totalQuestions}
                {aiQuestionsLoaded && (
                    <span className="quiz-header__progress-detail">
                        ({localQuestionsCount} local + {totalQuestions - localQuestionsCount} AI)
                    </span>
                )}
            </div>
            <div className="quiz-header__meta">
                {usingByo && (
                    <span
                        className="quiz-header__badge"
                        title="Your API key stays in this browser and is never sent to React Mastery servers"
                    >
                        Using your key · not shared quota
                    </span>
                )}
                {!usingByo && <AiQuotaBadge />}
                {enableAI && day && (
                    <label
                        className="quiz-header__ai-toggle"
                        style={{
                            cursor: loadingAI ? 'not-allowed' : 'pointer',
                            opacity: loadingAI ? 0.6 : 1,
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={aiEnabled}
                            onChange={onToggleAI}
                            disabled={loadingAI}
                            style={{
                                width: '18px',
                                height: '18px',
                                cursor: loadingAI ? 'not-allowed' : 'pointer',
                                flexShrink: 0,
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
            </div>
        </div>
    )
}

export default QuizHeader
