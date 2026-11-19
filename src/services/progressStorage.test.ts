import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// NOTE: getProgress() returns a shallow copy of DEFAULT_PROGRESS when storage is empty, so
// arrays/objects are shared and mutated across calls. Load a fresh module per test for isolation.
let progressStorage: (typeof import('./progressStorage'))['progressStorage']

beforeEach(async () => {
  vi.resetModules()
  progressStorage = (await import('./progressStorage')).progressStorage
})

const KEY = 'react-mastery-progress'
const LIVE = 'rm-live-day-progress'

afterEach(() => {
  vi.useRealTimers()
})

function setDate(iso: string) {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(iso))
}

describe('progressStorage basics', () => {
  it('returns defaults when empty', () => {
    expect(progressStorage.getProgress()).toEqual({
      completedDays: [],
      completedQuizzes: {},
      currentStreak: 0,
      lastActivityDate: '',
      quizScores: {},
    })
  })

  it('sanitizes malformed stored fields', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ completedDays: 'x', completedQuizzes: 'y', quizScores: 'z', currentStreak: 3 }),
    )
    const p = progressStorage.getProgress()
    expect(p.completedDays).toEqual([])
    expect(p.completedQuizzes).toEqual({})
    expect(p.quizScores).toEqual({})
    expect(p.currentStreak).toBe(3)
  })

  it('warns on corrupt JSON and returns defaults', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem(KEY, '{bad')
    expect(progressStorage.getProgress().completedDays).toEqual([])
    expect(warn).toHaveBeenCalled()
  })

  it('saveProgress emits event and warns on failure', () => {
    const spy = vi.fn()
    window.addEventListener('rm-progress-changed', spy)
    progressStorage.saveProgress(progressStorage.getProgress())
    expect(spy).toHaveBeenCalledTimes(1)
    window.removeEventListener('rm-progress-changed', spy)

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    progressStorage.saveProgress(progressStorage.getProgress())
    expect(warn).toHaveBeenCalled()
  })

  it('marks days completed once and counts them', () => {
    progressStorage.markDayCompleted(1)
    progressStorage.markDayCompleted(1)
    progressStorage.markDayCompleted(2)
    expect(progressStorage.getCompletedDaysCount()).toBe(2)
    expect(progressStorage.isDayCompleted(1)).toBe(true)
    expect(progressStorage.isDayCompleted(5)).toBe(false)
  })

  it('records quiz scores and pass state', () => {
    progressStorage.markQuizCompleted('day1', 60)
    expect(progressStorage.isQuizCompleted('day1')).toBe(false)
    expect(progressStorage.getQuizScore('day1')).toBe(60)
    progressStorage.markQuizCompleted('day1', 90, true)
    expect(progressStorage.isQuizCompleted('day1')).toBe(true)
    expect(progressStorage.getCompletedQuizzesCount()).toBe(1)
    expect(progressStorage.getQuizScore('day9')).toBeNull()
  })

  it('clearProgress wipes everything; warns on failure', () => {
    progressStorage.markDayCompleted(1)
    progressStorage.setLiveDayProgress(1, 40)
    sessionStorage.setItem(LIVE, '{}')
    progressStorage.clearProgress()
    expect(localStorage.getItem(KEY)).toBeNull()
    expect(localStorage.getItem(LIVE)).toBeNull()
    expect(sessionStorage.getItem(LIVE)).toBeNull()

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('x')
    })
    progressStorage.clearProgress()
    expect(warn).toHaveBeenCalled()
  })
})

describe('streaks', () => {
  it('starts a streak on first activity', () => {
    setDate('2026-11-10T10:00:00Z')
    progressStorage.markDayCompleted(1)
    expect(progressStorage.getProgress().currentStreak).toBe(1)
    expect(progressStorage.getProgress().lastActivityDate).toBe('2026-11-10')
  })

  it('increments on consecutive day, no-ops on same day, resets after gap', () => {
    setDate('2026-11-10T10:00:00Z')
    progressStorage.markDayCompleted(1)
    progressStorage.markQuizCompleted('day1', 50) // same day
    expect(progressStorage.getProgress().currentStreak).toBe(1)

    setDate('2026-11-11T10:00:00Z')
    progressStorage.markDayCompleted(2)
    expect(progressStorage.getProgress().currentStreak).toBe(2)

    setDate('2026-11-20T10:00:00Z')
    progressStorage.markDayCompleted(3)
    expect(progressStorage.getProgress().currentStreak).toBe(1)
  })

  it('getCurrentStreak returns stored streak', () => {
    setDate('2026-11-10T10:00:00Z')
    progressStorage.markDayCompleted(1)
    expect(progressStorage.getCurrentStreak()).toBe(1)
    // reading never persists a changed streak on its own
    setDate('2026-11-11T10:00:00Z')
    expect(progressStorage.getCurrentStreak()).toBe(2)
    expect(progressStorage.getProgress().currentStreak).toBe(1)
  })

  it('keeps streak when last activity is in the future (daysDiff <= 0)', () => {
    setDate('2026-11-10T10:00:00Z')
    localStorage.setItem(
      KEY,
      JSON.stringify({ completedDays: [], currentStreak: 4, lastActivityDate: '2026-11-12' }),
    )
    progressStorage.markDayCompleted(1)
    const p = progressStorage.getProgress()
    expect(p.currentStreak).toBe(4)
    expect(p.lastActivityDate).toBe('2026-11-10')
  })
})

describe('live day progress', () => {
  it('stores clamped percent and exposes it for matching day', () => {
    progressStorage.setLiveDayProgress(3, 150)
    expect(progressStorage.getLiveDayProgress(3)).toBe(80)
    expect(progressStorage.getLiveDayProgress(4)).toBeNull()
    progressStorage.setLiveDayProgress(3, -10)
    expect(progressStorage.getLiveDayProgress(3)).toBe(0)
    progressStorage.setLiveDayProgress(3, 33.4)
    expect(progressStorage.getLiveDayProgress(3)).toBe(33)
  })

  it('records null clear and treats NaN as clear', () => {
    progressStorage.setLiveDayProgress(2, 20)
    progressStorage.setLiveDayProgress(2, null)
    expect(progressStorage.getLiveDayProgressState()).toMatchObject({ day: 2, percent: null })
    expect(progressStorage.getLiveDayProgress(2)).toBeNull()
    progressStorage.setLiveDayProgress(5, NaN)
    expect(progressStorage.getLiveDayProgressState()).toMatchObject({ day: 5, percent: null })
  })

  it('skips no-op writes', () => {
    progressStorage.setLiveDayProgress(2, 20)
    const spy = vi.fn()
    window.addEventListener('rm-progress-changed', spy)
    progressStorage.setLiveDayProgress(2, 20)
    expect(spy).not.toHaveBeenCalled()
    window.removeEventListener('rm-progress-changed', spy)
  })

  it('drops legacy sessionStorage copy on write', () => {
    sessionStorage.setItem(LIVE, JSON.stringify({ day: 1, percent: 10 }))
    progressStorage.setLiveDayProgress(1, 50)
    expect(sessionStorage.getItem(LIVE)).toBeNull()
  })

  it('reads legacy sessionStorage when localStorage is empty', () => {
    sessionStorage.setItem(LIVE, JSON.stringify({ day: 1, percent: 10 }))
    expect(progressStorage.getLiveDayProgressState()).toEqual({
      day: 1,
      percent: 10,
      updatedAt: new Date(0).toISOString(),
    })
  })

  it('rejects invalid stored payloads', () => {
    expect(progressStorage.getLiveDayProgressState()).toBeNull()
    localStorage.setItem(LIVE, JSON.stringify({ day: 0, percent: 10 }))
    expect(progressStorage.getLiveDayProgressState()).toBeNull()
    localStorage.setItem(LIVE, JSON.stringify({ day: 'x', percent: 10 }))
    expect(progressStorage.getLiveDayProgressState()).toBeNull()
    localStorage.setItem(LIVE, JSON.stringify({ day: 1, percent: 'abc' }))
    expect(progressStorage.getLiveDayProgressState()).toBeNull()
    localStorage.setItem(LIVE, '{bad')
    expect(progressStorage.getLiveDayProgressState()).toBeNull()
  })

  it('applyLiveDayProgressState sets and clears', () => {
    const state = { day: 4, percent: 60, updatedAt: '2026-01-01T00:00:00.000Z' }
    progressStorage.applyLiveDayProgressState(state)
    expect(progressStorage.getLiveDayProgressState()).toEqual(state)
    progressStorage.applyLiveDayProgressState(null)
    expect(progressStorage.getLiveDayProgressState()).toBeNull()
  })

  it('swallows storage errors', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('x')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('x')
    })
    expect(() => progressStorage.setLiveDayProgress(1, 10)).not.toThrow()
    expect(() => progressStorage.applyLiveDayProgressState(null)).not.toThrow()
    expect(() => progressStorage.applyLiveDayProgressState({ day: 1, percent: 1, updatedAt: '' })).not.toThrow()
  })

  it('swallows sessionStorage-only removal errors', () => {
    const orig = Storage.prototype.removeItem
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (this: Storage, k: string) {
      if (this === sessionStorage) throw new Error('x')
      return orig.call(this, k)
    })
    expect(() => progressStorage.setLiveDayProgress(1, 10)).not.toThrow()
    expect(() => progressStorage.applyLiveDayProgressState({ day: 1, percent: 1, updatedAt: '' })).not.toThrow()
  })
})
