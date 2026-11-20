import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { QuizQuestion } from '../../types/challenges'

vi.mock('../../lib/sentry', () => ({ setAppContext: vi.fn() }))
vi.mock('../../services/aiAuthBridge', () => ({
  clearAiGate: vi.fn(),
  suppressAiGate: vi.fn(),
}))
vi.mock('../../services/quizQuestionService', () => ({
  quizQuestionService: { fetchLocalQuestions: vi.fn() },
}))

import { useQuizSession } from './useQuizSession'
import { questionHistory } from '../../services/questionHistory'
import { progressStorage } from '../../services/progressStorage'
import { analytics } from '../../services/analytics'
import { suppressAiGate } from '../../services/aiAuthBridge'

afterEach(() => cleanup())

function q(id: string): QuizQuestion {
  return {
    id,
    question: `Q ${id}`,
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 0,
    explanation: 'because',
    source: 'local',
  }
}

const bank = [q('day01-q1'), q('day01-q2'), q('day01-q3'), q('day01-q4')]

function aiSetters() {
  return {
    setAiQuestionCount: vi.fn(),
    setGeneratingAI: vi.fn(),
    setAiEnabled: vi.fn(),
    setAiQuestionsLoaded: vi.fn(),
  }
}

describe('useQuizSession (composer)', () => {
  beforeEach(() => {
    vi.spyOn(questionHistory, 'pickUnseenQuestions').mockImplementation((qs) => [...qs])
    vi.spyOn(questionHistory, 'recordAnswer').mockImplementation(() => undefined)
    vi.spyOn(questionHistory, 'canonicalId').mockImplementation((id) => id)
    vi.spyOn(progressStorage, 'markQuizCompleted').mockImplementation(() => undefined)
    vi.spyOn(analytics, 'trackQuizComplete').mockImplementation(() => undefined)
    vi.spyOn(analytics, 'trackTimeSpent').mockImplementation(() => undefined)
    vi.spyOn(analytics, 'track').mockImplementation(() => undefined)
  })

  it('answers, advances, and finishes with side effects', () => {
    const single = [q('only')]
    const { result } = renderHook(() =>
      useQuizSession({
        questions: single,
        day: 1,
        boot: null,
        aiQuestionsLoaded: true,
        ...aiSetters(),
      }),
    )

    act(() => result.current.handleAnswerSelect(0))
    expect(result.current.score).toBe(1)

    act(() => result.current.handleNext())
    expect(result.current.completed).toBe(true)
    expect(result.current.percentage).toBe(100)
    expect(suppressAiGate).toHaveBeenCalled()
    expect(progressStorage.markQuizCompleted).toHaveBeenCalledWith('day01', 100, true)
  })

  it('reset clears AI flags via setters', () => {
    const tracked = aiSetters()
    const { result } = renderHook(() =>
      useQuizSession({
        questions: bank,
        day: 1,
        boot: null,
        aiQuestionsLoaded: true,
        ...tracked,
      }),
    )
    act(() => result.current.reset())
    expect(tracked.setAiEnabled).toHaveBeenCalledWith(false)
    expect(tracked.setAiQuestionsLoaded).toHaveBeenCalledWith(false)
    expect(result.current.score).toBe(0)
  })

  it('cancel prompt finishes when no local questions remain after mid-quiz gate', () => {
    const short = [q('a'), q('b'), q('c')]
    const { result } = renderHook(() =>
      useQuizSession({
        questions: short,
        day: 1,
        boot: null,
        aiQuestionsLoaded: false,
        ...aiSetters(),
      }),
    )

    for (let i = 0; i < 3; i++) {
      act(() => result.current.handleAnswerSelect(0))
      act(() => result.current.handleNext())
    }
    expect(result.current.showQuestionPrompt).toBe(true)
    expect(result.current.currentQuestionIndex).toBe(2)

    act(() => result.current.handleCancelPrompt())
    expect(result.current.showQuestionPrompt).toBe(false)
    expect(result.current.completed).toBe(true)
    expect(progressStorage.markQuizCompleted).toHaveBeenCalled()
  })

  it('surfaces exhausted banner after cloud sync when unseen locals are gone', () => {
    const pick = vi.spyOn(questionHistory, 'pickUnseenQuestions')
    pick.mockImplementation((qs) => [...qs])

    const { result } = renderHook(() =>
      useQuizSession({
        questions: bank,
        day: 1,
        boot: null,
        aiQuestionsLoaded: false,
        ...aiSetters(),
      }),
    )
    expect(result.current.errorMessage).toBeNull()

    pick.mockReturnValue([])
    act(() => {
      window.dispatchEvent(new CustomEvent('rm-user-cloud-synced'))
    })
    expect(result.current.errorMessage).toMatch(/No new local questions left|Practice again replays/i)
  })
})
