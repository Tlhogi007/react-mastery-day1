import { expect, type Page } from '@playwright/test'
import { clerk } from '@clerk/testing/playwright'
import { loadRepoEnv } from './loadEnv'

loadRepoEnv()

export function overallPercent(page: Page) {
  return page.locator('[data-tutorial="progress"]').locator('span').filter({ hasText: /%$/ }).first()
}

export async function seedOnboarding(page: Page): Promise<void> {
  await page.goto('/')
  await page.evaluate(() => {
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
  })
}

/** Intro splash auto-unlocks after ~5s (Strict Mode may remount once). */
export async function dismissIntroIfPresent(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog', { name: /Welcome/i })
  if (!(await dialog.isVisible({ timeout: 2_000 }).catch(() => false))) return

  const continueBtn = dialog.getByRole('button', { name: /^Continue$/i })
  // Prefer waiting for auto-dismiss; fall back to Continue once unlocked.
  try {
    await Promise.race([
      dialog.waitFor({ state: 'hidden', timeout: 14_000 }),
      (async () => {
        await expect(continueBtn).toBeEnabled({ timeout: 14_000 })
        await continueBtn.click({ timeout: 3_000 })
      })(),
    ])
  } catch {
    // Last resort: keyboard unlock path
    await page.keyboard.press('Escape')
  }
  await expect(dialog).toBeHidden({ timeout: 5_000 })
}

export async function enterLab(
  page: Page,
  opts: { fresh?: boolean } = { fresh: true },
): Promise<void> {
  if (opts.fresh) {
    await seedOnboarding(page)
  } else {
    await page.goto('/')
  }

  // Already in the lab?
  if (await page.getByRole('button', { name: /Mark complete|^Completed$/i }).isVisible().catch(() => false)) {
    return
  }

  const start = page.getByRole('button', { name: /Start Day 1/i }).first()
  if (await start.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await start.click({ timeout: 15_000 })
  }

  const skip = page.getByRole('button', { name: /Skip tutorial/i })
  if (await skip.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skip.click()
  }
  await expect(page.getByText(/Rendering Pipeline/i).first()).toBeVisible({ timeout: 15_000 })
}

export async function markDayComplete(page: Page): Promise<void> {
  const mark = page.getByRole('button', { name: /Mark complete/i })
  await expect(mark).toBeVisible()
  await mark.click()
  await expect(page.getByRole('button', { name: /^Completed$/i })).toBeVisible({
    timeout: 5_000,
  })
}

export async function signInE2E(page: Page): Promise<void> {
  const email = process.env.E2E_CLERK_USER_EMAIL
  const password = process.env.E2E_CLERK_USER_PASSWORD
  if (!email || !password) {
    throw new Error('E2E_CLERK_USER_EMAIL / E2E_CLERK_USER_PASSWORD not set (auth.setup should set them)')
  }

  // Landing must load Clerk before helper sign-in
  await page.goto('/')
  await expect(page.getByRole('button', { name: /Sign in|Start Day 1/i }).first()).toBeVisible({
    timeout: 15_000,
  })

  // Prefer Backend API ticket sign-in (skips email verification / MFA first-factor)
  try {
    await clerk.signIn({ page, emailAddress: email })
  } catch {
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: email,
        password,
      },
    })
  }

  await expect
    .poll(async () => page.evaluate(() => Boolean((window as unknown as { Clerk?: { user?: unknown } }).Clerk?.user)), {
      timeout: 20_000,
    })
    .toBe(true)
}

export async function signOutE2E(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const clerk = (window as unknown as { Clerk?: { signOut?: () => Promise<void> } }).Clerk
    if (clerk?.signOut) await clerk.signOut()
  })
  await page.goto('/?rm=landing')
  await expect(page.getByRole('button', { name: /Sign in|Start Day 1/i }).first()).toBeVisible({
    timeout: 15_000,
  })
}

export async function readLocalProgress(page: Page): Promise<{
  completedDays: number[]
  quizScores: Record<string, number>
}> {
  return page.evaluate(() => {
    try {
      const raw = localStorage.getItem('react-mastery-progress')
      if (!raw) return { completedDays: [], quizScores: {} }
      const parsed = JSON.parse(raw) as {
        completedDays?: number[]
        quizScores?: Record<string, number>
      }
      return {
        completedDays: Array.isArray(parsed.completedDays) ? parsed.completedDays : [],
        quizScores: parsed.quizScores || {},
      }
    } catch {
      return { completedDays: [], quizScores: {} }
    }
  })
}

export async function readLiveProgress(page: Page): Promise<{
  day: number
  percent: number | null
} | null> {
  return page.evaluate(() => {
    try {
      const raw = localStorage.getItem('rm-live-day-progress')
      if (!raw) return null
      const parsed = JSON.parse(raw) as { day?: number; percent?: number | null }
      if (typeof parsed.day !== 'number') return null
      return {
        day: parsed.day,
        percent: parsed.percent == null ? null : Number(parsed.percent),
      }
    } catch {
      return null
    }
  })
}

/** Simulate mid-quiz live % on this device and wait for cloud PUT. `null` = tombstone clear. */
export async function pushLiveProgress(
  page: Page,
  day: number,
  percent: number | null,
): Promise<void> {
  const putPromise = waitForUserDataPut(page, 35_000)
  await page.evaluate(
    ({ day: d, percent: p }) => {
      localStorage.setItem(
        'rm-live-day-progress',
        JSON.stringify({
          day: d,
          percent: p,
          updatedAt: new Date().toISOString(),
        }),
      )
      window.dispatchEvent(new CustomEvent('rm-progress-changed'))
      // Force immediate cloud push (UserCloudSync flushes on hide)
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      })
      document.dispatchEvent(new Event('visibilitychange'))
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      })
      document.dispatchEvent(new Event('visibilitychange'))
    },
    { day, percent },
  )
  await putPromise
}

export async function waitForUserDataPut(page: Page, timeoutMs = 20_000) {
  return page.waitForResponse(
    (res) =>
      res.url().includes('/api/user-data') &&
      res.request().method() === 'PUT' &&
      res.ok(),
    { timeout: timeoutMs },
  )
}

export async function waitForUserDataGet(page: Page, timeoutMs = 20_000) {
  return page.waitForResponse(
    (res) =>
      res.url().includes('/api/user-data') &&
      res.request().method() === 'GET' &&
      res.ok(),
    { timeout: timeoutMs },
  )
}

export async function readLocalSettings(page: Page): Promise<{
  theme: string
  onboardingComplete: boolean
  studyMode: boolean
}> {
  return page.evaluate(() => {
    try {
      const raw = localStorage.getItem('react-mastery-settings')
      if (!raw) return { theme: 'auto', onboardingComplete: false, studyMode: false }
      const parsed = JSON.parse(raw) as {
        theme?: string
        onboardingComplete?: boolean
        studyMode?: boolean
      }
      return {
        theme: parsed.theme || 'auto',
        onboardingComplete: Boolean(parsed.onboardingComplete),
        studyMode: Boolean(parsed.studyMode),
      }
    } catch {
      return { theme: 'auto', onboardingComplete: false, studyMode: false }
    }
  })
}

export async function readHelpfulVotes(page: Page): Promise<Record<string, boolean>> {
  return page.evaluate(() => {
    try {
      const raw = localStorage.getItem('rm-community-helpful-votes')
      if (!raw) return {}
      const parsed = JSON.parse(raw) as Record<string, boolean>
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  })
}

export async function readQuizResume(page: Page): Promise<{ day: number; at: number } | null> {
  return page.evaluate(() => {
    try {
      const raw = sessionStorage.getItem('rm-quiz-progress')
      if (!raw) return null
      const parsed = JSON.parse(raw) as { day?: number; at?: number; allQuestions?: unknown[] }
      if (typeof parsed.day !== 'number' || typeof parsed.at !== 'number') return null
      if (!Array.isArray(parsed.allQuestions) || parsed.allQuestions.length === 0) return null
      return { day: parsed.day, at: parsed.at }
    } catch {
      return null
    }
  })
}

/** Seed prefs / votes / mid-quiz resume and bump cloud dirty. */
export async function seedExtendedCloudLocal(
  page: Page,
  opts: {
    theme?: 'light' | 'dark' | 'auto'
    studyMode?: boolean
    helpfulSlug?: string
  } = {},
): Promise<void> {
  await page.evaluate((o) => {
    localStorage.setItem(
      'react-mastery-settings',
      JSON.stringify({
        onboardingComplete: true,
        theme: o.theme || 'dark',
        studyMode: Boolean(o.studyMode),
        updatedAt: new Date().toISOString(),
      }),
    )
    if (o.helpfulSlug) {
      localStorage.setItem(
        'rm-community-helpful-votes',
        JSON.stringify({ [o.helpfulSlug]: true }),
      )
    }
    const analytics = [
      { event: 'e2e_cloud_probe', properties: { ok: true }, timestamp: Date.now() },
    ]
    localStorage.setItem('react-mastery-analytics', JSON.stringify(analytics))
    sessionStorage.setItem(
      'rm-quiz-progress',
      JSON.stringify({
        day: 1,
        currentQuestionIndex: 2,
        selectedAnswer: 1,
        score: 1,
        completed: false,
        localQuestionsCompleted: false,
        aiEnabled: false,
        aiQuestionsLoaded: false,
        allQuestions: [
          {
            id: 'e2e-q1',
            question: 'E2E resume probe?',
            options: ['a', 'b', 'c', 'd'],
            correctAnswer: 1,
            explanation: 'probe',
            source: 'local',
          },
          {
            id: 'e2e-q2',
            question: 'E2E resume probe 2?',
            options: ['a', 'b', 'c', 'd'],
            correctAnswer: 0,
            explanation: 'probe',
            source: 'local',
          },
          {
            id: 'e2e-q3',
            question: 'E2E resume probe 3?',
            options: ['a', 'b', 'c', 'd'],
            correctAnswer: 2,
            explanation: 'probe',
            source: 'local',
          },
        ],
        usedLocalQuestionIds: ['e2e-q1', 'e2e-q2', 'e2e-q3'],
        incorrectAnswerIds: [],
        totalTimeSpent: 12,
        at: Date.now(),
      }),
    )
    window.dispatchEvent(new CustomEvent('rm-progress-changed'))
  }, opts)
}
