import type { QuizQuestion } from '../../types/challenges'
import { quizQuestionService } from '../../services/quizQuestionService'
import { questionHistory } from '../../services/questionHistory'
import { getTopicForDay } from '../../services/topicMapper'
import { asLocal } from './tags'
import { LoadMoreLocalsReason } from './quizSessionEnums'

export type LoadMoreLocalsResult =
  | { ok: true; updatedQuestions: QuizQuestion[]; usedIds: string[]; warning: string | null }
  | { ok: false; reason: LoadMoreLocalsReason; message?: string }

/** Fetch + splice unseen locals after the current index. Pure result — hook dispatches. */
export async function loadMoreLocalQuestions(params: {
  day: number
  count: number
  allQuestions: QuizQuestion[]
  currentQuestionIndex: number
  usedLocalQuestionIds: string[]
}): Promise<LoadMoreLocalsResult> {
  const { day, count, allQuestions, currentQuestionIndex, usedLocalQuestionIds } = params

  try {
    const topic = getTopicForDay(day)
    const bank = await quizQuestionService.fetchLocalQuestions(topic, 100)
    if (bank.length === 0) {
      return { ok: false, reason: LoadMoreLocalsReason.EmptyBank }
    }

    const sessionExclude = new Set(
      [...usedLocalQuestionIds, ...allQuestions.map((q) => q.id)].map((id) =>
        questionHistory.canonicalId(id),
      ),
    )
    const newQuestions = questionHistory
      .pickUnseenQuestions(bank, sessionExclude, count, day)
      .map(asLocal)

    if (newQuestions.length === 0) {
      return { ok: false, reason: LoadMoreLocalsReason.NoUnseen }
    }

    const warning =
      newQuestions.length < count
        ? `Only ${newQuestions.length} new local question${newQuestions.length === 1 ? '' : 's'} left — added those (no repeats).`
        : null

    const updatedQuestions = [
      ...allQuestions.slice(0, currentQuestionIndex + 1),
      ...newQuestions,
      ...allQuestions.slice(currentQuestionIndex + 1),
    ]
    const usedIds = [
      ...usedLocalQuestionIds,
      ...newQuestions.map((q) => questionHistory.canonicalId(q.id)),
    ]

    return { ok: true, updatedQuestions, usedIds, warning }
  } catch (error) {
    console.error('❌ [Quiz] Failed to load more local questions:', error)
    return {
      ok: false,
      reason: LoadMoreLocalsReason.Error,
      message: 'Failed to load more local questions. Please try again.',
    }
  }
}
