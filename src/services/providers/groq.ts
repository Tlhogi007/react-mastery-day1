/**
 * Groq API (FREE tier - very fast inference with Llama 3, Mixtral models)
 * Can generate React-specific questions with proper prompts
 * Get API key from: https://console.groq.com/
 */

import type { APIProvider } from './types'
import { parseAIQuestions, getGroqApiKey } from './utils'
import { TIMEOUT } from '../../constants'
import { getTopicKeywords } from '../topicMapper'
import type { QuizQuestion } from '../../types/challenges'

export const groqProvider: APIProvider = {
  name: 'Groq',
  async isAvailable(): Promise<boolean> {
    const apiKey = getGroqApiKey()
    if (!apiKey) {
      return false // Silently return false if no API key
    }
    
    // Check if API is accessible (lightweight check)
    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(TIMEOUT.API_AVAILABILITY_CHECK)
      })
      return response.ok || response.status === 401 // 401 means API key exists but might be invalid
    } catch {
      return false
    }
  },
  async fetch(topic: string, count: number): Promise<QuizQuestion[]> {
    const apiKey = getGroqApiKey()
    if (!apiKey) {
      console.warn('[Groq] API key not found. Set VITE_GROQ_API_KEY in .env file')
      return []
    }

    // Get React-specific keywords for better prompts
    const keywords = getTopicKeywords(topic)
    const keywordString = keywords.join(', ')

    // Use Llama 3.1 8B (fast and free tier) or Mixtral 8x7B
    const models = [
      'llama-3.1-8b-instant', // Fast, good for free tier
      'llama-3.1-70b-versatile', // Better quality if available
      'mixtral-8x7b-32768' // Alternative
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

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
            console.warn(`[Groq] ⚠️ Invalid API key. Please check your VITE_GROQ_API_KEY`)
            return []
          }
          if (response.status === 429) {
            console.log(`[Groq] ${model} rate limited, trying next model...`)
            continue
          }
          console.warn(`[Groq] ${model} error: ${response.status}. Trying next model.`)
          continue
        }

        const data = await response.json()
        if (!data?.choices?.[0]?.message?.content) {
          console.log(`[Groq] ${model} returned invalid response format, trying next model...`)
          continue
        }

        const generatedText = data.choices[0].message.content
        console.log(`[Groq] ${model} generated text for React internals topic: ${topic}`)
        console.log(`[Groq] Raw generated text length: ${generatedText.length} characters`)

        // Parse the generated text into QuizQuestion format
        const parsedQuestions = parseAIQuestions(generatedText, topic, count)

        if (parsedQuestions.length > 0) {
          console.log(`✅ [Groq] Successfully parsed ${parsedQuestions.length} questions from ${model}`)
          return parsedQuestions
        }

        console.log(`[Groq] Could not parse questions from ${model}, trying next model...`)
        continue
      } catch (error) {
        console.warn(`[Groq] ${model} fetch failed:`, error)
        continue
      }
    }

    console.log('[Groq] All models failed to generate questions.')
    return []
  }
}
