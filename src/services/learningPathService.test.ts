import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getProgress: vi.fn(),
  getStats: vi.fn(),
  getIncorrectQuestions: vi.fn(),
}))

vi.mock('./progressStorage', () => ({
  progressStorage: { getProgress: mocks.getProgress },
}))
vi.mock('./questionHistory', () => ({
  questionHistory: {
    getStats: mocks.getStats,
    getIncorrectQuestions: mocks.getIncorrectQuestions,
  },
}))

import { learningPathService } from './learningPathService'

const progress = (p: Record<string, unknown> = {}) => ({
  completedDays: [],
  completedQuizzes: {},
  quizScores: {},
  currentStreak: 0,
  lastActivityDate: '',
  ...p,
})
const stats = (p: Record<string, unknown> = {}) => ({
  totalQuestions: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  averageTime: 0,
  accuracy: 0,
  ...p,
})
const wrong = (questionId: string) => ({ questionId, answeredCorrectly: false })

beforeEach(() => {
  mocks.getProgress.mockReset().mockReturnValue(progress())
  mocks.getStats.mockReset().mockReturnValue(stats())
  mocks.getIncorrectQuestions.mockReset().mockReturnValue([])
})

describe('identifyWeakAreas', () => {
  it('is empty with no history', () => {
    expect(learningPathService.identifyWeakAreas()).toEqual([])
  })

  it('groups incorrect questions by day and maps topics', () => {
    mocks.getIncorrectQuestions.mockReturnValue([
      wrong('day01-q1'),
      wrong('day01-q2'),
      wrong('day03-q1'),
      wrong('no-day-here'),
    ])
    const areas = learningPathService.identifyWeakAreas()
    expect(areas).toHaveLength(2)
    expect(areas.find((a) => a.day === 1)).toMatchObject({
      topic: 'rendering pipeline',
      questionCount: 2,
      accuracy: 0,
    })
    expect(areas.find((a) => a.day === 3)?.topic).toBe('fiber architecture')
  })

  it('adds an Overall Fundamentals area when accuracy is low and days are completed', () => {
    mocks.getProgress.mockReturnValue(progress({ completedDays: [1, 4] }))
    const s = stats({ totalQuestions: 10, accuracy: 50 })
    const areas = learningPathService.identifyWeakAreas(s as never)
    expect(areas).toHaveLength(1)
    expect(areas[0]).toMatchObject({
      topic: 'Overall Fundamentals',
      day: 4,
      accuracy: 0.5,
      questionCount: 10,
    })
    expect(mocks.getStats).not.toHaveBeenCalled()
  })

  it('skips overall area when no days completed or accuracy is fine', () => {
    mocks.getStats.mockReturnValue(stats({ totalQuestions: 10, accuracy: 50 }))
    expect(learningPathService.identifyWeakAreas()).toEqual([])
    mocks.getProgress.mockReturnValue(progress({ completedDays: [1] }))
    mocks.getStats.mockReturnValue(stats({ totalQuestions: 10, accuracy: 90 }))
    expect(learningPathService.identifyWeakAreas()).toEqual([])
  })

  it('sorts areas by accuracy ascending', () => {
    mocks.getProgress.mockReturnValue(progress({ completedDays: [2] }))
    mocks.getIncorrectQuestions.mockReturnValue([wrong('day02-q1')])
    const areas = learningPathService.identifyWeakAreas(stats({ totalQuestions: 4, accuracy: 60 }) as never)
    expect(areas.map((a) => a.accuracy)).toEqual([0, 0.6])
  })
})

describe('getSuggestedNextDay', () => {
  it('starts at day 1', () => {
    expect(learningPathService.getSuggestedNextDay()).toBe(1)
  })

  it('returns null once week 1 is complete', () => {
    mocks.getProgress.mockReturnValue(progress({ completedDays: [1, 7] }))
    expect(learningPathService.getSuggestedNextDay()).toBeNull()
  })

  it('advances when quiz passed with >= 70', () => {
    mocks.getProgress.mockReturnValue(
      progress({
        completedDays: [3],
        completedQuizzes: { 'day-3': true },
        quizScores: { 'day-3': 70 },
      }),
    )
    expect(learningPathService.getSuggestedNextDay()).toBe(4)
  })

  it('stays when quiz missing or score low', () => {
    mocks.getProgress.mockReturnValue(progress({ completedDays: [3] }))
    expect(learningPathService.getSuggestedNextDay()).toBe(3)
    mocks.getProgress.mockReturnValue(
      progress({ completedDays: [3], completedQuizzes: { 'day-3': true }, quizScores: { 'day-3': 60 } }),
    )
    expect(learningPathService.getSuggestedNextDay()).toBe(3)
  })
})

describe('getRecommendations', () => {
  it('recommends day 1 with high priority for new learners', () => {
    const recs = learningPathService.getRecommendations()
    expect(recs).toEqual([
      expect.objectContaining({ id: 'advance-day-1', type: 'advance', priority: 'high', day: 1 }),
    ])
  })

  it('medium-priority advance after progress; none after day 7', () => {
    mocks.getProgress.mockReturnValue(progress({ completedDays: [2] }))
    expect(learningPathService.getRecommendations()[0]).toMatchObject({
      id: 'advance-day-3',
      priority: 'medium',
    })
    mocks.getProgress.mockReturnValue(progress({ completedDays: [7] }))
    expect(learningPathService.getRecommendations()).toEqual([])
  })

  it('adds review (low accuracy) and focus recommendations sorted by priority', () => {
    mocks.getProgress.mockReturnValue(progress({ completedDays: [2] }))
    mocks.getIncorrectQuestions.mockReturnValue([wrong('day02-q1')])
    mocks.getStats.mockReturnValue(stats({ totalQuestions: 10, accuracy: 40 }))
    const recs = learningPathService.getRecommendations()
    const types = recs.map((r) => r.type)
    expect(types).toContain('review')
    expect(types).toContain('focus')
    expect(types[types.length - 1]).toBe('advance')
    expect(recs.find((r) => r.type === 'review')?.id).toBe('review-2-reconciliation')
    expect(recs.find((r) => r.type === 'focus')?.description).toContain('40%')
  })

  it('adds practice recommendation for moderate accuracy', () => {
    mocks.getProgress.mockReturnValue(progress({ completedDays: [3] }))
    mocks.getStats.mockReturnValue(stats({ totalQuestions: 10, accuracy: 65 }))
    const recs = learningPathService.getRecommendations()
    const practice = recs.find((r) => r.type === 'practice')
    expect(practice).toMatchObject({ priority: 'medium', day: 3, topic: 'Overall Fundamentals' })
    expect(recs.some((r) => r.type === 'review')).toBe(false)
  })

  it('does not add practice for accuracy of 80%+', () => {
    mocks.getProgress.mockReturnValue(progress({ completedDays: [3] }))
    mocks.getStats.mockReturnValue(stats({ totalQuestions: 10, accuracy: 85 }))
    expect(learningPathService.getRecommendations().map((r) => r.type)).toEqual(['advance'])
  })
})

describe('getPersonalizedPath', () => {
  it('defaults to day 1 for new learners', () => {
    const path = learningPathService.getPersonalizedPath()
    expect(path).toMatchObject({ currentDay: 1, nextDay: 1, weakAreas: [] })
    expect(path.recommendations).toHaveLength(1)
  })

  it('uses max completed day as current day', () => {
    mocks.getProgress.mockReturnValue(
      progress({ completedDays: [1, 2, 3], completedQuizzes: { 'day-3': true }, quizScores: { 'day-3': 90 } }),
    )
    expect(learningPathService.getPersonalizedPath()).toMatchObject({ currentDay: 3, nextDay: 4 })
  })
})
