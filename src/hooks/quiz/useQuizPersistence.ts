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
  usedLocalQuestionIds: Set<string>
  incorrectAnswers: QuizQuestion[]
  totalTimeSpent: number
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
}: UseQuizPersistenceParams): void {
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
      at: Date.now(),
    })
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
    usedLocalQuestionIds,
    incorrectAnswers,
    totalTimeSpent,
  ])

  useEffect(() => {
    if (completed && day != null) clearQuizProgress()
  }, [completed, day])
}
