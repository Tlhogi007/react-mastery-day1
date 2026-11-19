import { test, expect } from '@playwright/test'
import {
  enterLab,
  markDayComplete,
  overallPercent,
  readLocalProgress,
  seedOnboarding,
  signInE2E,
  signOutE2E,
  waitForUserDataPut,
} from './helpers'
import { loadRepoEnv } from './loadEnv'

loadRepoEnv()

test.describe('Signed-in progress + cloud sync', () => {
  test.describe.configure({ mode: 'serial' })

  test('anonymous progress survives sign-in and syncs to cloud', async ({ page }) => {
    await enterLab(page, { fresh: true })
    await markDayComplete(page)
    await expect(overallPercent(page)).toHaveText('14%')
    expect((await readLocalProgress(page)).completedDays).toContain(1)

    // Capture PUT during sign-in sync (UserCloudSync)
    const putPromise = waitForUserDataPut(page, 30_000)
    await signInE2E(page)
    const put = await putPromise
    expect(put.status(), `user-data PUT status`).toBe(200)

    // Local progress must not be wiped by sign-in merge
    expect((await readLocalProgress(page)).completedDays).toContain(1)

    await enterLab(page, { fresh: false })
    await expect(overallPercent(page)).not.toHaveText('0%')
  })

  test('signed-in mark complete pushes /api/user-data', async ({ page }) => {
    await seedOnboarding(page)
    await signInE2E(page)
    await enterLab(page, { fresh: false })

    // Reset day completion so Mark complete is available
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
    await expect(page.getByRole('button', { name: /Mark complete/i })).toBeVisible({
      timeout: 15_000,
    })

    const putPromise = waitForUserDataPut(page, 30_000)
    await markDayComplete(page)
    const put = await putPromise
    expect(put.ok()).toBe(true)

    expect((await readLocalProgress(page)).completedDays).toContain(1)
    await expect(overallPercent(page)).toHaveText('14%')
  })

  test('logout → clear local → sign-in restores cloud progress', async ({ page }) => {
    await seedOnboarding(page)
    await signInE2E(page)
    await enterLab(page, { fresh: false })

    // Guarantee day 1 is complete locally + pushed (reset then mark if needed)
    const local = await readLocalProgress(page)
    if (!local.completedDays.includes(1)) {
      const put = waitForUserDataPut(page, 30_000)
      await markDayComplete(page)
      await put
    } else {
      // Already complete from prior test — force one more PUT of current snapshot
      const put = waitForUserDataPut(page, 30_000)
      await page.evaluate(() => {
        const raw = localStorage.getItem('react-mastery-progress')
        const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
        parsed.currentStreak = Number(parsed.currentStreak || 0) + 0
        localStorage.setItem('react-mastery-progress', JSON.stringify(parsed))
      })
      // Bump App progressEpoch by toggling mark path via storage event + reload
      await page.reload()
      await put.catch(() => undefined)
      // Reload triggers syncUserCloudOnSignIn once per user — that PUT is enough
    }

    expect((await readLocalProgress(page)).completedDays).toContain(1)

    await signOutE2E(page)

    await page.evaluate(() => {
      localStorage.removeItem('react-mastery-progress')
      sessionStorage.clear()
      localStorage.setItem(
        'react-mastery-settings',
        JSON.stringify({ onboardingComplete: true, theme: 'light' }),
      )
    })
    expect((await readLocalProgress(page)).completedDays).not.toContain(1)

    // Sign-in merge should rehydrate from cloud (client merge + PUT)
    await signInE2E(page)
    // Remount sync effects cleanly after testing sign-in
    await page.reload()
    await expect
      .poll(async () => (await readLocalProgress(page)).completedDays.includes(1), {
        timeout: 45_000,
      })
      .toBe(true)

    await enterLab(page, { fresh: false })
    await expect(overallPercent(page)).not.toHaveText('0%')
    await expect(page.getByRole('button', { name: /^Completed$/i })).toBeVisible({
      timeout: 10_000,
    })
  })
})
