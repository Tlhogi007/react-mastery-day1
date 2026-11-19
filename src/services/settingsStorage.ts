/**
 * Service for managing user settings in localStorage
 */

export interface SettingsData {
  theme: 'light' | 'dark' | 'auto'
  onboardingComplete?: boolean
  studyMode?: boolean
  /** ISO time of last prefs change — used for cloud last-write-wins */
  updatedAt?: string
}

const STORAGE_KEY = 'react-mastery-settings'
const DEFAULT_SETTINGS: SettingsData = {
  theme: 'auto',
  onboardingComplete: false,
  studyMode: false,
}

function bumpCloudDirty(): void {
  try {
    window.dispatchEvent(new CustomEvent('rm-progress-changed'))
  } catch {
    /* ignore */
  }
}

class SettingsStorage {
  /**
   * Get settings from localStorage
   */
  getSettings(): SettingsData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<SettingsData>
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
        }
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error)
    }
    return { ...DEFAULT_SETTINGS }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings(settings: SettingsData, opts?: { touch?: boolean }): void {
    try {
      const next = { ...settings }
      if (opts?.touch !== false) {
        next.updatedAt = new Date().toISOString()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error)
    }
  }

  /**
   * Get theme preference
   */
  getTheme(): 'light' | 'dark' | 'auto' {
    return this.getSettings().theme
  }

  /**
   * Set theme preference
   */
  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    const settings = this.getSettings()
    settings.theme = theme
    this.saveSettings(settings)
  }

  hasCompletedOnboarding(): boolean {
    return Boolean(this.getSettings().onboardingComplete)
  }

  setOnboardingComplete(complete = true): void {
    const settings = this.getSettings()
    settings.onboardingComplete = complete
    this.saveSettings(settings)
    bumpCloudDirty()
  }

  getStudyMode(): boolean {
    return Boolean(this.getSettings().studyMode)
  }

  setStudyMode(enabled: boolean): void {
    const settings = this.getSettings()
    settings.studyMode = enabled
    this.saveSettings(settings)
    bumpCloudDirty()
  }

  /**
   * Replace settings from cloud restore (preserves unknown future keys via spread).
   * Does not bump updatedAt — cloud stamp wins.
   */
  applyCloudSettings(partial: Partial<SettingsData>): SettingsData {
    const next: SettingsData = {
      ...this.getSettings(),
      ...partial,
    }
    this.saveSettings(next, { touch: false })
    return next
  }

  /**
   * Clear all settings (for testing/reset)
   */
  clearSettings(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear settings:', error)
    }
  }
}

export const settingsStorage = new SettingsStorage()
