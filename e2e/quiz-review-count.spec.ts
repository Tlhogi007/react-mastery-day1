import { test, expect } from '@playwright/test'
import { enterLab } from './helpers'

async function dismissMorePrompt(page: import('@playwright/test').Page): Promise<void> {
  if (await page.getByText(/Want More Questions/i).isVisible().catch(() => false)) {
    await page
      .getByRole('button', { name: /Skip — finish remaining|Continue with remaining/i })
      .click()
  }
}

async function finishLocalAiGate(page: import('@playwright/test').Page): Promise<boolean> {
  if (!(await page.getByText(/Local quiz done/i).isVisible().catch(() => false))) {
    return false
  }
  const none = page.getByRole('radio', { name: /^None$/i })
  if (await none.isVisible().catch(() => false)) {
    await none.click()
  }
  await page.getByRole('button', { name: /Finish quiz/i }).click()
  return true
}

test.describe('Quiz review count', () => {
  test('missed count matches score (wrong + skip)', async ({ page }) => {
    await enterLab(page)
    await page.getByRole('tab', { name: /^Quiz$/i }).click()
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)\d+/i)).toBeVisible({
      timeout: 10_000,
    })

    // Q1 answer
    await page.locator('.quiz-option').first().click()
    await page.getByRole('button', { name: /Next Question|Complete Local/i }).click()

    // Q2 skip
    await expect(page.getByRole('button', { name: /Skip/i })).toBeVisible({ timeout: 5_000 })
    await page.getByRole('button', { name: /Skip/i }).click()

    // Drain the rest of the local bank
    for (let i = 0; i < 30; i++) {
      if (await page.getByText(/Quiz Complete/i).isVisible().catch(() => false)) break
      await dismissMorePrompt(page)
      if (await finishLocalAiGate(page)) break

      const skip = page.getByRole('button', { name: /Skip question|^Skip$/i })
      if (await skip.isVisible().catch(() => false)) {
        await skip.click()
        continue
      }

      if (await page.locator('.quiz-option').first().isVisible().catch(() => false)) {
        await page.locator('.quiz-option').first().click()
        const next = page.getByRole('button', {
          name: /Next Question|Complete Local|Finish Quiz/i,
        })
        await expect(next).toBeVisible({ timeout: 5_000 })
        await next.click()
      }
    }

    await expect(page.getByText(/Quiz Complete/i)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/You missed\s+\d+/i)).toBeVisible()

    const summary = await page.evaluate(() => {
      const body = document.body.innerText
      const scoreMatch = body.match(/(\d+)\s*\/\s*(\d+)/)
      const missedMatch = body.match(/You missed\s+(\d+)/i)
      return {
        score: scoreMatch ? Number(scoreMatch[1]) : null,
        total: scoreMatch ? Number(scoreMatch[2]) : null,
        missedLabel: missedMatch ? Number(missedMatch[1]) : null,
      }
    })

    expect(summary.score).not.toBeNull()
    expect(summary.total).not.toBeNull()
    expect(summary.missedLabel).toBe((summary.total ?? 0) - (summary.score ?? 0))
  })
})
