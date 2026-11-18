/**
 * Open Trivia Database (FREE - no API key needed)
 * Best for general programming/tech questions
 */

import type { APIProvider, TriviaAPIResponse } from './types'
import { decodeHtml } from './utils'
import { shuffleArray } from '../../utils/array'
import { TIMEOUT } from '../../constants'
import type { QuizQuestion } from '../../types/challenges'

export const triviaDBProvider: APIProvider = {
  name: 'Open Trivia DB',
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch('https://opentdb.com/api.php?amount=1&category=18', {
        method: 'GET',
        signal: AbortSignal.timeout(TIMEOUT.API_AVAILABILITY_CHECK)
      })
      return response.ok
    } catch {
      return false
    }
  },
  async fetch(topic: string, count: number): Promise<QuizQuestion[]> {
    // Retry logic with exponential backoff for rate limits
    const maxRetries = 3
    let retryDelay = 2000 // Start with 2 seconds

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Add delay between requests to avoid rate limits (except first attempt)
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          retryDelay *= 2 // Exponential backoff: 2s, 4s, 8s
        }

        // Category 18 = Science: Computers (programming/tech questions)
        const response = await fetch(
          `https://opentdb.com/api.php?amount=${Math.min(count, 50)}&category=18&difficulty=medium&type=multiple`,
          {
            signal: AbortSignal.timeout(TIMEOUT.API_REQUEST)
          }
        )

        if (!response.ok) {
          // Handle rate limiting with retry
          if (response.status === 429) {
            if (attempt >= maxRetries - 1) {
              console.warn('[TriviaDB] Rate limited after all retries, using fallback')
              return []
            }
            console.warn(`[TriviaDB] Rate limited (429), will retry in ${retryDelay}ms...`)
            continue // Retry
          }
          throw new Error(`Trivia API error: ${response.status}`)
        }

        const data: TriviaAPIResponse = await response.json()

        if (data.response_code !== 0 || !data.results || data.results.length === 0) {
          continue
        }

        const questions = data.results.map((q, idx) => {
          // Combine correct and incorrect answers, then shuffle
          const options = [...q.incorrect_answers, q.correct_answer]
          const shuffled = shuffleArray(options)
          const correctIndex = shuffled.indexOf(q.correct_answer)

          return {
            id: `trivia-${topic}-${Date.now()}-${idx}`,
            question: decodeHtml(q.question),
            options: shuffled.map((opt: string) => decodeHtml(opt)),
            correctAnswer: correctIndex,
            explanation: `This is a general programming/computer science question from Open Trivia Database. For React-specific content, the local question bank provides more targeted questions.`
          }
        }).slice(0, count)
        
        console.warn(`⚠️ [TriviaDB] Note: These are general programming questions, not React-specific. They may be filtered out if React-specific content is required.`)
        return questions
      } catch (error) {
        if (attempt >= maxRetries - 1) {
          console.warn('[TriviaDB] Failed after all retries:', error)
          return []
        }
        // Continue to next retry
      }
    }
    return []
  }
}
