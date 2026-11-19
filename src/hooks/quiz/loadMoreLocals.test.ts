import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { QuizQuestion } from '../../types/challenges'

vi.mock('../../services/quizQuestionService', () => ({
  quizQuestionService: { fetchLocalQuestions: vi.fn() },
}))

import { loadMoreLocalQuestions } from './loadMoreLocals'
import { LoadMoreLocalsReason } from './quizSessionEnums'
import { quizQuestionService } from '../../services/quizQuestionService'
import { questionHistory } from '../../services/questionHistory'

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

describe('loadMoreLocalQuestions', () => {
  beforeEach(() => {
    vi.spyOn(questionHistory, 'canonicalId').mockImplementation((id) => id)
  })

  it('returns empty_bank when service has nothing', async () => {
    vi.mocked(quizQuestionService.fetchLocalQuestions).mockResolvedValue([])
    const result = await loadMoreLocalQuestions({
      day: 1,
      count: 2,
      allQuestions: [q('a')],
      currentQuestionIndex: 0,
      usedLocalQuestionIds: [],
    })
    expect(result).toEqual({ ok: false, reason: LoadMoreLocalsReason.EmptyBank })
  })

  it('returns no_unseen when all are excluded', async () => {
    vi.mocked(quizQuestionService.fetchLocalQuestions).mockResolvedValue([q('a')])
    vi.spyOn(questionHistory, 'pickUnseenQuestions').mockReturnValue([])
    const result = await loadMoreLocalQuestions({
      day: 1,
      count: 2,
      allQuestions: [q('a')],
      currentQuestionIndex: 0,
      usedLocalQuestionIds: ['a'],
    })
    expect(result).toEqual({ ok: false, reason: LoadMoreLocalsReason.NoUnseen })
  })

  it('splices new questions after current index', async () => {
    vi.mocked(quizQuestionService.fetchLocalQuestions).mockResolvedValue([
      q('a'),
      q('x'),
      q('y'),
    ])
    vi.spyOn(questionHistory, 'pickUnseenQuestions').mockImplementation((qs, exclude, count) =>
      qs.filter((row) => !exclude.has(row.id)).slice(0, count),
    )
    const result = await loadMoreLocalQuestions({
      day: 1,
      count: 2,
      allQuestions: [q('a'), q('b')],
      currentQuestionIndex: 0,
      usedLocalQuestionIds: ['a'],
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.updatedQuestions.map((row) => row.id)).toEqual(['a', 'x', 'y', 'b'])
    }
  })
})
