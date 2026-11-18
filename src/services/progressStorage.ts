/**
 * Service for managing user progress in localStorage
 */

export interface ProgressData {
  completedDays: number[]
  completedQuizzes: Record<string, boolean> // day-key -> true if passed
  currentStreak: number
  lastActivityDate: string // ISO date string
  quizScores: Record<string, number> // day-key -> score percentage
}

const STORAGE_KEY = 'react-mastery-progress'
const DEFAULT_PROGRESS: ProgressData = {
  completedDays: [],
  completedQuizzes: {},
  currentStreak: 0,
  lastActivityDate: '',
  quizScores: {}
}

class ProgressStorage {
  /**
   * Get progress data from localStorage
   */
  getProgress(): ProgressData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as ProgressData
        // Validate and merge with defaults
        return {
          ...DEFAULT_PROGRESS,
          ...parsed,
          completedDays: Array.isArray(parsed.completedDays) ? parsed.completedDays : [],
          completedQuizzes: typeof parsed.completedQuizzes === 'object' ? parsed.completedQuizzes : {},
          quizScores: typeof parsed.quizScores === 'object' ? parsed.quizScores : {}
        }
      }
    } catch (error) {
      console.warn('Failed to load progress from localStorage:', error)
    }
    return { ...DEFAULT_PROGRESS }
  }

  /**
   * Save progress data to localStorage
   */
  saveProgress(progress: ProgressData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    } catch (error) {
      console.warn('Failed to save progress to localStorage:', error)
    }
  }

  /**
   * Mark a day as completed
   */
  markDayCompleted(day: number): void {
    const progress = this.getProgress()
    if (!progress.completedDays.includes(day)) {
      progress.completedDays.push(day)
      this.updateStreak(progress)
      this.saveProgress(progress)
    }
  }

  /**
   * Mark a quiz as completed with a score
   */
  markQuizCompleted(dayKey: string, scorePercentage: number, passed: boolean = false): void {
    const progress = this.getProgress()
    progress.quizScores[dayKey] = scorePercentage
    if (passed) {
      progress.completedQuizzes[dayKey] = true
    }
    this.updateStreak(progress)
    this.saveProgress(progress)
  }

  /**
   * Update the current streak based on last activity
   */
  private updateStreak(progress: ProgressData): void {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const lastDate = progress.lastActivityDate

    if (lastDate === today) {
      // Already updated today, no change
      return
    }

    if (!lastDate) {
      // First time
      progress.currentStreak = 1
      progress.lastActivityDate = today
      return
    }

    const lastDateObj = new Date(lastDate)
    const todayObj = new Date(today)
    const daysDiff = Math.floor((todayObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff === 1) {
      // Consecutive day
      progress.currentStreak += 1
    } else if (daysDiff > 1) {
      // Streak broken
      progress.currentStreak = 1
    }
    // If daysDiff === 0, same day, no change

    progress.lastActivityDate = today
  }

  /**
   * Get current streak
   */
  getCurrentStreak(): number {
    const progress = this.getProgress()
    // Update streak if needed
    this.updateStreak(progress)
    return progress.currentStreak
  }

  /**
   * Get count of completed days
   */
  getCompletedDaysCount(): number {
    return this.getProgress().completedDays.length
  }

  /**
   * Get count of completed quizzes
   */
  getCompletedQuizzesCount(): number {
    return Object.keys(this.getProgress().completedQuizzes).length
  }

  /**
   * Check if a day is completed
   */
  isDayCompleted(day: number): boolean {
    return this.getProgress().completedDays.includes(day)
  }

  /**
   * Check if a quiz is completed
   */
  isQuizCompleted(dayKey: string): boolean {
    return this.getProgress().completedQuizzes[dayKey] === true
  }

  /**
   * Get quiz score for a day
   */
  getQuizScore(dayKey: string): number | null {
    return this.getProgress().quizScores[dayKey] ?? null
  }

  /**
   * Clear all progress (for testing/reset)
   */
  clearProgress(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear progress:', error)
    }
  }
}

export const progressStorage = new ProgressStorage()
