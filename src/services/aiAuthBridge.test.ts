import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Bridge = typeof import('./aiAuthBridge')

async function load(): Promise<Bridge> {
  vi.resetModules()
  return import('./aiAuthBridge')
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('token getter', () => {
  it('returns null with no getter registered', async () => {
    const b = await load()
    expect(await b.getAiAuthToken()).toBeNull()
  })

  it('returns the token from the registered getter', async () => {
    const b = await load()
    b.registerAiAuthTokenGetter(async () => 'tok')
    expect(await b.getAiAuthToken()).toBe('tok')
  })

  it('normalizes empty/undefined tokens to null', async () => {
    const b = await load()
    b.registerAiAuthTokenGetter(async () => '')
    expect(await b.getAiAuthToken()).toBeNull()
    b.registerAiAuthTokenGetter(async () => undefined)
    expect(await b.getAiAuthToken()).toBeNull()
  })

  it('returns null when the getter throws and after unregistering', async () => {
    const b = await load()
    b.registerAiAuthTokenGetter(async () => {
      throw new Error('clerk')
    })
    expect(await b.getAiAuthToken()).toBeNull()
    b.registerAiAuthTokenGetter(null)
    expect(await b.getAiAuthToken()).toBeNull()
  })
})

describe('waitForAiAuthToken', () => {
  it('resolves immediately when a token is available', async () => {
    const b = await load()
    b.registerAiAuthTokenGetter(async () => 'now')
    expect(await b.waitForAiAuthToken(3, 10)).toBe('now')
  })

  it('polls until the token appears', async () => {
    const b = await load()
    const getter = vi
      .fn<() => Promise<string | null>>()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue('late')
    b.registerAiAuthTokenGetter(getter)
    const p = b.waitForAiAuthToken(5, 100)
    await vi.advanceTimersByTimeAsync(250)
    expect(await p).toBe('late')
    expect(getter).toHaveBeenCalledTimes(3)
  })

  it('gives up after the given attempts', async () => {
    const b = await load()
    const getter = vi.fn().mockResolvedValue(null)
    b.registerAiAuthTokenGetter(getter)
    const p = b.waitForAiAuthToken(3, 50)
    await vi.advanceTimersByTimeAsync(500)
    expect(await p).toBeNull()
    expect(getter).toHaveBeenCalledTimes(3)
  })

  it('uses default attempts/delay', async () => {
    const b = await load()
    const p = b.waitForAiAuthToken()
    await vi.advanceTimersByTimeAsync(25 * 120 + 10)
    expect(await p).toBeNull()
  })
})

describe('AI gate', () => {
  it('notifies listeners and blocks provider fallback', async () => {
    const b = await load()
    const listener = vi.fn()
    const unsub = b.subscribeAiGate(listener)
    expect(b.aiGateBlocksProviderFallback()).toBe(false)
    b.emitAiGate({ mode: 'auth', message: 'sign in' })
    expect(listener).toHaveBeenCalledWith({ mode: 'auth', message: 'sign in' })
    expect(b.aiGateBlocksProviderFallback()).toBe(true)
    b.clearAiGate()
    expect(listener).toHaveBeenLastCalledWith({ mode: 'clear' })
    expect(b.aiGateBlocksProviderFallback()).toBe(false)
    unsub()
    b.emitAiGate({ mode: 'quota', message: 'x' })
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('suppression ignores emits until allowed again', async () => {
    const b = await load()
    const listener = vi.fn()
    b.subscribeAiGate(listener)
    b.suppressAiGate()
    b.emitAiGate({ mode: 'auth', message: 'x' })
    expect(listener).not.toHaveBeenCalled()
    expect(b.aiGateBlocksProviderFallback()).toBe(false)
    b.allowAiGate()
    b.emitAiGate({ mode: 'auth', message: 'x' })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('dismiss-local suppresses and notifies', async () => {
    const b = await load()
    const listener = vi.fn()
    b.subscribeAiGate(listener)
    b.emitAiGate({ mode: 'quota', message: 'x' })
    b.emitAiGateDismissLocal()
    expect(listener).toHaveBeenLastCalledWith({ mode: 'dismiss-local' })
    expect(b.aiGateBlocksProviderFallback()).toBe(false)
    b.emitAiGate({ mode: 'quota', message: 'y' })
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
