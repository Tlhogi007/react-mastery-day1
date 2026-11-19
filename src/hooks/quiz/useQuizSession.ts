import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type Dispatch,
  type SetStateAction,
} from 'react'
import type { QuizQuestion } from '../../types/challenges'
import type { QuizProgressSnapshot } from '../../services/quizResume'
import { quizQuestionService } from '../../services/quizQuestionService'
import { getTopicForDay } from '../../services/topicMapper'
import { progressStorage } from '../../services/progressStorage'
import { questionHistory } from '../../services/questionHistory'
import { analytics } from '../../services/analytics'
import { setAppContext } from '../../lib/sentry'
import { QUIZ_THRESHOLDS } from '../../constants'
import { clearAiGate, suppressAiGate } from '../../services/aiAuthBridge'
import { clearQuizProgress } from '../../services/quizResume'
import { asAi, asLocal, isLocalQuestion } from './tags'

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
  questionPromptType: 'local' | 'ai' | null
  setQuestionPromptType: Dispatch<SetStateAction<'local' | 'ai' | null>>
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
  handleSelectPromptType: (type: 'local' | 'ai' | null) => void
  handleCancelPrompt: () => void
}

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
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>(() => {
    const seed = boot?.allQuestions ?? questions
    return seed.map((q) => (q.source === 'ai' ? asAi(q) : asLocal(q)))
  })
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(
    () => boot?.currentQuestionIndex ?? 0,
  )
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(
    () => boot?.selectedAnswer ?? null,
  )
  const [score, setScore] = useState<number>(() => boot?.score ?? 0)
  const [completed, setCompleted] = useState<boolean>(() => boot?.completed ?? false)
  const [localQuestionsCompleted, setLocalQuestionsCompleted] = useState<boolean>(
    () => boot?.localQuestionsCompleted ?? false,
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showQuestionPrompt, setShowQuestionPrompt] = useState<boolean>(false)
  const [questionPromptType, setQuestionPromptType] = useState<'local' | 'ai' | null>(null)
  /** Mid-quiz “want more?” only once per attempt (index 2 → 3). */
  const midQuizPromptShownRef = useRef(false)
  const [usedLocalQuestionIds, setUsedLocalQuestionIds] = useState<Set<string>>(
    () => new Set(boot?.usedLocalQuestionIds ?? []),
  )
  const [incorrectAnswers, setIncorrectAnswers] = useState<QuizQuestion[]>(() => {
    if (!boot?.incorrectAnswerIds?.length) return []
    return (boot.allQuestions || []).filter((q) => boot.incorrectAnswerIds.includes(q.id))
  })
  const [incorrectAnswersWithSelection, setIncorrectAnswersWithSelection] = useState<
    Array<{ question: QuizQuestion; selectedIndex: number }>
  >([])
  const [quizStartTime, setQuizStartTime] = useState<number | null>(() => Date.now())
  const [totalTimeSpent, setTotalTimeSpent] = useState<number>(() => boot?.totalTimeSpent ?? 0)
  const [skippedQuestions, setSkippedQuestions] = useState<Set<string>>(new Set())
  const questionStartTimeRef = useRef<number>(Date.now())
  const timePerQuestionRef = useRef<Map<string, number>>(new Map())

  const currentQuestion = allQuestions[currentQuestionIndex]
  const localQuestionsCount = useMemo(
    () => allQuestions.filter((q) => isLocalQuestion(q)).length,
    [allQuestions],
  )
  const isAISection = currentQuestion?.source === 'ai'
  const missedCount = Math.max(0, allQuestions.length - score)

  useEffect(() => {
    if (day != null) {
      setAppContext({ day })
    }
  }, [day])

  // Initialize with unseen local questions when possible (skip if OAuth restore already applied)
  useEffect(() => {
    if (boot) return
    const picked = questionHistory.pickUnseenQuestions(
      questions,
      new Set(),
      questions.length,
      day,
    )
    const shuffled = (picked.length > 0 ? picked : [...questions].sort(() => Math.random() - 0.5)).map(
      asLocal,
    )
    setAllQuestions(shuffled)
    setUsedLocalQuestionIds(new Set())
    setQuizStartTime(Date.now())
    questionStartTimeRef.current = Date.now()
    setIncorrectAnswers([])
    setSkippedQuestions(new Set())
    setTotalTimeSpent(0)
    if (picked.length === 0 && questions.length > 0) {
      setErrorMessage(
        'You have already completed all local questions for this day. Retake will reuse the bank, or try AI questions.',
      )
    }
  }, [questions, boot, day])

  // Track time per question
  useEffect(() => {
    if (currentQuestion) {
      questionStartTimeRef.current = Date.now()
    }
  }, [currentQuestionIndex, currentQuestion])

  const handleAnswerSelect = useCallback((index: number): void => {
    if (completed || !currentQuestion) return
    setErrorMessage(null)
    setSelectedAnswer(index)
    const isCorrect = index === currentQuestion.correctAnswer
    if (isCorrect) {
      setScore(prev => prev + 1)
    } else {
      setIncorrectAnswers(prev => {
        if (!prev.find(q => q.id === currentQuestion.id)) {
          return [...prev, currentQuestion]
        }
        return prev
      })
      setIncorrectAnswersWithSelection(prev => {
        if (!prev.find(item => item.question.id === currentQuestion.id)) {
          return [...prev, { question: currentQuestion, selectedIndex: index }]
        }
        return prev
      })
    }

    const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000)
    timePerQuestionRef.current.set(currentQuestion.id, timeSpent)
    setTotalTimeSpent(prev => prev + timeSpent)

    const topic = day ? getTopicForDay(day) : undefined
    questionHistory.recordAnswer(currentQuestion, isCorrect, timeSpent, day, topic)
  }, [completed, currentQuestion, day])

  const handleFinishQuiz = useCallback((): void => {
    suppressAiGate()
    clearAiGate()
    setErrorMessage(null)
    setCompleted(true)
    if (day) {
      const percentage = Math.round((score / allQuestions.length) * 100)
      const passed = percentage >= QUIZ_THRESHOLDS.PASSING_SCORE
      const dayKey = `day${day.toString().padStart(2, '0')}`
      progressStorage.markQuizCompleted(dayKey, percentage, passed)

      const totalTime = quizStartTime ? Math.floor((Date.now() - quizStartTime) / 1000 / 60) : 0
      analytics.trackQuizComplete(day, score, passed)
      analytics.trackTimeSpent(day, totalTime)
      analytics.track('quiz_completed', {
        day,
        score,
        percentage,
        passed,
        totalQuestions: allQuestions.length,
        incorrectCount: incorrectAnswers.length,
        skippedCount: skippedQuestions.size,
        totalTimeMinutes: totalTime
      })
    }
  }, [day, score, allQuestions.length, quizStartTime, incorrectAnswers.length, skippedQuestions.size])

  const handleNext = useCallback((): void => {
    if (currentQuestion && isLocalQuestion(currentQuestion)) {
      setUsedLocalQuestionIds((prev) => new Set([...prev, questionHistory.canonicalId(currentQuestion.id)]))
    }

    if (
      currentQuestionIndex === 2 &&
      !midQuizPromptShownRef.current &&
      !showQuestionPrompt &&
      !localQuestionsCompleted &&
      !completed &&
      isLocalQuestion(currentQuestion)
    ) {
      midQuizPromptShownRef.current = true
      setShowQuestionPrompt(true)
      setSelectedAnswer(null)
      return
    }

    const moreLocalAfter = allQuestions
      .slice(currentQuestionIndex + 1)
      .some((q) => isLocalQuestion(q))
    if (
      isLocalQuestion(currentQuestion) &&
      !moreLocalAfter &&
      !aiQuestionsLoaded &&
      !localQuestionsCompleted
    ) {
      setLocalQuestionsCompleted(true)
      setSelectedAnswer(null)
      return
    }

    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setSelectedAnswer(null)
      questionStartTimeRef.current = Date.now()
    } else {
      handleFinishQuiz()
    }
  }, [
    currentQuestionIndex,
    allQuestions,
    aiQuestionsLoaded,
    handleFinishQuiz,
    showQuestionPrompt,
    localQuestionsCompleted,
    completed,
    currentQuestion,
  ])

  const handleSkip = useCallback((): void => {
    if (!currentQuestion || completed) return

    setSkippedQuestions(prev => new Set([...prev, currentQuestion.id]))

    const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000)
    timePerQuestionRef.current.set(currentQuestion.id, timeSpent)

    const topic = day ? getTopicForDay(day) : undefined
    questionHistory.recordAnswer(currentQuestion, false, timeSpent, day, topic)
    setIncorrectAnswers((prev) => {
      if (prev.find((q) => q.id === currentQuestion.id)) return prev
      return [...prev, currentQuestion]
    })
    setIncorrectAnswersWithSelection((prev) => {
      if (prev.find((item) => item.question.id === currentQuestion.id)) return prev
      return [...prev, { question: currentQuestion, selectedIndex: -1 }]
    })

    handleNext()
  }, [currentQuestion, completed, handleNext, day])

  const handleLoadMoreLocalQuestions = useCallback(async (count: number): Promise<void> => {
    if (!day) {
      setCompleted(true)
      return
    }

    setGeneratingAI(true)
    setErrorMessage(null)

    try {
      const topic = getTopicForDay(day)

      const allLocalQuestions = await quizQuestionService.fetchLocalQuestions(topic, 100)
      if (allLocalQuestions.length === 0) {
        setErrorMessage('No local questions available for this topic. Try AI-generated questions instead.')
        return
      }

      const sessionExclude = new Set(
        [...usedLocalQuestionIds, ...allQuestions.map((q) => q.id)].map((id) =>
          questionHistory.canonicalId(id),
        ),
      )
      const newQuestions = questionHistory
        .pickUnseenQuestions(allLocalQuestions, sessionExclude, count, day)
        .map(asLocal)

      if (newQuestions.length === 0) {
        setQuestionPromptType('ai')
        setErrorMessage('No new local questions left. Choose an AI count, or Back to continue the quiz.')
        return
      }

      if (newQuestions.length < count) {
        setErrorMessage(
          `Only ${newQuestions.length} new local question${newQuestions.length === 1 ? '' : 's'} left — added those (no repeats).`,
        )
      }

      const updated = [
        ...allQuestions.slice(0, currentQuestionIndex + 1),
        ...newQuestions,
        ...allQuestions.slice(currentQuestionIndex + 1),
      ]
      setAllQuestions(updated)
      setUsedLocalQuestionIds(
        new Set([
          ...usedLocalQuestionIds,
          ...newQuestions.map((q) => questionHistory.canonicalId(q.id)),
        ]),
      )
      setShowQuestionPrompt(false)
      setQuestionPromptType(null)
      setCurrentQuestionIndex((prev) => prev + 1)
      setSelectedAnswer(null)
    } catch (error) {
      console.error('❌ [Quiz] Failed to load more local questions:', error)
      setErrorMessage('Failed to load more local questions. Please try again.')
    } finally {
      setGeneratingAI(false)
    }
  }, [day, allQuestions, currentQuestionIndex, usedLocalQuestionIds, setGeneratingAI])

  const handleSelectPromptType = useCallback((type: 'local' | 'ai' | null): void => {
    setErrorMessage(null)
    setQuestionPromptType(type)
  }, [])

  const handleCancelPrompt = useCallback((): void => {
    setErrorMessage(null)
    setShowQuestionPrompt(false)
    setQuestionPromptType(null)
    setCurrentQuestionIndex((prev) => prev + 1)
    setSelectedAnswer(null)
    questionStartTimeRef.current = Date.now()
  }, [])

  const reset = useCallback((): void => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setScore(0)
    setCompleted(false)
    setLocalQuestionsCompleted(false)
    setAiQuestionCount(null)
    setGeneratingAI(false)
    const fresh = questionHistory.pickUnseenQuestions(questions, new Set(), questions.length, day)
    const shuffled = (fresh.length > 0 ? fresh : [...questions].sort(() => Math.random() - 0.5)).map(
      asLocal,
    )
    setAllQuestions(shuffled)
    setAiEnabled(false)
    setAiQuestionsLoaded(false)
    setErrorMessage(
      fresh.length === 0 && questions.length > 0
        ? 'All local questions were already completed. Showing the full bank again — or use AI / Retake Incorrect.'
        : null,
    )
    setShowQuestionPrompt(false)
    setQuestionPromptType(null)
    midQuizPromptShownRef.current = false
    setIncorrectAnswers([])
    setIncorrectAnswersWithSelection([])
    setSkippedQuestions(new Set())
    setTotalTimeSpent(0)
    setQuizStartTime(Date.now())
    questionStartTimeRef.current = Date.now()
    timePerQuestionRef.current.clear()
    setUsedLocalQuestionIds(new Set())
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
    if (incorrectAnswers.length === 0) return

    const incorrectIds = new Set(incorrectAnswers.map(q => q.id))
    const incorrectOnly = allQuestions.filter(q => incorrectIds.has(q.id))
    const shuffled = [...incorrectOnly].sort(() => Math.random() - 0.5)

    setAllQuestions(shuffled)
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setScore(0)
    setCompleted(false)
    setLocalQuestionsCompleted(false)
    setAiQuestionCount(null)
    setGeneratingAI(false)
    setAiEnabled(false)
    setAiQuestionsLoaded(false)
    setErrorMessage(null)
    setShowQuestionPrompt(false)
    setQuestionPromptType(null)
    midQuizPromptShownRef.current = false
    setIncorrectAnswers([])
    setIncorrectAnswersWithSelection([])
    setSkippedQuestions(new Set())
    setTotalTimeSpent(0)
    setQuizStartTime(Date.now())
    questionStartTimeRef.current = Date.now()
    timePerQuestionRef.current.clear()
    setUsedLocalQuestionIds(new Set())
  }, [
    incorrectAnswers,
    allQuestions,
    setAiQuestionCount,
    setGeneratingAI,
    setAiEnabled,
    setAiQuestionsLoaded,
  ])

  const percentage = useMemo(() => {
    if (completed && allQuestions.length > 0) {
      return Math.round((score / allQuestions.length) * 100)
    }
    return 0
  }, [completed, score, allQuestions.length])

  return {
    allQuestions,
    setAllQuestions,
    currentQuestion,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    selectedAnswer,
    setSelectedAnswer,
    score,
    completed,
    setCompleted,
    localQuestionsCompleted,
    localQuestionsCount,
    isAISection,
    errorMessage,
    setErrorMessage,
    percentage,
    showQuestionPrompt,
    setShowQuestionPrompt,
    questionPromptType,
    setQuestionPromptType,
    incorrectAnswers,
    incorrectAnswersWithSelection,
    missedCount,
    quizStartTime,
    totalTimeSpent,
    skippedQuestions,
    usedLocalQuestionIds,
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
