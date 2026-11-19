import { useEffect, useState, type CSSProperties, type JSX } from 'react'
import { useAuth } from '@clerk/react'
import { BYO_KEYS_CHANGED_EVENT, byoAiKeys } from '../services/byoAiKeys'
import {
  AI_QUOTA_UPDATED_EVENT,
  type AiQuotaStatus,
  fetchUserCloud,
} from '../services/userCloudSync'

const QUOTA_CACHE_KEY = 'rm-ai-quota-cache'

function readCachedQuota(): AiQuotaStatus | null {
  try {
    const raw = sessionStorage.getItem(QUOTA_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AiQuotaStatus
    if (
      typeof parsed?.remaining === 'number' &&
      typeof parsed?.limit === 'number' &&
      typeof parsed?.available === 'boolean'
    ) {
      return parsed
    }
  } catch {
    // ignore
  }
  return null
}

function writeCachedQuota(quota: AiQuotaStatus): void {
  try {
    sessionStorage.setItem(QUOTA_CACHE_KEY, JSON.stringify(quota))
  } catch {
    // ignore
  }
}

const badgeBase: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  padding: '4px 8px',
  borderRadius: 6,
  border: '1px solid var(--border-color)',
  display: 'inline-flex',
  alignItems: 'center',
  alignSelf: 'center',
  minHeight: 24,
  lineHeight: 1.25,
  boxSizing: 'border-box',
  whiteSpace: 'nowrap',
}

/** Shows remaining free hosted AI generations for the signed-in user. */
export function AiQuotaBadge(): JSX.Element {
  const { isLoaded, isSignedIn } = useAuth()
  const [usingByo, setUsingByo] = useState(() => byoAiKeys.hasAny())
  const [quota, setQuota] = useState<AiQuotaStatus | null>(() => readCachedQuota())
  const [loading, setLoading] = useState(() => !readCachedQuota())

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
      if (!detail) return
      writeCachedQuota(detail)
      setQuota(detail)
      setLoading(false)
    }
    window.addEventListener(AI_QUOTA_UPDATED_EVENT, onQuota)
    return () => window.removeEventListener(AI_QUOTA_UPDATED_EVENT, onQuota)
  }, [])

  useEffect(() => {
    if (!isLoaded || !isSignedIn || usingByo) {
      setLoading(false)
      if (usingByo) setQuota(null)
      return
    }
    let cancelled = false
    // Only show the loading chip when we have nothing cached yet
    if (!readCachedQuota()) setLoading(true)
    void (async () => {
      const data = await fetchUserCloud()
      if (cancelled) return
      if (data?.quota) {
        writeCachedQuota(data.quota)
        setQuota(data.quota)
      }
      setLoading(false)
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
          ...badgeBase,
          background: 'var(--bg-success)',
          color: 'var(--text-on-success)',
        }}
        title="Using your own API key in this browser — hosted free quota is not used."
      >
        Own API key
      </span>
    )
  }

  // Reserve space so the row doesn’t jump when the network responds
  if (loading && !quota) {
    return (
      <span
        aria-hidden
        style={{
          ...badgeBase,
          background: 'var(--bg-section)',
          color: 'transparent',
          minWidth: 132,
          userSelect: 'none',
        }}
      >
        …
      </span>
    )
  }

  if (!quota?.available) return <></>

  const low = quota.remaining <= 2
  const empty = quota.remaining <= 0

  return (
    <span
      style={{
        ...badgeBase,
        background: empty ? 'var(--bg-warning)' : low ? 'var(--bg-info, var(--bg-section))' : 'var(--bg-section)',
        color: empty ? 'var(--text-on-warning)' : 'var(--text-secondary)',
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
