/**
 * Service for managing flashcards with spaced repetition algorithm
 */

export interface Flashcard {
    id: string
    front: string // Question or concept
    back: string // Answer or explanation
    day: number
    topic: string
    difficulty: 'easy' | 'medium' | 'hard'
    // Spaced repetition fields
    easeFactor: number // SM-2 algorithm ease factor (default 2.5)
    interval: number // Days until next review
    repetitions: number // Number of successful reviews
    lastReviewDate: string | null // ISO date string
    nextReviewDate: string // ISO date string
    createdAt: string // ISO date string
}

export interface ReviewResult {
    cardId: string
    quality: 0 | 1 | 2 | 3 | 4 | 5 // SM-2 quality rating
    timestamp: string
}

// SM-2 Algorithm constants
const MIN_EASE_FACTOR = 1.3
const DEFAULT_EASE_FACTOR = 2.5
const QUALITY_THRESHOLD = 3 // Quality >= 3 is considered successful

const STORAGE_KEY = 'react-mastery-flashcards'

class FlashcardStorage {
    /**
     * Get all flashcards
     */
    getFlashcards(): Flashcard[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                return JSON.parse(stored) as Flashcard[]
            }
        } catch (error) {
            console.warn('Failed to load flashcards from localStorage:', error)
        }
        return []
    }

    /**
     * Get flashcards for a specific day
     */
    getFlashcardsForDay(day: number): Flashcard[] {
        return this.getFlashcards().filter(card => card.day === day)
    }

    /**
     * Get flashcards due for review
     */
    getDueFlashcards(): Flashcard[] {
        const now = new Date().toISOString()
        return this.getFlashcards().filter(card => card.nextReviewDate <= now)
    }

    /**
     * Get flashcards needing review (due or never reviewed)
     */
    getFlashcardsNeedingReview(): Flashcard[] {
        const now = new Date().toISOString()
        return this.getFlashcards().filter(
            card => card.nextReviewDate <= now || card.lastReviewDate === null
        )
    }

    /**
     * Create a flashcard from a quiz question
     */
    createFromQuizQuestion(
        questionId: string,
        question: string,
        explanation: string,
        day: number,
        topic: string,
        difficulty: 'easy' | 'medium' | 'hard' = 'medium'
    ): string {
        const flashcards = this.getFlashcards()
        const newCard: Flashcard = {
            id: `card-${questionId}-${Date.now()}`,
            front: question,
            back: explanation,
            day,
            topic,
            difficulty,
            easeFactor: DEFAULT_EASE_FACTOR,
            interval: 0,
            repetitions: 0,
            lastReviewDate: null,
            nextReviewDate: new Date().toISOString(), // Review immediately
            createdAt: new Date().toISOString()
        }
        flashcards.push(newCard)
        this.saveFlashcards(flashcards)
        return newCard.id
    }

    /**
     * Create a custom flashcard
     */
    createFlashcard(
        front: string,
        back: string,
        day: number,
        topic: string,
        difficulty: 'easy' | 'medium' | 'hard' = 'medium'
    ): string {
        const flashcards = this.getFlashcards()
        const newCard: Flashcard = {
            id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            front,
            back,
            day,
            topic,
            difficulty,
            easeFactor: DEFAULT_EASE_FACTOR,
            interval: 0,
            repetitions: 0,
            lastReviewDate: null,
            nextReviewDate: new Date().toISOString(),
            createdAt: new Date().toISOString()
        }
        flashcards.push(newCard)
        this.saveFlashcards(flashcards)
        return newCard.id
    }

    /**
     * Review a flashcard using SM-2 algorithm
     * Quality: 0=blackout, 1=incorrect, 2=incorrect (easy), 3=correct, 4=correct (easy), 5=perfect
     */
    reviewFlashcard(cardId: string, quality: 0 | 1 | 2 | 3 | 4 | 5): boolean {
        const flashcards = this.getFlashcards()
        const cardIndex = flashcards.findIndex(card => card.id === cardId)
        if (cardIndex === -1) return false

        const card = flashcards[cardIndex]
        const now = new Date()

        // Update ease factor
        let newEaseFactor = card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        newEaseFactor = Math.max(newEaseFactor, MIN_EASE_FACTOR)

        // Calculate new interval
        let newInterval: number
        if (quality < QUALITY_THRESHOLD) {
            // Failed - reset
            newInterval = 0
            card.repetitions = 0
        } else {
            // Passed
            if (card.repetitions === 0) {
                newInterval = 1
            } else if (card.repetitions === 1) {
                newInterval = 6
            } else {
                newInterval = Math.round(card.interval * newEaseFactor)
            }
            card.repetitions += 1
        }

        // Update card
        card.easeFactor = newEaseFactor
        card.interval = newInterval
        card.lastReviewDate = now.toISOString()
        card.nextReviewDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000).toISOString()

        flashcards[cardIndex] = card
        this.saveFlashcards(flashcards)
        return true
    }

    /**
     * Delete a flashcard
     */
    deleteFlashcard(id: string): boolean {
        const flashcards = this.getFlashcards().filter(card => card.id !== id)
        this.saveFlashcards(flashcards)
        return true
    }

    /**
     * Update a flashcard
     */
    updateFlashcard(id: string, updates: Partial<Flashcard>): boolean {
        const flashcards = this.getFlashcards()
        const index = flashcards.findIndex(card => card.id === id)
        if (index === -1) return false

        flashcards[index] = { ...flashcards[index], ...updates }
        this.saveFlashcards(flashcards)
        return true
    }

    /**
     * Get statistics
     */
    getStats(): {
        total: number
        due: number
        mastered: number // Cards with interval > 30 days
        struggling: number // Cards with easeFactor < 1.5
    } {
        const cards = this.getFlashcards()
        const now = new Date().toISOString()
        
        return {
            total: cards.length,
            due: cards.filter(card => card.nextReviewDate <= now).length,
            mastered: cards.filter(card => card.interval > 30).length,
            struggling: cards.filter(card => card.easeFactor < 1.5).length
        }
    }

    /**
     * Save flashcards to localStorage
     */
    private saveFlashcards(flashcards: Flashcard[]): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(flashcards))
        } catch (error) {
            console.warn('Failed to save flashcards to localStorage:', error)
        }
    }

    /**
     * Clear all flashcards
     */
    clearAll(): void {
        localStorage.removeItem(STORAGE_KEY)
    }
}

export const flashcardStorage = new FlashcardStorage()
