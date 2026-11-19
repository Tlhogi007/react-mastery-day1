import { useEffect, useState, type JSX } from 'react'
import { useAuth } from '@clerk/react'
import { BYO_KEYS_CHANGED_EVENT, byoAiKeys } from '../services/byoAiKeys'
import {
  AI_QUOTA_UPDATED_EVENT,
  type AiQuotaStatus,
  fetchUserCloud,
} from '../services/userCloudSync'

/** Shows remaining free hosted AI generations for the signed-in user. */
export function AiQuotaBadge(): JSX.Element {
  const { isLoaded, isSignedIn } = useAuth()
  const [usingByo, setUsingByo] = useState(() => byoAiKeys.hasAny())
  const [quota, setQuota] = useState<AiQuotaStatus | null>(null)

  useEffect(() => {
    const syncByo = () => setUsingByo(byoAiKeys.hasAny())
    window.addEventListener(BYO_KEYS_CHANGED_EVENT, syncByo)
    window.addEventListener('storage', syncByo)
    return () => {
      window.removeEventListener(BYO_KEYS_CHANGED_EVENT, syncByo)
      window.removeEventListener('storage', syncByo)
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

  useEffect(() => {
    if (!isLoaded || !isSignedIn || usingByo) {
      setQuota(null)
      return
    }
    let cancelled = false
    void (async () => {
      const data = await fetchUserCloud()
      if (!cancelled && data?.quota) setQuota(data.quota)
    })()
    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, usingByo])

  if (!isLoaded || !isSignedIn) return <></>
  if (usingByo) {
    return (
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          padding: '4px 8px',
          borderRadius: 6,
          background: 'var(--bg-success)',
          color: 'var(--text-on-success)',
          border: '1px solid var(--border-color)',
        }}
        title="Using your own API key in this browser — hosted free quota is not used."
      >
        Own API key
      </span>
    )
  }
  if (!quota?.available) return <></>

  const low = quota.remaining <= 2
  const empty = quota.remaining <= 0

  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        padding: '4px 8px',
        borderRadius: 6,
        background: empty ? 'var(--bg-warning)' : low ? 'var(--bg-info, var(--bg-section))' : 'var(--bg-section)',
        color: empty ? 'var(--text-on-warning)' : 'var(--text-secondary)',
        border: '1px solid var(--border-color)',
      }}
      title={
        empty
          ? 'Free hosted AI used up for today (UTC). Add your own key in Settings to keep generating.'
          : low
            ? `${quota.remaining} free hosted AI left today — add your own key anytime in Settings.`
            : `Free hosted AI generations left today (UTC). Resets daily.`
      }
    >
      {empty
        ? '0 free AI — add your key'
        : low
          ? `${quota.remaining} free AI left · Settings for your key`
          : `${quota.remaining}/${quota.limit} free AI left`}
    </span>
  )
}
