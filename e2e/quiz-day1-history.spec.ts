import { test, expect, type Page } from '@playwright/test'
import { dismissIntroIfPresent, enterLab } from './helpers'

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

/** Seed settings + history before first paint so questionHistory singleton loads them. */
async function bootWithDay1History(
  page: Page,
  opts: { correctIds?: string[]; incorrectIds?: string[] } = {},
): Promise<void> {
  const entries = buildHistoryEntries(opts)

  await page.addInitScript((historyEntries) => {
    const flag = 'e2e-day1-history-seeded'
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
    // Reloads: keep lab session; re-assert history if wiped.
    if (!localStorage.getItem('react-mastery-question-history')) {
      localStorage.setItem('react-mastery-question-history', JSON.stringify(historyEntries))
    }
  }, entries)

  await page.goto('/')
  await dismissIntroIfPresent(page)
  await enterLab(page, { fresh: false })
}

async function openDay1Quiz(page: Page): Promise<void> {
  await page.getByRole('tab', { name: /^Quiz$/i }).click()
}

async function readDay1History(page: Page): Promise<{
  total: number
  mastered: string[]
  missed: string[]
}> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('react-mastery-question-history')
    if (!raw) return { total: 0, mastered: [], missed: [] }
    const parsed = JSON.parse(raw) as [string, HistoryEntry][]
    const day1 = parsed
      .map(([, e]) => e)
      .filter((e) => e.day === 1 || /^day01-q/i.test(e.questionId))
    return {
      total: parsed.length,
      mastered: day1.filter((e) => e.answeredCorrectly).map((e) => e.questionId),
      missed: day1.filter((e) => !e.answeredCorrectly).map((e) => e.questionId),
    }
  })
}

test.describe('Day 1 question history edges', () => {
  test('all mastered → exhausted panel blocks questions until Practice again', async ({ page }) => {
    await bootWithDay1History(page)

    const hist = await readDay1History(page)
    expect(hist.mastered.sort()).toEqual([...DAY1_IDS].sort())
    expect(hist.missed).toEqual([])

    await openDay1Quiz(page)

    await expect(page.getByRole('region', { name: /Local bank done/i })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByRole('button', { name: /^Practice again$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Try AI questions/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Finish quiz$/i })).toBeVisible()
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)\d+/i)).toHaveCount(0)

    await page.getByRole('button', { name: /^Practice again$/i }).click()
    await expect(page.getByRole('region', { name: /Local bank done/i })).toHaveCount(0)
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)\d+/i)).toBeVisible({
      timeout: 8_000,
    })
  })

  test('Practice again + reload with quiz resume → questions resume (no gate)', async ({ page }) => {
    await bootWithDay1History(page)
    await openDay1Quiz(page)

    await expect(page.getByRole('region', { name: /Local bank done/i })).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('button', { name: /^Practice again$/i }).click()
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)\d+/i)).toBeVisible()

    // Persistence writes rm-quiz-progress — wait for it
    await expect
      .poll(async () => page.evaluate(() => sessionStorage.getItem('rm-quiz-progress')), {
        timeout: 5_000,
      })
      .toBeTruthy()

    await page.reload()
    await dismissIntroIfPresent(page)
    if (await page.getByRole('tab', { name: /^Quiz$/i }).isVisible().catch(() => false)) {
      await openDay1Quiz(page)
    }

    // Mid-quiz resume skips exhausted reseed
    await expect(page.getByRole('region', { name: /Local bank done/i })).toHaveCount(0)
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)\d+/i)).toBeVisible({
      timeout: 15_000,
    })
  })

  test('Practice again + clear progress + reload → exhausted gate returns from history', async ({
    page,
  }) => {
    await bootWithDay1History(page)
    await openDay1Quiz(page)

    await expect(page.getByRole('region', { name: /Local bank done/i })).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('button', { name: /^Practice again$/i }).click()
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)\d+/i)).toBeVisible()

    // Leave Quiz first so persistence can't rewrite progress after we clear it.
    await page.getByRole('tab', { name: /^Learn$/i }).click()
    await page.evaluate(() => sessionStorage.removeItem('rm-quiz-progress'))
    await page.reload()
    await dismissIntroIfPresent(page)
    await openDay1Quiz(page)

    await expect(page.getByRole('region', { name: /Local bank done/i })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)\d+/i)).toHaveCount(0)
  })

  test('Finish from exhausted panel ends the quiz', async ({ page }) => {
    await bootWithDay1History(page)
    await openDay1Quiz(page)

    await expect(page.getByRole('region', { name: /Local bank done/i })).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('button', { name: /^Finish quiz$/i }).click()

    await expect(page.getByRole('button', { name: /Retake/i }).first()).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByRole('region', { name: /Local bank done/i })).toHaveCount(0)
  })

  test('missed Day 1 id still seeds without exhausted gate', async ({ page }) => {
    await bootWithDay1History(page, {
      correctIds: ['day01-q1', 'day01-q2', 'day01-q3', 'day01-q4'],
      incorrectIds: ['day01-q5'],
    })

    const hist = await readDay1History(page)
    expect(hist.missed).toEqual(['day01-q5'])

    await openDay1Quiz(page)

    await expect(page.getByRole('region', { name: /Local bank done/i })).toHaveCount(0)
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)\d+/i)).toBeVisible({
      timeout: 15_000,
    })
  })

  test('Try AI from exhausted panel opens AI count prompt', async ({ page }) => {
    await bootWithDay1History(page)
    await openDay1Quiz(page)

    await expect(page.getByRole('region', { name: /Local bank done/i })).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('button', { name: /Try AI questions/i }).click()

    await expect(page.getByText(/How many/i).first()).toBeVisible({ timeout: 8_000 })
    await expect(page.getByRole('region', { name: /Local bank done/i })).toHaveCount(0)
  })

  test('Learn → Quiz remount re-shows gate until Practice again was chosen', async ({ page }) => {
    await bootWithDay1History(page)
    await openDay1Quiz(page)

    await expect(page.getByRole('region', { name: /Local bank done/i })).toBeVisible({
      timeout: 15_000,
    })

    await page.getByRole('tab', { name: /^Learn$/i }).click()
    await openDay1Quiz(page)

    await expect(page.getByRole('region', { name: /Local bank done/i })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)\d+/i)).toHaveCount(0)
  })

  test('after Practice again, Learn → Quiz resumes questions (gate stays dismissed)', async ({
    page,
  }) => {
    await bootWithDay1History(page)
    await openDay1Quiz(page)

    await expect(page.getByRole('region', { name: /Local bank done/i })).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('button', { name: /^Practice again$/i }).click()
    await expect(page.getByText(/Question\s+1(?:\s+of\s+|\/)\d+/i)).toBeVisible()

    await expect
      .poll(async () =>
        page.evaluate(() => {
          const raw = sessionStorage.getItem('rm-quiz-progress')
          if (!raw) return false
          return Boolean(JSON.parse(raw).localBankGateDismissed)
        }),
      )
      .toBe(true)

    await page.getByRole('tab', { name: /^Learn$/i }).click()
    await openDay1Quiz(page)

    await expect(page.getByRole('region', { name: /Local bank done/i })).toHaveCount(0)
    await expect(page.getByText(/Question\s+\d+(?:\s+of\s+|\/)\d+/i)).toBeVisible({
      timeout: 15_000,
    })
  })
})
