import { describe, expect, it, vi } from 'vitest'
import { settingsStorage } from './settingsStorage'

const KEY = 'react-mastery-settings'

describe('settingsStorage', () => {
  it('returns defaults when nothing stored', () => {
    expect(settingsStorage.getSettings()).toEqual({
      theme: 'auto',
      onboardingComplete: false,
      studyMode: false,
    })
  })

  it('merges stored partial settings with defaults', () => {
    localStorage.setItem(KEY, JSON.stringify({ theme: 'dark' }))
    expect(settingsStorage.getSettings()).toEqual({
      theme: 'dark',
      onboardingComplete: false,
      studyMode: false,
    })
  })

  it('falls back to defaults and warns on corrupt JSON', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem(KEY, '{nope')
    expect(settingsStorage.getSettings().theme).toBe('auto')
    expect(warn).toHaveBeenCalled()
  })

  it('saveSettings stamps updatedAt by default and skips with touch:false', () => {
    settingsStorage.saveSettings({ theme: 'light' })
    expect(JSON.parse(localStorage.getItem(KEY)!).updatedAt).toEqual(expect.any(String))

    localStorage.clear()
    settingsStorage.saveSettings({ theme: 'light' }, { touch: false })
    expect(JSON.parse(localStorage.getItem(KEY)!).updatedAt).toBeUndefined()
  })

  it('warns when setItem throws', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    settingsStorage.saveSettings({ theme: 'dark' })
    expect(warn).toHaveBeenCalled()
  })

  it('get/set theme', () => {
    settingsStorage.setTheme('dark')
    expect(settingsStorage.getTheme()).toBe('dark')
  })

  it('onboarding flag and dirty event', () => {
    const spy = vi.fn()
    window.addEventListener('rm-progress-changed', spy)
    expect(settingsStorage.hasCompletedOnboarding()).toBe(false)
    settingsStorage.setOnboardingComplete()
    expect(settingsStorage.hasCompletedOnboarding()).toBe(true)
    settingsStorage.setOnboardingComplete(false)
    expect(settingsStorage.hasCompletedOnboarding()).toBe(false)
    expect(spy).toHaveBeenCalledTimes(2)
    window.removeEventListener('rm-progress-changed', spy)
  })

  it('study mode flag and dirty event', () => {
    const spy = vi.fn()
    window.addEventListener('rm-progress-changed', spy)
    expect(settingsStorage.getStudyMode()).toBe(false)
    settingsStorage.setStudyMode(true)
    expect(settingsStorage.getStudyMode()).toBe(true)
    expect(spy).toHaveBeenCalledTimes(1)
    window.removeEventListener('rm-progress-changed', spy)
  })

  it('swallows dispatchEvent failures', () => {
    vi.spyOn(window, 'dispatchEvent').mockImplementation(() => {
      throw new Error('boom')
    })
    expect(() => settingsStorage.setStudyMode(true)).not.toThrow()
  })

  it('applyCloudSettings merges without touching updatedAt', () => {
    const next = settingsStorage.applyCloudSettings({
      theme: 'dark',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(next.theme).toBe('dark')
    expect(JSON.parse(localStorage.getItem(KEY)!).updatedAt).toBe('2026-01-01T00:00:00.000Z')
  })

  it('clearSettings removes key and warns on failure', () => {
    settingsStorage.setTheme('dark')
    settingsStorage.clearSettings()
    expect(localStorage.getItem(KEY)).toBeNull()

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('x')
    })
    settingsStorage.clearSettings()
    expect(warn).toHaveBeenCalled()
  })
})
