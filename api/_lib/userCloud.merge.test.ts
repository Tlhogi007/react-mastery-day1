import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  emptyProgress,
  emptySettings,
  emptySnapshot,
  mergeLiveProgress,
  mergeProgress,
  mergeQuizResume,
  mergeSnapshots,
  normalizeLiveProgress,
  normalizeProgress,
  parseSnapshot,
  sanitizeIncomingSnapshot,
  userCloudKey,
  USER_CLOUD_KEY_PREFIX,
  type CloudQuizResume,
  type UserCloudSnapshot,
} from './userCloud'

afterEach(() => {
  vi.useRealTimers()
})

const resume = (p: Partial<CloudQuizResume> = {}): CloudQuizResume => ({
  day: 1,
  currentQuestionIndex: 0,
  selectedAnswer: null,
  score: 0,
  completed: false,
  localQuestionsCompleted: false,
  aiEnabled: false,
  aiQuestionsLoaded: false,
  allQuestions: [{ id: 'q' }],
  usedLocalQuestionIds: [],
  incorrectAnswerIds: [],
  totalTimeSpent: 0,
  at: Date.now(),
  ...p,
})

describe('keys & empties', () => {
  it('builds per-user key', () => {
    expect(USER_CLOUD_KEY_PREFIX).toBe('rm:user:')
    expect(userCloudKey('u1')).toBe('rm:user:u1:v1')
  })

  it('empty helpers are fresh objects', () => {
    expect(emptyProgress()).not.toBe(emptyProgress())
    expect(emptySettings().theme).toBe('auto')
    expect(emptySnapshot().version).toBe(1)
  })
})

describe('live progress', () => {
  it('normalizes and clamps', () => {
    expect(normalizeLiveProgress(null)).toBeNull()
    expect(normalizeLiveProgress({ day: 0, updatedAt: 'x' })).toBeNull()
    expect(normalizeLiveProgress({ day: 1 })).toBeNull()
    expect(normalizeLiveProgress({ day: 1, percent: 'abc', updatedAt: 'x' })).toBeNull()
    expect(normalizeLiveProgress({ day: 1, percent: null, updatedAt: 'x' })).toEqual({
      day: 1,
      percent: null,
      updatedAt: 'x',
    })
    expect(normalizeLiveProgress({ day: 2, percent: 120.4, updatedAt: 'x' })?.percent).toBe(80)
    expect(normalizeLiveProgress({ day: 2, percent: -5, updatedAt: 'x' })?.percent).toBe(0)
  })

  it('merges newest-wins with null handling', () => {
    const a = { day: 1, percent: 10, updatedAt: '2026-01-01' }
    const b = { day: 1, percent: 20, updatedAt: '2026-02-01' }
    expect(mergeLiveProgress(null, null)).toBeNull()
    expect(mergeLiveProgress(a, null)).toBe(a)
    expect(mergeLiveProgress(undefined, b)).toBe(b)
    expect(mergeLiveProgress(a, b)).toBe(b)
    expect(mergeLiveProgress(b, a)).toBe(b)
  })
})

describe('progress edge cases', () => {
  it('normalizeProgress sanitizes everything', () => {
    expect(
      normalizeProgress({
        completedDays: [3, 1, 3, 'x'],
        completedQuizzes: { a: true, b: 'yes' },
        quizScores: { a: '5', b: 'x' },
        currentStreak: -4.7,
        lastActivityDate: 7,
      }),
    ).toEqual({
      completedDays: [1, 3],
      completedQuizzes: { a: true },
      currentStreak: 0,
      lastActivityDate: '',
      quizScores: { a: 5 },
    })
    expect(normalizeProgress([])).toEqual(emptyProgress())
  })

  it('mergeProgress falls back to the non-empty last activity date', () => {
    const a = { ...emptyProgress(), lastActivityDate: '' }
    const b = { ...emptyProgress(), lastActivityDate: '2026-01-01' }
    expect(mergeProgress(a, b).lastActivityDate).toBe('2026-01-01')
    expect(mergeProgress(b, a).lastActivityDate).toBe('2026-01-01')
  })
})

describe('mergeQuizResume', () => {
  it('handles nulls and picks the newest', () => {
    const old = resume({ at: Date.now() - 1000, score: 1 })
    const fresh = resume({ at: Date.now(), score: 2 })
    expect(mergeQuizResume(null, null)).toBeNull()
    expect(mergeQuizResume(old, null)?.score).toBe(1)
    expect(mergeQuizResume(null, fresh)?.score).toBe(2)
    expect(mergeQuizResume(old, fresh)?.score).toBe(2)
    expect(mergeQuizResume(fresh, old)?.score).toBe(2)
  })
})

describe('mergeSnapshots', () => {
  it('merges items by id (newest stamp wins) and drops invalid rows', () => {
    const local = {
      ...emptySnapshot(),
      notes: [
        { id: 'n1', updatedAt: '2026-02-01', content: 'local' },
        { id: 'n2', createdAt: '2026-01-01' },
        null,
        { noId: true },
      ],
      flashcards: [{ id: 'f1', lastReviewDate: '2026-03-01', v: 'local' }],
    }
    const cloud = {
      ...emptySnapshot(),
      notes: [{ id: 'n1', updatedAt: '2026-01-01', content: 'cloud' }, { id: 'n3' }],
      flashcards: [{ id: 'f1', lastReviewDate: '2026-04-01', v: 'cloud' }],
    }
    const merged = mergeSnapshots(local, cloud)
    const notes = merged.notes as Array<Record<string, unknown>>
    expect(notes.find((n) => n.id === 'n1')?.content).toBe('local')
    expect(notes.map((n) => n.id).sort()).toEqual(['n1', 'n2', 'n3'])
    expect((merged.flashcards as Array<Record<string, unknown>>)[0].v).toBe('cloud')
  })

  it('merges analytics by event+timestamp and caps to 400 sorted', () => {
    const local = {
      ...emptySnapshot(),
      analytics: [
        { event: 'a', timestamp: 2 },
        { event: 'bad' },
        { timestamp: 5 },
        null,
        'x',
      ],
    }
    const cloud = {
      ...emptySnapshot(),
      analytics: [
        { event: 'a', timestamp: 2 },
        { event: 'b', timestamp: 1 },
        ...Array.from({ length: 500 }, (_, i) => ({ event: 'bulk', timestamp: i + 10 })),
      ],
    }
    const merged = mergeSnapshots(local, cloud).analytics as Array<{ timestamp: number }>
    expect(merged).toHaveLength(400)
    expect(merged[merged.length - 1].timestamp).toBe(509)
    const small = mergeSnapshots(local, { ...emptySnapshot(), analytics: [{ event: 'b', timestamp: 1 }] })
    expect((small.analytics as Array<{ timestamp: number }>).map((e) => e.timestamp)).toEqual([1, 2])
  })

  it('merges question history preferring more attempts and OR-ing correctness', () => {
    const local = {
      ...emptySnapshot(),
      questionHistory: [
        { questionId: 'q1-duplicate-1-1', attempts: 1, lastSeen: 5, answeredCorrectly: true },
        { questionId: 'q2', attempts: 4, lastSeen: 5, answeredCorrectly: false },
        { questionId: 'q3', attempts: 2, lastSeen: 1, answeredCorrectly: false },
        null,
        { questionId: 5 },
      ],
    }
    const cloud = {
      ...emptySnapshot(),
      questionHistory: [
        { questionId: 'q1', attempts: 3, lastSeen: 3, answeredCorrectly: false },
        { questionId: 'q2', attempts: 2, lastSeen: 50, answeredCorrectly: true },
        { questionId: 'q3', attempts: 2, lastSeen: 9, answeredCorrectly: false },
      ],
    }
    const hist = mergeSnapshots(local, cloud).questionHistory as Array<Record<string, unknown>>
    const byId = Object.fromEntries(hist.map((h) => [h.questionId as string, h]))
    expect(byId.q1).toMatchObject({ attempts: 3, answeredCorrectly: true })
    expect(byId.q2).toMatchObject({ attempts: 4, answeredCorrectly: true })
    expect(byId.q3).toMatchObject({ lastSeen: 9 })
  })

  it('merges helpful votes (true wins, falsy dropped)', () => {
    const merged = mergeSnapshots(
      { ...emptySnapshot(), helpfulVotes: { a: true, b: false } },
      { ...emptySnapshot(), helpfulVotes: { c: true, b: true } },
    )
    expect(merged.helpfulVotes).toEqual({ a: true, b: true, c: true })
  })

  it('handles null local/cloud and picks the newer lab', () => {
    expect(mergeSnapshots(null, null).progress).toEqual(emptyProgress())
    const lab = (exercise: string) => ({ exercise, view: 'exercises' as const, tools: false })
    const local = { ...emptySnapshot(), updatedAt: '2026-02-01', lab: lab('local') }
    const cloud = { ...emptySnapshot(), updatedAt: '2026-01-01', lab: lab('cloud') }
    expect(mergeSnapshots(local, cloud).lab?.exercise).toBe('local')
    expect(mergeSnapshots({ ...local, updatedAt: '2025-01-01' }, cloud).lab?.exercise).toBe('cloud')
    expect(mergeSnapshots({ ...local, lab: null }, { ...cloud, lab: undefined }).lab).toBeNull()
    expect(mergeSnapshots(undefined, cloud).lab?.exercise).toBe('cloud')
  })
})

describe('parseSnapshot', () => {
  it('returns null for empty / invalid input', () => {
    expect(parseSnapshot(null)).toBeNull()
    expect(parseSnapshot('')).toBeNull()
    expect(parseSnapshot('{bad')).toBeNull()
    expect(parseSnapshot('null')).toBeNull()
  })

  it('normalizes stored snapshots and defaults missing fields', () => {
    const snap = parseSnapshot(JSON.stringify({ progress: { completedDays: [2] }, settings: { theme: 'dark' } }))!
    expect(snap.progress.completedDays).toEqual([2])
    expect(snap.settings?.theme).toBe('dark')
    expect(snap.updatedAt).toBe(new Date(0).toISOString())
    expect(snap.questionHistory).toEqual([])
    expect(snap.notes).toEqual([])
    expect(snap.analytics).toEqual([])
    expect(snap.lab).toBeNull()
    expect(parseSnapshot(JSON.stringify({}))!.settings).toEqual(emptySettings())
  })

  it('keeps provided arrays and timestamps', () => {
    const snap = parseSnapshot(
      JSON.stringify({
        updatedAt: '2026-01-01',
        lab: { exercise: 'x', view: 'exercises', tools: false },
        questionHistory: [1],
        analytics: [2],
        notes: [3],
        helpfulVotes: { a: true, b: 1 },
      }),
    )!
    expect(snap.updatedAt).toBe('2026-01-01')
    expect(snap.lab?.exercise).toBe('x')
    expect(snap.questionHistory).toEqual([1])
    expect(snap.analytics).toEqual([2])
    expect(snap.notes).toEqual([3])
    expect(snap.helpfulVotes).toEqual({ a: true })
  })
})

describe('sanitizeIncomingSnapshot', () => {
  it('rejects non-objects', () => {
    expect(sanitizeIncomingSnapshot(null)).toBeNull()
    expect(sanitizeIncomingSnapshot('x')).toBeNull()
  })

  it('caps arrays and defaults fields', () => {
    const big = (n: number) => Array.from({ length: n }, (_, i) => ({ id: String(i) }))
    const snap = sanitizeIncomingSnapshot({
      questionHistory: big(2500),
      notes: big(600),
      annotations: big(600),
      reflections: big(600),
      flashcards: big(1500),
      snippets: big(600),
      analytics: big(500),
      settings: { theme: 'light' },
    }) as UserCloudSnapshot
    expect(snap.questionHistory).toHaveLength(2000)
    expect(snap.notes).toHaveLength(500)
    expect(snap.annotations).toHaveLength(500)
    expect(snap.reflections).toHaveLength(500)
    expect(snap.flashcards).toHaveLength(1000)
    expect(snap.snippets).toHaveLength(500)
    expect(snap.analytics).toHaveLength(400)
    expect(snap.settings?.theme).toBe('light')
    expect(typeof snap.updatedAt).toBe('string')
  })

  it('treats non-array lists as empty and missing settings as defaults', () => {
    const snap = sanitizeIncomingSnapshot({ notes: 'x', updatedAt: '2026-01-01', lab: { exercise: 'e' } })!
    expect(snap.notes).toEqual([])
    expect(snap.settings).toEqual(emptySettings())
    expect(snap.updatedAt).toBe('2026-01-01')
    expect(snap.lab).toEqual({ exercise: 'e' })
  })
})
