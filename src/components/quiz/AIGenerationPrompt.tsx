/**
 * AI Generation Prompt — decision sheet after local questions
 */

import { type JSX, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BYO_KEYS_CHANGED_EVENT, byoAiKeys } from '../../services/byoAiKeys'
import { allowAiGate, subscribeAiGate } from '../../services/aiAuthBridge'
import {
  AI_QUOTA_UPDATED_EVENT,
  type AiQuotaStatus,
  fetchUserCloud,
} from '../../services/userCloudSync'
import '../../exercises/exerciseLayout.css'

interface AIGenerationPromptProps {
  localScore: number
  localQuestionsCount: number
  onGenerate: (count: number) => void
  generating: boolean
  errorMessage: string | null
}

const MOBILE_MQ = '(max-width: 768px)'
const COUNT_OPTIONS = [0, 5, 10, 15] as const
const SHEET_EXIT_MS = 280

function AIGenerationPrompt({
  localScore,
  localQuestionsCount,
  onGenerate,
  generating,
  errorMessage,
}: AIGenerationPromptProps): JSX.Element {
  const [selectedCount, setSelectedCount] = useState(5)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_MQ).matches : false,
  )
  const [sheetEntered, setSheetEntered] = useState(false)
  const [usingByo, setUsingByo] = useState(() => byoAiKeys.hasAny())
  const [hostedBlocked, setHostedBlocked] = useState(false)
  const [blockReason, setBlockReason] = useState<'quota' | 'auth' | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const pct =
    localQuestionsCount > 0
      ? Math.round((localScore / localQuestionsCount) * 100)
      : 0

  const aiUnavailable = hostedBlocked && !usingByo

  const openSettings = () => {
    allowAiGate()
    window.dispatchEvent(new CustomEvent('rm-open-settings'))
  }

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

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
        setSelectedCount(0)
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
        setSelectedCount(0)
      }
    })()
    const onQuota = (e: Event) => {
      const q = (e as CustomEvent<AiQuotaStatus>).detail
      if (q?.available && q.remaining <= 0 && !byoAiKeys.hasAny()) {
        setHostedBlocked(true)
        setBlockReason('quota')
        setSelectedCount(0)
      }
    }
    window.addEventListener(AI_QUOTA_UPDATED_EVENT, onQuota)
    return () => {
      cancelled = true
      window.removeEventListener(AI_QUOTA_UPDATED_EVENT, onQuota)
    }
  }, [usingByo])

  useEffect(() => {
    if (!isMobile) {
      setSheetEntered(false)
      document.body.classList.remove('quiz-sheet-open')
      return
    }
    document.body.classList.add('quiz-sheet-open')
    const enter = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setSheetEntered(true))
    })
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 40)

    return () => {
      window.cancelAnimationFrame(enter)
      window.clearTimeout(focusTimer)
      document.body.style.overflow = prevOverflow
      document.body.classList.remove('quiz-sheet-open')
    }
  }, [isMobile])

  const primaryLabel = generating
    ? 'Generating…'
    : aiUnavailable || selectedCount === 0
      ? 'Finish quiz'
      : `Generate ${selectedCount} & continue`

  const finish = () => {
    if (generating) return
    setSheetEntered(false)
    window.setTimeout(() => onGenerate(0), isMobile ? SHEET_EXIT_MS : 0)
  }

  const blockedStatus =
    blockReason === 'auth'
      ? 'Sign-in required'
      : blockReason === 'quota'
        ? 'Free limit reached'
        : 'AI unavailable'

  const blockedBanner =
    errorMessage ||
    (blockReason === 'auth'
      ? 'Hosted AI needs sign-in. Finish with your local score, or add your own API key in Settings.'
      : 'Hosted AI isn’t available (limit or sign-in). Finish the quiz, or add your own API key in Settings.')

  const decisionBody = (
    <div className={`quiz-ai-gate${aiUnavailable ? ' quiz-ai-escape' : ''}`}>
      <h2 className="quiz-panel__title" id={titleId}>
        Local quiz done
      </h2>
      <p className="quiz-ai-gate__score">
        {localScore}/{localQuestionsCount} correct
      </p>
      <p className="quiz-ai-gate__pct">{pct}% score</p>

      {aiUnavailable ? (
        <div className="quiz-ai-escape__callout" role="alert" style={{ marginTop: 14 }}>
          <span className="quiz-ai-escape__status">{blockedStatus}</span>
          <p className="quiz-ai-escape__message">{blockedBanner}</p>
        </div>
      ) : (
        <>
          <p className="quiz-ai-gate__question">Add AI questions?</p>
          <div
            className="quiz-segment"
            role="radiogroup"
            aria-label="Number of AI questions"
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
                {count === 0 ? 'None' : String(count)}
              </button>
            ))}
          </div>
        </>
      )}

      {errorMessage && !aiUnavailable && (
        <p className="quiz-ai-gate__error" role="alert">
          {errorMessage}
        </p>
      )}

      <div className={`quiz-actions${aiUnavailable ? ' quiz-ai-escape__actions' : ''}`}>
        {aiUnavailable ? (
          <>
            <button
              type="button"
              className="quiz-btn quiz-btn--primary"
              onClick={finish}
              disabled={generating}
            >
              Finish quiz
            </button>
            <button
              type="button"
              className="quiz-btn quiz-btn--ghost"
              onClick={
                blockReason === 'auth'
                  ? () => window.dispatchEvent(new CustomEvent('rm-open-ai-sign-in'))
                  : openSettings
              }
              disabled={generating}
            >
              {blockReason === 'auth' ? 'Sign in' : 'Add API key'}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="quiz-btn quiz-btn--primary"
            onClick={() => {
              if (selectedCount === 0) {
                finish()
                return
              }
              onGenerate(selectedCount)
            }}
            disabled={generating}
          >
            {primaryLabel}
          </button>
        )}
      </div>

      {aiUnavailable && blockReason === 'auth' ? (
        <div className="quiz-ai-escape__footer">
          <button
            type="button"
            className="quiz-ai-escape__footer-btn"
            onClick={openSettings}
            disabled={generating}
          >
            Use your own key
          </button>
        </div>
      ) : !aiUnavailable ? (
        <p className="quiz-ai-gate__hint">
          AI questions come from free APIs and templates; quality varies.
        </p>
      ) : null}
    </div>
  )

  if (!isMobile) {
    return (
      <div className="quiz-panel" role="region" aria-labelledby={titleId}>
        {decisionBody}
      </div>
    )
  }

  return (
    <>
      <div className="quiz-panel" aria-hidden={sheetEntered}>
        <p className="quiz-panel__title">Local quiz done</p>
        <p className="quiz-ai-gate__score" style={{ marginTop: 8 }}>
          {localScore}/{localQuestionsCount} correct
        </p>
        <p className="quiz-panel__lead">{pct}% score</p>
      </div>
      {createPortal(
        <div
          className={`quiz-results-sheet${sheetEntered ? ' quiz-results-sheet--open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            className="quiz-results-sheet__backdrop"
            aria-label="Finish quiz without AI questions"
            disabled={generating}
            onClick={finish}
          />
          <div className="quiz-results-sheet__panel">
            <div className="quiz-results-sheet__chrome quiz-results-sheet__chrome--minimal">
              <button
                ref={closeRef}
                type="button"
                className="quiz-results-sheet__dismiss"
                disabled={generating}
                aria-label="Dismiss and finish quiz"
                onClick={finish}
              >
                ✕
              </button>
            </div>
            <div className="quiz-results-sheet__content">{decisionBody}</div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

export default AIGenerationPrompt
