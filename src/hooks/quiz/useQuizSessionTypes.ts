import type { Dispatch, SetStateAction } from 'react'
import type { QuizQuestion } from '../../types/challenges'
import type { QuizProgressSnapshot } from '../../services/quizResume'
import type { QuestionPromptType } from './quizSessionEnums'

export interface UseQuizSessionParams {
  questions: QuizQuestion[]
  day?: number
  boot: QuizProgressSnapshot | null
  aiQuestionsLoaded: boolean
  setAiQuestionCount: Dispatch<SetStateAction<number | null>>
  setGeneratingAI: Dispatch<SetStateAction<boolean>>
  setAiEnabled: Dispatch<SetStateAction<boolean>>
  setAiQuestionsLoaded: Dispatch<SetStateAction<boolean>>
}

export interface UseQuizSessionReturn {
  allQuestions: QuizQuestion[]
  setAllQuestions: Dispatch<SetStateAction<QuizQuestion[]>>
  currentQuestion: QuizQuestion | undefined
  currentQuestionIndex: number
  setCurrentQuestionIndex: Dispatch<SetStateAction<number>>
  selectedAnswer: number | null
  setSelectedAnswer: Dispatch<SetStateAction<number | null>>
  score: number
  completed: boolean
  setCompleted: Dispatch<SetStateAction<boolean>>
  localQuestionsCompleted: boolean
  localQuestionsCount: number
  isAISection: boolean
  errorMessage: string | null
  setErrorMessage: Dispatch<SetStateAction<string | null>>
  percentage: number
  showQuestionPrompt: boolean
  setShowQuestionPrompt: Dispatch<SetStateAction<boolean>>
  questionPromptType: QuestionPromptType
  setQuestionPromptType: Dispatch<SetStateAction<QuestionPromptType>>
  incorrectAnswers: QuizQuestion[]
  incorrectAnswersWithSelection: Array<{ question: QuizQuestion; selectedIndex: number }>
  missedCount: number
  quizStartTime: number | null
  totalTimeSpent: number
  skippedQuestions: Set<string>
  usedLocalQuestionIds: Set<string>
  handleAnswerSelect: (index: number) => void
  handleNext: () => void
  handleSkip: () => void
  handleLoadMoreLocalQuestions: (count: number) => Promise<void>
  handleFinishQuiz: () => void
  reset: () => void
  resetWithIncorrectOnly: () => void
  handleSelectPromptType: (type: QuestionPromptType) => void
  handleCancelPrompt: () => void
}
