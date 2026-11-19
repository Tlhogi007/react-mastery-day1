import { QUIZ_THRESHOLDS } from '../../constants'
import { progressStorage } from '../../services/progressStorage'
import { analytics } from '../../services/analytics'
import { clearAiGate, suppressAiGate } from '../../services/aiAuthBridge'

/** Side effects when a quiz attempt completes (progress + analytics + AI gate). */
export function persistQuizFinish(params: {
  day?: number
  score: number
  totalQuestions: number
  incorrectCount: number
  skippedCount: number
  quizStartTime: number | null
}): void {
  suppressAiGate()
  clearAiGate()

  const { day, score, totalQuestions, incorrectCount, skippedCount, quizStartTime } = params
  if (!day || totalQuestions <= 0) return

  const percentage = Math.round((score / totalQuestions) * 100)
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
    totalQuestions,
    incorrectCount,
    skippedCount,
    totalTimeMinutes: totalTime,
  })
}
