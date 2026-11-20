/**
 * Full-screen decision when the local bank is exhausted — choose before questions resume.
 */

import { type JSX } from 'react'
import SlideUp from '../animations/SlideUp'
import '../../exercises/exerciseLayout.css'

interface QuizExhaustedPromptProps {
  message: string
  enableAI: boolean
  onKeepGoing: () => void
  onTryAi: () => void
  onFinishQuiz: () => void
}

function QuizExhaustedPrompt({
  message,
  enableAI,
  onKeepGoing,
  onTryAi,
  onFinishQuiz,
}: QuizExhaustedPromptProps): JSX.Element {
  return (
    <SlideUp>
      <div className="quiz-panel quiz-exhausted-prompt" role="region" aria-label="Local bank done">
        <div className="quiz-exhausted__callout" role="status">
          <span className="quiz-exhausted__status">Local bank done</span>
          <p className="quiz-exhausted__message">{message}</p>
        </div>

        <div className="quiz-actions quiz-exhausted__actions">
          <button type="button" className="quiz-btn quiz-btn--primary" onClick={onKeepGoing}>
            Practice again
          </button>
          {enableAI && (
            <button type="button" className="quiz-btn quiz-btn--ghost" onClick={onTryAi}>
              Try AI questions
            </button>
          )}
          <button type="button" className="quiz-btn quiz-btn--link" onClick={onFinishQuiz}>
            Finish quiz
          </button>
        </div>
      </div>
    </SlideUp>
  )
}

export default QuizExhaustedPrompt
