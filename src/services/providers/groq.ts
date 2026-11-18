/**
 * Groq via server proxy (/api/ai-quiz) — API key never reaches the browser.
 */

import type { APIProvider } from './types'
import { fetchViaAiProxy, getAiProxyAvailability } from './aiProxy'
import type { QuizQuestion } from '../../types/challenges'

export const groqProvider: APIProvider = {
  name: 'Groq',
  async isAvailable(): Promise<boolean> {
    const { groq } = await getAiProxyAvailability()
    return groq
  },
  async fetch(topic: string, count: number): Promise<QuizQuestion[]> {
    return fetchViaAiProxy('groq', topic, count)
  },
}
