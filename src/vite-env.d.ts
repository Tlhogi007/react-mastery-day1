/// <reference types="vite/client" />

declare const __APP_VERSION__: string
declare const __APP_AUTHOR__: string

interface ImportMetaEnv {
  readonly VITE_CONTENT_REPO_URL?: string
  readonly VITE_GA_TRACKING_ID?: string
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
