/**
 * Type definitions for API providers
 */

import type { QuizQuestion } from '../../types/challenges'

export interface APIProvider {
  name: string
  fetch: (topic: string, count: number) => Promise<QuizQuestion[]>
  isAvailable: () => Promise<boolean>
}

/**
 * Interface for Open Trivia Database API response
 */
export interface TriviaAPIResponse {
  response_code: number
  results: Array<{
    category: string
    type: string
    difficulty: string
    question: string
    correct_answer: string
    incorrect_answers: string[]
  }>
}
