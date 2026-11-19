import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const KEY = 'react-mastery-analytics'

async function fresh() {
  vi.resetModules()
  const mod = await import('./analytics')
  return mod.analytics
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-19T12:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('analytics', () => {
  it('tracks session_start on construction and persists', async () => {
    const a = await fresh()
    const stored = JSON.parse(localStorage.getItem(KEY)!)
    expect(stored).toHaveLength(1)
    expect(stored[0].event).toBe('session_start')
    expect(a.getSummary().totalEvents).toBe(1)
  })

  it('loads previously stored events', async () => {
    localStorage.setItem(KEY, JSON.stringify([{ event: 'x', timestamp: 1 }]))
    const a = await fresh()
    expect(a.getSummary().eventsByType).toEqual({ x: 1, session_start: 1 })
  })

  it('handles corrupt storage and null JSON', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem(KEY, '{bad')
    let a = await fresh()
    expect(warn).toHaveBeenCalled()
    expect(a.getSummary().totalEvents).toBe(1)
    localStorage.setItem(KEY, 'null')
    a = await fresh()
    expect(a.getSummary().totalEvents).toBe(1)
  })

  it('warns if save fails', async () => {
    const a = await fresh()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    a.track('foo')
    expect(warn).toHaveBeenCalled()
  })

  it('typed trackers emit the right events', async () => {
    const a = await fresh()
    a.trackExerciseComplete(3, 1)
    a.trackQuizComplete(3, 80, true)
    a.trackQuizComplete(4, 20, false)
    a.trackTimeSpent(3, 10)
    a.trackTimeSpent(4, 5)
    a.trackSearch('hooks', 4)
    a.trackFeatureUsage('theme', { mode: 'dark' })
    const summary = a.getSummary()
    expect(summary.eventsByType).toMatchObject({
      exercise_complete: 1,
      quiz_complete: 2,
      time_spent: 2,
      search: 1,
      feature_usage: 1,
    })
    expect(summary.recentEvents[0].event).toBe('feature_usage')
    expect(summary.recentEvents[0].properties).toEqual({ feature: 'theme', mode: 'dark' })
    const ex = a.toCloudJSON().find((e) => e.event === 'exercise_complete')!
    expect(ex.properties).toEqual({ day: 3, week: 1, exercise: 'day03' })
    const times = a.toCloudJSON().filter((e) => e.event === 'time_spent')
    expect(times[1].properties?.totalMinutes).toBe(15)
  })

  it('getSummary computes session duration', async () => {
    const a = await fresh()
    vi.setSystemTime(new Date('2026-11-19T12:05:30Z'))
    expect(a.getSummary().sessionDuration).toBe(5)
  })

  it('getUserProgress aggregates', async () => {
    const a = await fresh()
    a.trackExerciseComplete(1, 1)
    a.trackQuizComplete(1, 90, true)
    a.trackQuizComplete(2, 10, false)
    a.trackTimeSpent(1, 7)
    a.track('time_spent', { minutes: 'bad' })
    const p = a.getUserProgress()
    expect(p).toMatchObject({ exercisesCompleted: 1, quizzesPassed: 1, totalTimeSpent: 7, streak: 0 })
    expect(p.lastActivity).toBe('2026-11-19T12:00:00.000Z')
  })

  it('getUserProgress with no events uses now', async () => {
    const a = await fresh()
    a.clear()
    expect(localStorage.getItem(KEY)).toBeNull()
    expect(a.getUserProgress().lastActivity).toBe('2026-11-19T12:00:00.000Z')
    expect(a.getSummary().totalEvents).toBe(0)
  })

  it('toCloudJSON caps at 400, storage caps at 1000', async () => {
    const a = await fresh()
    for (let i = 0; i < 1100; i++) a.track('e')
    expect(a.toCloudJSON()).toHaveLength(400)
    expect(JSON.parse(localStorage.getItem(KEY)!)).toHaveLength(1000)
  })

  it('mergeFromCloud dedupes, validates and sorts', async () => {
    const a = await fresh()
    const t = Date.now()
    a.mergeFromCloud([
      { event: 'a', timestamp: t + 10, properties: { x: 1 } },
      { event: 'a', timestamp: String(t + 10) },
      { event: 'b', timestamp: t - 10 },
      { event: 5, timestamp: 1 },
      { event: 'c', timestamp: 'NaN' },
      null,
      'str',
    ])
    const events = a.toCloudJSON()
    expect(events.map((e) => e.event)).toEqual(['b', 'session_start', 'a'])
    expect(events[2].properties).toEqual({ x: 1 })
  })

  it('mergeFromCloud ignores non-arrays', async () => {
    const a = await fresh()
    a.mergeFromCloud({ not: 'array' })
    a.mergeFromCloud(null)
    expect(a.getSummary().totalEvents).toBe(1)
  })

  it('export returns JSON with events, summary and progress', async () => {
    const a = await fresh()
    const out = JSON.parse(a.export())
    expect(out.events).toHaveLength(1)
    expect(out.summary.totalEvents).toBe(1)
    expect(out.userProgress.exercisesCompleted).toBe(0)
  })
})
