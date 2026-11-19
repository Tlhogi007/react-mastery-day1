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
const LIVE_PROGRESS_KEY = 'rm-live-day-progress'
const DEFAULT_PROGRESS: ProgressData = {
  completedDays: [],
  completedQuizzes: {},
  currentStreak: 0,
  lastActivityDate: '',
  quizScores: {}
}

/** Persisted + cloud-synced mid-quiz day bar. percent null = cleared. */
export type LiveDayProgress = {
  day: number
  percent: number | null
  updatedAt: string
}

function emitProgressChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rm-progress-changed'))
  }
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
      emitProgressChanged()
    } catch (error) {
      console.warn('Failed to save progress to localStorage:', error)
    }
  }

  /**
   * In-progress quiz overlay for the current day.
   * Stored in localStorage so it can sync across signed-in devices.
   * Cleared when the quiz finishes or the learner leaves the quiz.
   */
  setLiveDayProgress(day: number, percent: number | null): void {
    try {
      const payload: LiveDayProgress = {
        day,
        percent:
          percent == null || !Number.isFinite(percent)
            ? null
            : Math.min(80, Math.max(0, Math.round(percent))),
        updatedAt: new Date().toISOString(),
      }
      localStorage.setItem(LIVE_PROGRESS_KEY, JSON.stringify(payload))
      // Drop legacy session-only copy if present
      try {
        sessionStorage.removeItem(LIVE_PROGRESS_KEY)
      } catch {
        /* ignore */
      }
      emitProgressChanged()
    } catch {
      /* ignore */
    }
  }

  /** Full live payload for cloud sync (includes clears). */
  getLiveDayProgressState(): LiveDayProgress | null {
    try {
      const raw = localStorage.getItem(LIVE_PROGRESS_KEY) || sessionStorage.getItem(LIVE_PROGRESS_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as Partial<LiveDayProgress>
      const day = Number(parsed.day)
      if (!Number.isFinite(day) || day < 1) return null
      const updatedAt =
        typeof parsed.updatedAt === 'string' && parsed.updatedAt
          ? parsed.updatedAt
          : new Date(0).toISOString()
      if (parsed.percent == null) {
        return { day, percent: null, updatedAt }
      }
      const percent = Number(parsed.percent)
      if (!Number.isFinite(percent)) return null
      return {
        day,
        percent: Math.min(80, Math.max(0, Math.round(percent))),
        updatedAt,
      }
    } catch {
      return null
    }
  }

  getLiveDayProgress(day: number): number | null {
    const state = this.getLiveDayProgressState()
    if (!state || state.day !== day || state.percent == null) return null
    return state.percent
  }

  /** Apply cloud live progress onto this device. */
  applyLiveDayProgressState(state: LiveDayProgress | null): void {
    try {
      if (!state) {
        localStorage.removeItem(LIVE_PROGRESS_KEY)
      } else {
        localStorage.setItem(LIVE_PROGRESS_KEY, JSON.stringify(state))
      }
      try {
        sessionStorage.removeItem(LIVE_PROGRESS_KEY)
      } catch {
        /* ignore */
      }
      emitProgressChanged()
    } catch {
      /* ignore */
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
      localStorage.removeItem(LIVE_PROGRESS_KEY)
      sessionStorage.removeItem(LIVE_PROGRESS_KEY)
      emitProgressChanged()
    } catch (error) {
      console.warn('Failed to clear progress:', error)
    }
  }
}

export const progressStorage = new ProgressStorage()
