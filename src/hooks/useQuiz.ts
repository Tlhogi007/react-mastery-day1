import { useState } from 'react'
import type { QuizQuestion } from '../types/challenges'
import { loadQuizProgress } from '../services/quizResume'
import { useQuizAi, useQuizAiState } from './quiz/useQuizAi'
import { useQuizPersistence } from './quiz/useQuizPersistence'
import { useQuizSession } from './quiz/useQuizSession'

interface UseQuizOptions {
  questions: QuizQuestion[]
  day?: number
}

interface UseQuizReturn {
  allQuestions: QuizQuestion[]
  currentQuestion: QuizQuestion | undefined
  currentQuestionIndex: number
  selectedAnswer: number | null
  score: number
  completed: boolean
  localQuestionsCompleted: boolean
  /** Count of non-AI questions currently in the session (updates after More Local). */
  localQuestionsCount: number
  isAISection: boolean
  aiQuestionCount: number | null
  generatingAI: boolean
  aiEnabled: boolean
  loadingAI: boolean
  aiQuestionsLoaded: boolean
  errorMessage: string | null
  percentage: number
  showQuestionPrompt: boolean
  questionPromptType: 'local' | 'ai' | null
  incorrectAnswers: QuizQuestion[]
  incorrectAnswersWithSelection: Array<{ question: QuizQuestion; selectedIndex: number }>
  /** totalQuestions - score; keeps Review copy honest even if a path missed the list */
  missedCount: number
  quizStartTime: number | null
  totalTimeSpent: number
  skippedQuestions: Set<string>

  handleAnswerSelect: (index: number) => void
  handleNext: () => void
  handleSkip: () => void
  handleAIGenerationRequest: (count: number) => Promise<void>
  handleLoadMoreLocalQuestions: (count: number) => Promise<void>
  handleFinishQuiz: () => void
  dismissError: () => void
  offerAiQuestions: () => void
  reset: () => void
  resetWithIncorrectOnly: () => void
  toggleAI: () => void
  handleSelectPromptType: (type: 'local' | 'ai' | null) => void
  handleCancelPrompt: () => void
}

export function useQuiz({ questions, day }: UseQuizOptions): UseQuizReturn {
  const [boot] = useState(() => (day != null ? loadQuizProgress(day) : null))

  const aiState = useQuizAiState(boot)
  const session = useQuizSession({
    questions,
    day,
    boot,
    aiQuestionsLoaded: aiState.aiQuestionsLoaded,
    setAiQuestionCount: aiState.setAiQuestionCount,
    setGeneratingAI: aiState.setGeneratingAI,
    setAiEnabled: aiState.setAiEnabled,
    setAiQuestionsLoaded: aiState.setAiQuestionsLoaded,
  })
  const ai = useQuizAi({
    day,
    questions,
    allQuestions: session.allQuestions,
    currentQuestionIndex: session.currentQuestionIndex,
    score: session.score,
    localQuestionsCompleted: session.localQuestionsCompleted,
    setAllQuestions: session.setAllQuestions,
    setCurrentQuestionIndex: session.setCurrentQuestionIndex,
    setSelectedAnswer: session.setSelectedAnswer,
    setCompleted: session.setCompleted,
    setShowQuestionPrompt: session.setShowQuestionPrompt,
    setQuestionPromptType: session.setQuestionPromptType,
    setErrorMessage: session.setErrorMessage,
    ai: aiState,
  })

  useQuizPersistence({
    day,
    currentQuestionIndex: session.currentQuestionIndex,
    selectedAnswer: session.selectedAnswer,
    score: session.score,
    completed: session.completed,
    localQuestionsCompleted: session.localQuestionsCompleted,
    aiEnabled: ai.aiEnabled,
    aiQuestionsLoaded: ai.aiQuestionsLoaded,
    allQuestions: session.allQuestions,
    usedLocalQuestionIds: Array.from(session.usedLocalQuestionIds),
    incorrectAnswers: session.incorrectAnswers,
    totalTimeSpent: session.totalTimeSpent,
    localBankGateDismissed: session.localBankGateDismissed,
  })

  return {
    allQuestions: session.allQuestions,
    currentQuestion: session.currentQuestion,
    currentQuestionIndex: session.currentQuestionIndex,
    selectedAnswer: session.selectedAnswer,
    score: session.score,
    completed: session.completed,
    localQuestionsCompleted: session.localQuestionsCompleted,
    localQuestionsCount: session.localQuestionsCount,
    isAISection: session.isAISection,
    aiQuestionCount: ai.aiQuestionCount,
    generatingAI: ai.generatingAI,
    aiEnabled: ai.aiEnabled,
    loadingAI: ai.loadingAI,
    aiQuestionsLoaded: ai.aiQuestionsLoaded,
    errorMessage: session.errorMessage,
    percentage: session.percentage,
    showQuestionPrompt: session.showQuestionPrompt,
    questionPromptType: session.questionPromptType,
    incorrectAnswers: session.incorrectAnswers,
    incorrectAnswersWithSelection: session.incorrectAnswersWithSelection,
    missedCount: session.missedCount,
    quizStartTime: session.quizStartTime,
    totalTimeSpent: session.totalTimeSpent,
    skippedQuestions: session.skippedQuestions,
    handleAnswerSelect: session.handleAnswerSelect,
    handleNext: session.handleNext,
    handleSkip: session.handleSkip,
    handleAIGenerationRequest: ai.handleAIGenerationRequest,
    handleLoadMoreLocalQuestions: session.handleLoadMoreLocalQuestions,
    handleFinishQuiz: session.handleFinishQuiz,
    dismissError: session.dismissError,
    offerAiQuestions: session.offerAiQuestions,
    reset: session.reset,
    resetWithIncorrectOnly: session.resetWithIncorrectOnly,
    toggleAI: ai.toggleAI,
    handleSelectPromptType: session.handleSelectPromptType,
    handleCancelPrompt: session.handleCancelPrompt,
  }
}
