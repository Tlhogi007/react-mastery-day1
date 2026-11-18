/**
 * Bridges Clerk session tokens into non-React AI fetch helpers.
 */

type TokenGetter = () => Promise<string | null | undefined>

let tokenGetter: TokenGetter | null = null

export type AiGateEvent = {
  mode: 'auth' | 'quota'
  message: string
}

export type AiGateClearEvent = { mode: 'clear' }

type GateListener = (event: AiGateEvent | AiGateClearEvent) => void
const gateListeners = new Set<GateListener>()

export function registerAiAuthTokenGetter(getter: TokenGetter | null): void {
  tokenGetter = getter
}

export async function getAiAuthToken(): Promise<string | null> {
  if (!tokenGetter) return null
  try {
    const token = await tokenGetter()
    return token || null
  } catch {
    return null
  }
}

/** Wait briefly for Clerk to hydrate after OAuth remount. */
export async function waitForAiAuthToken(
  attempts = 25,
  delayMs = 120,
): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    const token = await getAiAuthToken()
    if (token) return token
    await new Promise((r) => setTimeout(r, delayMs))
  }
  return null
}

export function subscribeAiGate(listener: GateListener): () => void {
  gateListeners.add(listener)
  return () => gateListeners.delete(listener)
}

export function emitAiGate(event: AiGateEvent): void {
  for (const listener of gateListeners) listener(event)
}

export function clearAiGate(): void {
  for (const listener of gateListeners) listener({ mode: 'clear' })
}
