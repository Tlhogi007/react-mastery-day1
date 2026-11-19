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

/**
 * Cross-device live sync: two browser contexts = phone + laptop.
 * Device A pushes; device B must pick up via pull poll (no reload).
 */
test.describe('Live cross-device sync', () => {
  test.describe.configure({ mode: 'serial' })

  test('live day % from device A appears on device B via poll', async ({ browser }) => {
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

      // Clear any prior live overlay on both
      await phonePage.evaluate(() => localStorage.removeItem('rm-live-day-progress'))
      await laptopPage.evaluate(() => localStorage.removeItem('rm-live-day-progress'))

      await pushLiveProgress(phonePage, 1, 42)

      await expect
        .poll(async () => (await readLiveProgress(laptopPage))?.percent ?? null, {
          timeout: 20_000,
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
        // Re-push current snapshot so laptop poll has a fresh cloud updatedAt
        const put = waitForUserDataPut(phonePage, 30_000)
        await pushLiveProgress(phonePage, 1, 10)
        await put.catch(() => undefined)
        // Also ensure completed day is in the pushed progress
        await phonePage.evaluate(() => {
          window.dispatchEvent(new CustomEvent('rm-progress-changed'))
        })
        await waitForUserDataPut(phonePage, 15_000).catch(() => undefined)
      }

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
