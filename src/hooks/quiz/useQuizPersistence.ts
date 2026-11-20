import { useEffect } from 'react'
import type { QuizQuestion } from '../../types/challenges'
import { clearQuizProgress, saveQuizProgress } from '../../services/quizResume'

export interface UseQuizPersistenceParams {
  day?: number
  currentQuestionIndex: number
  selectedAnswer: number | null
  score: number
  completed: boolean
  localQuestionsCompleted: boolean
  aiEnabled: boolean
  aiQuestionsLoaded: boolean
  allQuestions: QuizQuestion[]
  /** Prefer a stable array — a new Set() each render re-fires this effect forever. */
  usedLocalQuestionIds: string[]
  incorrectAnswers: QuizQuestion[]
  totalTimeSpent: number
  localBankGateDismissed: boolean
}

export function useQuizPersistence({
  day,
  currentQuestionIndex,
  selectedAnswer,
  score,
  completed,
  localQuestionsCompleted,
  aiEnabled,
  aiQuestionsLoaded,
  allQuestions,
  usedLocalQuestionIds,
  incorrectAnswers,
  totalTimeSpent,
  localBankGateDismissed,
}: UseQuizPersistenceParams): void {
  const usedIdsKey = usedLocalQuestionIds.join('|')
  const incorrectIdsKey = incorrectAnswers.map((q) => q.id).join('|')

  useEffect(() => {
    if (day == null || completed) return
    saveQuizProgress({
      day,
      currentQuestionIndex,
      selectedAnswer,
      score,
      completed,
      localQuestionsCompleted,
      aiEnabled,
      aiQuestionsLoaded,
      allQuestions,
      usedLocalQuestionIds: [...usedLocalQuestionIds],
      incorrectAnswerIds: incorrectAnswers.map((q) => q.id),
      totalTimeSpent,
      localBankGateDismissed,
      at: Date.now(),
    })
    // Serialize id lists — array/Set identity changes every render and caused max update depth.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- usedIdsKey / incorrectIdsKey stand in for list identity
  }, [
    day,
    currentQuestionIndex,
    selectedAnswer,
    score,
    completed,
    localQuestionsCompleted,
    aiEnabled,
    aiQuestionsLoaded,
    allQuestions,
    usedIdsKey,
    incorrectIdsKey,
    totalTimeSpent,
    localBankGateDismissed,
  ])

  useEffect(() => {
    if (completed && day != null) clearQuizProgress()
  }, [completed, day])
}
