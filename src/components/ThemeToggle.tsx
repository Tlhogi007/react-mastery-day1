/**
 * Theme Toggle Button Component
 * Single Responsibility: Toggle between light/dark themes manually
 */

import { useState, useEffect, type JSX } from 'react'
import { settingsStorage } from '../services/settingsStorage'
import { tracking } from '../lib/googleAnalytics'

interface ThemeToggleProps {
  className?: string
  /** Square icon control for tight mobile headers */
  compact?: boolean
}

function ThemeToggle({ className, compact }: ThemeToggleProps): JSX.Element {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(() => {
    return settingsStorage.getTheme()
  })

  useEffect(() => {
    // Apply theme on mount and when it changes
    const root = document.documentElement
    const body = document.body
    
    const applyTheme = (): void => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

      if (theme === 'light') {
        root.style.colorScheme = 'light'
        root.classList.add('light-theme')
        root.classList.remove('dark-theme')
        body.classList.add('light-theme')
        body.classList.remove('dark-theme')
      } else if (theme === 'dark') {
        root.style.colorScheme = 'dark'
        root.classList.add('dark-theme')
        root.classList.remove('light-theme')
        body.classList.add('dark-theme')
        body.classList.remove('light-theme')
      } else {
        // Auto mode - follow system preference
        root.style.colorScheme = 'light dark'
        if (prefersDark) {
          root.classList.add('dark-theme')
          root.classList.remove('light-theme')
          body.classList.add('dark-theme')
          body.classList.remove('light-theme')
        } else {
          root.classList.add('light-theme')
          root.classList.remove('dark-theme')
          body.classList.add('light-theme')
          body.classList.remove('dark-theme')
        }
      }
    }

    applyTheme()

    // Listen for system preference changes in auto mode
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (): void => {
        if (theme === 'auto') {
          applyTheme()
        }
      }
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  const toggleTheme = (): void => {
    // Cycle: auto -> light -> dark -> auto
    const nextTheme: 'light' | 'dark' | 'auto' = 
      theme === 'auto' ? 'light' : 
      theme === 'light' ? 'dark' : 'auto'
    
    setTheme(nextTheme)
    settingsStorage.setTheme(nextTheme)
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
