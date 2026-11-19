import { useCallback, useEffect, useState, type JSX, type ReactNode } from 'react'
import { useAuth } from '@clerk/react'
import { waitForAiAuthToken } from '../services/aiAuthBridge'

type AdminUserRow = {
  userId: string
  email: string | null
  name: string | null
  aiBanned: boolean
  usedToday: number
  limit: number
  remainingToday: number
}

type LoadState =
  | { status: 'loading' }
  | { status: 'denied' }
  | { status: 'error'; message: string }
  | { status: 'ok'; day: string; users: AdminUserRow[] }

function useAdminAiUsage(): {
  state: LoadState
  busyId: string | null
  setBanned: (userId: string, aiBanned: boolean) => Promise<void>
  reload: () => Promise<void>
} {
  const { isSignedIn } = useAuth()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setState({ status: 'loading' })
    if (!isSignedIn) {
      setState({ status: 'denied' })
      return
    }
    const token = await waitForAiAuthToken(2500)
    if (!token) {
      setState({ status: 'denied' })
      return
    }
    const res = await fetch('/api/admin-ai', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (res.status === 401 || res.status === 403) {
      setState({ status: 'denied' })
      return
    }
    if (!res.ok) {
      let detail = ''
      try {
        const body = (await res.json()) as { error?: string; code?: string }
        detail = body.error || body.code || ''
      } catch {
        /* ignore */
      }
      setState({
        status: 'error',
        message: detail || `Failed to load AI usage (${res.status})`,
      })
      return
    }
    const data = (await res.json()) as { day: string; users: AdminUserRow[] }
    setState({ status: 'ok', day: data.day, users: data.users || [] })
  }, [isSignedIn])

  useEffect(() => {
    void load()
  }, [load])

  const setBanned = async (userId: string, aiBanned: boolean) => {
    setBusyId(userId)
    const token = await waitForAiAuthToken(2500)
    if (!token) {
      setBusyId(null)
      return
    }
    const res = await fetch('/api/admin-ai', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, aiBanned }),
    })
    setBusyId(null)
    if (res.ok) void load()
  }

  return { state, busyId, setBanned, reload: load }
}

function UsageTable({
  users,
  busyId,
  setBanned,
}: {
  users: AdminUserRow[]
  busyId: string | null
  setBanned: (userId: string, aiBanned: boolean) => Promise<void>
}): JSX.Element {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
          <th style={{ padding: '8px 4px' }}>User</th>
          <th style={{ padding: '8px 4px' }}>Today</th>
          <th style={{ padding: '8px 4px' }}>Status</th>
          <th style={{ padding: '8px 4px' }} />
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.userId} style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '10px 4px' }}>
              <div style={{ fontWeight: 600 }}>{u.name || u.email || u.userId.slice(0, 12)}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.email}</div>
            </td>
            <td style={{ padding: '10px 4px' }}>
              {u.usedToday}/{u.limit}
            </td>
            <td style={{ padding: '10px 4px' }}>
              {u.aiBanned ? (
                <span style={{ color: 'var(--text-on-warning)' }}>Banned</span>
              ) : (
                <span style={{ color: 'var(--text-on-success)' }}>Active</span>
              )}
            </td>
            <td style={{ padding: '10px 4px', textAlign: 'right' }}>
              <button
                type="button"
                disabled={busyId === u.userId}
                onClick={() => void setBanned(u.userId, !u.aiBanned)}
                style={{
                  cursor: 'pointer',
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border-color)',
                  background: u.aiBanned ? 'var(--bg-success)' : 'var(--bg-warning)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                }}
              >
                {u.aiBanned ? 'Unban' : 'Ban AI'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function UsageChart({ users }: { users: AdminUserRow[] }): JSX.Element {
  const max = Math.max(1, ...users.map((u) => u.usedToday))
  const top = [...users].sort((a, b) => b.usedToday - a.usedToday).slice(0, 8)
  const totalUsed = users.reduce((s, u) => s + u.usedToday, 0)
  const banned = users.filter((u) => u.aiBanned).length

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          marginBottom: 12,
        }}
      >
        {[
          { label: 'Users', value: String(users.length) },
          { label: 'Gens today', value: String(totalUsed) },
          { label: 'Banned', value: String(banned) },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-section)',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {top.map((u) => (
          <div key={u.userId} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 40px', gap: 8, alignItems: 'center' }}>
            <span
              style={{
                fontSize: 12,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={u.email || u.userId}
            >
              {u.name || u.email || u.userId.slice(0, 10)}
            </span>
            <div style={{ height: 8, background: 'var(--bg-section)', borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(u.usedToday / max) * 100}%`,
                  background: u.aiBanned ? 'var(--border-warning)' : 'var(--button-primary)',
                }}
              />
            </div>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{u.usedToday}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function UsageBody({
  state,
  busyId,
  setBanned,
}: {
  state: LoadState
  busyId: string | null
  setBanned: (userId: string, aiBanned: boolean) => Promise<void>
}): ReactNode {
  if (state.status === 'loading') return <p>Loading…</p>
  if (state.status === 'error') {
    return <p style={{ color: 'var(--text-on-error)' }}>{state.message}</p>
  }
  if (state.status !== 'ok') return null
  if (state.users.length === 0) {
    return (
      <p style={{ color: 'var(--text-secondary)' }}>No AI quota keys found for recent days.</p>
    )
  }
  return (
    <>
      <UsageChart users={state.users} />
      <UsageTable users={state.users} busyId={busyId} setBanned={setBanned} />
    </>
  )
}

/** Account page block — renders nothing unless the signed-in user is an admin. */
export function AdminAiSection(): JSX.Element | null {
  const { state, busyId, setBanned } = useAdminAiUsage()

  if (state.status === 'denied') return null
  if (state.status === 'loading') return null

  const day = state.status === 'ok' ? state.day : '—'

  return (
    <section
      style={{
        marginBottom: 28,
        padding: 20,
        borderRadius: 12,
        border: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
      }}
    >
      <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Admin · Hosted AI</h2>
      <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        Ban sets Clerk <code>privateMetadata.aiBanned</code>. Visible only to admins (
        <code>ADMIN_USER_IDS</code> or <code>metadata.role=admin</code>).
      </p>
      <p style={{ margin: '0 0 12px', color: 'var(--text-secondary)', fontSize: 13 }}>
        UTC day {day}
      </p>
      <UsageBody state={state} busyId={busyId} setBanned={setBanned} />
    </section>
  )
}

interface AdminAiPanelProps {
  onClose?: () => void
}

/** Modal variant (optional). Same admin gate on the API. */
export function AdminAiPanel({ onClose }: AdminAiPanelProps): JSX.Element | null {
  const { state, busyId, setBanned } = useAdminAiUsage()

  if (state.status === 'denied') return null

  const day = state.status === 'ok' ? state.day : '—'

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(720px, 100%)',
          maxHeight: '85vh',
          overflow: 'auto',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          padding: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Admin · Hosted AI usage</h2>
            <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
              UTC day {day} · ban sets Clerk <code>privateMetadata.aiBanned</code>
            </p>
          </div>
          {onClose && (
            <button type="button" onClick={onClose} style={{ cursor: 'pointer' }}>
              Close
            </button>
          )}
        </div>
        <UsageBody state={state} busyId={busyId} setBanned={setBanned} />
      </div>
    </div>
  )
}
