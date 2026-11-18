/**
 * Direct vendor calls using the learner's own keys (localStorage).
 */

import type { QuizQuestion } from '../../types/challenges'
import { byoAiKeys } from '../byoAiKeys'
import { parseAIQuestions } from './utils'
import type { AiProxyProvider } from './aiProxy'

function buildPrompt(topic: string, count: number): string {
  const safeTopic = topic.slice(0, 120).replace(/[^\w\s\-./]/g, '')
  const safeCount = Math.min(Math.max(Number(count) || 3, 1), 5)
  return `Generate ${safeCount} multiple-choice quiz questions about React.js internals, specifically about "${safeTopic}".

Focus on React's internal architecture.

Format each question as:
Q: [question about React internals]
A) [option1]
B) [option2]
C) [option3]
D) [option4]
Correct: [A/B/C/D]
Explanation: [detailed explanation of React internals]

Make questions technical and specific to React's internal mechanisms, not general JavaScript.`
}

async function openaiChat(
  url: string,
  apiKey: string,
  model: string,
  prompt: string,
): Promise<string | null> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert in React.js internals.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
    signal: AbortSignal.timeout(25000),
  })
  if (!response.ok) return null
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  return data.choices?.[0]?.message?.content || null
}

async function geminiChat(apiKey: string, model: string, prompt: string): Promise<string | null> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `You are an expert in React.js internals.\n\n${prompt}` }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
      }),
      signal: AbortSignal.timeout(25000),
    },
  )
  if (!response.ok) return null
  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || null
}

const GROQ_MODELS = ['openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-120b']
const GEMINI_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.8-flash']
const TOGETHER_MODELS = [
  'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
  'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
]

export async function fetchWithByoKey(
  provider: AiProxyProvider,
  topic: string,
  count: number,
): Promise<QuizQuestion[]> {
  const keys = byoAiKeys.get()
  const prompt = buildPrompt(topic, count)
  const order: Array<'groq' | 'gemini' | 'together'> =
    provider === 'auto'
      ? ['groq', 'gemini', 'together']
      : provider === 'groq' || provider === 'gemini' || provider === 'together'
        ? [provider]
        : ['groq', 'gemini', 'together']

  for (const p of order) {
    let content: string | null = null
    try {
      if (p === 'groq' && keys.groq) {
        for (const model of GROQ_MODELS) {
          content = await openaiChat(
            'https://api.groq.com/openai/v1/chat/completions',
            keys.groq,
            model,
            prompt,
          )
          if (content) break
        }
      } else if (p === 'gemini' && keys.gemini) {
        for (const model of GEMINI_MODELS) {
          content = await geminiChat(keys.gemini, model, prompt)
          if (content) break
        }
      } else if (p === 'together' && keys.together) {
        for (const model of TOGETHER_MODELS) {
          content = await openaiChat(
            'https://api.together.xyz/v1/chat/completions',
            keys.together,
            model,
            prompt,
          )
          if (content) break
        }
      }
    } catch {
      content = null
    }
    if (content) return parseAIQuestions(content, topic, count)
  }
  return []
}
