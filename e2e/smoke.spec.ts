import { test, expect } from '@playwright/test'
import {
  dismissIntroIfPresent,
  enterLab,
  markDayComplete,
  overallPercent,
  readLocalProgress,
  readLocalSettings,
  seedOnboarding,
  signInE2E,
  signOutE2E,
  waitForUserDataPut,
} from './helpers'
import { loadRepoEnv } from './loadEnv'

loadRepoEnv()

/**
 * Launch smoke — critical path only.
 *
 * Local (default): Vite on :5173
 *   npm run test:e2e:smoke
 *
 * Production / preview:
 *   BASE_URL=https://react-mastery-day1.vercel.app npm run test:e2e:smoke
 *
 * Note: prod Bot Protection may challenge automation; prefer local or a
 * protection-bypass URL when needed.
 */
test.describe('Launch smoke', () => {
  test.describe.configure({ mode: 'serial' })

  test('intro → lab → sign-in → complete → theme → restore', async ({ page }) => {
    // 1) Fresh landing + intro (stays until Continue)
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.reload()

    const intro = page.getByRole('dialog', { name: /Welcome/i })
    await expect(intro).toBeVisible({ timeout: 15_000 })
    await expect(intro.getByText(/React Mastery/i)).toBeVisible()
    await expect(intro.getByRole('button', { name: /^Continue$/i })).toBeVisible()
    await dismissIntroIfPresent(page)
    await expect(intro).toBeHidden()

    // 2) Landing CTAs
    await expect(page.getByRole('button', { name: /Start Day 1/i }).first()).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByRole('button', { name: /Support/i })).toBeVisible()

    // 3) Enter lab (skip guided tour)
    await seedOnboarding(page)
    await enterLab(page, { fresh: false })
    await expect(page.getByText(/Rendering Pipeline/i).first()).toBeVisible()

    // 4) Sign in + cloud sync available
    const putOnSignIn = waitForUserDataPut(page, 45_000)
    await signInE2E(page)
    await putOnSignIn.catch(() => undefined)
    await enterLab(page, { fresh: false })

    // 5) Mark Day 1 complete (reset first if already done from prior runs)
    const already = (await readLocalProgress(page)).completedDays.includes(1)
    if (already) {
      await page.evaluate(() => {
        localStorage.setItem(
          'react-mastery-progress',
          JSON.stringify({
            completedDays: [],
            completedQuizzes: {},
            currentStreak: 0,
            lastActivityDate: '',
            quizScores: {},
          }),
        )
        window.dispatchEvent(new CustomEvent('rm-progress-changed'))
      })
      await page.reload()
      await enterLab(page, { fresh: false })
    }

    const putComplete = waitForUserDataPut(page, 45_000)
    await markDayComplete(page)
    await putComplete
    expect((await readLocalProgress(page)).completedDays).toContain(1)
    await expect(overallPercent(page)).not.toHaveText('0%')

    // 6) Theme toggle (header) → dark classes on <html>
    const themeBtn = page.locator('[data-tutorial="theme"] button')
    await expect(themeBtn).toBeVisible()
    // Cycle until dark (auto → light → dark)
    for (let i = 0; i < 3; i++) {
      const isDark = await page.evaluate(() =>
        document.documentElement.classList.contains('dark-theme'),
      )
      if (isDark) break
      const putTheme = waitForUserDataPut(page, 30_000)
      await themeBtn.click()
      await putTheme.catch(() => undefined)
    }
    await expect
      .poll(
        async () =>
          page.evaluate(() => document.documentElement.classList.contains('dark-theme')),
        { timeout: 15_000 },
      )
      .toBe(true)
    expect((await readLocalSettings(page)).theme).toBe('dark')

    // 7) Settings modal opens
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('rm-open-settings')))
    await expect(page.getByRole('dialog', { name: /Settings/i })).toBeVisible({
      timeout: 10_000,
    })
    await page.getByRole('button', { name: /Close settings/i }).click()
    await expect(page.getByRole('dialog', { name: /Settings/i })).toBeHidden()

    // 8) Sign out → wipe device → sign-in restores progress + theme
    await signOutE2E(page)
    await page.evaluate(() => {
      localStorage.removeItem('react-mastery-progress')
      localStorage.setItem(
        'react-mastery-settings',
        JSON.stringify({
          onboardingComplete: true,
          theme: 'light',
          studyMode: false,
          updatedAt: new Date(0).toISOString(),
        }),
      )
      sessionStorage.clear()
    })
    expect((await readLocalProgress(page)).completedDays).not.toContain(1)
    expect((await readLocalSettings(page)).theme).toBe('light')

    await signInE2E(page)
    await page.reload()

    await expect
      .poll(async () => (await readLocalProgress(page)).completedDays.includes(1), {
        timeout: 45_000,
      })
      .toBe(true)
    await expect
      .poll(async () => (await readLocalSettings(page)).theme, { timeout: 30_000 })
      .toBe('dark')
  })
})
