import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type Dispatch,
  type SetStateAction,
} from 'react'
import type { QuizQuestion } from '../../types/challenges'
import { questionHistory } from '../../services/questionHistory'
import { setAppContext } from '../../lib/sentry'
import { clearQuizProgress } from '../../services/quizResume'
import { getTopicForDay } from '../../services/topicMapper'
import { createInitialQuizSessionState, pickLocalDeck } from './quizSessionState'
import { applyNext, quizSessionReducer } from './quizSessionReducer'
import { loadMoreLocalQuestions } from './loadMoreLocals'
import { persistQuizFinish } from './persistQuizFinish'
import { isLocalQuestion } from './tags'
import {
  LoadMoreLocalsReason,
  QuizSessionActionType,
  type QuestionPromptType,
} from './quizSessionEnums'

export type { UseQuizSessionParams, UseQuizSessionReturn } from './useQuizSessionTypes'
import type { UseQuizSessionParams, UseQuizSessionReturn } from './useQuizSessionTypes'

export function useQuizSession({
  questions,
  day,
  boot,
  aiQuestionsLoaded,
  setAiQuestionCount,
  setGeneratingAI,
  setAiEnabled,
  setAiQuestionsLoaded,
}: UseQuizSessionParams): UseQuizSessionReturn {
  const [state, dispatch] = useReducer(
    quizSessionReducer,
    undefined,
    () => createInitialQuizSessionState(questions, boot),
  )

  const questionStartTimeRef = useRef(Date.now())
  const timePerQuestionRef = useRef(new Map<string, number>())
  const stateRef = useRef(state)
  stateRef.current = state

  const currentQuestion = state.allQuestions[state.currentQuestionIndex]
  const localQuestionsCount = useMemo(
    () => state.allQuestions.filter((q) => isLocalQuestion(q)).length,
    [state.allQuestions],
  )
  const isAISection = currentQuestion?.source === 'ai'
  const missedCount = Math.max(0, state.allQuestions.length - state.score)
  const percentage = useMemo(() => {
    if (state.completed && state.allQuestions.length > 0) {
      return Math.round((state.score / state.allQuestions.length) * 100)
    }
    return 0
  }, [state.completed, state.score, state.allQuestions.length])

  useEffect(() => {
    if (day != null) setAppContext({ day })
  }, [day])

  // Depend on question ids — callers often pass a fresh `questions` array each render.
  const questionIdsKey = questions.map((q) => q.id).join('|')
  useEffect(() => {
    if (boot) return
    const picked = questionHistory.pickUnseenQuestions(
      questions,
      new Set(),
      questions.length,
      day,
    )
    const { questions: deck, exhausted } = pickLocalDeck(questions, picked)
    dispatch({
      type: QuizSessionActionType.SeedUnseen,
      questions: deck,
      exhaustedMessage: exhausted
        ? 'You have already completed all local questions for this day. Retake will reuse the bank, or try AI questions.'
        : null,
      now: Date.now(),
    })
    questionStartTimeRef.current = Date.now()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- questionIdsKey tracks bank identity
  }, [questionIdsKey, boot, day])

  useEffect(() => {
    if (currentQuestion) questionStartTimeRef.current = Date.now()
  }, [state.currentQuestionIndex, currentQuestion])

  const finishIfNeeded = useCallback(
    (prev: typeof state, next: typeof state) => {
      if (next.completed && !prev.completed) {
        persistQuizFinish({
          day,
          score: next.score,
          totalQuestions: next.allQuestions.length,
          incorrectCount: next.incorrectAnswers.length,
          skippedCount: next.skippedQuestionIds.length,
          quizStartTime: next.quizStartTime,
        })
      }
    },
    [day],
  )

  const handleAnswerSelect = useCallback(
    (index: number): void => {
      const current = stateRef.current
      const question = current.allQuestions[current.currentQuestionIndex]
      if (current.completed || !question) return
      const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000)
      timePerQuestionRef.current.set(question.id, timeSpent)
      const isCorrect = index === question.correctAnswer
      questionHistory.recordAnswer(
        question,
        isCorrect,
        timeSpent,
        day,
        day ? getTopicForDay(day) : undefined,
      )
      dispatch({
        type: QuizSessionActionType.SelectAnswer,
        index,
        timeSpentSec: timeSpent,
      })
    },
    [day],
  )

  const handleFinishQuiz = useCallback((): void => {
    const prev = stateRef.current
    const next = { ...prev, completed: true, errorMessage: null }
    finishIfNeeded(prev, next)
    dispatch({ type: QuizSessionActionType.Finish })
  }, [finishIfNeeded])

  const handleNext = useCallback((): void => {
    const prev = stateRef.current
    const next = applyNext(
      prev,
      aiQuestionsLoaded,
      Date.now(),
      (id) => questionHistory.canonicalId(id),
    )
    finishIfNeeded(prev, next)
    dispatch({ type: QuizSessionActionType.Replace, state: next })
  }, [aiQuestionsLoaded, finishIfNeeded])

  const handleSkip = useCallback((): void => {
    const prev = stateRef.current
    const question = prev.allQuestions[prev.currentQuestionIndex]
    if (!question || prev.completed) return
    const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000)
    timePerQuestionRef.current.set(question.id, timeSpent)
    questionHistory.recordAnswer(
      question,
      false,
      timeSpent,
      day,
      day ? getTopicForDay(day) : undefined,
    )
    const marked = quizSessionReducer(prev, {
      type: QuizSessionActionType.SkipMark,
      timeSpentSec: timeSpent,
    })
    const next = applyNext(
      marked,
      aiQuestionsLoaded,
      Date.now(),
      (id) => questionHistory.canonicalId(id),
    )
    finishIfNeeded(marked, next)
    dispatch({ type: QuizSessionActionType.Replace, state: next })
  }, [aiQuestionsLoaded, day, finishIfNeeded])

  const handleLoadMoreLocalQuestions = useCallback(
    async (count: number): Promise<void> => {
      if (!day) {
        dispatch({ type: QuizSessionActionType.LoadMoreNoDay })
        return
      }
      setGeneratingAI(true)
      dispatch({ type: QuizSessionActionType.SetError, value: null })
      const snap = stateRef.current
      const result = await loadMoreLocalQuestions({
        day,
        count,
        allQuestions: snap.allQuestions,
        currentQuestionIndex: snap.currentQuestionIndex,
        usedLocalQuestionIds: snap.usedLocalQuestionIds,
      })
      if (result.ok) {
        dispatch({
          type: QuizSessionActionType.LoadMoreOk,
          updatedQuestions: result.updatedQuestions,
          usedIds: result.usedIds,
          warning: result.warning,
          now: Date.now(),
        })
      } else if (result.reason === LoadMoreLocalsReason.EmptyBank) {
        dispatch({ type: QuizSessionActionType.LoadMoreEmptyBank })
      } else if (result.reason === LoadMoreLocalsReason.NoUnseen) {
        dispatch({ type: QuizSessionActionType.LoadMoreNoUnseen })
      } else {
        dispatch({
          type: QuizSessionActionType.LoadMoreFail,
          message: result.message || 'Failed to load more local questions. Please try again.',
        })
      }
      setGeneratingAI(false)
    },
    [day, setGeneratingAI],
  )

  const handleSelectPromptType = useCallback((type: QuestionPromptType): void => {
    dispatch({ type: QuizSessionActionType.SelectPromptType, promptType: type })
  }, [])

  const handleCancelPrompt = useCallback((): void => {
    dispatch({ type: QuizSessionActionType.CancelPrompt, now: Date.now() })
    questionStartTimeRef.current = Date.now()
  }, [])

  const reset = useCallback((): void => {
    setAiQuestionCount(null)
    setGeneratingAI(false)
    setAiEnabled(false)
    setAiQuestionsLoaded(false)
    const picked = questionHistory.pickUnseenQuestions(
      questions,
      new Set(),
      questions.length,
      day,
    )
    dispatch({
      type: QuizSessionActionType.Reset,
      bank: questions,
      picked,
      now: Date.now(),
    })
    questionStartTimeRef.current = Date.now()
    timePerQuestionRef.current.clear()
    if (day != null) clearQuizProgress()
  }, [
    questions,
    day,
    setAiQuestionCount,
    setGeneratingAI,
    setAiEnabled,
    setAiQuestionsLoaded,
  ])

  const resetWithIncorrectOnly = useCallback((): void => {
    if (stateRef.current.incorrectAnswers.length === 0) return
    setAiQuestionCount(null)
    setGeneratingAI(false)
    setAiEnabled(false)
    setAiQuestionsLoaded(false)
    dispatch({ type: QuizSessionActionType.ResetIncorrect, now: Date.now() })
    questionStartTimeRef.current = Date.now()
    timePerQuestionRef.current.clear()
  }, [setAiQuestionCount, setGeneratingAI, setAiEnabled, setAiQuestionsLoaded])

  return {
    allQuestions: state.allQuestions,
    setAllQuestions: ((value) =>
      dispatch({
        type: QuizSessionActionType.SetAllQuestions,
        value,
      })) as Dispatch<SetStateAction<QuizQuestion[]>>,
    currentQuestion,
    currentQuestionIndex: state.currentQuestionIndex,
    setCurrentQuestionIndex: ((value) =>
      dispatch({
        type: QuizSessionActionType.SetCurrentIndex,
        value,
      })) as Dispatch<SetStateAction<number>>,
    selectedAnswer: state.selectedAnswer,
    setSelectedAnswer: ((value) =>
      dispatch({
        type: QuizSessionActionType.SetSelectedAnswer,
        value,
      })) as Dispatch<SetStateAction<number | null>>,
    score: state.score,
    completed: state.completed,
    setCompleted: ((value) =>
      dispatch({
        type: QuizSessionActionType.SetCompleted,
        value,
      })) as Dispatch<SetStateAction<boolean>>,
    localQuestionsCompleted: state.localQuestionsCompleted,
    localQuestionsCount,
    isAISection,
    errorMessage: state.errorMessage,
    setErrorMessage: ((value) =>
      dispatch({
        type: QuizSessionActionType.SetError,
        value,
      })) as Dispatch<SetStateAction<string | null>>,
    percentage,
    showQuestionPrompt: state.showQuestionPrompt,
    setShowQuestionPrompt: ((value) =>
      dispatch({
        type: QuizSessionActionType.SetShowPrompt,
        value,
      })) as Dispatch<SetStateAction<boolean>>,
    questionPromptType: state.questionPromptType,
    setQuestionPromptType: ((value) =>
      dispatch({
        type: QuizSessionActionType.SetPromptType,
        value,
      })) as Dispatch<SetStateAction<QuestionPromptType>>,
    incorrectAnswers: state.incorrectAnswers,
    incorrectAnswersWithSelection: state.incorrectAnswersWithSelection,
    missedCount,
    quizStartTime: state.quizStartTime,
    totalTimeSpent: state.totalTimeSpent,
    skippedQuestions: new Set(state.skippedQuestionIds),
    usedLocalQuestionIds: new Set(state.usedLocalQuestionIds),
    handleAnswerSelect,
    handleNext,
    handleSkip,
    handleLoadMoreLocalQuestions,
    handleFinishQuiz,
    reset,
    resetWithIncorrectOnly,
    handleSelectPromptType,
    handleCancelPrompt,
  }
}
