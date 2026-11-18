/**
 * Together AI via server proxy (/api/ai-quiz) — API key never reaches the browser.
 */

import type { APIProvider } from './types'
import { fetchViaAiProxy, getAiProxyAvailability } from './aiProxy'
import type { QuizQuestion } from '../../types/challenges'

export const togetherAIProvider: APIProvider = {
  name: 'Together AI',
  async isAvailable(): Promise<boolean> {
    const { together } = await getAiProxyAvailability()
    return together
  },
  async fetch(topic: string, count: number): Promise<QuizQuestion[]> {
    return fetchViaAiProxy('together', topic, count)
  },
}
