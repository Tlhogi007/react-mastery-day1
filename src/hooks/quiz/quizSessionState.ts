import type { QuizQuestion } from '../../types/challenges'
import type { QuizProgressSnapshot } from '../../services/quizResume'
import { asAi, asLocal } from './tags'
import type { QuestionPromptType } from './quizSessionEnums'

export type { QuestionPromptType } from './quizSessionEnums'

export type IncorrectWithSelection = {
  question: QuizQuestion
  selectedIndex: number
}

/** Serializable session state — Sets live at the hook boundary. */
export type QuizSessionState = {
  allQuestions: QuizQuestion[]
  currentQuestionIndex: number
  selectedAnswer: number | null
  score: number
  completed: boolean
  localQuestionsCompleted: boolean
  errorMessage: string | null
  showQuestionPrompt: boolean
  questionPromptType: QuestionPromptType
  midQuizPromptShown: boolean
  usedLocalQuestionIds: string[]
  incorrectAnswers: QuizQuestion[]
  incorrectAnswersWithSelection: IncorrectWithSelection[]
  quizStartTime: number | null
  totalTimeSpent: number
  skippedQuestionIds: string[]
  /** Practice again was chosen — don't re-block on remount until reset/finish. */
  localBankGateDismissed: boolean
}

export function tagQuestions(seed: QuizQuestion[]): QuizQuestion[] {
  return seed.map((q) => (q.source === 'ai' ? asAi(q) : asLocal(q)))
}

export function createInitialQuizSessionState(
  questions: QuizQuestion[],
  boot: QuizProgressSnapshot | null,
  now = Date.now(),
): QuizSessionState {
  const seed = boot?.allQuestions ?? questions
  const incorrectAnswers =
    boot?.incorrectAnswerIds?.length
      ? (boot.allQuestions || []).filter((q) => boot.incorrectAnswerIds.includes(q.id))
      : []

  return {
    allQuestions: tagQuestions(seed),
    currentQuestionIndex: boot?.currentQuestionIndex ?? 0,
    selectedAnswer: boot?.selectedAnswer ?? null,
    score: boot?.score ?? 0,
    completed: boot?.completed ?? false,
    localQuestionsCompleted: boot?.localQuestionsCompleted ?? false,
    errorMessage: null,
    showQuestionPrompt: false,
    questionPromptType: null,
    midQuizPromptShown: false,
    usedLocalQuestionIds: [...(boot?.usedLocalQuestionIds ?? [])],
    incorrectAnswers,
    incorrectAnswersWithSelection: [],
    quizStartTime: now,
    totalTimeSpent: boot?.totalTimeSpent ?? 0,
    skippedQuestionIds: [],
    localBankGateDismissed: Boolean(boot?.localBankGateDismissed),
  }
}

export function pickLocalDeck(
  bank: QuizQuestion[],
  picked: QuizQuestion[],
): { questions: QuizQuestion[]; exhausted: boolean } {
  const source = picked.length > 0 ? picked : [...bank].sort(() => Math.random() - 0.5)
  return {
    questions: source.map(asLocal),
    exhausted: picked.length === 0 && bank.length > 0,
  }
}
