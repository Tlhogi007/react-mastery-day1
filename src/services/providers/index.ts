/**
 * API Providers - Main entry point
 * Exports all providers and management functions
 */

import type { APIProvider } from './types'
import type { QuizQuestion } from '../../types/challenges'
import { groqProvider } from './groq'
import { togetherAIProvider } from './togetherAI'
import { huggingFaceProvider } from './huggingFace'
import { triviaDBProvider } from './triviaDB'

// Export all providers
export { groqProvider, togetherAIProvider, huggingFaceProvider, triviaDBProvider }
export type { APIProvider } from './types'

/**
 * Get all available providers
 * Checks availability of each provider
 */
export async function getAvailableProviders(): Promise<APIProvider[]> {
  const providers = [
    groqProvider,        // Best quality, requires API key
    togetherAIProvider,  // Good quality, requires API key
    huggingFaceProvider, // Free but models may be deprecated
    triviaDBProvider    // Free but generic (not React-specific)
  ]
  const available: APIProvider[] = []

  for (const provider of providers) {
    try {
      console.log(`[API] 🔍 Checking ${provider.name} availability...`)
      const isAvailable = await provider.isAvailable()
      console.log(`[API] ${provider.name} availability result:`, isAvailable)
      if (!isAvailable) {
        console.log(`[API] ❌ ${provider.name} is not available`)
        continue
      }

      available.push(provider)
      console.log(`[API] ✅ ${provider.name} is available`)
    } catch (error) {
      console.warn(`[API] ❌ ${provider.name} availability check failed:`, error)
    }
  }

  console.log(`[API] 📡 Found ${available.length} available provider(s): ${available.map(p => p.name).join(', ')}`)
  return available
}

/**
 * Try to fetch questions from all available providers
 * Randomly selects between Groq and Together AI to distribute usage
 */
export async function fetchFromProviders(
  topic: string,
  count: number
): Promise<QuizQuestion[]> {
  console.log(`[API] 🔍 Checking available providers for topic: "${topic}" (requesting ${count} questions)`)
  const providers = await getAvailableProviders()
  
  if (providers.length === 0) {
    console.warn(`⚠️ [API] No providers are currently available`)
    return []
  }
  
  console.log(`[API] 📡 Found ${providers.length} available provider(s): ${providers.map(p => p.name).join(', ')}`)

  // Separate premium providers (Groq, Together AI) from free providers
  const premiumProviders = providers.filter(p => 
    p.name === 'Groq' || p.name === 'Together AI'
  )
  const freeProviders = providers.filter(p => 
    p.name !== 'Groq' && p.name !== 'Together AI'
  )

  // If we have premium providers, randomly select one
  if (premiumProviders.length > 0) {
    const selectedProvider = premiumProviders[Math.floor(Math.random() * premiumProviders.length)]
    const otherPremiumProviders = premiumProviders.filter(p => p !== selectedProvider)
    
    console.log(`[API] 🎲 Randomly selected: ${selectedProvider.name} (from ${premiumProviders.length} premium provider(s))`)
    
    // Try the randomly selected provider first
    const providersToTry = [
      selectedProvider,
      ...otherPremiumProviders, // Try other premium providers if first fails
      ...freeProviders // Then try free providers
    ]
    
    for (const provider of providersToTry) {
      try {
        console.log(`[API] 🔄 Trying ${provider.name}...`)
        const questions = await provider.fetch(topic, count)
        if (questions.length > 0) {
          console.log(`✅ [API] Successfully fetched ${questions.length} questions from ${provider.name}`)
          console.log(`[API] 📊 Source: ${provider.name} | Topic: "${topic}" | Count: ${questions.length}`)
          return questions
        }
        console.log(`[API] ⚠️ ${provider.name} returned 0 questions, trying next provider...`)
      } catch (error) {
        console.warn(`[API] ❌ ${provider.name} fetch failed:`, error)
        continue
      }
    }
  }

  // No premium providers, try free providers in order
  for (const provider of freeProviders) {
    try {
      console.log(`[API] 🔄 Trying ${provider.name}...`)
      const questions = await provider.fetch(topic, count)
      if (questions.length > 0) {
        console.log(`✅ [API] Successfully fetched ${questions.length} questions from ${provider.name}`)
        console.log(`[API] 📊 Source: ${provider.name} | Topic: "${topic}" | Count: ${questions.length}`)
        return questions
      }
      console.log(`[API] ⚠️ ${provider.name} returned 0 questions, trying next provider...`)
    } catch (error) {
      console.warn(`[API] ❌ ${provider.name} fetch failed:`, error)
      continue
    }
  }

  console.warn(`[API] ⚠️ All providers exhausted. No AI questions were generated.`)
  console.warn(`[API] 💡 Suggestions:`)
  console.warn(`[API]   1. Hugging Face models may be deprecated (410 Gone)`)
  console.warn(`[API]   2. Open Trivia DB provides generic programming questions, not React-specific`)
  console.warn(`[API]   3. For React-specific AI questions, set server env GROQ_API_KEY / TOGETHER_API_KEY`)
  console.warn(`[API]      (never VITE_*) and call /api/ai-quiz — see .env.example`)
  console.warn(`[API]   4. Consider using local React-specific templates instead`)
  return []
}
