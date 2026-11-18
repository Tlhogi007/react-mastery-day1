/**
 * Service for tracking question history and performance
 * Used for spaced repetition and review
 */

import type { QuizQuestion } from '../types/challenges'

export interface QuestionHistoryEntry {
  questionId: string
  answeredCorrectly: boolean
  timestamp: number
  timeSpent: number // seconds
  attempts: number
  lastSeen: number
  difficulty?: 'easy' | 'medium' | 'hard'
  day?: number // Track which day the question belongs to
  topic?: string // Track the topic
}

const STORAGE_KEY = 'react-mastery-question-history'

class QuestionHistoryService {
  private history: Map<string, QuestionHistoryEntry> = new Map()

  constructor() {
    this.loadHistory()
  }

  /**
   * Record an answer attempt
   */
  recordAnswer(
    question: QuizQuestion,
    answeredCorrectly: boolean,
    timeSpent: number,
    day?: number,
    topic?: string
  ): void {
    // Extract day from questionId if not provided (format: day01-q1, day02-challenge-1, etc.)
    let questionDay = day
    let questionTopic = topic
    
    if (!questionDay) {
      const dayMatch = question.id.match(/day0?(\d+)/i)
      if (dayMatch) {
        questionDay = parseInt(dayMatch[1], 10)
      }
    }
    
    const existing = this.history.get(question.id) || {
      questionId: question.id,
      answeredCorrectly: false,
      timestamp: Date.now(),
      timeSpent: 0,
      attempts: 0,
      lastSeen: Date.now(),
      difficulty: question.difficulty,
      day: questionDay,
      topic: questionTopic
    }

    existing.answeredCorrectly = answeredCorrectly
    existing.timestamp = Date.now()
    existing.timeSpent = timeSpent
    existing.attempts += 1
    existing.lastSeen = Date.now()
    existing.difficulty = question.difficulty || existing.difficulty
    if (questionDay) existing.day = questionDay
    if (questionTopic) existing.topic = questionTopic

    this.history.set(question.id, existing)
    this.saveHistory()
  }

  /**
   * Get history for a question
   */
  getHistory(questionId: string): QuestionHistoryEntry | null {
    return this.history.get(questionId) || null
  }

  /**
   * Get all incorrect questions (for review)
   */
  getIncorrectQuestions(): QuestionHistoryEntry[] {
    return Array.from(this.history.values())
      .filter(entry => !entry.answeredCorrectly)
      .sort((a, b) => b.lastSeen - a.lastSeen)
  }

  /**
   * Get questions that need review (spaced repetition)
   */
  getQuestionsNeedingReview(): QuestionHistoryEntry[] {
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000

    return Array.from(this.history.values())
      .filter(entry => {
        const daysSinceLastSeen = (now - entry.lastSeen) / oneDay
        
        // Review if:
        // - Answered incorrectly
        // - Not seen in 7+ days (spaced repetition)
        // - Multiple attempts but still struggling
        return (
          !entry.answeredCorrectly ||
          daysSinceLastSeen >= 7 ||
          (entry.attempts >= 3 && !entry.answeredCorrectly)
        )
      })
      .sort((a, b) => {
        // Prioritize incorrect answers
        if (a.answeredCorrectly !== b.answeredCorrectly) {
          return a.answeredCorrectly ? 1 : -1
        }
        // Then by last seen (oldest first)
        return a.lastSeen - b.lastSeen
      })
  }

  /**
   * Get all questions (both correct and incorrect)
   */
  getAllQuestions(): QuestionHistoryEntry[] {
    return Array.from(this.history.values())
      .sort((a, b) => b.lastSeen - a.lastSeen)
  }

  /**
   * Get questions by day
   */
  getQuestionsByDay(day: number): QuestionHistoryEntry[] {
    return Array.from(this.history.values())
      .filter(entry => entry.day === day)
  }

  /**
   * Get questions grouped by day with accuracy
   */
  getQuestionsByDayWithStats(): Record<number, {
    total: number
    correct: number
    incorrect: number
    accuracy: number
    averageTime: number
  }> {
    const byDay: Record<number, {
      total: number
      correct: number
      incorrect: number
      totalTime: number
    }> = {}

    Array.from(this.history.values()).forEach(entry => {
      const day = entry.day || 0
      if (!byDay[day]) {
        byDay[day] = { total: 0, correct: 0, incorrect: 0, totalTime: 0 }
      }
      byDay[day].total++
      if (entry.answeredCorrectly) {
        byDay[day].correct++
      } else {
        byDay[day].incorrect++
      }
      byDay[day].totalTime += entry.timeSpent
    })

    // Convert to final format with accuracy
    const result: Record<number, {
      total: number
      correct: number
      incorrect: number
      accuracy: number
      averageTime: number
    }> = {}

    Object.entries(byDay).forEach(([dayStr, stats]) => {
      const day = parseInt(dayStr, 10)
      result[day] = {
        total: stats.total,
        correct: stats.correct,
        incorrect: stats.incorrect,
        accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
        averageTime: stats.total > 0 ? stats.totalTime / stats.total : 0
      }
    })

    return result
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalQuestions: number
    correctAnswers: number
    incorrectAnswers: number
    averageTime: number
    accuracy: number
  } {
    const entries = Array.from(this.history.values())
    const correct = entries.filter(e => e.answeredCorrectly).length
    const total = entries.length
    const totalTime = entries.reduce((sum, e) => sum + e.timeSpent, 0)

    return {
      totalQuestions: total,
      correctAnswers: correct,
      incorrectAnswers: total - correct,
      averageTime: total > 0 ? totalTime / total : 0,
      accuracy: total > 0 ? (correct / total) * 100 : 0
    }
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history.clear()
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * Save to localStorage
   */
  private saveHistory(): void {
    try {
      const data = Array.from(this.history.entries())
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save question history:', error)
    }
  }

  /**
   * Load from localStorage
   */
  private loadHistory(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as [string, QuestionHistoryEntry][]
        this.history = new Map(parsed)
      }
    } catch (error) {
      console.warn('Failed to load question history:', error)
      this.history = new Map()
    }
  }
}

export const questionHistory = new QuestionHistoryService()
