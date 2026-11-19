import * as Sentry from '@sentry/react'

const DSN = import.meta.env.VITE_SENTRY_DSN || ''

export type AppView = 'landing' | 'exercises' | 'tools' | 'community' | 'settings' | 'support'

export function initSentry(): void {
  if (!DSN) return

  // Dev Fast Refresh / Vite restarts flood Sentry with false positives (hook queues,
  // mid-HMR ReferenceErrors, dynamic import failures). Opt in with VITE_SENTRY_ENABLE_DEV=1.
  const enableInDev = import.meta.env.VITE_SENTRY_ENABLE_DEV === '1'
  const enabled = Boolean(DSN) && (import.meta.env.PROD || enableInDev)

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    release: typeof __APP_VERSION__ !== 'undefined' ? `react-mastery@${__APP_VERSION__}` : undefined,
    sendDefaultPii: false,
    enabled,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    tracePropagationTargets: [/^\//, /localhost/, /react-mastery-day1\.vercel\.app/],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    enableLogs: true,
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'AbortError',
      'Non-Error promise rejection captured',
      /^Failed to fetch$/,
      /Failed to fetch dynamically imported module/,
      /Importing a module script failed/i,
      /Loading chunk [\d]+ failed/,
      /ChunkLoadError/,
      /Failed to load Clerk JS/i,
      /failed_to_load_clerk_js/i,
      /Should have a queue/i,
    ],
    beforeSend(event) {
      const message = event.message || event.exception?.values?.[0]?.value || ''
      if (typeof message !== 'string') return event

      // Drop SDK setup noise — AI upstream failures use captureWarning
      if (
        message.includes('Sentry setup verification') ||
        message.includes('client SDK verification') ||
        message.includes('AI proxy ') ||
        message.includes('Should have a queue') ||
        /Failed to load Clerk JS/i.test(message) ||
        /failed_to_load_clerk_js/i.test(message) ||
        /Importing a module script failed/i.test(message)
      ) {
        return null
      }

      const frames =
        event.exception?.values?.flatMap((v) => v.stacktrace?.frames || []) || []
      const isViteHmr = frames.some((f) => {
        const file = f.filename || ''
        const fn = f.function || ''
        return (
          file.includes('@react-refresh') ||
          fn.includes('performReactRefresh') ||
          fn.includes('scheduleRefresh')
        )
      })
      if (isViteHmr) return null

      return event
    },
  })
}

/** Persist navigation context so every alert email includes day/view. */
export function setAppContext(partial: {
  view?: AppView
  day?: number | null
  exercise?: string | null
  week?: number | null
}): void {
  if (!DSN) return

  if (partial.view) Sentry.setTag('app.view', partial.view)

  if (partial.day === null) {
    Sentry.setTag('app.day', 'none')
  } else if (partial.day != null) {
    Sentry.setTag('app.day', String(partial.day))
  }

  if (partial.exercise === null) {
    Sentry.setTag('app.exercise', 'none')
  } else if (partial.exercise) {
    Sentry.setTag('app.exercise', partial.exercise)
  }

  if (partial.week === null) {
    Sentry.setTag('app.week', 'none')
  } else if (partial.week != null) {
    Sentry.setTag('app.week', String(partial.week))
  }

  Sentry.setContext('app', {
    view: partial.view,
    day: partial.day ?? undefined,
    exercise: partial.exercise ?? undefined,
    week: partial.week ?? undefined,
  })
}

export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
  tags?: Record<string, string>,
): void {
  if (!DSN) return

  Sentry.withScope((scope) => {
    if (tags) {
      for (const [key, value] of Object.entries(tags)) {
        scope.setTag(key, value)
      }
    }
    if (context) {
      scope.setExtras(context)
    }
    Sentry.captureException(error)
  })
}

/**
 * Track expected/operational failures (AI upstream, rate limits) without error-level alerts.
 * Configure Sentry email alerts for "error/fatal" only so these stay in the dashboard.
 */
export function captureWarning(
  error: unknown,
  context?: Record<string, unknown>,
  tags?: Record<string, string>,
): void {
  if (!DSN) return

  Sentry.withScope((scope) => {
    scope.setLevel('warning')
    if (tags) {
      for (const [key, value] of Object.entries(tags)) {
        scope.setTag(key, value)
      }
    }
    scope.setTag('severity', 'warning')
    if (context) {
      scope.setExtras(context)
    }
    // Stable grouping so retries don't explode into many issues
    const fingerprintKey =
      tags?.['ai.provider'] || tags?.feature || tags?.['quiz.action'] || 'warning'
    scope.setFingerprint(['warning', fingerprintKey, String(error)])
    Sentry.captureException(error)
  })
}

export { Sentry }
