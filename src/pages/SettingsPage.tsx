import { useRef, useState, type ChangeEvent, type JSX } from 'react'
import {
  downloadLearnerDataBackup,
  importLearnerData,
  readBackupFile,
  resetLearnerData,
  summarizeImport,
} from '../services/learnerData'
import { AdminAiSection } from '../components/AdminAiPanel'

interface SettingsPageProps {
  onBack: () => void
}

export default function SettingsPage({ onBack }: SettingsPageProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dataStatus, setDataStatus] = useState<string | null>(null)
  const buttonBaseStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    background: 'var(--bg-section)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left',
    marginBottom: 8,
  }

  const sectionStyle: React.CSSProperties = {
    marginBottom: 28,
    padding: 20,
    borderRadius: 12,
    border: '1px solid var(--border-color)',
    background: 'var(--bg-card)',
  }

  const handleExportData = (): void => {
    downloadLearnerDataBackup()
    setDataStatus('Backup downloaded')
  }

  const handleImportClick = (): void => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    try {
      const backup = await readBackupFile(file)
      const result = importLearnerData(backup)
      const summary = summarizeImport(result)
      const shouldReload = result.restoredKeys.length > 0
      setDataStatus(shouldReload ? `${summary}. Reloading…` : summary)
      if (shouldReload) {
        window.setTimeout(() => window.location.reload(), 1200)
      }
    } catch (err) {
      setDataStatus(err instanceof Error ? err.message : 'Import failed')
    }
  }

  const handleResetData = (): void => {
    const ok = window.confirm(
      'Reset all learner data on this device?\n\nThis clears progress, notes, reflections, flashcards, snippets, and local analytics. This cannot be undone unless you exported a backup first.',
    )
    if (!ok) return
    resetLearnerData()
    setDataStatus('All data cleared — reloading…')
    window.setTimeout(() => window.location.reload(), 600)
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '8px 4px 40px', width: '100%', boxSizing: 'border-box' }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          marginBottom: 16,
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
          background: 'var(--bg-section)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        ← Back to lab
      </button>

      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Account &amp; data</h1>
        <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.5 }}>
          Export backups, reset this device, and manage hosted AI (admin). Theme and BYO keys stay in the
          quick Settings modal.
        </p>
      </header>

      <section style={sectionStyle}>
        <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>Your data</h2>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Progress and tools stay in this browser. When signed in, progress, notes, reflections, flashcards,
          snippets, and last lab location sync to your account. Export a backup before clearing site data.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={(e) => void handleImportFile(e)}
        />
        <button type="button" onClick={handleExportData} style={buttonBaseStyle}>
          Export backup
          <div style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginTop: 4 }}>
            Download all learner data as JSON
          </div>
        </button>
        <button type="button" onClick={handleImportClick} style={buttonBaseStyle}>
          Import backup
          <div style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginTop: 4 }}>
            Restore from a previous export (reloads the app)
          </div>
        </button>
        <button
          type="button"
          onClick={handleResetData}
          style={{
            ...buttonBaseStyle,
            marginBottom: 0,
            borderColor: 'var(--bg-error)',
          }}
        >
          Reset all data
          <div style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginTop: 4 }}>
            Clears progress, notes, reflections, and local analytics on this device
          </div>
        </button>
        {dataStatus && (
          <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>{dataStatus}</p>
        )}
      </section>

      <AdminAiSection />
    </div>
  )
}
