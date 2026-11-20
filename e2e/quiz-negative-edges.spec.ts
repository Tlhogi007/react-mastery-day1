import { test, expect, type Page } from '@playwright/test'
import { dismissIntroIfPresent, enterLab, markDayComplete, overallPercent } from './helpers'

const DAY1_IDS = ['day01-q1', 'day01-q2', 'day01-q3', 'day01-q4', 'day01-q5'] as const

type HistoryEntry = {
  questionId: string
  answeredCorrectly: boolean
  timestamp: number
  timeSpent: number
  attempts: number
  lastSeen: number
  difficulty?: string
  day?: number
}

function buildHistoryEntries(opts: {
  correctIds?: string[]
  incorrectIds?: string[]
}): [string, HistoryEntry][] {
  const correctIds = opts.correctIds ?? [...DAY1_IDS]
  const incorrectIds = opts.incorrectIds ?? []
  const now = Date.now()
  const entries: [string, HistoryEntry][] = []
  for (const id of correctIds) {
    entries.push([
      id,
      {
        questionId: id,
        answeredCorrectly: true,
        timestamp: now,
        timeSpent: 5,
        attempts: 1,
        lastSeen: now,
        difficulty: 'easy',
        day: 1,
      },
    ])
  }
  for (const id of incorrectIds) {
    entries.push([
      id,
      {
        questionId: id,
        answeredCorrectly: false,
        timestamp: now,
        timeSpent: 5,
        attempts: 1,
        lastSeen: now,
        difficulty: 'easy',
        day: 1,
      },
    ])
  }
  return entries
}

async function bootWithDay1History(
  page: Page,
  opts: { correctIds?: string[]; incorrectIds?: string[] } = {},
): Promise<void> {
  const entries = buildHistoryEntries(opts)

  await page.addInitScript((historyEntries) => {
    const flag = 'e2e-neg-history-seeded'
    if (!sessionStorage.getItem(flag)) {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem(
        'react-mastery-settings',
        JSON.stringify({
          onboardingComplete: true,
          theme: 'light',
          studyMode: false,
          updatedAt: new Date().toISOString(),
        }),
      )
      localStorage.setItem('react-mastery-question-history', JSON.stringify(historyEntries))
      sessionStorage.setItem(flag, '1')
      return
    }
    if (!localStorage.getItem('react-mastery-question-history')) {
      localStorage.setItem('react-mastery-question-history', JSON.stringify(historyEntries))
    }
  }, entries)

  await page.goto('/')
  await dismissIntroIfPresent(page)
  await enterLab(page, { fresh: false })
}

async function openQuiz(page: Page): Promise<void> {
  await page.getByRole('tab', { name: /^Quiz$/i }).click()
}

async function readDay1Missed(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('react-mastery-question-history')
    if (!raw) return []
    const parsed = JSON.parse(raw) as [string, HistoryEntry][]
    return parsed
      .map(([, e]) => e)
      .filter((e) => (e.day === 1 || /^day01-q/i.test(e.questionId)) && !e.answeredCorrectly)
      .map((e) => e.questionId)
  })
}

/** Day 1 locals use correctAnswer index 1 — option A is wrong. */
async function answerWrongAndAdvance(page: Page): Promise<void> {
  await page.locator('.quiz-option').first().click()
  const next = page.getByRole('button', { name: /Next question|Complete local questions|Finish quiz/i })
  await expect(next).toBeVisible({ timeout: 5_000 })
  await next.click()
}

async function answerAnyAndAdvance(page: Page): Promise<void> {
  await page.locator('.quiz-option').first().click()
  const next = page.getByRole('button', { name: /Next question|Complete local questions|Finish quiz/i })
  await expect(next).toBeVisible({ timeout: 5_000 })
  await next.click()
}

function heroPercent(page: Page) {
  return page.locator('.hero-section__progress span').filter({ hasText: /%$/ }).first()
}

test.describe('Quiz negative edges', () => {
  test('hosted AI 401 → Continue without AI → Finish quiz', async ({ page }) => {
    await page.route('**/api/ai-quiz**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ groq: true, gemini: true, together: true, authRequired: true }),
        })
        return
      }
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Sign in to use hosted AI', code: 'auth_required' }),
      })
    })
    // Stop free TriviaDB fallback so the auth gate sticks
    await page.route('**/opentdb.com/**', (route) => route.abort())

    await bootWithDay1History(page, {
      correctIds: ['day01-q1', 'day01-q2', 'day01-q3', 'day01-q4'],
      incorrectIds: ['day01-q5'],
    })
    await openQuiz(page)
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)1/i)).toBeVisible({ timeout: 15_000 })

    await answerAnyAndAdvance(page)

    await expect(page.getByText(/Local quiz done|Add AI questions/i).first()).toBeVisible({
      timeout: 10_000,
    })

    const generate = page.getByRole('button', { name: /Generate \d+ & continue/i })
    await expect(generate.or(page.getByRole('button', { name: /^Finish quiz$/i }))).toBeVisible({
      timeout: 10_000,
    })
    if (await generate.isVisible().catch(() => false)) {
      await generate.click()
    }

    const signInDialog = page.getByRole('dialog', { name: /Sign in for hosted AI|hosted AI/i })
    await expect(signInDialog).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: /Continue without AI/i }).click()

    // dismiss-local completes the attempt — land on results, not another Finish button
    await expect(page.getByRole('button', { name: /Retake/i }).first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('AI generate network failure shows escape + Finish quiz', async ({ page }) => {
    await page.route('**/api/ai-quiz**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ groq: true, gemini: false, together: false, authRequired: false }),
        })
        return
      }
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Upstream AI blew up' }),
      })
    })
    await page.route('**/opentdb.com/**', (route) => route.abort())

    await bootWithDay1History(page, {
      correctIds: ['day01-q1', 'day01-q2', 'day01-q3', 'day01-q4'],
      incorrectIds: ['day01-q5'],
    })
    await openQuiz(page)
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)1/i)).toBeVisible({ timeout: 15_000 })
    await answerAnyAndAdvance(page)

    await expect(page.getByText(/Local quiz done|Add AI questions/i).first()).toBeVisible({
      timeout: 10_000,
    })

    const generate = page.getByRole('button', { name: /Generate \d+ & continue/i })
    await expect(generate).toBeVisible({ timeout: 10_000 })
    await generate.click()

    await expect(
      page.getByText(/No additional questions|Failed to load|isn.?t available|Finish the quiz/i).first(),
    ).toBeVisible({ timeout: 15_000 })

    // Error path keeps count UI — pick None so primary becomes Finish quiz
    await page.getByRole('radio', { name: /^None$/i }).click()
    await page.getByRole('button', { name: /^Finish quiz$/i }).click()
    await expect(page.getByRole('button', { name: /Retake/i }).first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('load more locals when bank already mastered → Local bank done', async ({ page }) => {
    await bootWithDay1History(page)
    await openQuiz(page)

    await expect(page.getByRole('region', { name: /Local bank done/i })).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('button', { name: /^Practice again$/i }).click()
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)5/i)).toBeVisible({ timeout: 8_000 })

    for (let i = 0; i < 3; i++) {
      await answerAnyAndAdvance(page)
    }

    await expect(page.getByText(/Want more questions/i)).toBeVisible({ timeout: 8_000 })
    await page.getByRole('button', { name: /^Local questions$/i }).click()
    await expect(page.getByText(/How many local/i)).toBeVisible({ timeout: 5_000 })
    await page.getByRole('radio', { name: '5', exact: true }).click()
    await page.getByRole('button', { name: /Continue with 5/i }).click()

    await expect(page.getByRole('region', { name: /Local bank done/i })).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByText(/No new local questions left/i)).toBeVisible()
  })

  test('cloud sync mid-attempt surfaces exhausted gate', async ({ page }) => {
    await bootWithDay1History(page)
    await openQuiz(page)
    await expect(page.getByRole('region', { name: /Local bank done/i })).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('button', { name: /^Practice again$/i }).click()
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)5/i)).toBeVisible()

    // Sync while still on Q1 unanswered: history still all-mastered → reseed exhaust gate.
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('rm-user-cloud-synced'))
    })

    await expect(page.getByRole('region', { name: /Local bank done/i })).toBeVisible({
      timeout: 10_000,
    })
  })

  test('correct → later wrong remisses and reseeds without exhaust', async ({ page }) => {
    await bootWithDay1History(page)
    await openQuiz(page)
    await expect(page.getByRole('region', { name: /Local bank done/i })).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('button', { name: /^Practice again$/i }).click()
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)5/i)).toBeVisible()

    await answerWrongAndAdvance(page)
    await expect.poll(async () => (await readDay1Missed(page)).length).toBeGreaterThan(0)

    // Bail out of this attempt so remount reseeds from history
    await page.getByRole('tab', { name: /^Learn$/i }).click()
    await page.evaluate(() => sessionStorage.removeItem('rm-quiz-progress'))
    await openQuiz(page)

    await expect(page.getByRole('region', { name: /Local bank done/i })).toHaveCount(0)
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)\d+/i)).toBeVisible({
      timeout: 15_000,
    })
  })

  test('Mark complete keeps day bar at 100% after worse quiz score', async ({ page }) => {
    await enterLab(page)
    await markDayComplete(page)
    await expect(heroPercent(page)).toHaveText('100%')
    await expect(overallPercent(page)).toHaveText('14%')

    await openQuiz(page)
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)\d+/i)).toBeVisible({
      timeout: 10_000,
    })

    // Blow the attempt: skip path through mid-prompt cancel → finish remaining → finish quiz
    for (let i = 0; i < 3; i++) {
      await answerWrongAndAdvance(page)
    }
    await expect(page.getByText(/Want more questions/i)).toBeVisible({ timeout: 8_000 })
    await page.getByRole('button', { name: /Skip — finish remaining/i }).click()

    // Remaining locals (2) then AI gate
    for (let i = 0; i < 2; i++) {
      const q = page.getByText(/Question\s+\d+(?:\s+of\s+|\/)\d+/i)
      if (!(await q.isVisible().catch(() => false))) break
      await answerWrongAndAdvance(page)
    }

    const finish = page.getByRole('button', { name: /^Finish quiz$/i })
    const completeLocal = page.getByRole('button', { name: /Complete local questions/i })
    if (await completeLocal.isVisible().catch(() => false)) {
      await completeLocal.click()
    }
    await expect(finish.or(page.getByText(/Local quiz done/i))).toBeVisible({ timeout: 10_000 })
    if (await page.getByText(/Local quiz done/i).isVisible().catch(() => false)) {
      // Prefer None / Finish without AI
      const none = page.getByRole('radio', { name: /^None$/i })
      if (await none.isVisible().catch(() => false)) await none.click()
      await page.getByRole('button', { name: /^Finish quiz$/i }).click()
    } else {
      await finish.click()
    }

    await expect(page.getByRole('button', { name: /Retake/i }).first()).toBeVisible({
      timeout: 10_000,
    })

    // Day marked complete wins over a later failing quiz score
    await expect(heroPercent(page)).toHaveText('100%')
    await expect(overallPercent(page)).toHaveText('14%')
  })

  test('mid-quiz Skip — finish remaining advances past the gate', async ({ page }) => {
    await enterLab(page)
    await openQuiz(page)
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)\d+/i)).toBeVisible({
      timeout: 10_000,
    })

    for (let i = 0; i < 3; i++) {
      await answerAnyAndAdvance(page)
    }

    await expect(page.getByText(/Want more questions/i)).toBeVisible({ timeout: 8_000 })
    await page.getByRole('button', { name: /Skip — finish remaining/i }).click()

    await expect(page.getByText(/Want more questions/i)).toHaveCount(0)
    await expect(page.getByText(/Question\s+4(?:\s+of\s+|\/)\d+/i)).toBeVisible({
      timeout: 8_000,
    })
  })
})
