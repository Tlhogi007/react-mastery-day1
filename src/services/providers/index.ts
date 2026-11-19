/**
 * API Providers — fixed waterfall (no random).
 * Hosted auto (Groq→Gemini→Together) first, then TriviaDB as last free fallback.
 * Hugging Face client fallback removed — old api-inference.huggingface.co is gone.
 */

import type { APIProvider } from './types'
import type { QuizQuestion } from '../../types/challenges'
import { hostedAutoProvider } from './hostedAuto'
import { groqProvider } from './groq'
import { geminiProvider } from './gemini'
import { togetherAIProvider } from './togetherAI'
import { triviaDBProvider } from './triviaDB'

export {
  hostedAutoProvider,
  groqProvider,
  geminiProvider,
  togetherAIProvider,
  triviaDBProvider,
}
export type { APIProvider } from './types'

export async function getAvailableProviders(): Promise<APIProvider[]> {
  // Prefer single hosted auto call; keep individuals for availability UX if needed
  const providers = [
    hostedAutoProvider,
    triviaDBProvider,
  ]
  const available: APIProvider[] = []

  for (const provider of providers) {
    try {
      if (await provider.isAvailable()) available.push(provider)
    } catch (error) {
      console.warn(`[API] ❌ ${provider.name} availability check failed:`, error)
    }
  }

  return available
}

/**
 * Fixed order: Hosted AI waterfall → free providers.
 * Local templates remain the default in quizQuestionService before this runs.
 */
export async function fetchFromProviders(
  topic: string,
  count: number,
): Promise<QuizQuestion[]> {
  const providers = await getAvailableProviders()

  if (providers.length === 0) {
    console.warn(`⚠️ [API] No providers are currently available`)
    return []
  }

  for (const provider of providers) {
    try {
      const questions = await provider.fetch(topic, count)
      if (questions.length > 0) return questions
    } catch (error) {
      console.warn(`[API] ❌ ${provider.name} fetch failed:`, error)
    }
  }

  console.warn(`[API] ⚠️ All providers exhausted. No AI questions were generated.`)
  return []
}
