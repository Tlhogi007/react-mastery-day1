import { beforeEach, describe, expect, it, vi } from 'vitest'
import { progressStorage } from '../services/progressStorage'
import { getWeightedProgressPercent } from './learningPath'

describe('getWeightedProgressPercent', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('keeps marked-complete day at full weight after a worse quiz score', () => {
    progressStorage.markDayCompleted(1)
    progressStorage.markQuizCompleted('day01', 100, true)
    expect(getWeightedProgressPercent(7)).toBe(14) // 100/7

    progressStorage.markQuizCompleted('day01', 20, false)
    expect(progressStorage.getQuizScore('day01')).toBe(20)
    // Marked complete still contributes 100 — worse retake must not drag overall down
    expect(getWeightedProgressPercent(7)).toBe(14)
  })

  it('uses quiz score × 0.8 when day is not marked complete', () => {
    progressStorage.markQuizCompleted('day01', 50, false)
    // 40 / 7 → rounds to 6, floored at least 1
    expect(getWeightedProgressPercent(7)).toBe(6)
  })
})
