import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  emptySnapshot,
  mergeLiveProgress,
  mergeProgress,
  mergeQuizResume,
  mergeSettings,
  mergeSnapshots,
  normalizeLiveProgress,
  normalizeProgress,
  normalizeQuizResume,
  normalizeSettings,
  parseSnapshot,
  sanitizeIncomingSnapshot,
  type CloudQuizResume,
  type CloudSettings,
  type ProgressData,
} from './userCloud'

const baseProgress = (partial: Partial<ProgressData> = {}): ProgressData => ({
  completedDays: [],
  completedQuizzes: {},
  currentStreak: 0,
  lastActivityDate: '',
  quizScores: {},
  ...partial,
})

const quizResume = (partial: Partial<CloudQuizResume> = {}): CloudQuizResume => ({
  day: 1,
  currentQuestionIndex: 0,
  selectedAnswer: null,
  score: 0,
  completed: false,
  localQuestionsCompleted: false,
  aiEnabled: false,
  aiQuestionsLoaded: false,
  allQuestions: [{ id: 'q1', question: 'Q?', options: ['a', 'b'], correctAnswer: 0 }],
  usedLocalQuestionIds: ['q1'],
  incorrectAnswerIds: [],
  totalTimeSpent: 0,
  at: Date.now(),
  ...partial,
})

afterEach(() => {
  vi.useRealTimers()
})

describe('normalizeProgress / mergeProgress', () => {
  it('unions completed days and takes max quiz scores', () => {
    const a = baseProgress({
      completedDays: [1, 3],
      quizScores: { day1: 70, day2: 50 },
      currentStreak: 2,
      lastActivityDate: '2026-11-18',
    })
    const b = baseProgress({
      completedDays: [2, 3],
      quizScores: { day1: 90, day3: 80 },
      currentStreak: 5,
      lastActivityDate: '2026-11-19',
    })
    const merged = mergeProgress(a, b)
    expect(merged.completedDays).toEqual([1, 2, 3])
    expect(merged.quizScores).toEqual({ day1: 90, day2: 50, day3: 80 })
    expect(merged.currentStreak).toBe(5)
    expect(merged.lastActivityDate).toBe('2026-11-19')
  })

  it('normalizes junk input safely', () => {
    expect(normalizeProgress(null)).toEqual(baseProgress())
    expect(normalizeProgress({ completedDays: ['x', 2, 2], quizScores: { a: 'nope', b: 10 } })).toEqual(
      baseProgress({ completedDays: [2], quizScores: { b: 10 } }),
    )
  })
})

describe('mergeSettings (theme / focus / onboarding)', () => {
  it('prefers explicit theme over auto', () => {
    expect(
      mergeSettings(
        { theme: 'dark', updatedAt: '2026-01-01T00:00:00.000Z' },
        { theme: 'auto', updatedAt: '2026-12-01T00:00:00.000Z' },
      ).theme,
    ).toBe('dark')
    expect(
      mergeSettings(
        { theme: 'auto', updatedAt: '2026-12-01T00:00:00.000Z' },
        { theme: 'light', updatedAt: '2026-01-01T00:00:00.000Z' },
      ).theme,
    ).toBe('light')
  })

  it('last-write-wins for theme when both are explicit (wipe device loses)', () => {
    const wiped: CloudSettings = {
      theme: 'light',
      studyMode: false,
      updatedAt: new Date(0).toISOString(),
    }
    const cloud: CloudSettings = {
      theme: 'dark',
      studyMode: true,
      onboardingComplete: true,
      updatedAt: '2026-11-19T12:00:00.000Z',
    }
    const merged = mergeSettings(wiped, cloud)
    expect(merged.theme).toBe('dark')
    expect(merged.studyMode).toBe(true)
    expect(merged.onboardingComplete).toBe(true)
  })

  it('keeps onboardingComplete once true on either side', () => {
    expect(
      mergeSettings(
        { theme: 'auto', onboardingComplete: true, updatedAt: '2026-01-01T00:00:00.000Z' },
        { theme: 'auto', onboardingComplete: false, updatedAt: '2026-12-01T00:00:00.000Z' },
      ).onboardingComplete,
    ).toBe(true)
  })

  it('normalizes invalid theme to auto', () => {
    expect(normalizeSettings({ theme: 'neon' }).theme).toBe('auto')
  })
})

describe('quiz resume', () => {
  it('drops stale resumes (> 30 min)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-19T12:00:00.000Z'))
    const stale = quizResume({ at: Date.now() - 31 * 60_000 })
    expect(normalizeQuizResume(stale)).toBeNull()
  })

  it('keeps fresh resume and caps question list', () => {
    const many = Array.from({ length: 50 }, (_, i) => ({ id: `q${i}` }))
    const normalized = normalizeQuizResume(quizResume({ allQuestions: many, at: Date.now() }))
    expect(normalized).not.toBeNull()
    expect(normalized!.allQuestions).toHaveLength(40)
  })

  it('newer at wins when both valid', () => {
    const older = quizResume({ day: 1, score: 1, at: Date.now() - 60_000 })
    const newer = quizResume({ day: 2, score: 5, at: Date.now() })
    expect(mergeQuizResume(older, newer)?.day).toBe(2)
    expect(mergeQuizResume(newer, older)?.score).toBe(5)
  })

  it('returns null for empty questions / bad day', () => {
    expect(normalizeQuizResume(quizResume({ allQuestions: [] }))).toBeNull()
    expect(normalizeQuizResume(quizResume({ day: 0 }))).toBeNull()
    expect(normalizeQuizResume(null)).toBeNull()
  })
})

describe('live progress', () => {
  it('newer updatedAt wins; percent clamped', () => {
    const a = normalizeLiveProgress({ day: 1, percent: 99, updatedAt: '2026-11-19T10:00:00.000Z' })
    const b = normalizeLiveProgress({ day: 1, percent: 40, updatedAt: '2026-11-19T11:00:00.000Z' })
    expect(a?.percent).toBe(80)
    expect(mergeLiveProgress(a, b)?.percent).toBe(40)
  })

  it('accepts tombstone percent null', () => {
    const t = normalizeLiveProgress({ day: 1, percent: null, updatedAt: '2026-11-19T11:00:00.000Z' })
    expect(t).toEqual({ day: 1, percent: null, updatedAt: '2026-11-19T11:00:00.000Z' })
  })
})

describe('mergeSnapshots / sanitize / parse', () => {
  it('merges empty local with cloud without wiping cloud prefs', () => {
    const cloud = {
      ...emptySnapshot(),
      updatedAt: '2026-11-19T10:00:00.000Z',
      progress: baseProgress({ completedDays: [1] }),
      settings: {
        theme: 'dark' as const,
        onboardingComplete: true,
        studyMode: true,
        updatedAt: '2026-11-19T10:00:00.000Z',
      },
      helpfulVotes: { 'post-a': true },
      analytics: [{ event: 'probe', timestamp: 100 }],
    }
    const local = {
      ...emptySnapshot(),
      updatedAt: new Date().toISOString(),
      settings: {
        theme: 'light' as const,
        studyMode: false,
        updatedAt: new Date(0).toISOString(),
      },
      helpfulVotes: {},
      analytics: [],
    }
    const merged = mergeSnapshots(local, cloud)
    expect(merged.progress.completedDays).toContain(1)
    expect(merged.settings?.theme).toBe('dark')
    expect(merged.settings?.studyMode).toBe(true)
    expect(merged.helpfulVotes?.['post-a']).toBe(true)
    expect(merged.analytics).toEqual(
      expect.arrayContaining([expect.objectContaining({ event: 'probe' })]),
    )
  })

  it('ORs helpful votes and dedupes analytics by event+timestamp', () => {
    const merged = mergeSnapshots(
      {
        ...emptySnapshot(),
        helpfulVotes: { a: true, b: false },
        analytics: [
          { event: 'x', timestamp: 1 },
          { event: 'x', timestamp: 1 },
        ],
      },
      {
        ...emptySnapshot(),
        helpfulVotes: { b: true, c: true },
        analytics: [{ event: 'x', timestamp: 1 }, { event: 'y', timestamp: 2 }],
      },
    )
    expect(merged.helpfulVotes).toEqual({ a: true, b: true, c: true })
    expect(merged.analytics).toHaveLength(2)
  })

  it('merges notes by id with newer stamp', () => {
    const merged = mergeSnapshots(
      {
        ...emptySnapshot(),
        notes: [{ id: 'n1', text: 'local', updatedAt: '2026-11-19T12:00:00.000Z' }],
      },
      {
        ...emptySnapshot(),
        notes: [{ id: 'n1', text: 'cloud', updatedAt: '2026-11-19T10:00:00.000Z' }],
      },
    )
    expect(merged.notes).toEqual([
      expect.objectContaining({ id: 'n1', text: 'local' }),
    ])
  })

  it('sanitize caps arrays and rejects non-objects', () => {
    expect(sanitizeIncomingSnapshot(null)).toBeNull()
    expect(sanitizeIncomingSnapshot('nope')).toBeNull()
    const huge = Array.from({ length: 600 }, (_, i) => ({ id: `n${i}` }))
    const snap = sanitizeIncomingSnapshot({
      progress: baseProgress(),
      notes: huge,
      analytics: Array.from({ length: 500 }, (_, i) => ({ event: `e${i}`, timestamp: i + 1 })),
    })
    expect(snap).not.toBeNull()
    expect((snap!.notes as unknown[]).length).toBe(500)
    expect((snap!.analytics as unknown[]).length).toBe(400)
  })

  it('parseSnapshot returns null on invalid JSON / shape', () => {
    expect(parseSnapshot(null)).toBeNull()
    expect(parseSnapshot('{')).toBeNull()
    expect(parseSnapshot('"string"')).toBeNull()
    const ok = parseSnapshot(
      JSON.stringify({
        updatedAt: '2026-11-19T00:00:00.000Z',
        progress: baseProgress({ completedDays: [7] }),
      }),
    )
    expect(ok?.progress.completedDays).toEqual([7])
  })
})
