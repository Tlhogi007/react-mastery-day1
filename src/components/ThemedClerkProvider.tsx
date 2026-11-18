import { useEffect, useMemo, useState, type JSX, type ReactNode } from 'react'
import { ClerkProvider } from '@clerk/react'
import {
  getClerkAppearance,
  resolveAppColorMode,
  type AppColorMode,
} from '../services/clerkAppearance'

interface ThemedClerkProviderProps {
  publishableKey: string
  children: ReactNode
}

/**
 * ClerkProvider that re-applies appearance when the app light/dark theme changes.
 * Theme is driven by `.light-theme` / `.dark-theme` on <html> (see ThemeToggle).
 */
export function ThemedClerkProvider({
  publishableKey,
  children,
}: ThemedClerkProviderProps): JSX.Element {
  const [mode, setMode] = useState<AppColorMode>(() => resolveAppColorMode())

  useEffect(() => {
    const sync = () => setMode(resolveAppColorMode())
    sync()

    const root = document.documentElement
    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', sync)

    return () => {
      observer.disconnect()
      media.removeEventListener('change', sync)
    }
  }, [])

  const appearance = useMemo(() => getClerkAppearance(mode), [mode])

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      localization={{
        signIn: {
          start: {
            title: 'Sign in to\nReact Mastery',
            titleCombined: 'Sign in to\nReact Mastery',
          },
        },
        signUp: {
          start: {
            title: 'Create your\nReact Mastery account',
            titleCombined: 'Create your\nReact Mastery account',
          },
        },
      }}
      appearance={appearance}
    >
      {children}
    </ClerkProvider>
  )
}
