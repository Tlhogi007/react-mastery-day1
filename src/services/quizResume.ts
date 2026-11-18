/**
 * Resume quiz / AI generation after Clerk OAuth remounts the SPA.
 */

import type { QuizQuestion } from '../types/challenges'

const AI_RESUME_KEY = 'rm-ai-resume'
const PROGRESS_KEY = 'rm-quiz-progress'

export type AiResumePending = {
  day: number
  mode: 'toggle' | 'generate'
  count?: number
  at: number
}

export type QuizProgressSnapshot = {
  day: number
  currentQuestionIndex: number
  selectedAnswer: number | null
  score: number
  completed: boolean
  localQuestionsCompleted: boolean
  aiEnabled: boolean
  aiQuestionsLoaded: boolean
  allQuestions: QuizQuestion[]
  usedLocalQuestionIds: string[]
  incorrectAnswerIds: string[]
  totalTimeSpent: number
  at: number
}

function safeGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

function safeRemove(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/** Call when hosted AI asks the user to sign in. */
export function markAiResumePending(pending: Omit<AiResumePending, 'at'>): void {
  safeSet(AI_RESUME_KEY, JSON.stringify({ ...pending, at: Date.now() }))
}

export function peekAiResumePending(): AiResumePending | null {
  try {
    const raw = safeGet(AI_RESUME_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AiResumePending
    // Ignore stale flags (> 30 min)
    if (!parsed?.day || Date.now() - parsed.at > 30 * 60_000) {
      safeRemove(AI_RESUME_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function consumeAiResumePending(day?: number): AiResumePending | null {
  const pending = peekAiResumePending()
  if (!pending) return null
  if (day != null && pending.day !== day) return null
  safeRemove(AI_RESUME_KEY)
  return pending
}

export function saveQuizProgress(snapshot: QuizProgressSnapshot): void {
  safeSet(PROGRESS_KEY, JSON.stringify({ ...snapshot, at: Date.now() }))
}

export function loadQuizProgress(day: number): QuizProgressSnapshot | null {
  try {
    const raw = safeGet(PROGRESS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as QuizProgressSnapshot
    if (parsed.day !== day) return null
    if (Date.now() - parsed.at > 30 * 60_000) {
      safeRemove(PROGRESS_KEY)
      return null
    }
    if (!Array.isArray(parsed.allQuestions) || parsed.allQuestions.length === 0) return null
    return parsed
  } catch {
    return null
  }
}

export function clearQuizProgress(): void {
  safeRemove(PROGRESS_KEY)
}
