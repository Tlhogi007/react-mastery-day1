import { useEffect, useMemo, useState, type JSX, type ReactNode } from 'react'
import { ClerkProvider } from '@clerk/react'
import { ui } from '@clerk/ui'
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

  // Only production (pk_live_) needs /__clerk — vercel.app cannot CNAME clerk.*.
  // Development keys use accounts.dev and must not go through the FAPI proxy.
  // Proxy must be a same-origin relative path (never an absolute URL).
  const envProxy = (import.meta.env.VITE_CLERK_PROXY_URL as string | undefined)?.trim()
  const proxyUrl =
    envProxy && envProxy.startsWith('/') && !envProxy.startsWith('//')
      ? envProxy
      : publishableKey.startsWith('pk_live_')
        ? '/__clerk'
        : undefined

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      ui={ui}
      {...(proxyUrl ? { proxyUrl } : {})}
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      // Hash-free query marker so remount opens landing (not a stale lab session).
      // `/#rm=landing` broke the next Sign in (Clerk rejects fragment redirect URLs).
      afterSignOutUrl="/?rm=landing"
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
