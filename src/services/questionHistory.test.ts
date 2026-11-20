import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { QuizQuestion } from '../types/challenges'

const KEY = 'react-mastery-question-history'

type QH = (typeof import('./questionHistory'))['questionHistory']
let qh: QH

const q = (id: string, extra: Partial<QuizQuestion> = {}): QuizQuestion => ({
  id,
  question: 'Q?',
  options: ['a', 'b'],
  correctAnswer: 0,
  explanation: 'because',
  ...extra,
})

beforeEach(async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-19T12:00:00Z'))
  vi.resetModules()
  qh = (await import('./questionHistory')).questionHistory
})

afterEach(() => {
  vi.useRealTimers()
})

describe('construction / persistence', () => {
  it('loads persisted entries', async () => {
    localStorage.setItem(KEY, JSON.stringify([['day01-q1', { questionId: 'day01-q1', answeredCorrectly: true }]]))
    vi.resetModules()
    const fresh = (await import('./questionHistory')).questionHistory
    expect(fresh.getHistory('day01-q1')?.answeredCorrectly).toBe(true)
  })

  it('warns and starts empty on corrupt storage', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem(KEY, '{bad')
    vi.resetModules()
    const fresh = (await import('./questionHistory')).questionHistory
    expect(fresh.toJSON()).toEqual([])
    expect(warn).toHaveBeenCalled()
  })

  it('warns if saving fails', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    qh.recordAnswer(q('day01-q1'), true, 5)
    expect(warn).toHaveBeenCalled()
  })

  it('clear wipes memory and storage', () => {
    qh.recordAnswer(q('day01-q1'), true, 5)
    expect(localStorage.getItem(KEY)).not.toBeNull()
    qh.clear()
    expect(qh.toJSON()).toEqual([])
    expect(localStorage.getItem(KEY)).toBeNull()
  })
})

describe('canonicalId', () => {
  it('strips session duplicate suffixes only', () => {
    expect(qh.canonicalId('day03-q1-duplicate-123-0')).toBe('day03-q1')
    expect(qh.canonicalId('day03-q1-DUPLICATE-9-12')).toBe('day03-q1')
    expect(qh.canonicalId('day03-q1')).toBe('day03-q1')
    expect(qh.canonicalId('day03-duplicate-1-2-q1')).toBe('day03-duplicate-1-2-q1')
  })
})

describe('recordAnswer', () => {
  it('creates and updates entries, inferring day from id', () => {
    qh.recordAnswer(q('day02-q3', { difficulty: 'hard' }), false, 12)
    let e = qh.getHistory('day02-q3')!
    expect(e).toMatchObject({
      answeredCorrectly: false,
      attempts: 1,
      timeSpent: 12,
      day: 2,
      difficulty: 'hard',
    })

    vi.setSystemTime(new Date('2026-11-19T12:05:00Z'))
    qh.recordAnswer(q('day02-q3'), true, 7, undefined, 'reconciliation')
    e = qh.getHistory('day02-q3')!
    expect(e).toMatchObject({
      answeredCorrectly: true,
      attempts: 2,
      timeSpent: 7,
      day: 2,
      difficulty: 'hard',
      topic: 'reconciliation',
      lastSeen: Date.now(),
    })
  })

  it('prefers explicit day/topic and canonicalizes duplicate ids', () => {
    qh.recordAnswer(q('custom-q-duplicate-1-2'), true, 3, 9, 'topic')
    expect(qh.getHistory('custom-q')).toMatchObject({ day: 9, topic: 'topic', questionId: 'custom-q' })
    qh.recordAnswer(q('custom-q'), true, 3)
    expect(qh.getHistory('custom-q')?.attempts).toBe(2)
    expect(qh.getHistory('custom-q-duplicate-5-5')?.attempts).toBe(2)
  })

  it('leaves day undefined when it cannot be inferred', () => {
    qh.recordAnswer(q('misc'), true, 1)
    expect(qh.getHistory('misc')?.day).toBeUndefined()
  })

  it('getHistory returns null for unknown ids', () => {
    expect(qh.getHistory('nope')).toBeNull()
  })

  it('getHistory falls back to raw id for non-canonical keys', () => {
    qh.mergeFromEntries([{ questionId: 'x', attempts: 1 }])
    expect(qh.getHistory('x')).not.toBeNull()
  })
})

describe('queries', () => {
  beforeEach(() => {
    qh.recordAnswer(q('day01-q1'), true, 10)
    vi.setSystemTime(new Date('2026-11-19T12:01:00Z'))
    qh.recordAnswer(q('day01-q2'), false, 20)
    vi.setSystemTime(new Date('2026-11-19T12:02:00Z'))
    qh.recordAnswer(q('day02-q1'), false, 30)
  })

  it('getAllQuestions sorts newest first', () => {
    expect(qh.getAllQuestions().map((e) => e.questionId)).toEqual(['day02-q1', 'day01-q2', 'day01-q1'])
  })

  it('getIncorrectQuestions returns only wrong, newest first', () => {
    expect(qh.getIncorrectQuestions().map((e) => e.questionId)).toEqual(['day02-q1', 'day01-q2'])
  })

  it('getQuestionsByDay', () => {
    expect(qh.getQuestionsByDay(1)).toHaveLength(2)
    expect(qh.getQuestionsByDay(5)).toEqual([])
  })

  it('getSeenQuestionIds, optionally scoped by day', () => {
    expect([...qh.getSeenQuestionIds()].sort()).toEqual(['day01-q1', 'day01-q2', 'day02-q1'])
    expect([...qh.getSeenQuestionIds(2)]).toEqual(['day02-q1'])
    qh.recordAnswer(q('misc'), true, 1)
    expect(qh.getSeenQuestionIds(2).has('misc')).toBe(true) // entries without day are never filtered
  })

  it('getStats aggregates, and handles empty', () => {
    expect(qh.getStats()).toMatchObject({
      totalQuestions: 3,
      correctAnswers: 1,
      incorrectAnswers: 2,
      averageTime: 20,
    })
    expect(qh.getStats().accuracy).toBeCloseTo(33.33, 1)
    qh.clear()
    expect(qh.getStats()).toEqual({
      totalQuestions: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      averageTime: 0,
      accuracy: 0,
    })
  })

  it('getQuestionsByDayWithStats groups by day (0 for unknown)', () => {
    qh.recordAnswer(q('misc'), true, 4)
    const stats = qh.getQuestionsByDayWithStats()
    expect(stats[1]).toEqual({ total: 2, correct: 1, incorrect: 1, accuracy: 50, averageTime: 15 })
    expect(stats[2]).toMatchObject({ total: 1, correct: 0, accuracy: 0 })
    expect(stats[0]).toMatchObject({ total: 1, correct: 1, accuracy: 100, averageTime: 4 })
  })

  it('getQuestionsNeedingReview prioritizes incorrect then oldest, includes stale correct', () => {
    vi.setSystemTime(new Date('2026-11-30T12:00:00Z')) // everything >= 7 days old
    qh.recordAnswer(q('day03-fresh'), true, 1) // fresh + correct → not included
    const ids = qh.getQuestionsNeedingReview().map((e) => e.questionId)
    expect(ids).toEqual(['day01-q2', 'day02-q1', 'day01-q1'])
  })
})

describe('pickUnseenQuestions', () => {
  const pool = [{ id: 'day01-q1' }, { id: 'day01-q2' }, { id: 'day01-q3' }]

  it('returns only fresh questions, excluding seen + excluded ids', () => {
    qh.recordAnswer(q('day01-q1'), true, 1)
    const out = qh.pickUnseenQuestions(pool, new Set(['day01-q2']), 5)
    expect(out.map((p) => p.id)).toEqual(['day01-q3'])
  })

  it('respects count and non-positive count', () => {
    expect(qh.pickUnseenQuestions(pool, new Set(), 2)).toHaveLength(2)
    expect(qh.pickUnseenQuestions(pool, new Set(), 0)).toEqual([])
    expect(qh.pickUnseenQuestions(pool, new Set(), -3)).toEqual([])
  })

  it('falls back to still-missed questions when nothing fresh', () => {
    qh.recordAnswer(q('day01-q1'), true, 1)
    qh.recordAnswer(q('day01-q2'), false, 1)
    qh.recordAnswer(q('day01-q3'), false, 1)
    const out = qh.pickUnseenQuestions(pool, new Set(['day01-q3']), 5)
    expect(out.map((p) => p.id)).toEqual(['day01-q2'])
  })

  it('remiss (correct → later wrong) returns the id to the miss pool', () => {
    for (const p of pool) qh.recordAnswer(q(p.id), true, 1)
    expect(qh.pickUnseenQuestions(pool, new Set(), 5)).toEqual([])

    qh.recordAnswer(q('day01-q2'), false, 2)
    expect(qh.getHistory('day01-q2')?.answeredCorrectly).toBe(false)
    expect(qh.pickUnseenQuestions(pool, new Set(), 5).map((p) => p.id)).toEqual(['day01-q2'])
  })

  it('returns nothing when everything is mastered or excluded', () => {
    for (const p of pool) qh.recordAnswer(q(p.id), true, 1)
    expect(qh.pickUnseenQuestions(pool, new Set(), 5)).toEqual([])
  })

  it('scopes seen ids by day', () => {
    qh.recordAnswer(q('day02-q1'), true, 1)
    const out = qh.pickUnseenQuestions([{ id: 'day02-q1' }], new Set(), 3, 1)
    expect(out.map((p) => p.id)).toEqual(['day02-q1'])
  })
})

describe('mergeFromEntries / toJSON', () => {
  it('ignores non-arrays and junk rows', () => {
    qh.mergeFromEntries('nope')
    qh.mergeFromEntries([null, 5, { questionId: '' }, { questionId: 3 }])
    expect(qh.toJSON()).toEqual([])
  })

  it('adds new entries with sanitized fields', () => {
    qh.mergeFromEntries([
      {
        questionId: 'day04-q1-duplicate-1-1',
        answeredCorrectly: 1,
        timestamp: 'x',
        timeSpent: '5',
        attempts: 2.9,
        lastSeen: 100,
        difficulty: 'easy',
        day: 4,
        topic: 'memo',
      },
      { questionId: 'day04-q2', attempts: -3, day: 'x', topic: 5 },
    ])
    const [a, b] = qh.toJSON()
    expect(a).toMatchObject({
      questionId: 'day04-q1',
      answeredCorrectly: true,
      timeSpent: 5,
      attempts: 2,
      lastSeen: 100,
      difficulty: 'easy',
      day: 4,
      topic: 'memo',
      timestamp: Date.now(),
    })
    expect(b).toMatchObject({ attempts: 0, day: undefined, topic: undefined, answeredCorrectly: false })
    expect(JSON.parse(localStorage.getItem(KEY)!)).toHaveLength(2)
  })

  it('prefers incoming with more attempts but keeps correctness once achieved', () => {
    qh.mergeFromEntries([{ questionId: 'a', answeredCorrectly: true, attempts: 1, lastSeen: 10 }])
    qh.mergeFromEntries([{ questionId: 'a', answeredCorrectly: false, attempts: 3, lastSeen: 5, timeSpent: 9 }])
    expect(qh.getHistory('a')).toMatchObject({
      answeredCorrectly: true,
      attempts: 3,
      lastSeen: 5,
      timeSpent: 9,
    })
  })

  it('prefers incoming on equal attempts when newer', () => {
    qh.mergeFromEntries([{ questionId: 'a', attempts: 2, lastSeen: 10, timeSpent: 1 }])
    qh.mergeFromEntries([{ questionId: 'a', attempts: 2, lastSeen: 20, timeSpent: 2 }])
    expect(qh.getHistory('a')?.timeSpent).toBe(2)
  })

  it('keeps existing when incoming is older, but upgrades correctness', () => {
    qh.mergeFromEntries([{ questionId: 'a', answeredCorrectly: false, attempts: 5, lastSeen: 50, timeSpent: 1 }])
    qh.mergeFromEntries([{ questionId: 'a', answeredCorrectly: true, attempts: 1, lastSeen: 10, timeSpent: 99 }])
    expect(qh.getHistory('a')).toMatchObject({ answeredCorrectly: true, attempts: 5, timeSpent: 1 })
    qh.mergeFromEntries([{ questionId: 'a', answeredCorrectly: false, attempts: 1, lastSeen: 10 }])
    expect(qh.getHistory('a')?.answeredCorrectly).toBe(true)
  })

  it('toJSON returns an array snapshot of entries', () => {
    qh.recordAnswer(q('day01-q1'), true, 1)
    const json = qh.toJSON()
    expect(Array.isArray(json)).toBe(true)
    expect(json[0].questionId).toBe('day01-q1')
  })
})
