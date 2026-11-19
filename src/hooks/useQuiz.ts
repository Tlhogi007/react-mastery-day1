/**
 * Custom hook for quiz state management
 * Follows Single Responsibility Principle - handles only quiz logic
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { QuizQuestion } from '../types/challenges'
import { quizQuestionService } from '../services/quizQuestionService'
import { getTopicForDay } from '../services/topicMapper'
import { progressStorage } from '../services/progressStorage'
import { questionHistory } from '../services/questionHistory'
import { analytics } from '../services/analytics'
import { captureWarning, setAppContext } from '../lib/sentry'
import { QUIZ_THRESHOLDS } from '../constants'
import { getAiAuthToken } from '../services/aiAuthBridge'
import {
  clearQuizProgress,
  consumeAiResumePending,
  loadQuizProgress,
  markAiResumePending,
  peekAiResumePending,
  saveQuizProgress,
} from '../services/quizResume'

interface UseQuizOptions {
  questions: QuizQuestion[]
  day?: number
}

interface UseQuizReturn {
  // State
  allQuestions: QuizQuestion[]
  currentQuestion: QuizQuestion | undefined
  currentQuestionIndex: number
  selectedAnswer: number | null
  score: number
  completed: boolean
  localQuestionsCompleted: boolean
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
  quizStartTime: number | null
  totalTimeSpent: number
  skippedQuestions: Set<string>

  // Actions
  handleAnswerSelect: (index: number) => void
  handleNext: () => void
  handleSkip: () => void
  handleAIGenerationRequest: (count: number) => Promise<void>
  handleLoadMoreLocalQuestions: (count: number) => Promise<void>
  handleFinishQuiz: () => void
  reset: () => void
  resetWithIncorrectOnly: () => void
  toggleAI: () => void
  handleSelectPromptType: (type: 'local' | 'ai' | null) => void
  handleCancelPrompt: () => void
}

export function useQuiz({ questions, day }: UseQuizOptions): UseQuizReturn {
  const [boot] = useState(() => (day != null ? loadQuizProgress(day) : null))

  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>(
    () => boot?.allQuestions ?? questions,
  )
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
  const [aiQuestionCount, setAiQuestionCount] = useState<number | null>(null)
  const [generatingAI, setGeneratingAI] = useState<boolean>(false)
  const [aiEnabled, setAiEnabled] = useState<boolean>(() => boot?.aiEnabled ?? false)
  const [loadingAI, setLoadingAI] = useState<boolean>(false)
  const [aiQuestionsLoaded, setAiQuestionsLoaded] = useState<boolean>(
    () => boot?.aiQuestionsLoaded ?? false,
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showQuestionPrompt, setShowQuestionPrompt] = useState<boolean>(false)
  const [questionPromptType, setQuestionPromptType] = useState<'local' | 'ai' | null>(null)
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
  const localQuestionsCount = questions.length
  const isAISection = currentQuestionIndex >= localQuestionsCount

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
    const shuffled =
      picked.length > 0
        ? picked
        : [...questions].sort(() => Math.random() - 0.5)
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

  // Persist progress so OAuth remount can continue mid-quiz
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

  // After sign-in, resume AI opt-in / generation that was interrupted by auth
  useEffect(() => {
    if (day == null) return
    const pending = peekAiResumePending()
    if (!pending || pending.day !== day) return

    let cancelled = false
    ;(async () => {
      for (let i = 0; i < 30; i++) {
        if (cancelled) return
        const token = await getAiAuthToken()
        if (token) {
          const resume = consumeAiResumePending(day)
          if (!resume || cancelled) return
          if (resume.mode === 'generate' && resume.count) {
            setAiQuestionCount(resume.count)
            setGeneratingAI(true)
            setErrorMessage(null)
            try {
              const topic = getTopicForDay(day)
              const aiQuestions = await quizQuestionService.getQuestions(
                day,
                topic,
                resume.count,
                true,
              )
              if (cancelled) return
              if (aiQuestions.length > 0) {
                setAllQuestions((prev) => [
                  ...prev.slice(0, currentQuestionIndex + 1),
                  ...aiQuestions,
                  ...prev.slice(currentQuestionIndex + 1),
                ])
                setAiQuestionsLoaded(true)
                setShowQuestionPrompt(false)
                setQuestionPromptType(null)
                setCurrentQuestionIndex((prev) => prev + 1)
                setSelectedAnswer(null)
              }
            } finally {
              if (!cancelled) setGeneratingAI(false)
            }
          } else {
            setAiEnabled(true)
            setAiQuestionsLoaded(false)
            setErrorMessage(null)
          }
          return
        }
        await new Promise((r) => setTimeout(r, 100))
      }
    })()

    return () => {
      cancelled = true
    }
    // Only on mount / day change — resume once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day])

  // Track time per question
  useEffect(() => {
    if (currentQuestion) {
      questionStartTimeRef.current = Date.now()
    }
  }, [currentQuestionIndex, currentQuestion])

  // Show prompt after 3 questions - removed, now handled in handleNext

  // Fetch AI questions when toggle is enabled (legacy support)
  useEffect(() => {
    if (aiEnabled && day && !aiQuestionsLoaded && !loadingAI && !localQuestionsCompleted) {
      const fetchAIQuestions = async (): Promise<void> => {
        setLoadingAI(true)
        setErrorMessage(null)
        markAiResumePending({ day, mode: 'toggle' })
        try {
          const topic = getTopicForDay(day)
          const aiQuestions = await quizQuestionService.getQuestions(day, topic, 5)

          if (aiQuestions.length > 0) {
            consumeAiResumePending(day)
            // Combine local + AI questions, shuffle them
            const combined = [...questions, ...aiQuestions]
            const shuffled = combined.sort(() => Math.random() - 0.5)
            setAllQuestions(shuffled)
            setAiQuestionsLoaded(true)
          } else {
            setErrorMessage('No additional questions could be loaded. Using local questions only.')
          }
        } catch (error) {
          console.error('Failed to load AI questions:', error)
          captureWarning(error, { day, topic: getTopicForDay(day) }, {
            feature: 'quiz',
            'quiz.action': 'prefetch_ai',
            'app.day': String(day),
          })
          setErrorMessage('Failed to load additional questions. Please check your connection and try again.')
        } finally {
          setLoadingAI(false)
        }
      }

      fetchAIQuestions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiEnabled, day, aiQuestionsLoaded, loadingAI, localQuestionsCompleted])

  const handleAnswerSelect = useCallback((index: number): void => {
    if (completed || !currentQuestion) return
    setSelectedAnswer(index)
    const isCorrect = index === currentQuestion.correctAnswer
    if (isCorrect) {
      setScore(prev => prev + 1)
    } else {
      // Track incorrect answer for review with selected index
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
    
    // Track time spent on this question
    const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000)
    timePerQuestionRef.current.set(currentQuestion.id, timeSpent)
    setTotalTimeSpent(prev => prev + timeSpent)
    
    // Record in history with day and topic
    const topic = day ? getTopicForDay(day) : undefined
    questionHistory.recordAnswer(currentQuestion, isCorrect, timeSpent, day, topic)
  }, [completed, currentQuestion])

  const handleFinishQuiz = useCallback((): void => {
    setCompleted(true)
    // Save progress when quiz is completed
    if (day) {
      const percentage = Math.round((score / allQuestions.length) * 100)
      const passed = percentage >= QUIZ_THRESHOLDS.PASSING_SCORE
      const dayKey = `day${day.toString().padStart(2, '0')}`
      progressStorage.markQuizCompleted(dayKey, percentage, passed)
      
      // Track analytics
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
    // Mark the current question as used when moving to next (only for local questions)
    if (currentQuestion && !isAISection) {
      setUsedLocalQuestionIds(prev => new Set([...prev, currentQuestion.id]))
    }

    // Show prompt after 3 questions (when moving from index 2 to 3)
    if (currentQuestionIndex === 2 && !showQuestionPrompt && !localQuestionsCompleted && !completed && !isAISection) {
      setShowQuestionPrompt(true)
      setSelectedAnswer(null)
      return
    }

    // Check if we're completing the last local question
    if (currentQuestionIndex === localQuestionsCount - 1 && !isAISection) {
      // Completing last local question - mark local section as complete
      setLocalQuestionsCompleted(true)
      setSelectedAnswer(null)
      return
    }

    // Check if we're completing AI questions or all questions
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer(null)
      questionStartTimeRef.current = Date.now()
    } else {
      // All questions done, finish quiz
      handleFinishQuiz()
    }
  }, [currentQuestionIndex, allQuestions.length, localQuestionsCount, isAISection, handleFinishQuiz, showQuestionPrompt, localQuestionsCompleted, completed, currentQuestion])

  const handleSkip = useCallback((): void => {
    if (!currentQuestion || completed) return
    
    // Mark as skipped
    setSkippedQuestions(prev => new Set([...prev, currentQuestion.id]))
    
    // Track time
    const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000)
    timePerQuestionRef.current.set(currentQuestion.id, timeSpent)
    
    // Record as incorrect in history + review list (skip ≠ ignore)
    const topic = day ? getTopicForDay(day) : undefined
    questionHistory.recordAnswer(currentQuestion, false, timeSpent, day, topic)
    setIncorrectAnswers((prev) => {
      if (prev.find((q) => q.id === currentQuestion.id)) return prev
      return [...prev, currentQuestion]
    })
    
    // Move to next question
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

      // Fetch all available local questions
      const allLocalQuestions = await quizQuestionService.fetchLocalQuestions(topic, 100)
      if (allLocalQuestions.length === 0) {
        setErrorMessage('No local questions available for this topic. Try AI-generated questions instead.')
        return
      }

      // Never repeat answered/shown local questions — no duplicate clones
      const sessionExclude = new Set(
        [...usedLocalQuestionIds, ...allQuestions.map((q) => q.id)].map((id) =>
          questionHistory.canonicalId(id),
        ),
      )
      const newQuestions = questionHistory.pickUnseenQuestions(
        allLocalQuestions,
        sessionExclude,
        count,
        day,
      )

      if (newQuestions.length === 0) {
        setErrorMessage(
          'No new local questions left for this day — you have already seen them all. Try AI-generated questions instead.',
        )
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
  }, [day, allQuestions, currentQuestionIndex, usedLocalQuestionIds])

  const handleAIGenerationRequest = useCallback(async (count: number): Promise<void> => {
    if (!day) {
      // No day specified, just finish
      setCompleted(true)
      return
    }

    if (count === 0) {
      // No AI questions requested, finish quiz with local questions only
      setCompleted(true)
      const percentage = Math.round((score / allQuestions.length) * 100)
      const passed = percentage >= QUIZ_THRESHOLDS.PASSING_SCORE
      const dayKey = `day${day.toString().padStart(2, '0')}`
      progressStorage.markQuizCompleted(dayKey, percentage, passed)
      return
    }

    setAiQuestionCount(count)
    setGeneratingAI(true)
    setErrorMessage(null)
    markAiResumePending({ day, mode: 'generate', count })

    try {
      const topic = getTopicForDay(day)
      // Skip local questions - we only want NEW AI-generated questions
      const aiQuestions = await quizQuestionService.getQuestions(day, topic, count, true)
      
      if (aiQuestions.length > 0) {
        consumeAiResumePending(day)
        // Add AI questions after current position
        const updated = [
          ...allQuestions.slice(0, currentQuestionIndex + 1),
          ...aiQuestions,
          ...allQuestions.slice(currentQuestionIndex + 1)
        ]
        setAllQuestions(updated)
        setAiQuestionsLoaded(true)
        
        // Close prompt and continue to next question
        setShowQuestionPrompt(false)
        setQuestionPromptType(null)
        setCurrentQuestionIndex(prev => prev + 1)
        setSelectedAnswer(null)
        
      } else {
        console.warn(`⚠️ [Quiz] No AI questions were generated. APIs may be unavailable or parsing failed.`)
        setErrorMessage('No additional questions could be loaded. Please try again or continue with remaining questions.')
      }
    } catch (error) {
      console.error('❌ [Quiz] Failed to load AI questions:', error)
      captureWarning(error, {
        day,
        topic: day ? getTopicForDay(day) : undefined,
        requestedCount: count,
      }, {
        feature: 'quiz',
        'quiz.action': 'load_ai',
        ...(day != null ? { 'app.day': String(day) } : {}),
      })
      setErrorMessage(`Failed to load additional questions: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
    } finally {
      setGeneratingAI(false)
    }
  }, [day, allQuestions, currentQuestionIndex, score])

  const handleSelectPromptType = useCallback((type: 'local' | 'ai' | null): void => {
    setQuestionPromptType(type)
  }, [])

  const handleCancelPrompt = useCallback((): void => {
    setShowQuestionPrompt(false)
    setQuestionPromptType(null)
    // Continue with remaining questions
  }, [])

  const reset = useCallback((): void => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setScore(0)
    setCompleted(false)
    setLocalQuestionsCompleted(false)
    setAiQuestionCount(null)
    setGeneratingAI(false)
    // Prefer questions not yet completed; do not mark the whole bank used up front
    const fresh = questionHistory.pickUnseenQuestions(questions, new Set(), questions.length, day)
    const shuffled =
      fresh.length > 0
        ? fresh
        : [...questions].sort(() => Math.random() - 0.5)
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
    setIncorrectAnswers([])
    setIncorrectAnswersWithSelection([])
    setSkippedQuestions(new Set())
    setTotalTimeSpent(0)
    setQuizStartTime(Date.now())
    questionStartTimeRef.current = Date.now()
    timePerQuestionRef.current.clear()
    setUsedLocalQuestionIds(new Set())
    if (day != null) clearQuizProgress()
  }, [questions, day])

  const resetWithIncorrectOnly = useCallback((): void => {
    if (incorrectAnswers.length === 0) return
    
    // Create a quiz with only incorrect questions
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
    setIncorrectAnswers([])
    setIncorrectAnswersWithSelection([])
    setSkippedQuestions(new Set())
    setTotalTimeSpent(0)
    setQuizStartTime(Date.now())
    questionStartTimeRef.current = Date.now()
    timePerQuestionRef.current.clear()
    setUsedLocalQuestionIds(new Set())
  }, [incorrectAnswers, allQuestions])

  const toggleAI = useCallback((): void => {
    if (!day || localQuestionsCompleted) return // Don't allow toggle after local questions are done
    setAiEnabled(!aiEnabled)
    setErrorMessage(null)
    if (!aiEnabled) {
      // Will trigger useEffect to fetch
    } else {
      // Disable: revert to local questions
      setAllQuestions(questions)
      setAiQuestionsLoaded(false)
      setCurrentQuestionIndex(0)
      setSelectedAnswer(null)
    }
  }, [day, aiEnabled, questions, localQuestionsCompleted])

  const percentage = useMemo(() => {
    if (completed && allQuestions.length > 0) {
      return Math.round((score / allQuestions.length) * 100)
    }
    return 0
  }, [completed, score, allQuestions.length])

  return {
    allQuestions,
    currentQuestion,
    currentQuestionIndex,
    selectedAnswer,
    score,
    completed,
    localQuestionsCompleted,
    aiQuestionCount,
    generatingAI,
    aiEnabled,
    loadingAI,
    aiQuestionsLoaded,
    errorMessage,
    percentage,
    showQuestionPrompt,
    questionPromptType,
  incorrectAnswers,
  incorrectAnswersWithSelection,
  quizStartTime,
  totalTimeSpent,
  skippedQuestions,
    handleAnswerSelect,
    handleNext,
    handleSkip,
    handleAIGenerationRequest,
    handleLoadMoreLocalQuestions,
    handleFinishQuiz,
    reset,
    resetWithIncorrectOnly,
    toggleAI,
    handleSelectPromptType,
    handleCancelPrompt
  }
}
