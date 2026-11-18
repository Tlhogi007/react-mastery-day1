/**
 * Hosted waterfall: Groq → Gemini → Together in one server round-trip.
 */

import type { APIProvider } from './types'
import { fetchViaAiProxy, getAiProxyAvailability } from './aiProxy'
import type { QuizQuestion } from '../../types/challenges'

export const hostedAutoProvider: APIProvider = {
  name: 'Hosted AI',
  async isAvailable(): Promise<boolean> {
    const { groq, gemini, together } = await getAiProxyAvailability()
    return groq || gemini || together
  },
  async fetch(topic: string, count: number): Promise<QuizQuestion[]> {
    return fetchViaAiProxy('auto', topic, count)
  },
}
