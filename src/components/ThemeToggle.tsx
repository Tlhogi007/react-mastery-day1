/**
 * Theme Toggle Button Component
 * Single Responsibility: Toggle between light/dark themes manually
 */

import { useState, useEffect, type JSX } from 'react'
import { settingsStorage } from '../services/settingsStorage'
import { tracking } from '../lib/googleAnalytics'

interface ThemeToggleProps {
  className?: string
}

function ThemeToggle({ className }: ThemeToggleProps): JSX.Element {
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
      title={getTitle()}
      aria-label={getTitle()}
      style={{
        padding: '8px 12px',
        background: 'var(--bg-section)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        minWidth: '44px',
        height: '44px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-tertiary)'
        e.currentTarget.style.transform = 'scale(1.05)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--bg-section)'
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      {getIcon()}
    </button>
  )
}

export default ThemeToggle
