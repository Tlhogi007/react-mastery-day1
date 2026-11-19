import { cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { QuizQuestion } from '../../types/challenges'
import { useQuizPersistence, type UseQuizPersistenceParams } from './useQuizPersistence'
import * as resume from '../../services/quizResume'

afterEach(() => cleanup())

const question: QuizQuestion = {
  id: 'q1',
  question: 'Q?',
  options: ['a', 'b'],
  correctAnswer: 0,
  explanation: 'because',
}

const params = (p: Partial<UseQuizPersistenceParams> = {}): UseQuizPersistenceParams => ({
  day: 2,
  currentQuestionIndex: 0,
  selectedAnswer: null,
  score: 0,
  completed: false,
  localQuestionsCompleted: false,
  aiEnabled: false,
  aiQuestionsLoaded: false,
  allQuestions: [question],
  usedLocalQuestionIds: new Set(['q1']),
  incorrectAnswers: [question],
  totalTimeSpent: 3,
  ...p,
})

describe('useQuizPersistence', () => {
  it('saves progress while quiz is active', () => {
    const save = vi.spyOn(resume, 'saveQuizProgress')
    renderHook(() => useQuizPersistence(params()))
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        day: 2,
        usedLocalQuestionIds: ['q1'],
        incorrectAnswerIds: ['q1'],
        totalTimeSpent: 3,
      }),
    )
    expect(resume.peekQuizProgress()?.day).toBe(2)
  })

  it('does not save without a day', () => {
    const save = vi.spyOn(resume, 'saveQuizProgress')
    renderHook(() => useQuizPersistence(params({ day: undefined })))
    expect(save).not.toHaveBeenCalled()
  })

  it('clears progress once completed', () => {
    const save = vi.spyOn(resume, 'saveQuizProgress')
    const clear = vi.spyOn(resume, 'clearQuizProgress')
    renderHook(() => useQuizPersistence(params({ completed: true })))
    expect(save).not.toHaveBeenCalled()
    expect(clear).toHaveBeenCalled()
  })
})
