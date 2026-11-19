/**
 * Theme Toggle Button Component
 * Single Responsibility: Toggle between light/dark themes manually
 */

import { useState, useEffect, type JSX } from 'react'
import { settingsStorage } from '../services/settingsStorage'
import {
  applyAppTheme,
  setAppTheme,
  THEME_CHANGE_EVENT,
  type AppTheme,
} from '../services/theme'
import { tracking } from '../lib/googleAnalytics'

interface ThemeToggleProps {
  className?: string
  /** Square icon control for tight mobile headers */
  compact?: boolean
}

function ThemeToggle({ className, compact }: ThemeToggleProps): JSX.Element {
  const [theme, setTheme] = useState<AppTheme>(() => settingsStorage.getTheme())

  useEffect(() => {
    applyAppTheme(theme)

    if (theme !== 'auto') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (): void => applyAppTheme('auto')
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  useEffect(() => {
    const sync = (event: Event): void => {
      const next = (event as CustomEvent<AppTheme>).detail
      if (next === 'light' || next === 'dark' || next === 'auto') {
        setTheme(next)
      }
    }
    window.addEventListener(THEME_CHANGE_EVENT, sync)
    return () => window.removeEventListener(THEME_CHANGE_EVENT, sync)
  }, [])

  const toggleTheme = (): void => {
    const nextTheme: AppTheme =
      theme === 'auto' ? 'light' : theme === 'light' ? 'dark' : 'auto'

    setAppTheme(nextTheme)
    tracking.themeChanged(nextTheme)
  }

  const getIcon = (): string => {
    if (theme === 'light') return '☀️'
    if (theme === 'dark') return '🌙'
    return '💻' // Auto/system
  }

  const getTitle = (): string => {
    if (theme === 'light') return 'Light Mode (Click for Dark)'
    if (theme === 'dark') return 'Dark Mode (Click for Auto)'
    return 'Auto Theme (Click for Light)'
  }

  return (
    <button
      onClick={toggleTheme}
      className={className}
      aria-label={getTitle()}
      style={{
        padding: 0,
        width: compact ? 40 : 36,
        height: compact ? 40 : 36,
        minWidth: compact ? 40 : 36,
        background: 'transparent',
        border: '1px solid transparent',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: compact ? 15 : 15,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.15s ease',
        color: 'var(--text-secondary)',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-section)'
        e.currentTarget.style.color = 'var(--text-primary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--text-secondary)'
      }}
    >
      {getIcon()}
    </button>
  )
}

export default ThemeToggle
