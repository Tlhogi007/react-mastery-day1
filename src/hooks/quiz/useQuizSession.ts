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
import { USER_CLOUD_SYNCED_EVENT } from '../../services/userCloudSync'
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

  const seedFromHistory = useCallback(
    (forceReseed: boolean): void => {
      if (boot) return
      const s = stateRef.current
      if (s.completed || s.showQuestionPrompt || s.localQuestionsCompleted) return

      const picked = questionHistory.pickUnseenQuestions(
        questions,
        new Set(),
        questions.length,
        day,
      )
      const { questions: deck, exhausted } = pickLocalDeck(questions, picked)
      const exhaustedMessage = exhausted
        ? 'All local questions were already completed. Showing the full bank again — or use AI / Retake Incorrect.'
        : null

      // Mid-attempt on this device: don't reshuffle, only surface the banner once history arrives.
      const quizStarted =
        s.currentQuestionIndex > 0 || s.selectedAnswer !== null || s.score > 0
      if (quizStarted && !forceReseed) {
        if (exhausted && !s.errorMessage) {
          dispatch({ type: QuizSessionActionType.SetError, value: exhaustedMessage })
        }
        return
      }

      dispatch({
        type: QuizSessionActionType.SeedUnseen,
        questions: deck,
        exhaustedMessage,
        now: Date.now(),
      })
      questionStartTimeRef.current = Date.now()
    },
    [boot, day, questions],
  )

  useEffect(() => {
    seedFromHistory(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- questionIdsKey tracks bank identity
  }, [questionIdsKey, boot, day])

  // History can land from cloud after the quiz already seeded (other device finished first).
  useEffect(() => {
    const onSynced = (): void => seedFromHistory(false)
    window.addEventListener(USER_CLOUD_SYNCED_EVENT, onSynced)
    return () => window.removeEventListener(USER_CLOUD_SYNCED_EVENT, onSynced)
  }, [seedFromHistory])

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
    const prev = stateRef.current
    const nextIndex = prev.currentQuestionIndex + 1
    const willComplete = nextIndex >= prev.allQuestions.length
    dispatch({ type: QuizSessionActionType.CancelPrompt, now: Date.now() })
    if (willComplete) {
      finishIfNeeded(prev, {
        ...prev,
        completed: true,
        localQuestionsCompleted: true,
        showQuestionPrompt: false,
        questionPromptType: null,
        errorMessage: null,
        selectedAnswer: null,
      })
    } else {
      questionStartTimeRef.current = Date.now()
    }
  }, [finishIfNeeded])

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
