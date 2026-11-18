/**
 * Bring-your-own AI keys — stored only in this browser's localStorage.
 * When set, the client calls providers directly so hosted free quota is not used.
 */

const STORAGE_KEY = 'react-mastery-byo-ai-keys'

export type ByoAiKeys = {
  groq?: string
  gemini?: string
  together?: string
}

function read(): ByoAiKeys {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as ByoAiKeys
    return {
      groq: typeof parsed.groq === 'string' ? parsed.groq.trim() : undefined,
      gemini: typeof parsed.gemini === 'string' ? parsed.gemini.trim() : undefined,
      together: typeof parsed.together === 'string' ? parsed.together.trim() : undefined,
    }
  } catch {
    return {}
  }
}

function write(keys: ByoAiKeys): void {
  const cleaned: ByoAiKeys = {}
  if (keys.groq?.trim()) cleaned.groq = keys.groq.trim()
  if (keys.gemini?.trim()) cleaned.gemini = keys.gemini.trim()
  if (keys.together?.trim()) cleaned.together = keys.together.trim()
  if (Object.keys(cleaned).length === 0) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
}

export const byoAiKeys = {
  get(): ByoAiKeys {
    return read()
  },
  set(partial: ByoAiKeys): void {
    write({ ...read(), ...partial })
  },
  clear(): void {
    localStorage.removeItem(STORAGE_KEY)
  },
  hasAny(): boolean {
    const k = read()
    return Boolean(k.groq || k.gemini || k.together)
  },
}
