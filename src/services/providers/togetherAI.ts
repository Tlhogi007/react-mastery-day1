/**
 * Together AI (FREE tier available with Llama, Mixtral models)
 * Can generate React-specific questions
 * Get API key from: https://api.together.xyz/
 */

import type { APIProvider } from './types'
import { parseAIQuestions, getTogetherApiKey } from './utils'
import { TIMEOUT } from '../../constants'
import { getTopicKeywords } from '../topicMapper'
import type { QuizQuestion } from '../../types/challenges'

export const togetherAIProvider: APIProvider = {
  name: 'Together AI',
  async isAvailable(): Promise<boolean> {
    console.log('[Together AI] 🔍 Starting availability check...')
    const apiKey = getTogetherApiKey()
    
    if (!apiKey) {
      console.log('[Together AI] ⚠️ API key not found. Set VITE_TOGETHER_API_KEY in .env file')
      console.log('[Together AI] 🔍 Environment check - VITE_TOGETHER_API_KEY:', import.meta.env.VITE_TOGETHER_API_KEY ? 'exists but empty' : 'not found in import.meta.env')
      console.log('[Together AI] 🔍 All env vars starting with VITE_:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')))
      return false
    }

    console.log('[Together AI] ✅ API key found:', apiKey.substring(0, 20) + '...')
    
    // Simplified: if we have an API key, assume it's available
    // The actual fetch will handle authentication/network errors
    console.log('[Together AI] ✅ Assuming available (will verify on first use)')
    return true
  },
  async fetch(topic: string, count: number): Promise<QuizQuestion[]> {
    const apiKey = getTogetherApiKey()
    if (!apiKey) {
      console.warn('[Together AI] API key not found. Set VITE_TOGETHER_API_KEY in .env file')
      return []
    }

    // Get React-specific keywords for better prompts
    const keywords = getTopicKeywords(topic)
    const keywordString = keywords.join(', ')

    // Use Llama 3 or Mixtral models
    const models = [
      'meta-llama/Llama-3-8b-chat-hf', // Fast, good for free tier
      'meta-llama/Llama-3-70b-chat-hf', // Better quality if available
      'mistralai/Mixtral-8x7B-Instruct-v0.1' // Alternative
    ]

    for (const model of models) {
      try {
        // VERY SPECIFIC prompt about React internals
        const prompt = `Generate ${count} multiple-choice quiz questions about React.js internals, specifically about "${topic}". 

Focus on React's internal architecture: ${keywordString}

Each question should test deep understanding of React's rendering pipeline, Fiber architecture, reconciliation algorithm, or React internals.

Format each question as:
Q: [question about React internals]
A) [option1]
B) [option2] 
C) [option3]
D) [option4]
Correct: [A/B/C/D]
Explanation: [detailed explanation of React internals]

Make questions technical and specific to React's internal mechanisms, not general JavaScript.`

        const response = await fetch('https://api.together.xyz/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: 'You are an expert in React.js internals and can generate high-quality technical quiz questions about React\'s rendering pipeline, Fiber architecture, and reconciliation algorithm.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 2000
          }),
          signal: AbortSignal.timeout(TIMEOUT.API_REQUEST * 4)
        })

        if (!response.ok) {
          if (response.status === 401) {
            console.warn(`[Together AI] ⚠️ Invalid API key. Please check your VITE_TOGETHER_API_KEY`)
            return []
          }
          if (response.status === 402) {
            console.error(`[Together AI] ${model} error: 402 (Payment Required). Credits may be exhausted.`)
            continue // Try next model
          }
          if (response.status === 429) {
            console.log(`[Together AI] ${model} rate limited, trying next model...`)
            continue
          }
          console.warn(`[Together AI] ${model} error: ${response.status}. Trying next model.`)
          continue
        }

        const data = await response.json()
        if (!data?.choices?.[0]?.message?.content) {
          console.log(`[Together AI] ${model} returned invalid response format, trying next model...`)
          continue
        }

        const generatedText = data.choices[0].message.content
        console.log(`[Together AI] ${model} generated text for React internals topic: ${topic}`)
        console.log(`[Together AI] Raw generated text length: ${generatedText.length} characters`)

        // Parse the generated text into QuizQuestion format
        const parsedQuestions = parseAIQuestions(generatedText, topic, count)

        if (parsedQuestions.length > 0) {
          console.log(`✅ [Together AI] Successfully parsed ${parsedQuestions.length} questions from ${model}`)
          return parsedQuestions
        }

        console.log(`[Together AI] Could not parse questions from ${model}, trying next model...`)
        continue
      } catch (error) {
        console.warn(`[Together AI] ${model} fetch failed:`, error)
        continue
      }
    }

    console.log('[Together AI] All models failed to generate questions.')
    return []
  }
}
