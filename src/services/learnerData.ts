/**
 * Unified backup / restore / reset for all browser-local learner data.
 */

export const LEARNER_DATA_KEYS = [
  'react-mastery-progress',
  'react-mastery-settings',
  'react-mastery-notes',
  'react-mastery-annotations',
  'react-mastery-reflections',
  'react-mastery-flashcards',
  'react-mastery-snippets',
  'react-mastery-question-history',
  'react-mastery-analytics',
] as const

export type LearnerDataKey = (typeof LEARNER_DATA_KEYS)[number]

export interface LearnerBackup {
  version: 1
  exportedAt: string
  data: Partial<Record<LearnerDataKey, unknown>>
}

const BACKUP_VERSION = 1 as const

function readKey(key: LearnerDataKey): unknown | undefined {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return undefined
    return JSON.parse(raw) as unknown
  } catch {
    return undefined
  }
}

function writeKey(key: LearnerDataKey, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function exportLearnerData(): LearnerBackup {
  const data: LearnerBackup['data'] = {}
  for (const key of LEARNER_DATA_KEYS) {
    const value = readKey(key)
    if (value !== undefined) {
      data[key] = value
    }
  }
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }
}

export function downloadLearnerDataBackup(): void {
  const backup = exportLearnerData()
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `react-mastery-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function parseLearnerBackup(raw: string): LearnerBackup {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Invalid JSON file')
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Backup file is not an object')
  }

  const backup = parsed as Partial<LearnerBackup>
  if (backup.version !== BACKUP_VERSION) {
    throw new Error(`Unsupported backup version (expected ${BACKUP_VERSION})`)
  }
  if (!backup.data || typeof backup.data !== 'object') {
    throw new Error('Backup is missing data')
  }

  return {
    version: BACKUP_VERSION,
    exportedAt: typeof backup.exportedAt === 'string' ? backup.exportedAt : new Date().toISOString(),
    data: backup.data,
  }
}

export interface ImportResult {
  restoredKeys: LearnerDataKey[]
  missingKeys: LearnerDataKey[]
}

export function importLearnerData(backup: LearnerBackup): ImportResult {
  const restoredKeys: LearnerDataKey[] = []
  const missingKeys: LearnerDataKey[] = []

  for (const key of LEARNER_DATA_KEYS) {
    if (Object.prototype.hasOwnProperty.call(backup.data, key) && backup.data[key] !== undefined) {
      writeKey(key, backup.data[key])
      restoredKeys.push(key)
    } else {
      missingKeys.push(key)
    }
  }

  return { restoredKeys, missingKeys }
}

export function summarizeImport(result: ImportResult): string {
  const label = (key: LearnerDataKey): string => key.replace('react-mastery-', '')
  const restored = result.restoredKeys.map(label)
  const hasProgress = result.restoredKeys.includes('react-mastery-progress')

  if (restored.length === 0) {
    return 'Backup contained no learner data to restore'
  }

  let message = `Restored: ${restored.join(', ')}`
  if (!hasProgress) {
    message += '. No progress in this backup — day completion / quiz scores were empty when it was exported'
  }
  return message
}

export function resetLearnerData(): void {
  for (const key of LEARNER_DATA_KEYS) {
    localStorage.removeItem(key)
  }
}

export async function readBackupFile(file: File): Promise<LearnerBackup> {
  const text = await file.text()
  return parseLearnerBackup(text)
}
