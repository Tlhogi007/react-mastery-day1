/**
 * Utility functions for API providers
 */

import type { QuizQuestion } from '../../types/challenges'

/**
 * Decode HTML entities
 */
export function decodeHtml(html: string): string {
  const txt = document.createElement('textarea')
  txt.innerHTML = html
  return txt.value
}

/**
 * Parse AI-generated text into QuizQuestion format
 * Handles various formats and edge cases
 */
export function parseAIQuestions(
  generatedText: string,
  topic: string,
  count: number
): QuizQuestion[] {
  const questions: QuizQuestion[] = []
  const timestamp = Date.now()
  
  // Normalize the text - remove extra whitespace, normalize line breaks, remove markdown bold
  const normalized = generatedText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\*\*/g, '') // Remove markdown bold markers
    .trim()
  
  // Try multiple regex patterns to match different formats
  // Pattern 1: Q: ... A) ... B) ... C) ... D) ... Correct: ... Explanation: ...
  const pattern1 = /Q:\s*(.+?)\s*A\)\s*(.+?)\s*B\)\s*(.+?)\s*C\)\s*(.+?)\s*D\)\s*(.+?)\s*(?:Correct|Answer):\s*([A-D])\)?\s*(?:Explanation|Explain)[:\s]+(.+?)(?=Q:|$)/gis
  
  // Pattern 2: Question: ... Option A: ... Option B: ... Option C: ... Option D: ... Answer: ... Explanation: ...
  const pattern2 = /Question:\s*(.+?)\s*Option\s*A:\s*(.+?)\s*Option\s*B:\s*(.+?)\s*Option\s*C:\s*(.+?)\s*Option\s*D:\s*(.+?)\s*(?:Answer|Correct):\s*([A-D])\s*Explanation:\s*(.+?)(?=Question:|$)/gis
  
  // Pattern 3: More flexible - handles variations in spacing and formatting
  const pattern3 = /(?:Q|Question)[:\s]+(.+?)\s+(?:A|Option\s*A)[\):\s]+(.+?)\s+(?:B|Option\s*B)[\):\s]+(.+?)\s+(?:C|Option\s*C)[\):\s]+(.+?)\s+(?:D|Option\s*D)[\):\s]+(.+?)\s+(?:Correct|Answer|Right\s*Answer)[:\s]+([A-D])\s+(?:Explanation|Explain)[:\s]+(.+?)(?=(?:Q|Question)[:\s]|$)/gis
  
  // Pattern 4: Groq format - **Q1:** or Q1: ... A) ... B) ... C) ... D) ... Correct: C) [text] Explanation: ...
  const pattern4 = /(?:Q\d*|Question\s*\d*)[:\s]+(.+?)\s+A\)\s+(.+?)\s+B\)\s+(.+?)\s+C\)\s+(.+?)\s+D\)\s+(.+?)\s+(?:Correct|Answer)[:\s]+([A-D])\)?\s*(?:.+?)?\s*(?:Explanation|Explain)[:\s]+(.+?)(?=(?:Q\d*|Question\s*\d*)[:\s]|$)/gis
  
  let matches: RegExpMatchArray[] = []
  
  // Try each pattern until we find matches (try pattern4 first for Groq format)
  for (const pattern of [pattern4, pattern1, pattern2, pattern3]) {
    const foundMatches = [...normalized.matchAll(pattern)]
    if (foundMatches.length > 0) {
      matches = foundMatches
      console.log(`[AI Parser] Using pattern that matched ${foundMatches.length} questions`)
      break
    }
  }
  
  if (matches.length === 0) {
    console.warn('[AI Parser] Could not parse questions from generated text. Format may be unexpected.')
    console.log('[AI Parser] Generated text sample:', normalized.substring(0, 500))
    return []
  }
  
  console.log(`[AI Parser] Found ${matches.length} potential questions using pattern matching`)
  
  // Process each match
  for (let i = 0; i < Math.min(matches.length, count); i++) {
    const match = matches[i]
    
    try {
      // Extract components based on pattern
      const questionText = match[1]?.trim()
      const optionA = match[2]?.trim()
      const optionB = match[3]?.trim()
      const optionC = match[4]?.trim()
      const optionD = match[5]?.trim()
      let correctLetter = match[6]?.trim().toUpperCase()
      const explanation = match[7]?.trim()
      
      // Handle cases where correct answer might be "C) [text]" - extract just the letter
      if (correctLetter && correctLetter.includes(')')) {
        correctLetter = correctLetter.split(')')[0].trim()
      }
      
      // Validate all required fields
      if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctLetter || !explanation) {
        console.warn(`[AI Parser] Skipping question ${i + 1} - missing required fields`, {
          questionText: !!questionText,
          optionA: !!optionA,
          optionB: !!optionB,
          optionC: !!optionC,
          optionD: !!optionD,
          correctLetter,
          explanation: !!explanation
        })
        continue
      }
      
      // Validate correct answer is A, B, C, or D
      if (!['A', 'B', 'C', 'D'].includes(correctLetter)) {
        console.warn(`[AI Parser] Skipping question ${i + 1} - invalid correct answer: ${correctLetter}`)
        continue
      }
      
      // Convert letter to index (A=0, B=1, C=2, D=3)
      const correctAnswerIndex = correctLetter.charCodeAt(0) - 'A'.charCodeAt(0)
      
      // Build options array
      const options = [optionA, optionB, optionC, optionD]
      
      // Clean up options (remove leading numbers, bullets, etc.)
      const cleanedOptions = options.map(opt => 
        opt.replace(/^\d+[\.\)]\s*/, '') // Remove leading numbers
          .replace(/^[-\*]\s*/, '') // Remove bullets
          .trim()
      )
      
      // Validate options are not empty
      if (cleanedOptions.some(opt => !opt || opt.length < 3)) {
        console.warn(`[AI Parser] Skipping question ${i + 1} - options too short or empty`)
        continue
      }
      
      // Clean question text
      const cleanedQuestion = questionText.replace(/^\d+[\.\)]\s*/, '').trim()
      
      // Validate question length
      if (cleanedQuestion.length < 10) {
        console.warn(`[AI Parser] Skipping question ${i + 1} - question too short`)
        continue
      }
      
      // Create QuizQuestion object
      questions.push({
        id: `ai-${topic}-${timestamp}-${i}`,
        question: cleanedQuestion,
        options: cleanedOptions,
        correctAnswer: correctAnswerIndex,
        explanation: explanation || `This question tests understanding of ${topic} in React's internal architecture.`
      })
      
    } catch (error) {
      console.warn(`[AI Parser] Error parsing question ${i + 1}:`, error)
      continue
    }
  }
  
  if (questions.length === 0) {
    console.warn('[AI Parser] No valid questions could be parsed from generated text')
    return questions
  }

  console.log(`✅ [AI Parser] Successfully parsed ${questions.length} questions from AI-generated text`)
  return questions
}

/**
 * Get API key from environment variables
 * Vite uses import.meta.env for environment variables
 */
export function getGroqApiKey(): string | null {
  return import.meta.env.VITE_GROQ_API_KEY || null
}

export function getTogetherApiKey(): string | null {
  const key = import.meta.env.VITE_TOGETHER_API_KEY || null
  if (!key) {
    console.log('[Together AI] 🔍 Environment check - VITE_TOGETHER_API_KEY:', import.meta.env.VITE_TOGETHER_API_KEY ? 'exists but empty' : 'not found in import.meta.env')
    console.log('[Together AI] 🔍 All env vars starting with VITE_:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')))
  }
  return key
}
