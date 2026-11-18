/**
 * Service for managing user settings in localStorage
 */

export interface SettingsData {
  theme: 'light' | 'dark' | 'auto'
  // Add more settings here as needed
}

const STORAGE_KEY = 'react-mastery-settings'
const DEFAULT_SETTINGS: SettingsData = {
  theme: 'auto'
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
          ...parsed
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
  saveSettings(settings: SettingsData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
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
