import { test, expect } from '@playwright/test'
import { enterLab } from './helpers'

/**
 * Local bank must not re-serve the same question ids after they were answered
 * (no -duplicate- clones).
 */
test.describe('Local quiz no-repeat', () => {
  test('More Local Questions excludes already-answered ids', async ({ page }) => {
    await enterLab(page)

    await page.getByRole('tab', { name: /^Quiz$/i }).click()
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)\d+/i)).toBeVisible({
      timeout: 10_000,
    })

    const seenIds: string[] = []

    for (let i = 0; i < 3; i++) {
      const qText = (await page.locator('h3, h2, .quiz-question').first().textContent())?.trim()
      expect(qText).toBeTruthy()

      const id = await page.evaluate(() => {
        // Prefer data attribute if present; fall back to history last entry after answer
        return null as string | null
      })

      await page.locator('.quiz-option').first().click()
      // Capture id from question history after answer
      const answeredId = await page.evaluate(() => {
        try {
          const raw = localStorage.getItem('react-mastery-question-history')
          if (!raw) return null
          const entries = JSON.parse(raw) as [string, { questionId: string }][]
          if (!Array.isArray(entries) || entries.length === 0) return null
          return entries[entries.length - 1]?.[0] || entries[entries.length - 1]?.[1]?.questionId || null
        } catch {
          return null
        }
      })
      if (answeredId) seenIds.push(answeredId)
      void id

      if (i < 2) {
        await page.getByRole('button', { name: /Next Question/i }).click()
        await expect(
          page.getByText(new RegExp(`Question\\s+${i + 2}(?:\\s+of\\s+|\\/)\\d+`, 'i')),
        ).toBeVisible({
          timeout: 5_000,
        })
      } else {
        await page.getByRole('button', { name: /Next Question/i }).click()
      }
    }

    // Prompt after 3 questions
    await expect(page.getByText(/Want more questions/i)).toBeVisible({ timeout: 8_000 })
    await page.getByRole('button', { name: /^Local questions$/i }).click()
    await expect(page.getByText(/How many local/i)).toBeVisible({ timeout: 5_000 })
    await page.getByRole('radio', { name: '5', exact: true }).click()
    await page.getByRole('button', { name: /Continue with 5/i }).click()

    // Wait until prompt closes / next question shows (or exhausted message)
    const exhausted = page.getByText(/No new local questions left/i)
    const nextQ = page.getByText(/Question\s+\d+(?:\s+of\s+|\/)\d+/i)
    await expect(exhausted.or(nextQ)).toBeVisible({ timeout: 10_000 })

    if (await exhausted.isVisible().catch(() => false)) {
      // Bank smaller than request — still a valid no-repeat outcome
      return
    }

    // Answer one more and ensure its id is not in seenIds and not a duplicate clone
    await page.locator('.quiz-option').first().click()
    const newId = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('react-mastery-question-history')
        if (!raw) return null
        const entries = JSON.parse(raw) as [string, { questionId: string }][]
        return entries[entries.length - 1]?.[0] || null
      } catch {
        return null
      }
    })

    expect(newId).toBeTruthy()
    expect(newId).not.toMatch(/-duplicate-/i)
    expect(seenIds).not.toContain(newId!)
  })
})
