import type { QuizQuestion } from '../../types/challenges'
import { asLocal, isLocalQuestion } from './tags'
import {
  QuestionPromptKind,
  QuizSessionActionType,
  type QuestionPromptType,
} from './quizSessionEnums'
import {
  type QuizSessionState,
  pickLocalDeck,
  tagQuestions,
} from './quizSessionState'

type SetState<T> = T | ((prev: T) => T)

type QuizSessionActionPayload = {
  [QuizSessionActionType.Replace]: { state: QuizSessionState }
  [QuizSessionActionType.SeedUnseen]: {
    questions: QuizQuestion[]
    exhaustedMessage: string | null
    now: number
  }
  [QuizSessionActionType.SelectAnswer]: { index: number; timeSpentSec: number }
  [QuizSessionActionType.Next]: {
    aiQuestionsLoaded: boolean
    now: number
    canonicalId: (id: string) => string
  }
  [QuizSessionActionType.SkipMark]: { timeSpentSec: number }
  [QuizSessionActionType.Finish]: undefined
  [QuizSessionActionType.SetAllQuestions]: { value: SetState<QuizQuestion[]> }
  [QuizSessionActionType.SetCurrentIndex]: { value: SetState<number> }
  [QuizSessionActionType.SetSelectedAnswer]: { value: SetState<number | null> }
  [QuizSessionActionType.SetCompleted]: { value: SetState<boolean> }
  [QuizSessionActionType.SetError]: { value: SetState<string | null> }
  [QuizSessionActionType.SetShowPrompt]: { value: SetState<boolean> }
  [QuizSessionActionType.SetPromptType]: { value: SetState<QuestionPromptType> }
  [QuizSessionActionType.SelectPromptType]: { promptType: QuestionPromptType }
  [QuizSessionActionType.CancelPrompt]: { now: number }
  [QuizSessionActionType.LoadMoreOk]: {
    updatedQuestions: QuizQuestion[]
    usedIds: string[]
    warning: string | null
    now: number
  }
  [QuizSessionActionType.LoadMoreEmptyBank]: undefined
  [QuizSessionActionType.LoadMoreNoUnseen]: undefined
  [QuizSessionActionType.LoadMoreFail]: { message: string }
  [QuizSessionActionType.LoadMoreNoDay]: undefined
  [QuizSessionActionType.Reset]: {
    bank: QuizQuestion[]
    picked: QuizQuestion[]
    now: number
  }
  [QuizSessionActionType.ResetIncorrect]: { now: number }
}

export type QuizSessionAction = {
  [K in QuizSessionActionType]: QuizSessionActionPayload[K] extends undefined
    ? { type: K }
    : { type: K } & QuizSessionActionPayload[K]
}[QuizSessionActionType]

function resolve<T>(value: T | ((prev: T) => T), prev: T): T {
  return typeof value === 'function' ? (value as (prev: T) => T)(prev) : value
}

function markIncorrect(
  state: QuizSessionState,
  question: QuizQuestion,
  selectedIndex: number,
): Pick<QuizSessionState, 'incorrectAnswers' | 'incorrectAnswersWithSelection'> {
  const incorrectAnswers = state.incorrectAnswers.some((q) => q.id === question.id)
    ? state.incorrectAnswers
    : [...state.incorrectAnswers, question]
  const incorrectAnswersWithSelection = state.incorrectAnswersWithSelection.some(
    (item) => item.question.id === question.id,
  )
    ? state.incorrectAnswersWithSelection
    : [...state.incorrectAnswersWithSelection, { question, selectedIndex }]
  return { incorrectAnswers, incorrectAnswersWithSelection }
}

/** Pure next-step after answering / skipping a question. */
export function applyNext(
  state: QuizSessionState,
  aiQuestionsLoaded: boolean,
  _now: number,
  canonicalId: (id: string) => string,
): QuizSessionState {
  const current = state.allQuestions[state.currentQuestionIndex]
  let usedLocalQuestionIds = state.usedLocalQuestionIds
  if (current && isLocalQuestion(current)) {
    const id = canonicalId(current.id)
    if (!usedLocalQuestionIds.includes(id)) {
      usedLocalQuestionIds = [...usedLocalQuestionIds, id]
    }
  }

  if (
    state.currentQuestionIndex === 2 &&
    !state.midQuizPromptShown &&
    !state.showQuestionPrompt &&
    !state.localQuestionsCompleted &&
    !state.completed &&
    isLocalQuestion(current)
  ) {
    return {
      ...state,
      usedLocalQuestionIds,
      midQuizPromptShown: true,
      showQuestionPrompt: true,
      selectedAnswer: null,
    }
  }

  const moreLocalAfter = state.allQuestions
    .slice(state.currentQuestionIndex + 1)
    .some((q) => isLocalQuestion(q))
  if (
    isLocalQuestion(current) &&
    !moreLocalAfter &&
    !aiQuestionsLoaded &&
    !state.localQuestionsCompleted
  ) {
    return {
      ...state,
      usedLocalQuestionIds,
      localQuestionsCompleted: true,
      selectedAnswer: null,
    }
  }

  if (state.currentQuestionIndex < state.allQuestions.length - 1) {
    return {
      ...state,
      usedLocalQuestionIds,
      currentQuestionIndex: state.currentQuestionIndex + 1,
      selectedAnswer: null,
    }
  }

  return {
    ...state,
    usedLocalQuestionIds,
    completed: true,
    errorMessage: null,
  }
}

export function quizSessionReducer(
  state: QuizSessionState,
  action: QuizSessionAction,
): QuizSessionState {
  switch (action.type) {
    case QuizSessionActionType.Replace:
      return action.state

    case QuizSessionActionType.SeedUnseen:
      return {
        ...state,
        allQuestions: action.questions,
        usedLocalQuestionIds: [],
        quizStartTime: action.now,
        incorrectAnswers: [],
        incorrectAnswersWithSelection: [],
        skippedQuestionIds: [],
        totalTimeSpent: 0,
        errorMessage: action.exhaustedMessage,
      }

    case QuizSessionActionType.SelectAnswer: {
      const current = state.allQuestions[state.currentQuestionIndex]
      if (state.completed || !current) return state
      const isCorrect = action.index === current.correctAnswer
      const next: QuizSessionState = {
        ...state,
        errorMessage: null,
        selectedAnswer: action.index,
        score: isCorrect ? state.score + 1 : state.score,
        totalTimeSpent: state.totalTimeSpent + action.timeSpentSec,
      }
      if (!isCorrect) {
        Object.assign(next, markIncorrect(state, current, action.index))
      }
      return next
    }

    case QuizSessionActionType.SkipMark: {
      const current = state.allQuestions[state.currentQuestionIndex]
      if (!current || state.completed) return state
      const skippedQuestionIds = state.skippedQuestionIds.includes(current.id)
        ? state.skippedQuestionIds
        : [...state.skippedQuestionIds, current.id]
      return {
        ...state,
        skippedQuestionIds,
        totalTimeSpent: state.totalTimeSpent + action.timeSpentSec,
        ...markIncorrect(state, current, -1),
      }
    }

    case QuizSessionActionType.Next:
      return applyNext(state, action.aiQuestionsLoaded, action.now, action.canonicalId)

    case QuizSessionActionType.Finish:
      return { ...state, completed: true, errorMessage: null }

    case QuizSessionActionType.SetAllQuestions:
      return { ...state, allQuestions: resolve(action.value, state.allQuestions) }
    case QuizSessionActionType.SetCurrentIndex:
      return { ...state, currentQuestionIndex: resolve(action.value, state.currentQuestionIndex) }
    case QuizSessionActionType.SetSelectedAnswer:
      return { ...state, selectedAnswer: resolve(action.value, state.selectedAnswer) }
    case QuizSessionActionType.SetCompleted:
      return { ...state, completed: resolve(action.value, state.completed) }
    case QuizSessionActionType.SetError:
      return { ...state, errorMessage: resolve(action.value, state.errorMessage) }
    case QuizSessionActionType.SetShowPrompt:
      return { ...state, showQuestionPrompt: resolve(action.value, state.showQuestionPrompt) }
    case QuizSessionActionType.SetPromptType:
      return { ...state, questionPromptType: resolve(action.value, state.questionPromptType) }

    case QuizSessionActionType.SelectPromptType:
      return { ...state, errorMessage: null, questionPromptType: action.promptType }

    case QuizSessionActionType.CancelPrompt: {
      // Mid-prompt stays on the answered index (usually 2). Advancing past the
      // last item left currentQuestion undefined → perpetual "Loading questions…".
      const nextIndex = state.currentQuestionIndex + 1
      const hasMore = nextIndex < state.allQuestions.length
      return {
        ...state,
        errorMessage: null,
        showQuestionPrompt: false,
        questionPromptType: null,
        selectedAnswer: null,
        ...(hasMore
          ? { currentQuestionIndex: nextIndex }
          : { completed: true, localQuestionsCompleted: true }),
      }
    }

    case QuizSessionActionType.LoadMoreOk:
      return {
        ...state,
        allQuestions: action.updatedQuestions,
        usedLocalQuestionIds: action.usedIds,
        errorMessage: action.warning,
        showQuestionPrompt: false,
        questionPromptType: null,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        selectedAnswer: null,
      }

    case QuizSessionActionType.LoadMoreEmptyBank:
      return {
        ...state,
        errorMessage:
          'No local questions available for this topic. Try AI-generated questions instead.',
      }

    case QuizSessionActionType.LoadMoreNoUnseen:
      return {
        ...state,
        questionPromptType: QuestionPromptKind.Ai,
        errorMessage:
          'No new local questions left. Choose an AI count, or Back to continue the quiz.',
      }

    case QuizSessionActionType.LoadMoreFail:
      return { ...state, errorMessage: action.message }

    case QuizSessionActionType.LoadMoreNoDay:
      return { ...state, completed: true }

    case QuizSessionActionType.Reset: {
      const { questions, exhausted } = pickLocalDeck(action.bank, action.picked)
      return {
        ...state,
        allQuestions: questions,
        currentQuestionIndex: 0,
        selectedAnswer: null,
        score: 0,
        completed: false,
        localQuestionsCompleted: false,
        errorMessage: exhausted
          ? 'All local questions were already completed. Showing the full bank again — or use AI / Retake Incorrect.'
          : null,
        showQuestionPrompt: false,
        questionPromptType: null,
        midQuizPromptShown: false,
        incorrectAnswers: [],
        incorrectAnswersWithSelection: [],
        skippedQuestionIds: [],
        totalTimeSpent: 0,
        quizStartTime: action.now,
        usedLocalQuestionIds: [],
      }
    }

    case QuizSessionActionType.ResetIncorrect: {
      if (state.incorrectAnswers.length === 0) return state
      const incorrectIds = new Set(state.incorrectAnswers.map((q) => q.id))
      const incorrectOnly = state.allQuestions.filter((q) => incorrectIds.has(q.id))
      const shuffled = [...incorrectOnly].sort(() => Math.random() - 0.5).map(asLocal)
      return {
        ...state,
        allQuestions: tagQuestions(shuffled),
        currentQuestionIndex: 0,
        selectedAnswer: null,
        score: 0,
        completed: false,
        localQuestionsCompleted: false,
        errorMessage: null,
        showQuestionPrompt: false,
        questionPromptType: null,
        midQuizPromptShown: false,
        incorrectAnswers: [],
        incorrectAnswersWithSelection: [],
        skippedQuestionIds: [],
        totalTimeSpent: 0,
        quizStartTime: action.now,
        usedLocalQuestionIds: [],
      }
    }

    default:
      return state
  }
}
