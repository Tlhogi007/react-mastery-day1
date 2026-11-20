/**
 * Quiz Messages — non-blocking status banners (success / generic errors)
 */

import { type JSX } from 'react'
import { successMessageStyle, warningMessageStyle } from '../../utils/styles'
import { isLocalBankExhaustedMessage } from '../../hooks/quiz/quizMessages'

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
  errorMessage,
}: QuizMessagesProps): JSX.Element {
  // Exhausted copy is handled by QuizExhaustedPrompt (blocks the quiz).
  const showError = Boolean(errorMessage) && !isLocalBankExhaustedMessage(errorMessage)

  return (
    <>
      {aiQuestionsLoaded && (
        <div
          style={{
            ...successMessageStyle,
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          ✨ {totalQuestions - localQuestionsCount} additional AI-generated questions loaded!
        </div>
      )}

      {showError && (
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
