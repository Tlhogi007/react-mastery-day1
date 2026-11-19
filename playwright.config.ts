import { defineConfig, devices } from '@playwright/test'
import { loadRepoEnv } from './e2e/loadEnv'

loadRepoEnv()

/**
 * Progress / auth / cloud e2e against local Vite (:5173).
 * Auth setup creates a Clerk testing token + ensures an e2e user exists.
 */
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5173'
const externalBase = Boolean(process.env.BASE_URL)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  timeout: 90_000,
  use: {
    // Override for prod/preview: BASE_URL=https://react-mastery-day1.vercel.app
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  // Local + CI: boot Vite unless hitting an external BASE_URL (prod/preview smoke).
  ...(externalBase
    ? {}
    : {
        webServer: {
          command: 'npm run dev -- --host 127.0.0.1 --port 5173',
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
})
