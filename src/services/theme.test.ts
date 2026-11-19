import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyAppTheme, setAppTheme, THEME_CHANGE_EVENT } from './theme'
import { settingsStorage } from './settingsStorage'

function mockPrefersDark(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((q: string) => ({
      matches,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
  window.matchMedia = globalThis.matchMedia
}

beforeEach(() => {
  mockPrefersDark(false)
})

afterEach(() => {
  document.documentElement.className = ''
  document.body.className = ''
  document.documentElement.style.colorScheme = ''
})

describe('applyAppTheme', () => {
  it('applies dark', () => {
    applyAppTheme('dark')
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true)
    expect(document.body.classList.contains('light-theme')).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('applies light', () => {
    applyAppTheme('dark')
    applyAppTheme('light')
    expect(document.documentElement.classList.contains('light-theme')).toBe(true)
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false)
    expect(document.body.classList.contains('light-theme')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('auto follows system preference', () => {
    mockPrefersDark(true)
    applyAppTheme('auto')
    expect(document.body.classList.contains('dark-theme')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('light dark')

    mockPrefersDark(false)
    applyAppTheme('auto')
    expect(document.body.classList.contains('light-theme')).toBe(true)
  })
})

describe('setAppTheme', () => {
  it('persists, applies and notifies', () => {
    const handler = vi.fn()
    window.addEventListener(THEME_CHANGE_EVENT, handler)
    setAppTheme('dark')
    window.removeEventListener(THEME_CHANGE_EVENT, handler)
    expect(settingsStorage.getTheme()).toBe('dark')
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true)
    expect(handler).toHaveBeenCalledTimes(1)
    expect((handler.mock.calls[0][0] as CustomEvent).detail).toBe('dark')
  })

  it('swallows dirty event failure', () => {
    const real = window.dispatchEvent.bind(window)
    vi.spyOn(window, 'dispatchEvent').mockImplementation((e: Event) => {
      if (e.type === 'rm-progress-changed') throw new Error('x')
      return real(e)
    })
    expect(() => setAppTheme('light')).not.toThrow()
  })
})
