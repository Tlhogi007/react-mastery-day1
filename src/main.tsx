import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { ThemedClerkProvider } from './components/ThemedClerkProvider.tsx'
import { initSentry } from './lib/sentry'

initSentry()

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {clerkPubKey ? (
        <ThemedClerkProvider publishableKey={clerkPubKey}>
          <App />
        </ThemedClerkProvider>
      ) : (
        <App />
      )}
    </ErrorBoundary>
  </StrictMode>,
)
