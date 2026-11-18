/**
 * Service for managing daily reflection prompts and responses
 */

export interface Reflection {
    id: string
    day: number
    prompt: string
    response: string
    createdAt: string // ISO date string
    updatedAt: string // ISO date string
}

export interface ReflectionPrompt {
    id: string
    day: number
    prompt: string
    category: 'learning' | 'understanding' | 'application' | 'challenges'
}

const STORAGE_KEY = 'react-mastery-reflections'

// Default reflection prompts for each day
export const defaultPrompts: ReflectionPrompt[] = [
    {
        id: 'day1-learning',
        day: 1,
        prompt: 'What did you learn about the rendering pipeline today?',
        category: 'learning'
    },
    {
        id: 'day1-understanding',
        day: 1,
        prompt: 'Can you explain the difference between render phase and commit phase in your own words?',
        category: 'understanding'
    },
    {
        id: 'day1-application',
        day: 1,
        prompt: 'How will understanding the rendering pipeline help you debug performance issues?',
        category: 'application'
    },
    {
        id: 'day2-learning',
        day: 2,
        prompt: 'What surprised you about how React handles keys and reconciliation?',
        category: 'learning'
    },
    {
        id: 'day2-understanding',
        day: 2,
        prompt: 'Why do index keys cause bugs in reorderable lists?',
        category: 'understanding'
    },
    {
        id: 'day3-learning',
        day: 3,
        prompt: 'What is Fiber and why was it introduced?',
        category: 'learning'
    },
    {
        id: 'day3-understanding',
        day: 3,
        prompt: 'How does Fiber enable concurrent rendering?',
        category: 'understanding'
    },
    {
        id: 'day4-learning',
        day: 4,
        prompt: 'When should you use React.memo, useMemo, or useCallback?',
        category: 'learning'
    },
    {
        id: 'day4-application',
        day: 4,
        prompt: 'Describe a scenario where memoization would improve performance.',
        category: 'application'
    },
    {
        id: 'day5-learning',
        day: 5,
        prompt: 'What causes stale closures in useEffect?',
        category: 'learning'
    },
    {
        id: 'day5-understanding',
        day: 5,
        prompt: 'How can you fix stale closures without adding dependencies?',
        category: 'understanding'
    },
    {
        id: 'day6-learning',
        day: 6,
        prompt: 'Why do all Context consumers re-render when the value changes?',
        category: 'learning'
    },
    {
        id: 'day6-application',
        day: 6,
        prompt: 'How would you optimize a Context that causes too many re-renders?',
        category: 'application'
    },
    {
        id: 'day7-reflection',
        day: 7,
        prompt: 'Reflect on your Week 1 learning journey. What concepts are you most confident about?',
        category: 'understanding'
    },
    {
        id: 'day7-challenges',
        day: 7,
        prompt: 'What concepts do you still find challenging? How will you review them?',
        category: 'challenges'
    }
]

class ReflectionStorage {
    /**
     * Get all reflections
     */
    getReflections(): Reflection[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                return JSON.parse(stored) as Reflection[]
            }
        } catch (error) {
            console.warn('Failed to load reflections from localStorage:', error)
        }
        return []
    }

    /**
     * Get reflections for a specific day
     */
    getReflectionsForDay(day: number): Reflection[] {
        return this.getReflections().filter(reflection => reflection.day === day)
    }

    /**
     * Get prompts for a day
     */
    getPromptsForDay(day: number): ReflectionPrompt[] {
        return defaultPrompts.filter(prompt => prompt.day === day)
    }

    /**
     * Save a reflection
     */
    saveReflection(prompt: string, response: string, day: number): string {
        const reflections = this.getReflections()
        const newReflection: Reflection = {
            id: `reflection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            day,
            prompt,
            response,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
        reflections.push(newReflection)
        this.saveReflections(reflections)
        return newReflection.id
    }

    /**
     * Update a reflection
     */
    updateReflection(id: string, response: string): boolean {
        const reflections = this.getReflections()
        const index = reflections.findIndex(ref => ref.id === id)
        if (index === -1) return false

        reflections[index] = {
            ...reflections[index],
            response,
            updatedAt: new Date().toISOString()
        }
        this.saveReflections(reflections)
        return true
    }

    /**
     * Delete a reflection
     */
    deleteReflection(id: string): boolean {
        const reflections = this.getReflections().filter(ref => ref.id !== id)
        this.saveReflections(reflections)
        return true
    }

    /**
     * Save reflections to localStorage
     */
    private saveReflections(reflections: Reflection[]): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(reflections))
        } catch (error) {
            console.warn('Failed to save reflections to localStorage:', error)
        }
    }

    /**
     * Export reflections as JSON
     */
    exportReflections(): string {
        return JSON.stringify({
            reflections: this.getReflections(),
            exportedAt: new Date().toISOString()
        }, null, 2)
    }

    /**
     * Clear all reflections
     */
    clearAll(): void {
        localStorage.removeItem(STORAGE_KEY)
    }
}

export const reflectionStorage = new ReflectionStorage()
