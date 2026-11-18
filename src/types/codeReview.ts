/**
 * Types for Code Review Exercises
 */

export interface CodeReviewExercise {
    id: string
    title: string
    description: string
    code: string
    bugs: CodeBug[]
    expertSolution: string
    explanation: string
    difficulty: 'easy' | 'medium' | 'hard'
    day: number
    category: string
    hints: string[]
}

export interface CodeBug {
    id: string
    line: number
    description: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    fix: string
}

export interface ReviewSubmission {
    exerciseId: string
    foundBugs: string[] // Bug IDs
    suggestedFixes: Record<string, string> // Bug ID -> suggested fix
    timestamp: string
}
