import { describe, expect, it, vi } from 'vitest'
import { BYO_KEYS_CHANGED_EVENT, byoAiKeys } from './byoAiKeys'

const KEY = 'react-mastery-byo-ai-keys'

describe('byoAiKeys', () => {
  it('is empty by default', () => {
    expect(byoAiKeys.get()).toEqual({})
    expect(byoAiKeys.hasAny()).toBe(false)
    expect(byoAiKeys.activeProviders()).toEqual([])
  })

  it('stores trimmed keys and notifies', () => {
    const spy = vi.fn()
    window.addEventListener(BYO_KEYS_CHANGED_EVENT, spy)
    byoAiKeys.set({ groq: '  gk  ', gemini: 'gm' })
    window.removeEventListener(BYO_KEYS_CHANGED_EVENT, spy)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ groq: 'gk', gemini: 'gm' })
    expect(byoAiKeys.get()).toEqual({ groq: 'gk', gemini: 'gm', together: undefined })
    expect(byoAiKeys.hasAny()).toBe(true)
    expect(byoAiKeys.activeProviders()).toEqual(['groq', 'gemini'])
  })

  it('merges partial updates and lists all providers', () => {
    byoAiKeys.set({ groq: 'a' })
    byoAiKeys.set({ together: 'c', gemini: 'b' })
    expect(byoAiKeys.activeProviders()).toEqual(['groq', 'gemini', 'together'])
  })

  it('removes a key when set to blank; removes storage when none left', () => {
    byoAiKeys.set({ groq: 'a', gemini: 'b' })
    byoAiKeys.set({ groq: '   ' })
    expect(byoAiKeys.activeProviders()).toEqual(['gemini'])
    byoAiKeys.set({ gemini: '' })
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('clear removes keys and notifies', () => {
    byoAiKeys.set({ groq: 'a' })
    const spy = vi.fn()
    window.addEventListener(BYO_KEYS_CHANGED_EVENT, spy)
    byoAiKeys.clear()
    window.removeEventListener(BYO_KEYS_CHANGED_EVENT, spy)
    expect(spy).toHaveBeenCalled()
    expect(byoAiKeys.hasAny()).toBe(false)
  })

  it('ignores non-string values and corrupt JSON', () => {
    localStorage.setItem(KEY, JSON.stringify({ groq: 5, gemini: ' g ' }))
    expect(byoAiKeys.get()).toEqual({ groq: undefined, gemini: 'g', together: undefined })
    localStorage.setItem(KEY, '{bad')
    expect(byoAiKeys.get()).toEqual({})
  })

  it('swallows notify failures', () => {
    vi.spyOn(window, 'dispatchEvent').mockImplementation(() => {
      throw new Error('x')
    })
    expect(() => byoAiKeys.set({ groq: 'a' })).not.toThrow()
  })
})
