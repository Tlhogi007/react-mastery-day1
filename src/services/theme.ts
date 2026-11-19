import { settingsStorage } from './settingsStorage'

export type AppTheme = 'light' | 'dark' | 'auto'

export const THEME_CHANGE_EVENT = 'react-mastery-theme-change'

/** Apply light/dark/auto classes on <html> and <body> (matches CSS in index.css). */
export function applyAppTheme(theme: AppTheme): void {
  const root = document.documentElement
  const body = document.body
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const useDark = theme === 'dark' || (theme === 'auto' && prefersDark)

  if (theme === 'light') {
    root.style.colorScheme = 'light'
  } else if (theme === 'dark') {
    root.style.colorScheme = 'dark'
  } else {
    root.style.colorScheme = 'light dark'
  }

  if (useDark) {
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

/** Persist preference, apply DOM classes, and notify other UI (Settings / header toggle). */
export function setAppTheme(theme: AppTheme): void {
  settingsStorage.setTheme(theme)
  applyAppTheme(theme)
  window.dispatchEvent(new CustomEvent<AppTheme>(THEME_CHANGE_EVENT, { detail: theme }))
  try {
    window.dispatchEvent(new CustomEvent('rm-progress-changed'))
  } catch {
    /* ignore */
  }
}
