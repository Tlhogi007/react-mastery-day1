/**
 * Signed-in quiz gaps: history/exhaust, quota escape, cloud mid-sync, locals→AI→remount.
 */
import { test, expect, type Page } from '@playwright/test'
import {
  dismissIntroIfPresent,
  enterLab,
  seedOnboarding,
  signInE2E,
} from './helpers'
import { loadRepoEnv } from './loadEnv'

loadRepoEnv()

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
}): HistoryEntry[] {
  const correctIds = opts.correctIds ?? [...DAY1_IDS]
  const incorrectIds = opts.incorrectIds ?? []
  const now = Date.now()
  const entries: HistoryEntry[] = []
  for (const id of correctIds) {
    entries.push({
      questionId: id,
      answeredCorrectly: true,
      timestamp: now,
      timeSpent: 5,
      attempts: 1,
      lastSeen: now,
      difficulty: 'easy',
      day: 1,
    })
  }
  for (const id of incorrectIds) {
    entries.push({
      questionId: id,
      answeredCorrectly: false,
      timestamp: now,
      timeSpent: 5,
      attempts: 1,
      lastSeen: now,
      difficulty: 'easy',
      day: 1,
    })
  }
  return entries
}

function toLocalStoragePairs(entries: HistoryEntry[]): [string, HistoryEntry][] {
  return entries.map((e) => [e.questionId, e])
}

async function openQuiz(page: Page): Promise<void> {
  await page.getByRole('tab', { name: /^Quiz$/i }).click()
}

async function expectSignedIn(page: Page): Promise<void> {
  await expect
    .poll(async () => page.evaluate(() => Boolean((window as unknown as { Clerk?: { user?: unknown } }).Clerk?.user)), {
      timeout: 20_000,
    })
    .toBe(true)
  await expect(page.getByText(/Hi,\s/i).first()).toBeVisible({ timeout: 15_000 })
}

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

/**
 * Sign in, then pin Day 1 history via GET stub + local seed so cloud merge cannot undo the fixture.
 */
async function signedInLabWithHistory(
  page: Page,
  opts: { correctIds?: string[]; incorrectIds?: string[] } = {},
): Promise<void> {
  const entries = buildHistoryEntries(opts)
  const pairs = toLocalStoragePairs(entries)

  await seedOnboarding(page)
  await signInE2E(page)
  await expectSignedIn(page)

  await page.unroute('**/api/user-data**').catch(() => undefined)
  await page.route('**/api/user-data**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }
    // Fully stub GET — avoid route.fetch races when the page reloads/closes.
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        cloud: {
          progress: {
            completedDays: [],
            completedQuizzes: {},
            currentStreak: 0,
            lastActivityDate: '',
            quizScores: {},
          },
          liveProgress: null,
          questionHistory: entries,
          quizResume: null,
          settings: {
            theme: 'light',
            onboardingComplete: true,
            studyMode: false,
            updatedAt: new Date().toISOString(),
          },
        },
        quota: { available: true, remaining: 10, limit: 20 },
        changed: true,
      }),
    })
  })

  await page.addInitScript((historyPairs) => {
    localStorage.setItem('react-mastery-question-history', JSON.stringify(historyPairs))
    sessionStorage.removeItem('rm-quiz-progress')
  }, pairs)

  await page.evaluate((historyPairs) => {
    localStorage.setItem('react-mastery-question-history', JSON.stringify(historyPairs))
    sessionStorage.removeItem('rm-quiz-progress')
  }, pairs)

  await page.reload()
  await dismissIntroIfPresent(page)
  await enterLab(page, { fresh: false })
  await expectSignedIn(page)
}

test.describe('Signed-in quiz edges', () => {
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: 'ignoreErrors' }).catch(() => undefined)
  })

  test('all mastered → exhaust → Practice again → load-more → Local bank done', async ({
    page,
  }) => {
    await signedInLabWithHistory(page)
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
    await page.getByRole('radio', { name: '5', exact: true }).click()
    await page.getByRole('button', { name: /Continue with 5/i }).click()

    await expect(page.getByRole('region', { name: /Local bank done/i })).toBeVisible({
      timeout: 10_000,
    })
  })

  test('correct → later wrong remisses and reseeds without exhaust', async ({ page }) => {
    await signedInLabWithHistory(page)
    await openQuiz(page)
    await expect(page.getByRole('region', { name: /Local bank done/i })).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('button', { name: /^Practice again$/i }).click()
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)5/i)).toBeVisible()

    await answerWrongAndAdvance(page)
    await expect.poll(async () => (await readDay1Missed(page)).length).toBeGreaterThan(0)

    await page.getByRole('tab', { name: /^Learn$/i }).click()
    await page.evaluate(() => sessionStorage.removeItem('rm-quiz-progress'))
    await openQuiz(page)

    await expect(page.getByRole('region', { name: /Local bank done/i })).toHaveCount(0)
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)\d+/i)).toBeVisible({
      timeout: 15_000,
    })
  })

  test('missed id still seeds without exhaust gate', async ({ page }) => {
    await signedInLabWithHistory(page, {
      correctIds: ['day01-q1', 'day01-q2', 'day01-q3', 'day01-q4'],
      incorrectIds: ['day01-q5'],
    })
    await openQuiz(page)

    await expect(page.getByRole('region', { name: /Local bank done/i })).toHaveCount(0)
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)\d+/i)).toBeVisible({
      timeout: 15_000,
    })
  })

  test('quota exceeded → Finish quiz escape (no auth modal)', async ({ page }) => {
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
        status: 402,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Free hosted AI limit reached',
          code: 'quota_exceeded',
        }),
      })
    })
    await page.route('**/opentdb.com/**', (route) => route.abort())

    await signedInLabWithHistory(page, {
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
    if (await generate.isVisible().catch(() => false)) {
      await generate.click()
    }

    // Signed-in → quota modal/escape, not "Sign in for hosted AI"
    await expect(page.getByRole('dialog', { name: /Sign in for hosted AI/i })).toHaveCount(0)

    const quotaDialog = page.getByRole('dialog').filter({ hasText: /limit|quota|API key/i })
    const finishBtn = page.getByRole('button', { name: /^Finish quiz$/i })
    const addKey = page.getByRole('button', { name: /Add API key|Add your API key/i })

    await expect(quotaDialog.or(finishBtn).or(addKey).or(page.getByText(/limit reached|isn.?t available/i))).toBeVisible({
      timeout: 15_000,
    })

    if (await page.getByRole('button', { name: /Continue without AI/i }).isVisible().catch(() => false)) {
      await page.getByRole('button', { name: /Continue without AI/i }).click()
    }

    const none = page.getByRole('radio', { name: /^None$/i })
    if (await none.isVisible().catch(() => false)) {
      await none.click()
    }
    if (await finishBtn.isVisible().catch(() => false)) {
      await finishBtn.click()
    }

    await expect(page.getByRole('button', { name: /Retake/i }).first()).toBeVisible({
      timeout: 15_000,
    })
  })

  test('cloud sync mid Practice-again surfaces exhausted gate', async ({ page }) => {
    await signedInLabWithHistory(page)
    await openQuiz(page)
    await expect(page.getByRole('region', { name: /Local bank done/i })).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('button', { name: /^Practice again$/i }).click()
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)5/i)).toBeVisible()

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('rm-user-cloud-synced'))
    })

    await expect(page.getByRole('region', { name: /Local bank done/i })).toBeVisible({
      timeout: 10_000,
    })
  })

  test('locals → AI generate → finish → remount keeps exhaust when all mastered', async ({
    page,
  }) => {
    // Stub AI to return a tiny valid React question set so we do not depend on live providers.
    await page.route('**/api/ai-quiz**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ groq: true, gemini: false, together: false, authRequired: true }),
        })
        return
      }
      const content = [
        'Q: What is React reconciliation in the render pipeline?',
        'A) Diffing Virtual DOM trees',
        'B) A CSS reset',
        'C) Bundler caching',
        'D) Server-only rendering',
        'Correct: A) Diffing Virtual DOM trees',
        'Explanation: Reconciliation compares Virtual DOM trees in React.',
        '',
        'Q: Why does React use keys in lists during reconciliation?',
        'A) For styling rows',
        'B) To identify items between renders',
        'C) To sort items',
        'D) To avoid all re-renders',
        'Correct: B) To identify items between renders',
        'Explanation: Keys give React stable identity during list reconciliation.',
      ].join('\n')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content }),
      })
    })
    await page.route('**/opentdb.com/**', (route) => route.abort())

    await signedInLabWithHistory(page, {
      correctIds: ['day01-q1', 'day01-q2', 'day01-q3', 'day01-q4'],
      incorrectIds: ['day01-q5'],
    })
    await openQuiz(page)
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)1/i)).toBeVisible({ timeout: 15_000 })

    // Answer correctly (B is index 1 for Day 1 bank)
    await page.locator('.quiz-option').nth(1).click()
    await page.getByRole('button', { name: /Complete local questions/i }).click()

    await expect(page.getByText(/Local quiz done|Add AI questions/i).first()).toBeVisible({
      timeout: 10_000,
    })
    await page.getByRole('button', { name: /Generate \d+ & continue/i }).click()

    await expect(page.getByText(/Question\s+\d+(?:\s+of\s+|\/)\d+/i)).toBeVisible({
      timeout: 20_000,
    })
    // Should be in AI section (no sign-in modal)
    await expect(page.getByRole('dialog', { name: /Sign in for hosted AI/i })).toHaveCount(0)

    // Finish remaining AI quickly
    for (let i = 0; i < 6; i++) {
      const q = page.getByText(/Question\s+\d+(?:\s+of\s+|\/)\d+/i)
      if (!(await q.isVisible().catch(() => false))) break
      const finish = page.getByRole('button', { name: /Finish quiz|Complete local questions/i })
      const next = page.getByRole('button', { name: /Next question/i })
      await page.locator('.quiz-option').first().click()
      if (await finish.isVisible().catch(() => false)) {
        await finish.click()
        break
      }
      if (await next.isVisible().catch(() => false)) await next.click()
    }

    await expect(page.getByRole('button', { name: /Retake/i }).first()).toBeVisible({
      timeout: 20_000,
    })

    // Remount quiz: all Day 1 locals mastered → exhaust gate
    await page.getByRole('tab', { name: /^Learn$/i }).click()
    await page.evaluate(() => sessionStorage.removeItem('rm-quiz-progress'))
    await openQuiz(page)

    await expect(page.getByRole('region', { name: /Local bank done/i })).toBeVisible({
      timeout: 15_000,
    })
  })
})
