/**
 * Question Prompt — after the first 3 questions, choose local/AI and count
 */

import { useEffect, useState, type JSX } from 'react'
import SlideUp from '../animations/SlideUp'
import { BYO_KEYS_CHANGED_EVENT, byoAiKeys } from '../../services/byoAiKeys'
import { allowAiGate, subscribeAiGate } from '../../services/aiAuthBridge'
import {
  AI_QUOTA_UPDATED_EVENT,
  type AiQuotaStatus,
  fetchUserCloud,
} from '../../services/userCloudSync'
import '../../exercises/exerciseLayout.css'

interface QuestionPromptProps {
  onSelectType: (type: 'local' | 'ai' | null) => void
  onCancel: () => void
  onFinishQuiz: () => void
  selectedType: 'local' | 'ai' | null
  onSelectCount: (type: 'local' | 'ai', count: number) => void
  generating: boolean
  errorMessage: string | null
}

const COUNT_OPTIONS = [5, 10, 15, 20] as const

function QuestionPrompt({
  onSelectType,
  onCancel,
  onFinishQuiz,
  selectedType,
  onSelectCount,
  generating,
  errorMessage,
}: QuestionPromptProps): JSX.Element {
  const [selectedCount, setSelectedCount] = useState(5)
  const [usingByo, setUsingByo] = useState(() => byoAiKeys.hasAny())
  const [hostedBlocked, setHostedBlocked] = useState(false)
  const [blockReason, setBlockReason] = useState<'quota' | 'auth' | null>(null)

  const aiUnavailable = selectedType === 'ai' && hostedBlocked && !usingByo
  /** Failed generate must still offer an exit — don't leave Continue as the only path. */
  const aiFailed = selectedType === 'ai' && Boolean(errorMessage)
  const showAiEscape = aiUnavailable || aiFailed

  const openSettings = () => {
    allowAiGate()
    window.dispatchEvent(new CustomEvent('rm-open-settings'))
  }

  useEffect(() => {
    const syncByo = () => {
      const has = byoAiKeys.hasAny()
      setUsingByo(has)
      if (has) {
        allowAiGate()
        setHostedBlocked(false)
        setBlockReason(null)
      }
    }
    window.addEventListener(BYO_KEYS_CHANGED_EVENT, syncByo)
    window.addEventListener('storage', syncByo)
    return () => {
      window.removeEventListener(BYO_KEYS_CHANGED_EVENT, syncByo)
      window.removeEventListener('storage', syncByo)
    }
  }, [])

  useEffect(() => {
    return subscribeAiGate((event) => {
      if (event.mode === 'quota' || event.mode === 'auth') {
        setHostedBlocked(true)
        setBlockReason(event.mode)
      }
      if (event.mode === 'clear' && byoAiKeys.hasAny()) {
        setHostedBlocked(false)
        setBlockReason(null)
      }
    })
  }, [])

  useEffect(() => {
    if (usingByo) return
    let cancelled = false
    void (async () => {
      const data = await fetchUserCloud()
      if (cancelled || !data?.quota) return
      const q = data.quota as AiQuotaStatus
      if (q.available && q.remaining <= 0) {
        setHostedBlocked(true)
        setBlockReason('quota')
      }
    })()
    const onQuota = (e: Event) => {
      const q = (e as CustomEvent<AiQuotaStatus>).detail
      if (q?.available && q.remaining <= 0 && !byoAiKeys.hasAny()) {
        setHostedBlocked(true)
        setBlockReason('quota')
      }
    }
    window.addEventListener(AI_QUOTA_UPDATED_EVENT, onQuota)
    return () => {
      cancelled = true
      window.removeEventListener(AI_QUOTA_UPDATED_EVENT, onQuota)
    }
  }, [usingByo])

  if (!selectedType) {
    return (
      <SlideUp>
        <div className="quiz-panel" role="region" aria-label="More questions">
          <h2 className="quiz-panel__title">Want more questions?</h2>
          <p className="quiz-panel__lead">
            You’ve finished 3. Keep going with local or AI-generated questions.
          </p>

          <div className="quiz-actions">
            <button
              type="button"
              className="quiz-btn quiz-btn--primary"
              onClick={() => onSelectType('local')}
              disabled={generating}
            >
              Local questions
            </button>
            <button
              type="button"
              className="quiz-btn quiz-btn--ghost"
              onClick={() => onSelectType('ai')}
              disabled={generating}
            >
              AI questions
            </button>
            <button
              type="button"
              className="quiz-btn quiz-btn--link"
              onClick={onCancel}
              disabled={generating}
            >
              Skip — finish remaining
            </button>
          </div>
        </div>
      </SlideUp>
    )
  }

  if (showAiEscape) {
    const status =
      blockReason === 'auth'
        ? 'Sign-in required'
        : blockReason === 'quota'
          ? 'Free limit reached'
          : 'AI unavailable'

    const banner =
      errorMessage ||
      (blockReason === 'auth'
        ? 'Hosted AI needs sign-in. Continue locally, or add your own API key in Settings.'
        : 'Hosted AI isn’t available (limit or sign-in). Finish the quiz, or add your own API key in Settings.')

    const unlockAuth = blockReason === 'auth'

    return (
      <SlideUp>
        <div className="quiz-panel quiz-ai-escape" role="region" aria-label="AI unavailable">
          <div className="quiz-ai-escape__callout" role="alert">
            <span className="quiz-ai-escape__status">{status}</span>
            <p className="quiz-ai-escape__message">{banner}</p>
          </div>

          <div className="quiz-actions quiz-ai-escape__actions">
            <button
              type="button"
              className="quiz-btn quiz-btn--primary"
              onClick={onCancel}
              disabled={generating}
            >
              Continue without AI
            </button>
            <button
              type="button"
              className="quiz-btn quiz-btn--ghost"
              onClick={
                unlockAuth
                  ? () => window.dispatchEvent(new CustomEvent('rm-open-ai-sign-in'))
                  : openSettings
              }
              disabled={generating}
            >
              {unlockAuth ? 'Sign in' : 'Add API key'}
            </button>
          </div>

          <div className="quiz-ai-escape__footer">
            {unlockAuth && (
              <button
                type="button"
                className="quiz-ai-escape__footer-btn"
                onClick={openSettings}
                disabled={generating}
              >
                Use your own key
              </button>
            )}
            <button
              type="button"
              className="quiz-ai-escape__footer-btn"
              onClick={onFinishQuiz}
              disabled={generating}
            >
              Finish quiz
            </button>
          </div>
        </div>
      </SlideUp>
    )
  }

  const title = selectedType === 'local' ? 'Local questions' : 'AI questions'
  const primaryLabel = generating
    ? 'Loading…'
    : `Continue with ${selectedCount}`

  return (
    <SlideUp>
      <div className="quiz-panel" role="region" aria-label={title}>
        <h2 className="quiz-panel__title">{title}</h2>
        <p className="quiz-panel__lead">
          How many {selectedType === 'local' ? 'local' : 'AI'} questions would you like?
        </p>

        {errorMessage && (
          <p className="quiz-count-prompt__error" role="alert">
            {errorMessage}
          </p>
        )}

        <div
          className="quiz-segment"
          role="radiogroup"
          aria-label="Number of questions"
        >
          {COUNT_OPTIONS.map((count) => (
            <button
              key={count}
              type="button"
              role="radio"
              aria-checked={selectedCount === count}
              className={`quiz-segment__opt${selectedCount === count ? ' quiz-segment__opt--active' : ''}`}
              onClick={() => setSelectedCount(count)}
              disabled={generating}
            >
              {count}
            </button>
          ))}
        </div>

        <div className="quiz-actions">
          <button
            type="button"
            className="quiz-btn quiz-btn--primary"
            onClick={() => onSelectCount(selectedType, selectedCount)}
            disabled={generating}
          >
            {primaryLabel}
          </button>
          <button
            type="button"
            className="quiz-btn quiz-btn--ghost"
            onClick={() => onSelectType(null)}
            disabled={generating}
          >
            Back
          </button>
        </div>
      </div>
    </SlideUp>
  )
}

export default QuestionPrompt
