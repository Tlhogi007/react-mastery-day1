/**
 * Quiz AI controls: quota badge + opt-in checkbox
 */

import { useEffect, useState, type JSX } from 'react'
import { BYO_KEYS_CHANGED_EVENT, byoAiKeys } from '../../services/byoAiKeys'
import {
  AI_QUOTA_UPDATED_EVENT,
  type AiQuotaStatus,
} from '../../services/userCloudSync'
import { AiQuotaBadge } from '../AiQuotaBadge'
import '../../exercises/exerciseLayout.css'

const QUOTA_CACHE_KEY = 'rm-ai-quota-cache'

function readCachedQuota(): AiQuotaStatus | null {
  try {
    const raw = sessionStorage.getItem(QUOTA_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AiQuotaStatus
    if (typeof parsed?.remaining === 'number' && typeof parsed?.available === 'boolean') {
      return parsed
    }
  } catch {
    /* ignore */
  }
  return null
}

interface QuizAiControlsProps {
  enableAI?: boolean
  day?: number
  aiEnabled: boolean
  loadingAI: boolean
  onToggleAI: () => void
}

export default function QuizAiControls({
  enableAI = false,
  day,
  aiEnabled,
  loadingAI,
  onToggleAI,
}: QuizAiControlsProps): JSX.Element {
  const [usingByo, setUsingByo] = useState(() => byoAiKeys.hasAny())
  const [quota, setQuota] = useState<AiQuotaStatus | null>(() => readCachedQuota())

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

  useEffect(() => {
    const onQuota = (e: Event) => {
      const detail = (e as CustomEvent<AiQuotaStatus>).detail
      if (detail) setQuota(detail)
    }
    window.addEventListener(AI_QUOTA_UPDATED_EVENT, onQuota)
    return () => window.removeEventListener(AI_QUOTA_UPDATED_EVENT, onQuota)
  }, [])

  const showToggle = Boolean(enableAI && day)
  /** Hosted free tier exhausted and no browser BYO key — don't pretend AI will work. */
  const hostedExhausted =
    !usingByo && Boolean(quota?.available && quota.remaining <= 0)
  const toggleBlocked = hostedExhausted || loadingAI

  const openSettings = () => {
    window.dispatchEvent(new CustomEvent('rm-open-settings'))
  }

  return (
    <div className="quiz-header__meta">
      {usingByo ? (
        <span
          className="quiz-header__badge"
          title="Your API key stays in this browser and is never sent to React Mastery servers"
        >
          Using your key · not shared quota
        </span>
      ) : (
        <AiQuotaBadge />
      )}
      {showToggle && (
        <label
          className="quiz-header__ai-toggle"
          title={
            hostedExhausted
              ? 'Free hosted AI is used up for today — add your own API key in Settings'
              : usingByo
                ? 'Add AI questions using your own API key'
                : 'Add AI questions (opt-in · shared free quota)'
          }
          style={{
            cursor: toggleBlocked && !hostedExhausted ? 'not-allowed' : 'pointer',
            opacity: loadingAI ? 0.6 : 1,
          }}
          onClick={(e) => {
            if (!hostedExhausted) return
            e.preventDefault()
            openSettings()
          }}
        >
          <input
            type="checkbox"
            checked={aiEnabled && !hostedExhausted}
            onChange={() => {
              if (hostedExhausted) {
                openSettings()
                return
              }
              onToggleAI()
            }}
            disabled={loadingAI || hostedExhausted}
            style={{ cursor: toggleBlocked ? 'not-allowed' : 'pointer' }}
          />
          <span>
            {loadingAI
              ? 'Loading AI…'
              : hostedExhausted
                ? 'Add AI (need your key)'
                : usingByo
                  ? 'Add AI (your key)'
                  : 'Add AI questions'}
          </span>
        </label>
      )}
    </div>
  )
}
