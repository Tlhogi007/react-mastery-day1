/**
 * Gemini via server proxy (/api/ai-quiz) or BYO key.
 */

import type { APIProvider } from './types'
import { fetchViaAiProxy, getAiProxyAvailability } from './aiProxy'
import type { QuizQuestion } from '../../types/challenges'

export const geminiProvider: APIProvider = {
  name: 'Gemini',
  async isAvailable(): Promise<boolean> {
    const { gemini } = await getAiProxyAvailability()
    return gemini
  },
  async fetch(topic: string, count: number): Promise<QuizQuestion[]> {
    return fetchViaAiProxy('gemini', topic, count)
  },
}
