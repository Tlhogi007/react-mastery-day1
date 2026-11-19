import { useState, useEffect, useCallback, useRef, type Dispatch, type SetStateAction, type MutableRefObject } from 'react'
import type { QuizQuestion } from '../../types/challenges'
import type { QuizProgressSnapshot } from '../../services/quizResume'
import { quizQuestionService } from '../../services/quizQuestionService'
import { getTopicForDay } from '../../services/topicMapper'
import { progressStorage } from '../../services/progressStorage'
import { captureWarning } from '../../lib/sentry'
import { QUIZ_THRESHOLDS } from '../../constants'
import {
  aiGateBlocksProviderFallback,
  allowAiGate,
  clearAiGate,
  getAiAuthToken,
  subscribeAiGate,
  suppressAiGate,
} from '../../services/aiAuthBridge'
import {
  consumeAiResumePending,
  markAiResumePending,
  peekAiResumePending,
} from '../../services/quizResume'
import { asAi, asLocal } from './tags'

export interface QuizAiState {
  aiQuestionCount: number | null
  setAiQuestionCount: Dispatch<SetStateAction<number | null>>
  generatingAI: boolean
  setGeneratingAI: Dispatch<SetStateAction<boolean>>
  aiEnabled: boolean
  setAiEnabled: Dispatch<SetStateAction<boolean>>
  loadingAI: boolean
  setLoadingAI: Dispatch<SetStateAction<boolean>>
  aiQuestionsLoaded: boolean
  setAiQuestionsLoaded: Dispatch<SetStateAction<boolean>>
  aiGenEpochRef: MutableRefObject<number>
}

export function useQuizAiState(boot: QuizProgressSnapshot | null): QuizAiState {
  const [aiQuestionCount, setAiQuestionCount] = useState<number | null>(null)
  const [generatingAI, setGeneratingAI] = useState<boolean>(false)
  const [aiEnabled, setAiEnabled] = useState<boolean>(() => boot?.aiEnabled ?? false)
  const [loadingAI, setLoadingAI] = useState<boolean>(false)
  const [aiQuestionsLoaded, setAiQuestionsLoaded] = useState<boolean>(
    () => boot?.aiQuestionsLoaded ?? false,
  )
  const aiGenEpochRef = useRef(0)

  return {
    aiQuestionCount,
    setAiQuestionCount,
    generatingAI,
    setGeneratingAI,
    aiEnabled,
    setAiEnabled,
    loadingAI,
    setLoadingAI,
    aiQuestionsLoaded,
    setAiQuestionsLoaded,
    aiGenEpochRef,
  }
}

export interface UseQuizAiParams {
  day?: number
  questions: QuizQuestion[]
  allQuestions: QuizQuestion[]
  currentQuestionIndex: number
  score: number
  localQuestionsCompleted: boolean
  setAllQuestions: Dispatch<SetStateAction<QuizQuestion[]>>
  setCurrentQuestionIndex: Dispatch<SetStateAction<number>>
  setSelectedAnswer: Dispatch<SetStateAction<number | null>>
  setCompleted: Dispatch<SetStateAction<boolean>>
  setShowQuestionPrompt: Dispatch<SetStateAction<boolean>>
  setQuestionPromptType: Dispatch<SetStateAction<'local' | 'ai' | null>>
  setErrorMessage: Dispatch<SetStateAction<string | null>>
  ai: QuizAiState
}

export interface UseQuizAiReturn {
  aiQuestionCount: number | null
  generatingAI: boolean
  aiEnabled: boolean
  loadingAI: boolean
  aiQuestionsLoaded: boolean
  handleAIGenerationRequest: (count: number) => Promise<void>
  toggleAI: () => void
}

export function useQuizAi({
  day,
  questions,
  allQuestions,
  currentQuestionIndex,
  score,
  localQuestionsCompleted,
  setAllQuestions,
  setCurrentQuestionIndex,
  setSelectedAnswer,
  setCompleted,
  setShowQuestionPrompt,
  setQuestionPromptType,
  setErrorMessage,
  ai,
}: UseQuizAiParams): UseQuizAiReturn {
  const {
    aiQuestionCount,
    setAiQuestionCount,
    generatingAI,
    setGeneratingAI,
    aiEnabled,
    setAiEnabled,
    loadingAI,
    setLoadingAI,
    aiQuestionsLoaded,
    setAiQuestionsLoaded,
    aiGenEpochRef,
  } = ai

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
                  ...aiQuestions.map(asAi),
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
            // Append AI after the current local deck — do NOT reshuffle the full
            // bank (that re-queued already-answered locals and caused repeats).
            setAllQuestions((prev) => [
              ...prev.filter((q) => q.source !== 'ai'),
              ...aiQuestions.map(asAi),
            ])
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

  const handleAIGenerationRequest = useCallback(async (count: number): Promise<void> => {
    if (!day) {
      setCompleted(true)
      return
    }

    if (count === 0) {
      setCompleted(true)
      const percentage = Math.round((score / allQuestions.length) * 100)
      const passed = percentage >= QUIZ_THRESHOLDS.PASSING_SCORE
      const dayKey = `day${day.toString().padStart(2, '0')}`
      progressStorage.markQuizCompleted(dayKey, percentage, passed)
      return
    }

    const epoch = ++aiGenEpochRef.current
    allowAiGate()
    setAiQuestionCount(count)
    setGeneratingAI(true)
    setErrorMessage(null)
    markAiResumePending({ day, mode: 'generate', count })

    try {
      const topic = getTopicForDay(day)
      const aiQuestions = await quizQuestionService.getQuestions(day, topic, count, true)
      if (epoch !== aiGenEpochRef.current) return

      if (aiQuestions.length > 0) {
        consumeAiResumePending(day)
        const taggedAi = aiQuestions.map(asAi)
        const updated = [
          ...allQuestions.slice(0, currentQuestionIndex + 1),
          ...taggedAi,
          ...allQuestions.slice(currentQuestionIndex + 1)
        ]
        setAllQuestions(updated)
        setAiQuestionsLoaded(true)

        setShowQuestionPrompt(false)
        setQuestionPromptType(null)
        setCurrentQuestionIndex(prev => prev + 1)
        setSelectedAnswer(null)

      } else {
        console.warn(`⚠️ [Quiz] No AI questions were generated. APIs may be unavailable or parsing failed.`)
        setErrorMessage(
          aiGateBlocksProviderFallback()
            ? 'Hosted AI isn’t available (limit or sign-in). Finish the quiz, or add your own API key in Settings.'
            : 'No additional questions could be loaded. Finish the quiz, or try again later.',
        )
      }
    } catch (error) {
      if (epoch !== aiGenEpochRef.current) return
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
      if (epoch === aiGenEpochRef.current) setGeneratingAI(false)
    }
  }, [
    day,
    allQuestions,
    currentQuestionIndex,
    score,
    aiGenEpochRef,
    setAiQuestionCount,
    setGeneratingAI,
    setErrorMessage,
    setCompleted,
    setAllQuestions,
    setAiQuestionsLoaded,
    setShowQuestionPrompt,
    setQuestionPromptType,
    setCurrentQuestionIndex,
    setSelectedAnswer,
  ])

  // “Keep using local questions” on the AI auth/quota gate
  useEffect(() => {
    return subscribeAiGate((event) => {
      if (event.mode !== 'dismiss-local') return
      aiGenEpochRef.current += 1
      suppressAiGate()
      clearAiGate()
      setGeneratingAI(false)
      setLoadingAI(false)
      setErrorMessage(null)
      setShowQuestionPrompt(false)
      setQuestionPromptType(null)
      if (day != null) consumeAiResumePending(day)
      setCompleted(true)
      if (day) {
        const percentage = Math.round((score / Math.max(allQuestions.length, 1)) * 100)
        const passed = percentage >= QUIZ_THRESHOLDS.PASSING_SCORE
        const dayKey = `day${day.toString().padStart(2, '0')}`
        progressStorage.markQuizCompleted(dayKey, percentage, passed)
      }
    })
  }, [
    day,
    score,
    allQuestions.length,
    aiGenEpochRef,
    setGeneratingAI,
    setLoadingAI,
    setErrorMessage,
    setShowQuestionPrompt,
    setQuestionPromptType,
    setCompleted,
  ])

  const toggleAI = useCallback((): void => {
    if (!day || localQuestionsCompleted) return
    setAiEnabled(!aiEnabled)
    setErrorMessage(null)
    if (!aiEnabled) {
      // Will trigger useEffect to fetch
    } else {
      // Strip AI only — keep local order/progress so answered items don't reappear.
      setAllQuestions((prev) => {
        const locals = prev.filter((q) => q.source !== 'ai')
        return locals.length > 0 ? locals : questions.map(asLocal)
      })
      setAiQuestionsLoaded(false)
      setCurrentQuestionIndex((idx) => {
        const localLen = allQuestions.filter((q) => q.source !== 'ai').length
        const max = Math.max(0, localLen - 1)
        return Math.min(idx, max)
      })
      setSelectedAnswer(null)
    }
  }, [
    day,
    aiEnabled,
    questions,
    allQuestions,
    localQuestionsCompleted,
    setAiEnabled,
    setErrorMessage,
    setAllQuestions,
    setAiQuestionsLoaded,
    setCurrentQuestionIndex,
    setSelectedAnswer,
  ])

  return {
    aiQuestionCount,
    generatingAI,
    aiEnabled,
    loadingAI,
    aiQuestionsLoaded,
    handleAIGenerationRequest,
    toggleAI,
  }
}
