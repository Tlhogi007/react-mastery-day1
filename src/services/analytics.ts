/**
 * Analytics & Tracking Service
 * Single Responsibility: Track user behavior and learning progress
 */

export interface AnalyticsEvent {
  event: string
  properties?: Record<string, unknown>
  timestamp: number
}

export interface UserProgress {
  exercisesCompleted: number
  quizzesPassed: number
  totalTimeSpent: number // minutes
  streak: number
  lastActivity: string
}

class AnalyticsService {
  private events: AnalyticsEvent[] = []
  private sessionStart: number = Date.now()
  private readonly STORAGE_KEY = 'react-mastery-analytics'

  constructor() {
    this.loadEvents()
    this.track('session_start', {
      timestamp: this.sessionStart
    })
  }

  /**
   * Track an event
   */
  track(event: string, properties?: Record<string, unknown>): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now()
    }

    this.events.push(analyticsEvent)
    this.saveEvents()
  }

  /**
   * Track exercise completion
   */
  trackExerciseComplete(day: number, week: number): void {
    this.track('exercise_complete', {
      day,
      week,
      exercise: `day${day.toString().padStart(2, '0')}`
    })
  }

  /**
   * Track quiz completion
   */
  trackQuizComplete(day: number, score: number, passed: boolean): void {
    this.track('quiz_complete', {
      day,
      score,
      passed,
      timestamp: Date.now()
    })
  }

  /**
   * Track time spent on exercise
   */
  trackTimeSpent(day: number, minutes: number): void {
    this.track('time_spent', {
      day,
      minutes,
      totalMinutes: this.getTotalTimeSpent() + minutes
    })
  }

  /**
   * Track search usage
   */
  trackSearch(query: string, resultsCount: number): void {
    this.track('search', {
      query,
      resultsCount,
      queryLength: query.length
    })
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string, properties?: Record<string, unknown>): void {
    this.track('feature_usage', {
      feature,
      ...properties
    })
  }

  /**
   * Get analytics summary
   */
  getSummary(): {
    totalEvents: number
    sessionDuration: number
    eventsByType: Record<string, number>
    recentEvents: AnalyticsEvent[]
  } {
    const sessionDuration = Math.floor((Date.now() - this.sessionStart) / 1000 / 60) // minutes
    const eventsByType: Record<string, number> = {}
    
    this.events.forEach(event => {
      eventsByType[event.event] = (eventsByType[event.event] || 0) + 1
    })

    return {
      totalEvents: this.events.length,
      sessionDuration,
      eventsByType,
      recentEvents: this.events.slice(-10).reverse()
    }
  }

  /**
   * Get user progress analytics
   */
  getUserProgress(): UserProgress {
    const exercisesCompleted = this.events.filter(e => e.event === 'exercise_complete').length
    const quizzesPassed = this.events.filter(e => 
      e.event === 'quiz_complete' && e.properties?.passed === true
    ).length
    
    const timeEvents = this.events.filter(e => e.event === 'time_spent')
    const totalTimeSpent = timeEvents.reduce((sum, e) => {
      return sum + (typeof e.properties?.minutes === 'number' ? e.properties.minutes : 0)
    }, 0)

    const lastEvent = this.events[this.events.length - 1]
    const lastActivity = lastEvent ? new Date(lastEvent.timestamp).toISOString() : new Date().toISOString()

    return {
      exercisesCompleted,
      quizzesPassed,
      totalTimeSpent,
      streak: 0, // This would come from progressStorage
      lastActivity
    }
  }

  /**
   * Save events to localStorage
   */
  private saveEvents(): void {
    try {
      // Keep only last 1000 events
      const eventsToSave = this.events.slice(-1000)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(eventsToSave))
    } catch (error) {
      console.warn('Failed to save analytics events:', error)
    }
  }

  /**
   * Load events from localStorage
   */
  private loadEvents(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as AnalyticsEvent[]
        this.events = parsed || []
      }
    } catch (error) {
      console.warn('Failed to load analytics events:', error)
      this.events = []
    }
  }

  /**
   * Get total time spent across all sessions
   */
  private getTotalTimeSpent(): number {
    const timeEvents = this.events.filter(e => e.event === 'time_spent')
    return timeEvents.reduce((sum, e) => {
      return sum + (typeof e.properties?.minutes === 'number' ? e.properties.minutes : 0)
    }, 0)
  }

  /**
   * Clear all analytics data
   */
  clear(): void {
    this.events = []
    localStorage.removeItem(this.STORAGE_KEY)
  }

  /** Snapshot for cloud sync (capped). */
  toCloudJSON(): AnalyticsEvent[] {
    return this.events.slice(-400)
  }

  /** Merge cloud events into the local log (by event+timestamp). */
  mergeFromCloud(raw: unknown): void {
    if (!Array.isArray(raw)) return
    const map = new Map<string, AnalyticsEvent>()
    for (const item of [...this.events, ...raw]) {
      if (!item || typeof item !== 'object') continue
      const row = item as AnalyticsEvent
      if (typeof row.event !== 'string' || !Number.isFinite(Number(row.timestamp))) continue
      const key = `${row.event}:${row.timestamp}`
      if (!map.has(key)) {
        map.set(key, {
          event: row.event,
          properties: row.properties,
          timestamp: Number(row.timestamp),
        })
      }
    }
    this.events = [...map.values()]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-1000)
    this.saveEvents()
  }

  /**
   * Export analytics data
   */
  export(): string {
    return JSON.stringify({
      events: this.events,
      summary: this.getSummary(),
      userProgress: this.getUserProgress()
    }, null, 2)
  }
}

export const analytics = new AnalyticsService()
