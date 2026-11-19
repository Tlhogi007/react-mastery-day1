import { test, expect } from '@playwright/test'
import {
  enterLab,
  markDayComplete,
  overallPercent,
  pushLiveProgress,
  readLiveProgress,
  readLocalProgress,
  seedOnboarding,
  signInE2E,
  waitForUserDataPut,
} from './helpers'
import { loadRepoEnv } from './loadEnv'

loadRepoEnv()

/** Force a cloud pull (bypasses the 5m visibility throttle). */
async function forceCloudPull(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => {
    window.dispatchEvent(new Event('online'))
  })
}

/**
 * Cross-device live sync: two browser contexts = phone + laptop.
 * Device A pushes; device B picks up via return-to-tab / online pull (no idle poll).
 */
test.describe('Live cross-device sync', () => {
  test.describe.configure({ mode: 'serial' })

  test('live day % from device A appears on device B via pull', async ({ browser }) => {
    const phone = await browser.newContext()
    const laptop = await browser.newContext()
    const phonePage = await phone.newPage()
    const laptopPage = await laptop.newPage()

    try {
      await seedOnboarding(phonePage)
      await seedOnboarding(laptopPage)
      await signInE2E(phonePage)
      await signInE2E(laptopPage)

      await enterLab(phonePage, { fresh: false })
      await enterLab(laptopPage, { fresh: false })

      // Clear stale cloud live % from earlier suites, then set 42.
      await pushLiveProgress(phonePage, 1, null)
      await laptopPage.evaluate(() => localStorage.removeItem('rm-live-day-progress'))
      await pushLiveProgress(phonePage, 1, 42)

      // Prefer reload pull (sign-in sync) — online pull can race the 5m throttle path.
      await laptopPage.reload()
      await enterLab(laptopPage, { fresh: false })
      await forceCloudPull(laptopPage)

      await expect
        .poll(async () => (await readLiveProgress(laptopPage))?.percent ?? null, {
          timeout: 25_000,
          intervals: [500, 1000, 2000],
        })
        .toBe(42)

      await expect(overallPercent(laptopPage)).not.toHaveText('0%')
    } finally {
      await phone.close()
      await laptop.close()
    }
  })

  test('mark complete on device A updates device B without reload', async ({ browser }) => {
    const phone = await browser.newContext()
    const laptop = await browser.newContext()
    const phonePage = await phone.newPage()
    const laptopPage = await laptop.newPage()

    try {
      await seedOnboarding(phonePage)
      await seedOnboarding(laptopPage)
      await signInE2E(phonePage)
      await signInE2E(laptopPage)

      await enterLab(phonePage, { fresh: false })
      await enterLab(laptopPage, { fresh: false })

      // Cloud merge is additive — wipe laptop local only, then phone pushes day 1
      await laptopPage.evaluate(() => {
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
        localStorage.removeItem('rm-live-day-progress')
        window.dispatchEvent(new CustomEvent('rm-progress-changed'))
      })

      const alreadyDone = (await readLocalProgress(phonePage)).completedDays.includes(1)
      if (!alreadyDone) {
        const put = waitForUserDataPut(phonePage, 30_000)
        await markDayComplete(phonePage)
        await put
      } else {
        const put = waitForUserDataPut(phonePage, 30_000)
        await pushLiveProgress(phonePage, 1, 10)
        await put.catch(() => undefined)
        await phonePage.evaluate(() => {
          window.dispatchEvent(new CustomEvent('rm-progress-changed'))
        })
        await waitForUserDataPut(phonePage, 15_000).catch(() => undefined)
      }

      await forceCloudPull(laptopPage)

      await expect
        .poll(async () => (await readLocalProgress(laptopPage)).completedDays.includes(1), {
          timeout: 25_000,
          intervals: [500, 1000, 2000],
        })
        .toBe(true)

      await expect(laptopPage.getByRole('button', { name: /^Completed$/i })).toBeVisible({
        timeout: 10_000,
      })
      await expect(overallPercent(laptopPage)).not.toHaveText('0%')
    } finally {
      await phone.close()
      await laptop.close()
    }
  })
})
