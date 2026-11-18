/**
 * Stress harness for React Mastery
 * - concurrent sessions
 * - rapid day / Tools / Community switching
 * - playground typing flood
 * - console + page + network error capture
 *
 * Usage: BASE_URL=http://127.0.0.1:4173 node scripts/stress-test.mjs
 */
import { chromium } from 'playwright'

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4173'
const SESSIONS = Number(process.env.SESSIONS || 4)
const DAY_LOOPS = Number(process.env.DAY_LOOPS || 3)
const TYPE_CHARS = Number(process.env.TYPE_CHARS || 120)

const results = {
  sessions: [],
  totals: {
    consoleErrors: 0,
    pageErrors: 0,
    failedRequests: 0,
    crashed: 0,
    ok: 0,
  },
}

function dayButtons(page) {
  return page.locator('aside button').filter({ hasText: /Rendering Pipeline|Reconciliation|Fiber|Memoization|Effects|Context|Reflection/i })
}

async function enterLab(page) {
  const cta = page.getByRole('button', { name: /Start Week 1/i })
  await cta.waitFor({ state: 'visible', timeout: 15000 })
  await cta.click()
  await page.locator('aside').waitFor({ state: 'visible', timeout: 15000 })
}

async function stressSession(browser, id) {
  const context = await browser.newContext()
  const page = await context.newPage()
  const session = {
    id,
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    timings: {},
    ok: false,
  }

  page.on('console', (msg) => {
    if (msg.type() === 'error') session.consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => {
    session.pageErrors.push(String(err))
  })
  page.on('requestfailed', (req) => {
    session.failedRequests.push(`${req.failure()?.errorText || 'fail'} ${req.url()}`)
  })

  const t0 = performance.now()
  try {
    // Skip first-visit tour so it doesn't eat sidebar clicks
    await context.addInitScript(() => {
      localStorage.setItem(
        'react-mastery-settings',
        JSON.stringify({ onboardingComplete: true }),
      )
    })

    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 })
    session.timings.landingMs = Math.round(performance.now() - t0)

    await enterLab(page)
    session.timings.enterLabMs = Math.round(performance.now() - t0)

    // Dismiss tour if it still appears
    const skipTour = page.getByRole('button', { name: /Skip tutorial/i })
    if (await skipTour.count()) {
      await skipTour.click({ timeout: 2000 }).catch(() => {})
    }

    // Rapid day switching (forces lazy chunk loads)
    const buttons = dayButtons(page)
    const count = await buttons.count()
    if (count < 7) throw new Error(`Expected 7 day buttons, found ${count}`)

    for (let loop = 0; loop < DAY_LOOPS; loop++) {
      for (let i = 0; i < count; i++) {
        await buttons.nth(i).click({ force: true })
        await page.waitForTimeout(80)
      }
    }

    // Tools / Community thrash
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: 'Tools', exact: true }).click({ force: true })
      await page.waitForTimeout(100)
      await page.getByRole('button', { name: 'Community', exact: true }).click({ force: true })
      await page.waitForTimeout(100)
      // back via a day
      await buttons.nth(i % count).click({ force: true })
      await page.waitForTimeout(80)
    }

    // Playground flood on current day (if textarea present)
    const editor = page.locator('textarea').first()
    if (await editor.count()) {
      await editor.click({ timeout: 5000 }).catch(() => {})
      const payload = 'x'.repeat(TYPE_CHARS)
      await editor.fill(`// stress ${id}\n${payload}\nfunction App(){return null}`)
      // Toggle preview if available
      const previewBtn = page.getByRole('button', { name: /Preview/i }).first()
      if (await previewBtn.count()) {
        await previewBtn.click().catch(() => {})
        await page.waitForTimeout(50)
        await previewBtn.click().catch(() => {})
      }
    }

    // Focus mode toggle spam
    const focus = page.getByRole('button', { name: /Focus|Exit focus/i })
    if (await focus.count()) {
      for (let i = 0; i < 6; i++) {
        await focus.click().catch(() => {})
        await page.waitForTimeout(40)
      }
    }

    // Sidebar collapse spam
    const menu = page.getByRole('button', { name: /Menu/i })
    if (await menu.count()) {
      for (let i = 0; i < 8; i++) {
        await menu.click().catch(() => {})
        await page.waitForTimeout(30)
      }
    }

    session.timings.totalMs = Math.round(performance.now() - t0)
    session.ok = session.pageErrors.length === 0
    if (session.ok) results.totals.ok += 1
    else results.totals.crashed += 1
  } catch (err) {
    session.pageErrors.push(`SESSION_FAIL: ${err}`)
    session.timings.totalMs = Math.round(performance.now() - t0)
    results.totals.crashed += 1
  } finally {
    results.totals.consoleErrors += session.consoleErrors.length
    results.totals.pageErrors += session.pageErrors.length
    results.totals.failedRequests += session.failedRequests.length
    results.sessions.push(session)
    await context.close()
  }
}

async function httpFlood() {
  const urls = [BASE_URL, `${BASE_URL}/`, `${BASE_URL}/index.html`]
  const started = performance.now()
  const statuses = {}
  await Promise.all(
    Array.from({ length: 40 }, async (_, i) => {
      const url = urls[i % urls.length]
      try {
        const res = await fetch(url, { cache: 'no-store' })
        statuses[res.status] = (statuses[res.status] || 0) + 1
      } catch {
        statuses.error = (statuses.error || 0) + 1
      }
    }),
  )
  return { ms: Math.round(performance.now() - started), statuses }
}

async function main() {
  console.log(`Stress target: ${BASE_URL}`)
  console.log(`Sessions=${SESSIONS} dayLoops=${DAY_LOOPS} typeChars=${TYPE_CHARS}`)

  const flood = await httpFlood()
  console.log(`HTTP flood: ${JSON.stringify(flood)}`)

  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PW_CHANNEL || 'chrome',
  })
  const t0 = performance.now()
  await Promise.all(Array.from({ length: SESSIONS }, (_, i) => stressSession(browser, i + 1)))
  const wallMs = Math.round(performance.now() - t0)
  await browser.close()

  const report = {
    baseUrl: BASE_URL,
    wallMs,
    httpFlood: flood,
    totals: results.totals,
    sessions: results.sessions.map((s) => ({
      id: s.id,
      ok: s.ok,
      timings: s.timings,
      consoleErrors: s.consoleErrors.slice(0, 5),
      pageErrors: s.pageErrors.slice(0, 5),
      failedRequests: s.failedRequests.slice(0, 5),
      consoleErrorCount: s.consoleErrors.length,
      pageErrorCount: s.pageErrors.length,
      failedRequestCount: s.failedRequests.length,
    })),
  }

  console.log(JSON.stringify(report, null, 2))

  const hardFail = results.totals.pageErrors > 0 || results.totals.crashed > 0
  process.exit(hardFail ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
