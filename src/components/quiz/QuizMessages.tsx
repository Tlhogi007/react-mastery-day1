/**
 * Quiz Messages Component
 * Single Responsibility: Display status messages (success, error, loading)
 */

import { type JSX } from 'react'
import { successMessageStyle, warningMessageStyle } from '../../utils/styles'

interface QuizMessagesProps {
    aiQuestionsLoaded: boolean
    totalQuestions: number
    localQuestionsCount: number
    errorMessage: string | null
}

function QuizMessages({
    aiQuestionsLoaded,
    totalQuestions,
    localQuestionsCount,
    errorMessage
}: QuizMessagesProps): JSX.Element {
    return (
        <>
            {aiQuestionsLoaded && (
                <div style={{
                    ...successMessageStyle,
                    marginBottom: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    ✨ {totalQuestions - localQuestionsCount} additional AI-generated questions loaded!
                </div>
            )}

            {errorMessage && (
                <div
                    className="quiz-banner quiz-banner--warn"
                    style={{
                        ...warningMessageStyle,
                        marginBottom: '15px',
                    }}
                    role="status"
                >
                    {errorMessage}
                </div>
            )}
        </>
    )
}

export default QuizMessages
