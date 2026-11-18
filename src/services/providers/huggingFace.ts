/**
 * Hugging Face Inference API (FREE - no API key needed for public models)
 * Generates React-specific questions using AI with very specific React internals prompts
 */

import type { APIProvider } from './types'
import { parseAIQuestions } from './utils'
import { TIMEOUT } from '../../constants'
import { getTopicKeywords } from '../topicMapper'
import type { QuizQuestion } from '../../types/challenges'

export const huggingFaceProvider: APIProvider = {
  name: 'Hugging Face',
  async isAvailable(): Promise<boolean> {
    // Try multiple smaller models that are more likely to be available
    const modelsToCheck = [
      'distilgpt2',  // Smaller GPT-2, more available
      'gpt2-medium',
      'EleutherAI/gpt-neo-125M',
      'microsoft/DialoGPT-small',
      'google/flan-t5-base'
    ]
    
    for (const model of modelsToCheck) {
      try {
        const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(TIMEOUT.API_AVAILABILITY_CHECK)
        })
        if (response.status === 410) {
          console.log(`[HF] Model ${model} is gone (410) - deprecated/unavailable`)
          continue
        }
        if (response.ok || response.status === 405) {
          console.log(`[HF] Found available model: ${model}`)
          return true
        }
      } catch {
        continue
      }
    }
    
    console.warn(`[HF] ⚠️ All ${modelsToCheck.length} Hugging Face models are unavailable (410 Gone). Models may be deprecated.`)
    return false
  },
  async fetch(topic: string, count: number): Promise<QuizQuestion[]> {
    // Try models in order of preference
    const models = [
      'distilgpt2',
      'gpt2-medium', 
      'EleutherAI/gpt-neo-125M',
      'google/flan-t5-base',
      'microsoft/DialoGPT-small'
    ]
    
    // Get React-specific keywords for better prompts
    const keywords = getTopicKeywords(topic)
    const keywordString = keywords.join(', ')
    
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
        
        const response = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              inputs: prompt,
              parameters: {
                max_length: 2500,
                temperature: 0.7,
                return_full_text: false
              }
            }),
            signal: AbortSignal.timeout(TIMEOUT.API_REQUEST * 4)
          }
        )

        if (!response.ok) {
          if (response.status === 503) {
            console.log(`[HF] ${model} is loading (503), trying next model...`)
            continue
          }
          if (response.status === 410) {
            console.warn(`[HF] ⚠️ ${model} is gone (410) - model deprecated/unavailable, trying next model...`)
            continue
          }
          console.warn(`[HF] ${model} error: ${response.status}. Trying next model.`)
          continue
        }

        const data = await response.json()
        if (!data?.[0]?.generated_text) {
          console.log(`[HF] ${model} returned invalid response format, trying next model...`)
          continue
        }

        console.log(`[HF] ${model} generated text for React internals topic: ${topic}`)
        console.log(`[HF] Raw generated text length: ${data[0].generated_text.length} characters`)
        
        // Parse the generated text into QuizQuestion format
        const parsedQuestions = parseAIQuestions(
          data[0].generated_text,
          topic,
          count
        )
        
        if (parsedQuestions.length > 0) {
          console.log(`✅ [HF] Successfully parsed ${parsedQuestions.length} questions from ${model}`)
          return parsedQuestions
        }

        console.log(`[HF] Could not parse questions from ${model}, trying next model...`)
        continue
      } catch (error) {
        console.warn(`[HF] ${model} fetch failed:`, error)
        continue
      }
    }
    
    console.log('[HF] All models failed to generate questions.')
    return []
  }
}
