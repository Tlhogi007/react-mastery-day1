import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { emptySnapshot } from '../../api/_lib/userCloud'

const bridge = vi.hoisted(() => ({
  waitForAiAuthToken: vi.fn(),
}))

vi.mock('./aiAuthBridge', () => ({
  waitForAiAuthToken: bridge.waitForAiAuthToken,
}))

type Sync = typeof import('./userCloudSync')

async function load() {
  vi.resetModules()
  const sync: Sync = await import('./userCloudSync')
  const progress = (await import('./progressStorage')).progressStorage
  const settings = (await import('./settingsStorage')).settingsStorage
  const quizResume = await import('./quizResume')
  const helpful = await import('./communityHelpful')
  const analytics = (await import('./analytics')).analytics
  return { sync, progress, settings, quizResume, helpful, analytics }
}

const jsonRes = (body: unknown, ok = true) =>
  ({ ok, json: async () => body }) as unknown as Response

const quota = { used: 1, limit: 5, remaining: 4, day: '2026-11-19', available: true }

const question = { id: 'q1', question: 'Q?', options: ['a', 'b'], correctAnswer: 0 }

beforeEach(() => {
  bridge.waitForAiAuthToken.mockReset().mockResolvedValue('tok')
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  )
  window.matchMedia = globalThis.matchMedia
  window.history.replaceState(null, '', '/')
})

afterEach(() => {
  vi.useRealTimers()
  document.documentElement.className = ''
  document.body.className = ''
})

describe('buildLocalSnapshot', () => {
  it('produces an empty-ish snapshot with defaults', async () => {
    const { sync } = await load()
    const snap = sync.buildLocalSnapshot()
    expect(snap).toMatchObject({
      version: 1,
      lab: null,
      liveProgress: null,
      quizResume: null,
      notes: [],
      annotations: [],
      reflections: [],
      flashcards: [],
      snippets: [],
      helpfulVotes: {},
      settings: { theme: 'auto', onboardingComplete: false, studyMode: false },
    })
    expect(snap.progress.completedDays).toEqual([])
    // in-memory analytics fallback includes the session_start event
    expect((snap.analytics as unknown[]).length).toBeGreaterThanOrEqual(1)
  })

  it('reads lab session, active tab and local JSON stores', async () => {
    const { sync, progress } = await load()
    sessionStorage.setItem(
      'rm-lab-session',
      JSON.stringify({ exercise: 'day02', view: 'community', tools: 1 }),
    )
    sessionStorage.setItem('rm-active-tab', 'practice')
    localStorage.setItem('react-mastery-notes', JSON.stringify([{ id: 'n1' }]))
    localStorage.setItem('react-mastery-flashcards', '{bad')
    progress.markDayCompleted(2)
    progress.setLiveDayProgress(2, 30)
    const snap = sync.buildLocalSnapshot()
    expect(snap.lab).toEqual({ exercise: 'day02', view: 'community', tools: true, tab: 'practice' })
    expect(snap.notes).toEqual([{ id: 'n1' }])
    expect(snap.flashcards).toEqual([])
    expect(snap.progress.completedDays).toEqual([2])
    expect(snap.liveProgress).toMatchObject({ day: 2, percent: 30 })
  })

  it('ignores invalid lab sessions', async () => {
    const { sync } = await load()
    sessionStorage.setItem('rm-lab-session', JSON.stringify({ view: 'settings' }))
    expect(sync.buildLocalSnapshot().lab).toBeNull()
    sessionStorage.setItem('rm-lab-session', '{bad')
    expect(sync.buildLocalSnapshot().lab).toBeNull()
  })

  it('applies lab override with fallbacks to session values', async () => {
    const { sync } = await load()
    sessionStorage.setItem('rm-lab-session', JSON.stringify({ exercise: 'day05', view: 'support', tools: true }))
    sessionStorage.setItem('rm-active-tab', 'quiz')
    expect(sync.buildLocalSnapshot({ tab: 'custom' }).lab).toEqual({
      exercise: 'day05',
      view: 'support',
      tools: true,
      tab: 'custom',
    })
    expect(sync.buildLocalSnapshot({ exercise: 'x', view: 'settings', tools: false }).lab).toEqual({
      exercise: 'x',
      view: 'settings',
      tools: false,
      tab: 'quiz',
    })
    sessionStorage.clear()
    expect(sync.buildLocalSnapshot({}).lab).toEqual({
      exercise: 'day01-rendering-pipeline',
      view: 'exercises',
      tools: false,
      tab: undefined,
    })
  })

  it('includes capped quiz resume', async () => {
    const { sync, quizResume } = await load()
    quizResume.saveQuizProgress({
      day: 3,
      currentQuestionIndex: 1,
      selectedAnswer: 0,
      score: 2,
      completed: false,
      localQuestionsCompleted: false,
      aiEnabled: false,
      aiQuestionsLoaded: false,
      allQuestions: Array.from({ length: 60 }, (_, i) => ({ ...question, id: `q${i}` })) as never,
      usedLocalQuestionIds: Array.from({ length: 250 }, (_, i) => `u${i}`),
      incorrectAnswerIds: Array.from({ length: 250 }, (_, i) => `i${i}`),
      totalTimeSpent: 9,
      at: Date.now(),
    })
    const snap = sync.buildLocalSnapshot()
    expect(snap.quizResume).toMatchObject({ day: 3, score: 2, totalTimeSpent: 9 })
    expect(snap.quizResume!.allQuestions).toHaveLength(40)
    expect(snap.quizResume!.usedLocalQuestionIds).toHaveLength(200)
    expect(snap.quizResume!.incorrectAnswerIds).toHaveLength(200)
  })

  it('prefers stored analytics (capped to 400) over in-memory', async () => {
    const { sync } = await load()
    const events = Array.from({ length: 450 }, (_, i) => ({ event: 'e', timestamp: i + 1 }))
    localStorage.setItem('react-mastery-analytics', JSON.stringify(events))
    const a = sync.buildLocalSnapshot().analytics as Array<{ timestamp: number }>
    expect(a).toHaveLength(400)
    expect(a[399].timestamp).toBe(450)
  })

  it('includes settings with updatedAt and helpful votes', async () => {
    const { sync, settings, helpful } = await load()
    settings.setStudyMode(true)
    helpful.setLocalHelpful('post-a', true)
    const snap = sync.buildLocalSnapshot()
    expect(snap.settings).toMatchObject({ studyMode: true })
    expect(snap.settings!.updatedAt).toEqual(expect.any(String))
    expect(snap.helpfulVotes).toEqual({ 'post-a': true })
  })

  it('falls back to empty settings stamp if updatedAt not a string', async () => {
    const { sync } = await load()
    localStorage.setItem('react-mastery-settings', JSON.stringify({ theme: 'dark', updatedAt: 5 }))
    expect(sync.buildLocalSnapshot().settings).toMatchObject({ theme: 'dark', updatedAt: '' })
  })
})

describe('progressSyncFingerprint', () => {
  const base = () => ({ ...emptySnapshot(), progress: emptySnapshot().progress })

  it('is stable and ignores liveProgress.updatedAt', async () => {
    const { sync } = await load()
    const a = {
      ...base(),
      liveProgress: { day: 1, percent: 10, updatedAt: 'a' },
    }
    const b = { ...a, liveProgress: { day: 1, percent: 10, updatedAt: 'b' } }
    expect(sync.progressSyncFingerprint(a)).toBe(sync.progressSyncFingerprint(b))
    const c = { ...a, liveProgress: { day: 1, percent: 20, updatedAt: 'a' } }
    expect(sync.progressSyncFingerprint(a)).not.toBe(sync.progressSyncFingerprint(c))
  })

  it('tracks sorted history ids and truthy helpful votes only', async () => {
    const { sync } = await load()
    const a = {
      ...base(),
      questionHistory: [{ questionId: 'b' }, { questionId: 'a' }, null, { other: 1 }, { questionId: '' }],
      helpfulVotes: { z: true, y: false, x: true },
    }
    const parsed = JSON.parse(sync.progressSyncFingerprint(a))
    expect(parsed.historyIds).toEqual(['a', 'b'])
    expect(parsed.helpfulKeys).toEqual(['x', 'z'])
    expect(parsed.live).toBeNull()
  })

  it('handles non-array history, missing votes and quiz resume summary', async () => {
    const { sync } = await load()
    const a = {
      ...base(),
      questionHistory: 'nope',
      helpfulVotes: undefined,
      settings: undefined,
      quizResume: {
        day: 2,
        at: 99,
        currentQuestionIndex: 1,
        score: 3,
        completed: false,
        localQuestionsCompleted: false,
        aiEnabled: false,
        aiQuestionsLoaded: false,
        allQuestions: [question],
        usedLocalQuestionIds: [],
        incorrectAnswerIds: [],
        totalTimeSpent: 0,
      },
    }
    const parsed = JSON.parse(sync.progressSyncFingerprint(a as never))
    expect(parsed.historyIds).toEqual([])
    expect(parsed.helpfulKeys).toEqual([])
    expect(parsed.settings).toBeNull()
    expect(parsed.quizResume).toEqual({ day: 2, at: 99, index: 1, score: 3, completed: false })
  })
})

describe('emitAiQuota', () => {
  it('dispatches the quota event with detail', async () => {
    const { sync } = await load()
    const handler = vi.fn()
    window.addEventListener(sync.AI_QUOTA_UPDATED_EVENT, handler)
    sync.emitAiQuota(quota)
    window.removeEventListener(sync.AI_QUOTA_UPDATED_EVENT, handler)
    expect(handler).toHaveBeenCalledTimes(1)
    expect((handler.mock.calls[0][0] as CustomEvent).detail).toEqual(quota)
  })
})

describe('fetchUserCloud', () => {
  it('returns null without a token and never fetches', async () => {
    const { sync } = await load()
    bridge.waitForAiAuthToken.mockResolvedValue(null)
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await sync.fetchUserCloud()).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(bridge.waitForAiAuthToken).toHaveBeenCalledWith(40, 100)
  })

  it('GETs with bearer auth and emits quota', async () => {
    const { sync } = await load()
    const payload = { cloud: emptySnapshot(), quota }
    const fetchMock = vi.fn().mockResolvedValue(jsonRes(payload))
    vi.stubGlobal('fetch', fetchMock)
    const handler = vi.fn()
    window.addEventListener(sync.AI_QUOTA_UPDATED_EVENT, handler)
    expect(await sync.fetchUserCloud()).toEqual(payload)
    window.removeEventListener(sync.AI_QUOTA_UPDATED_EVENT, handler)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/user-data')
    expect(init.method).toBe('GET')
    expect(init.headers.Authorization).toBe('Bearer tok')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('returns data without quota event when quota missing', async () => {
    const { sync } = await load()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({ cloud: emptySnapshot() })))
    const handler = vi.fn()
    window.addEventListener(sync.AI_QUOTA_UPDATED_EVENT, handler)
    expect(await sync.fetchUserCloud()).not.toBeNull()
    window.removeEventListener(sync.AI_QUOTA_UPDATED_EVENT, handler)
    expect(handler).not.toHaveBeenCalled()
  })

  it('returns null on non-ok and on network errors', async () => {
    const { sync } = await load()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({}, false)))
    expect(await sync.fetchUserCloud()).toBeNull()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(await sync.fetchUserCloud()).toBeNull()
  })
})

describe('fetchUserCloudWait', () => {
  it('delegates to fetchUserCloud without a since marker', async () => {
    const { sync } = await load()
    const fetchMock = vi.fn().mockResolvedValue(jsonRes({ cloud: emptySnapshot(), quota }))
    vi.stubGlobal('fetch', fetchMock)
    await sync.fetchUserCloudWait('')
    expect(fetchMock.mock.calls[0][0]).toBe('/api/user-data')
  })

  it('long-polls with wait/since query', async () => {
    const { sync } = await load()
    const fetchMock = vi.fn().mockResolvedValue(jsonRes({ cloud: emptySnapshot(), quota, changed: true }))
    vi.stubGlobal('fetch', fetchMock)
    const res = await sync.fetchUserCloudWait('2026-01-01T00:00:00Z')
    expect(res?.changed).toBe(true)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/user-data?wait=1&since=2026-01-01T00%3A00%3A00Z')
  })

  it('returns null without token, non-ok, and errors; skips quota when absent', async () => {
    const { sync } = await load()
    bridge.waitForAiAuthToken.mockResolvedValueOnce(null)
    expect(await sync.fetchUserCloudWait('x')).toBeNull()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({}, false)))
    expect(await sync.fetchUserCloudWait('x')).toBeNull()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('x')))
    expect(await sync.fetchUserCloudWait('x')).toBeNull()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({ cloud: emptySnapshot() })))
    expect(await sync.fetchUserCloudWait('x')).not.toBeNull()
  })
})

describe('pushUserCloud', () => {
  it('PUTs the provided snapshot and emits quota', async () => {
    const { sync } = await load()
    const snap = sync.buildLocalSnapshot()
    const fetchMock = vi.fn().mockResolvedValue(jsonRes({ cloud: snap, quota }))
    vi.stubGlobal('fetch', fetchMock)
    const handler = vi.fn()
    window.addEventListener(sync.AI_QUOTA_UPDATED_EVENT, handler)
    expect(await sync.pushUserCloud(snap)).not.toBeNull()
    window.removeEventListener(sync.AI_QUOTA_UPDATED_EVENT, handler)
    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('PUT')
    expect(JSON.parse(init.body).version).toBe(1)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('builds a snapshot by default and tolerates missing quota', async () => {
    const { sync } = await load()
    const fetchMock = vi.fn().mockResolvedValue(jsonRes({ cloud: emptySnapshot() }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await sync.pushUserCloud()).not.toBeNull()
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).version).toBe(1)
  })

  it('returns null without token / on non-ok / on errors', async () => {
    const { sync } = await load()
    bridge.waitForAiAuthToken.mockResolvedValueOnce(null)
    expect(await sync.pushUserCloud()).toBeNull()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({}, false)))
    expect(await sync.pushUserCloud()).toBeNull()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('x')))
    expect(await sync.pushUserCloud()).toBeNull()
  })
})

function richCloud() {
  const now = Date.now()
  return {
    ...emptySnapshot(),
    updatedAt: new Date(now + 1000).toISOString(),
    progress: {
      completedDays: [1, 2],
      completedQuizzes: { 'day-1': true },
      currentStreak: 3,
      lastActivityDate: '2026-11-19',
      quizScores: { 'day-1': 80 },
    },
    lab: { exercise: 'day02-reconciliation', view: 'community', tools: true, tab: 'practice' },
    liveProgress: { day: 2, percent: 40, updatedAt: new Date(now + 5000).toISOString() },
    questionHistory: [
      { questionId: 'day01-q1', answeredCorrectly: true, attempts: 2, lastSeen: now, timeSpent: 3, timestamp: now },
    ],
    notes: [{ id: 'n1', day: 1, content: 'hi' }],
    annotations: [{ id: 'a1', noteId: 'n1' }],
    reflections: [{ id: 'r1' }],
    flashcards: [{ id: 'f1' }],
    snippets: [{ id: 's1' }],
    settings: { theme: 'dark', onboardingComplete: true, studyMode: true, updatedAt: new Date(now + 9000).toISOString() },
    quizResume: {
      day: 2,
      currentQuestionIndex: 1,
      selectedAnswer: null,
      score: 1,
      completed: false,
      localQuestionsCompleted: false,
      aiEnabled: false,
      aiQuestionsLoaded: false,
      allQuestions: [question],
      usedLocalQuestionIds: ['q1'],
      incorrectAnswerIds: [],
      totalTimeSpent: 4,
      at: now,
    },
    analytics: [{ event: 'remote_event', timestamp: now - 5 }],
    helpfulVotes: { 'post-x': true },
  }
}

describe('pullAndMergeUserCloud', () => {
  it('returns unchanged result when remote is unavailable', async () => {
    const { sync } = await load()
    bridge.waitForAiAuthToken.mockResolvedValue(null)
    expect(await sync.pullAndMergeUserCloud()).toEqual({ changed: false, data: null, updatedAt: '' })
    expect(await sync.pullAndMergeUserCloud(undefined, { since: 'abc' })).toEqual({
      changed: false,
      data: null,
      updatedAt: 'abc',
    })
  })

  it('does not apply anything when merge equals local', async () => {
    const { sync, progress } = await load()
    // Key order matters to the JSON fingerprint: mirror the order produced by normalizeProgress.
    vi.spyOn(progress, 'getProgress').mockReturnValue({
      completedDays: [],
      completedQuizzes: {},
      quizScores: {},
      currentStreak: 0,
      lastActivityDate: '',
    })
    const remote = { cloud: { ...emptySnapshot(), updatedAt: 'REMOTE-TS' }, quota }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes(remote)))
    const saveSpy = vi.spyOn(progress, 'saveProgress')
    const res = await sync.pullAndMergeUserCloud()
    expect(res.changed).toBe(false)
    expect(res.updatedAt).toBe('REMOTE-TS')
    expect(res.data).toEqual(remote)
    expect(saveSpy).not.toHaveBeenCalled()
  })

  it('currently reports changed for identical content when progress key order differs', async () => {
    const { sync } = await load()
    const remote = { cloud: { ...emptySnapshot(), updatedAt: 'REMOTE-TS' }, quota }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes(remote)))
    // progressStorage.getProgress() key order != normalizeProgress() key order → fingerprint differs
    expect((await sync.pullAndMergeUserCloud()).changed).toBe(true)
  })

  it('uses since when remote has no updatedAt string; uses wait endpoint', async () => {
    const { sync } = await load()
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonRes({ cloud: { ...emptySnapshot(), updatedAt: undefined }, quota }))
    vi.stubGlobal('fetch', fetchMock)
    const res = await sync.pullAndMergeUserCloud(undefined, { since: 'S' })
    expect(res.updatedAt).toBe('S')
    expect(fetchMock.mock.calls[0][0]).toContain('wait=1')
  })

  it('merges remote data into local storage and emits sync event', async () => {
    const { sync, progress, settings, quizResume, helpful, analytics } = await load()
    const cloud = richCloud()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({ cloud, quota })))
    const synced = vi.fn()
    const themed = vi.fn()
    window.addEventListener(sync.USER_CLOUD_SYNCED_EVENT, synced)
    window.addEventListener('react-mastery-theme-change', themed)

    const res = await sync.pullAndMergeUserCloud({ exercise: 'day01-rendering-pipeline' })

    window.removeEventListener(sync.USER_CLOUD_SYNCED_EVENT, synced)
    window.removeEventListener('react-mastery-theme-change', themed)

    expect(res.changed).toBe(true)
    expect(synced).toHaveBeenCalledTimes(1)
    expect(themed).toHaveBeenCalledTimes(1)
    expect(progress.getProgress().completedDays).toEqual([1, 2])
    expect(progress.getLiveDayProgressState()).toMatchObject({ day: 2, percent: 40 })
    expect(JSON.parse(localStorage.getItem('react-mastery-notes')!)).toEqual([{ id: 'n1', day: 1, content: 'hi' }])
    expect(JSON.parse(localStorage.getItem('react-mastery-annotations')!)).toHaveLength(1)
    expect(JSON.parse(localStorage.getItem('react-mastery-reflections')!)).toHaveLength(1)
    expect(JSON.parse(localStorage.getItem('react-mastery-flashcards')!)).toHaveLength(1)
    expect(JSON.parse(localStorage.getItem('react-mastery-snippets')!)).toHaveLength(1)
    expect(JSON.parse(localStorage.getItem('react-mastery-question-history')!)).toHaveLength(1)
    expect(settings.getSettings()).toMatchObject({ theme: 'dark', onboardingComplete: true, studyMode: true })
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true)
    expect(quizResume.peekQuizProgress()).toMatchObject({ day: 2, score: 1 })
    expect(analytics.toCloudJSON().some((e) => e.event === 'remote_event')).toBe(true)
    expect(helpful.hasMarkedHelpful('post-x')).toBe(true)
    expect(sessionStorage.getItem('rm-active-tab')).toBe('practice')
    expect(JSON.parse(sessionStorage.getItem('rm-lab-session')!)).toMatchObject({
      exercise: 'day02-reconciliation',
      view: 'community',
      tools: true,
    })
    expect(res.data?.cloud.progress.completedDays).toEqual([1, 2])
  })

  it('swallows sessionStorage failure when persisting active tab', async () => {
    const { sync } = await load()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({ cloud: richCloud(), quota })))
    const orig = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, k: string, v: string) {
      if (this === sessionStorage && k === 'rm-active-tab') throw new Error('x')
      return orig.call(this, k, v)
    })
    await expect(sync.pullAndMergeUserCloud()).resolves.toMatchObject({ changed: true })
  })

  it('skips optional sections when absent on the merged snapshot', async () => {
    const { sync, quizResume } = await load()
    const cloud = {
      ...emptySnapshot(),
      updatedAt: new Date(Date.now() + 1000).toISOString(),
      progress: { ...emptySnapshot().progress, completedDays: [4] },
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({ cloud, quota })))
    const res = await sync.pullAndMergeUserCloud()
    expect(res.changed).toBe(true)
    expect(quizResume.peekQuizProgress()).toBeNull()
  })
})

describe('syncUserCloudOnSignIn', () => {
  it('merges remote cloud into local, then PUTs the merged snapshot', async () => {
    const { sync, progress } = await load()
    progress.markDayCompleted(5)
    const cloud = richCloud()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonRes({ cloud, quota }))
      .mockResolvedValueOnce(jsonRes({ cloud, quota }))
    vi.stubGlobal('fetch', fetchMock)
    const res = await sync.syncUserCloudOnSignIn()
    expect(res).not.toBeNull()
    expect(fetchMock.mock.calls[0][1].method).toBe('GET')
    expect(fetchMock.mock.calls[1][1].method).toBe('PUT')
    const body = JSON.parse(fetchMock.mock.calls[1][1].body)
    expect(body.progress.completedDays).toEqual([1, 2, 5])
    expect(progress.getProgress().completedDays).toEqual([1, 2, 5])
  })

  it('retries the initial fetch once after 400ms', async () => {
    vi.useFakeTimers()
    const { sync } = await load()
    const cloud = richCloud()
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('token lag'))
      .mockResolvedValueOnce(jsonRes({ cloud, quota }))
      .mockResolvedValueOnce(jsonRes({ cloud, quota }))
    vi.stubGlobal('fetch', fetchMock)
    const p = sync.syncUserCloudOnSignIn({ exercise: 'day01-rendering-pipeline' })
    await vi.advanceTimersByTimeAsync(500)
    expect(await p).not.toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('pushes the local snapshot when the cloud is unreachable', async () => {
    vi.useFakeTimers()
    const { sync } = await load()
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('x'))
      .mockRejectedValueOnce(new Error('x'))
      .mockResolvedValueOnce(jsonRes({ cloud: emptySnapshot(), quota }))
    vi.stubGlobal('fetch', fetchMock)
    const p = sync.syncUserCloudOnSignIn()
    await vi.advanceTimersByTimeAsync(500)
    expect(await p).not.toBeNull()
    expect(fetchMock.mock.calls[2][1].method).toBe('PUT')
  })
})
