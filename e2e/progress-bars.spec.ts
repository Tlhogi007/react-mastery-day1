import { test, expect } from '@playwright/test'
import { enterLab, markDayComplete, overallPercent } from './helpers'

function heroPercent(page: Parameters<typeof overallPercent>[0]) {
  return page.locator('.hero-section__progress span').filter({ hasText: /%$/ }).first()
}

test.describe('Progress bars during quiz (anonymous)', () => {
  test('mid-quiz should move day + overall progress off 0%', async ({ page }) => {
    await enterLab(page)
    await expect(overallPercent(page)).toHaveText('0%')

    await page.getByRole('tab', { name: /^Quiz$/i }).click()
    await expect(page.getByText(/Question\s+1\s+of/i)).toBeVisible({ timeout: 10_000 })

    await expect
      .poll(async () => page.evaluate(() => sessionStorage.getItem('rm-live-day-progress')), {
        timeout: 5_000,
      })
      .toBeTruthy()

    await page.locator('.quiz-option').first().click()
    await expect
      .poll(async () => {
        const raw = await page.evaluate(() => sessionStorage.getItem('rm-live-day-progress'))
        return raw ? (JSON.parse(raw) as { percent: number }).percent : 0
      })
      .toBeGreaterThan(1)

    await page.getByRole('button', { name: /Next Question/i }).click()
    await expect(page.getByText(/Question\s+2\s+of/i)).toBeVisible({ timeout: 5_000 })

    const overallText = (await overallPercent(page).textContent())?.trim() ?? ''
    expect(overallText).not.toBe('0%')

    if (await page.locator('.hero-section').isVisible()) {
      const heroText = (await heroPercent(page).textContent())?.trim() ?? ''
      expect(heroText).not.toBe('0%')
    }
  })

  test('Mark complete should bump overall progress', async ({ page }) => {
    await enterLab(page)
    await expect(overallPercent(page)).toHaveText('0%')
    await markDayComplete(page)
    const overallText = (await overallPercent(page).textContent())?.trim()
    expect(overallText).not.toBe('0%')
  })
})
