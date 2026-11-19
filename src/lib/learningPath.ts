import { progressStorage } from '../services/progressStorage'

/** Soft unlock: suggested next day is first incomplete; later days get a nudge only. */
export function getSuggestedDay(maxDay = 7): number {
  for (let d = 1; d <= maxDay; d++) {
    if (!progressStorage.isDayCompleted(d)) return d
  }
  return maxDay
}

export function dayKey(day: number): string {
  return `day${String(day).padStart(2, '0')}`
}

export type WeakTopic = {
  day: number
  dayKey: string
  score: number
}

/** Quiz scores under 70% (or attempted & failed pass). */
export function getWeakQuizTopics(maxDay = 7): WeakTopic[] {
  const weak: WeakTopic[] = []
  for (let d = 1; d <= maxDay; d++) {
    const key = dayKey(d)
    const score = progressStorage.getQuizScore(key)
    if (score == null) continue
    if (score < 70 || !progressStorage.isQuizCompleted(key)) {
      weak.push({ day: d, dayKey: key, score })
    }
  }
  return weak.sort((a, b) => a.score - b.score)
}

export function getWeek1Completion(maxDay = 7): {
  completedDays: number
  totalDays: number
  quizzesPassed: number
  pct: number
} {
  let completedDays = 0
  let quizzesPassed = 0
  for (let d = 1; d <= maxDay; d++) {
    if (progressStorage.isDayCompleted(d)) completedDays++
    if (progressStorage.isQuizCompleted(dayKey(d))) quizzesPassed++
  }
  return {
    completedDays,
    totalDays: maxDay,
    quizzesPassed,
    pct: Math.round((completedDays / maxDay) * 100),
  }
}

/** Soft nudge when jumping more than 1 day ahead of suggested. */
export function shouldNudgeDaySkip(targetDay: number): boolean {
  const suggested = getSuggestedDay()
  return targetDay > suggested + 1
}
