export type Provider = 'groq' | 'gemini' | 'together' | 'auto'

const GROQ_MODELS = [
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
]

const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
]

const TOGETHER_MODELS = [
  'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
  'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
  'mistralai/Mixtral-8x7B-Instruct-v0.1',
]

export function buildPrompt(topic: string, count: number): string {
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

type ChatResult =
  | { kind: 'ok'; content: string }
  | { kind: 'auth' }
  | { kind: 'retry'; status: number; detail?: string }

async function openaiCompatibleChat(
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
  if (response.status === 401 || response.status === 403) return { kind: 'auth' }
  if (!response.ok) {
    const detail = (await response.text().catch(() => '')).slice(0, 180)
    console.warn(`[ai-quiz] ${model} -> ${response.status}`, detail)
    return { kind: 'retry', status: response.status, detail }
  }
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data?.choices?.[0]?.message?.content
  return content ? { kind: 'ok', content } : { kind: 'retry', status: 502, detail: 'empty content' }
}

async function geminiChat(apiKey: string, model: string, prompt: string): Promise<ChatResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are an expert in React.js internals.\n\n${prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    }),
    signal: AbortSignal.timeout(20000),
  })
  if (response.status === 401 || response.status === 403) return { kind: 'auth' }
  if (!response.ok) {
    const detail = (await response.text().catch(() => '')).slice(0, 180)
    console.warn(`[ai-quiz] gemini ${model} -> ${response.status}`, detail)
    return { kind: 'retry', status: response.status, detail }
  }
  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const content = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || ''
  return content
    ? { kind: 'ok', content }
    : { kind: 'retry', status: 502, detail: 'empty content' }
}

type Keys = { groq?: string; gemini?: string; together?: string }

async function runProvider(
  provider: Exclude<Provider, 'auto'>,
  prompt: string,
  keys: Keys,
): Promise<{ ok: true; content: string } | { ok: false; status: number; error: string }> {
  let lastStatus = 0
  let lastDetail = ''

  if (provider === 'groq') {
    if (!keys.groq) return { ok: false, status: 503, error: 'Groq not configured' }
    for (const model of GROQ_MODELS) {
      try {
        const result = await openaiCompatibleChat(
          'https://api.groq.com/openai/v1/chat/completions',
          keys.groq,
          model,
          prompt,
        )
        if (result.kind === 'auth') return { ok: false, status: 502, error: 'Upstream auth failed (check GROQ_API_KEY)' }
        if (result.kind === 'ok') return { ok: true, content: result.content }
        lastStatus = result.status
        lastDetail = result.detail || ''
      } catch (err) {
        lastDetail = err instanceof Error ? err.message : 'request failed'
      }
    }
  } else if (provider === 'gemini') {
    if (!keys.gemini) return { ok: false, status: 503, error: 'Gemini not configured' }
    for (const model of GEMINI_MODELS) {
      try {
        const result = await geminiChat(keys.gemini, model, prompt)
        if (result.kind === 'auth') return { ok: false, status: 502, error: 'Upstream auth failed (check GEMINI_API_KEY)' }
        if (result.kind === 'ok') return { ok: true, content: result.content }
        lastStatus = result.status
        lastDetail = result.detail || ''
      } catch (err) {
        lastDetail = err instanceof Error ? err.message : 'request failed'
      }
    }
  } else {
    if (!keys.together) return { ok: false, status: 503, error: 'Together AI not configured' }
    for (const model of TOGETHER_MODELS) {
      try {
        const result = await openaiCompatibleChat(
          'https://api.together.xyz/v1/chat/completions',
          keys.together,
          model,
          prompt,
        )
        if (result.kind === 'auth') return { ok: false, status: 502, error: 'Upstream auth failed (check TOGETHER_API_KEY)' }
        if (result.kind === 'ok') return { ok: true, content: result.content }
        lastStatus = result.status
        lastDetail = result.detail || ''
      } catch (err) {
        lastDetail = err instanceof Error ? err.message : 'request failed'
      }
    }
  }

  return {
    ok: false,
    status: 502,
    error: `Upstream generation failed${lastStatus ? ` (${lastStatus})` : ''}${lastDetail ? `: ${lastDetail}` : ''}`,
  }
}

/** Waterfall for auto: Groq → Gemini → Together (free/high-quota first). */
export async function generateQuizContent(
  provider: Provider,
  topic: string,
  count: number,
  keys: Keys,
): Promise<{ ok: true; content: string; used?: string } | { ok: false; status: number; error: string }> {
  const prompt = buildPrompt(topic, count)
  const order: Array<Exclude<Provider, 'auto'>> =
    provider === 'auto' ? ['groq', 'gemini', 'together'] : [provider]

  let lastFail: { ok: false; status: number; error: string } | null = null
  for (const p of order) {
    const configured =
      (p === 'groq' && keys.groq) ||
      (p === 'gemini' && keys.gemini) ||
      (p === 'together' && keys.together)
    if (!configured) continue

    const result = await runProvider(p, prompt, keys)
    if (result.ok) return { ...result, used: p }
    lastFail = result
    // Auth/credit failures → try next provider in auto mode
    if (provider !== 'auto') return result
  }

  return lastFail || { ok: false, status: 503, error: 'No AI providers configured' }
}

export function providerAvailability(keys: Keys) {
  return {
    groq: Boolean(keys.groq),
    gemini: Boolean(keys.gemini),
    together: Boolean(keys.together),
  }
}
