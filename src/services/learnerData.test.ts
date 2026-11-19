import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  LEARNER_DATA_KEYS,
  downloadLearnerDataBackup,
  exportLearnerData,
  importLearnerData,
  parseLearnerBackup,
  readBackupFile,
  resetLearnerData,
  summarizeImport,
} from './learnerData'

afterEach(() => {
  vi.useRealTimers()
})

describe('exportLearnerData', () => {
  it('exports only keys present and skips invalid JSON', () => {
    localStorage.setItem('react-mastery-progress', JSON.stringify({ completedDays: [1] }))
    localStorage.setItem('react-mastery-notes', '{bad')
    const backup = exportLearnerData()
    expect(backup.version).toBe(1)
    expect(backup.data).toEqual({ 'react-mastery-progress': { completedDays: [1] } })
    expect(new Date(backup.exportedAt).toString()).not.toBe('Invalid Date')
  })

  it('exports empty data when nothing is stored', () => {
    expect(exportLearnerData().data).toEqual({})
  })
})

describe('downloadLearnerDataBackup', () => {
  it('creates a download link with dated filename', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-19T12:00:00Z'))
    const create = vi.fn().mockReturnValue('blob:x')
    const revoke = vi.fn()
    ;(URL as unknown as { createObjectURL: unknown }).createObjectURL = create
    ;(URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = revoke
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    downloadLearnerDataBackup()
    expect(create).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    expect(revoke).toHaveBeenCalledWith('blob:x')
  })
})

describe('parseLearnerBackup', () => {
  it('parses valid backups', () => {
    const parsed = parseLearnerBackup(
      JSON.stringify({ version: 1, exportedAt: '2026-01-01', data: { 'react-mastery-progress': {} } }),
    )
    expect(parsed.exportedAt).toBe('2026-01-01')
    expect(parsed.data).toEqual({ 'react-mastery-progress': {} })
  })

  it('fills in missing exportedAt', () => {
    const parsed = parseLearnerBackup(JSON.stringify({ version: 1, data: {} }))
    expect(typeof parsed.exportedAt).toBe('string')
  })

  it('throws on invalid input', () => {
    expect(() => parseLearnerBackup('{bad')).toThrow('Invalid JSON file')
    expect(() => parseLearnerBackup('null')).toThrow('not an object')
    expect(() => parseLearnerBackup('5')).toThrow('not an object')
    expect(() => parseLearnerBackup(JSON.stringify({ version: 2, data: {} }))).toThrow('Unsupported')
    expect(() => parseLearnerBackup(JSON.stringify({ version: 1 }))).toThrow('missing data')
  })
})

describe('importLearnerData / reset / summary', () => {
  it('restores known keys and reports missing', () => {
    const result = importLearnerData({
      version: 1,
      exportedAt: '',
      data: { 'react-mastery-progress': { completedDays: [2] }, 'react-mastery-notes': undefined },
    })
    expect(result.restoredKeys).toEqual(['react-mastery-progress'])
    expect(result.missingKeys).toHaveLength(LEARNER_DATA_KEYS.length - 1)
    expect(JSON.parse(localStorage.getItem('react-mastery-progress')!)).toEqual({ completedDays: [2] })
  })

  it('resetLearnerData removes all keys', () => {
    for (const k of LEARNER_DATA_KEYS) localStorage.setItem(k, '1')
    resetLearnerData()
    for (const k of LEARNER_DATA_KEYS) expect(localStorage.getItem(k)).toBeNull()
  })

  it('summarizeImport covers empty, with progress, and without progress', () => {
    expect(summarizeImport({ restoredKeys: [], missingKeys: [] })).toMatch(/no learner data/)
    expect(summarizeImport({ restoredKeys: ['react-mastery-progress', 'react-mastery-notes'], missingKeys: [] })).toBe(
      'Restored: progress, notes',
    )
    expect(summarizeImport({ restoredKeys: ['react-mastery-notes'], missingKeys: [] })).toMatch(
      /^Restored: notes\. No progress/,
    )
  })

  it('readBackupFile reads and parses File text', async () => {
    const file = {
      text: async () => JSON.stringify({ version: 1, data: {} }),
    } as unknown as File
    expect((await readBackupFile(file)).version).toBe(1)
    await expect(readBackupFile({ text: async () => 'x' } as unknown as File)).rejects.toThrow('Invalid JSON')
  })
})
