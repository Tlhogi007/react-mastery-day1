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
  if (usingByo) return <></>
  if (!quota?.available) return <></>

  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        padding: '4px 8px',
        borderRadius: 6,
        background: quota.remaining > 0 ? 'var(--bg-section)' : 'var(--bg-warning)',
        color: quota.remaining > 0 ? 'var(--text-secondary)' : 'var(--text-on-warning)',
        border: '1px solid var(--border-color)',
      }}
      title={`Free hosted AI generations left today (UTC). Resets daily.`}
    >
      {quota.remaining}/{quota.limit} free AI left
    </span>
  )
}
