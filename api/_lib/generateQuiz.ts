export type Provider = 'groq' | 'together'

const GROQ_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.1-70b-versatile',
  'mixtral-8x7b-32768',
]

const TOGETHER_MODELS = [
  'meta-llama/Llama-3-8b-chat-hf',
  'meta-llama/Llama-3-70b-chat-hf',
  'mistralai/Mixtral-8x7B-Instruct-v0.1',
]

export function buildPrompt(topic: string, count: number): string {
  const safeTopic = topic.slice(0, 120).replace(/[^\w\s\-./]/g, '')
  const safeCount = Math.min(Math.max(Number(count) || 3, 1), 8)
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

type ChatResult = { kind: 'ok'; content: string } | { kind: 'auth' } | { kind: 'retry' }

async function chatCompletions(
  url: string,
  apiKey: string,
  model: string,
  prompt: string,
): Promise<ChatResult> {
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
          content:
            "You are an expert in React.js internals and can generate high-quality technical quiz questions about React's rendering pipeline, Fiber architecture, and reconciliation algorithm.",
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
    signal: AbortSignal.timeout(20000),
  })
  if (response.status === 401) return { kind: 'auth' }
  if (!response.ok) return { kind: 'retry' }
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data?.choices?.[0]?.message?.content
  return content ? { kind: 'ok', content } : { kind: 'retry' }
}

export async function generateQuizContent(
  provider: Provider,
  topic: string,
  count: number,
  keys: { groq?: string; together?: string },
): Promise<{ ok: true; content: string } | { ok: false; status: number; error: string }> {
  const prompt = buildPrompt(topic, count)

  if (provider === 'groq') {
    if (!keys.groq) return { ok: false, status: 503, error: 'Groq not configured' }
    for (const model of GROQ_MODELS) {
      try {
        const result = await chatCompletions(
          'https://api.groq.com/openai/v1/chat/completions',
          keys.groq,
          model,
          prompt,
        )
        if (result.kind === 'auth') return { ok: false, status: 502, error: 'Upstream auth failed' }
        if (result.kind === 'ok') return { ok: true, content: result.content }
      } catch {
        continue
      }
    }
    return { ok: false, status: 502, error: 'Upstream generation failed' }
  }

  if (!keys.together) return { ok: false, status: 503, error: 'Together AI not configured' }
  for (const model of TOGETHER_MODELS) {
    try {
      const result = await chatCompletions(
        'https://api.together.xyz/v1/chat/completions',
        keys.together,
        model,
        prompt,
      )
      if (result.kind === 'auth') return { ok: false, status: 502, error: 'Upstream auth failed' }
      if (result.kind === 'ok') return { ok: true, content: result.content }
    } catch {
      continue
    }
  }
  return { ok: false, status: 502, error: 'Upstream generation failed' }
}

export function providerAvailability(keys: { groq?: string; together?: string }) {
  return {
    groq: Boolean(keys.groq),
    together: Boolean(keys.together),
  }
}
