/**
 * Learning Path Recommendations Service
 * AI-suggested next steps based on quiz performance
 */

import { progressStorage } from './progressStorage'
import { questionHistory } from './questionHistory'
import { getTopicForDay } from './topicMapper'

export interface LearningRecommendation {
    id: string
    type: 'review' | 'practice' | 'advance' | 'focus'
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
    day?: number
    topic?: string
    reason: string
}

export interface WeakArea {
    topic: string
    day: number
    accuracy: number
    questionCount: number
    lastReviewed?: string
}

class LearningPathService {
    /**
     * Get learning recommendations based on performance
     */
    getRecommendations(): LearningRecommendation[] {
        const recommendations: LearningRecommendation[] = []
        const progress = progressStorage.getProgress()
        
        // Get stats once and reuse
        const stats = questionHistory.getStats()
        const weakAreas = this.identifyWeakAreas(stats)

        // Review weak areas
        weakAreas.forEach(area => {
            if (area.accuracy < 0.6) {
                recommendations.push({
                    id: `review-${area.day}-${area.topic}`,
                    type: 'review',
                    title: `Review ${area.topic}`,
                    description: `Your accuracy on ${area.topic} is ${(area.accuracy * 100).toFixed(0)}%. Consider reviewing Day ${area.day}.`,
                    priority: 'high',
                    day: area.day,
                    topic: area.topic,
                    reason: `Low accuracy (${(area.accuracy * 100).toFixed(0)}%) on this topic`
                })
            }
        })

        // Practice areas with medium performance
        weakAreas.forEach(area => {
            if (area.accuracy >= 0.6 && area.accuracy < 0.8) {
                recommendations.push({
                    id: `practice-${area.day}-${area.topic}`,
                    type: 'practice',
                    title: `Practice ${area.topic}`,
                    description: `Your accuracy is ${(area.accuracy * 100).toFixed(0)}%. More practice would help solidify understanding.`,
                    priority: 'medium',
                    day: area.day,
                    topic: area.topic,
                    reason: `Moderate accuracy (${(area.accuracy * 100).toFixed(0)}%) - needs practice`
                })
            }
        })

        // Advance to next day
        const completedDays = progress.completedDays
        const maxCompleted = completedDays.length > 0 ? Math.max(...completedDays) : 0
        if (maxCompleted < 7) {
            const nextDay = maxCompleted + 1
            recommendations.push({
                id: `advance-day-${nextDay}`,
                type: 'advance',
                title: `Continue to Day ${nextDay}`,
                description: `You've completed Day ${maxCompleted}. Ready to move to Day ${nextDay}?`,
                priority: maxCompleted === 0 ? 'high' : 'medium',
                day: nextDay,
                reason: 'Natural progression in learning path'
            })
        }

        // Focus on specific concepts
        if (stats.totalQuestions > 0 && stats.accuracy < 70) {
            recommendations.push({
                id: 'focus-overall',
                type: 'focus',
                title: 'Focus on Fundamentals',
                description: `Your overall accuracy is ${stats.accuracy.toFixed(0)}%. Consider reviewing Week 1 fundamentals.`,
                priority: 'high',
                reason: `Overall accuracy below 70%`
            })
        }

        // Sort by priority
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return recommendations.sort((a, b) =>
            priorityOrder[a.priority] - priorityOrder[b.priority]
        )
    }

    /**
     * Identify weak areas based on question history
     */
    identifyWeakAreas(stats?: ReturnType<typeof questionHistory.getStats>): WeakArea[] {
        const areas: WeakArea[] = []
        
        // Get stats if not provided (for backward compatibility)
        const allStats = stats || questionHistory.getStats()
        
        // Get all question history entries to calculate per-day accuracy
        // We need to access the internal history to group by day
        // For now, we'll use a simplified approach based on question IDs
        const incorrectQuestions = questionHistory.getIncorrectQuestions()
        
        // Group questions by day (both correct and incorrect)
        const questionsByDay: Record<number, { correct: number; incorrect: number }> = {}
        
        // Process incorrect questions
        incorrectQuestions.forEach(entry => {
            const dayMatch = entry.questionId.match(/day0?(\d+)/i)
            if (dayMatch) {
                const day = parseInt(dayMatch[1], 10)
                if (!questionsByDay[day]) {
                    questionsByDay[day] = { correct: 0, incorrect: 0 }
                }
                questionsByDay[day].incorrect++
            }
        })
        
        // Note: To get correct answers per day, we'd need to access all history entries
        // For now, we calculate accuracy based on what we have
        // This is a limitation - we're only seeing incorrect questions
        // In a full implementation, we'd iterate through all history entries
        
        // Calculate accuracy per day
        Object.entries(questionsByDay).forEach(([dayStr, counts]) => {
            const day = parseInt(dayStr, 10)
            
            // If we have incorrect questions, calculate accuracy
            // (We assume if there are incorrect, there might be correct too)
            if (counts.incorrect > 0) {
                // Estimate: if we have X incorrect, assume some correct answers exist
                // This is a simplified calculation - ideally we'd track all answers
                const estimatedTotal = counts.incorrect * 2 // Rough estimate
                const accuracy = counts.correct / estimatedTotal || 0
                const topic = getTopicForDay(day) || `Day ${day} concepts`
                
                areas.push({
                    topic,
                    day,
                    accuracy: Math.max(0, Math.min(1, accuracy)), // Clamp between 0 and 1
                    questionCount: counts.incorrect, // At least this many questions attempted
                    lastReviewed: new Date().toISOString()
                })
            }
        })
        
        // Also check overall accuracy and suggest areas if low
        if (allStats.totalQuestions > 0 && allStats.accuracy < 70) {
            // Add general weak area if overall performance is low
            const progress = progressStorage.getProgress()
            const completedDays = progress.completedDays
            if (completedDays.length > 0) {
                const lastDay = Math.max(...completedDays)
                areas.push({
                    topic: 'Overall Fundamentals',
                    day: lastDay,
                    accuracy: allStats.accuracy / 100, // Convert percentage to decimal
                    questionCount: allStats.totalQuestions,
                    lastReviewed: new Date().toISOString()
                })
            }
        }
        
        return areas.sort((a, b) => a.accuracy - b.accuracy) // Sort by accuracy (lowest first)
    }

    /**
     * Get suggested next day based on performance
     */
    getSuggestedNextDay(): number | null {
        const progress = progressStorage.getProgress()
        const completedDays = progress.completedDays
        
        if (completedDays.length === 0) return 1
        
        const maxCompleted = Math.max(...completedDays)
        if (maxCompleted >= 7) return null
        
        // Check if current day is mastered
        const currentDayQuiz = progress.completedQuizzes[`day-${maxCompleted}`]
        const currentDayScore = progress.quizScores[`day-${maxCompleted}`] || 0
        
        if (currentDayQuiz && currentDayScore >= 70) {
            return maxCompleted + 1
        }
        
        return maxCompleted // Stay on current day if not mastered
    }

    /**
     * Get personalized learning path
     */
    getPersonalizedPath(): {
        currentDay: number
        nextDay: number | null
        weakAreas: WeakArea[]
        recommendations: LearningRecommendation[]
    } {
        const progress = progressStorage.getProgress()
        const completedDays = progress.completedDays
        const currentDay = completedDays.length > 0 ? Math.max(...completedDays) : 1
        
        return {
            currentDay,
            nextDay: this.getSuggestedNextDay(),
            weakAreas: this.identifyWeakAreas(),
            recommendations: this.getRecommendations()
        }
    }
}

export const learningPathService = new LearningPathService()
