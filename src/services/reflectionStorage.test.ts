import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultPrompts, reflectionStorage } from './reflectionStorage'

beforeEach(() => {
  reflectionStorage.clearAll()
})

describe('prompts', () => {
  it('returns prompts for a day', () => {
    const prompts = reflectionStorage.getPromptsForDay(1)
    expect(prompts).toHaveLength(3)
    expect(prompts.every((p) => p.day === 1)).toBe(true)
  })

  it('returns empty list for days without prompts', () => {
    expect(reflectionStorage.getPromptsForDay(30)).toEqual([])
  })

  it('exposes default prompts for days 1–7 with unique ids', () => {
    expect(new Set(defaultPrompts.map((p) => p.id)).size).toBe(defaultPrompts.length)
    expect(new Set(defaultPrompts.map((p) => p.day))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7]))
  })
})

describe('reflections', () => {
  it('starts empty and saves/gets by day', () => {
    expect(reflectionStorage.getReflections()).toEqual([])
    const id = reflectionStorage.saveReflection('P1', 'R1', 1)
    reflectionStorage.saveReflection('P2', 'R2', 2)
    expect(id).toMatch(/^reflection-/)
    expect(reflectionStorage.getReflectionsForDay(1)).toHaveLength(1)
    expect(reflectionStorage.getReflectionsForDay(1)[0]).toMatchObject({ id, prompt: 'P1', response: 'R1' })
    expect(reflectionStorage.getReflectionsForDay(9)).toEqual([])
  })

  it('updates responses and bumps updatedAt', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const id = reflectionStorage.saveReflection('P', 'old', 1)
    vi.setSystemTime(new Date('2026-01-02T00:00:00Z'))
    expect(reflectionStorage.updateReflection(id, 'new')).toBe(true)
    const r = reflectionStorage.getReflections()[0]
    expect(r.response).toBe('new')
    expect(r.updatedAt).toBe('2026-01-02T00:00:00.000Z')
    expect(r.createdAt).toBe('2026-01-01T00:00:00.000Z')
    expect(reflectionStorage.updateReflection('missing', 'x')).toBe(false)
    vi.useRealTimers()
  })

  it('deletes reflections', () => {
    const id = reflectionStorage.saveReflection('P', 'R', 1)
    expect(reflectionStorage.deleteReflection(id)).toBe(true)
    expect(reflectionStorage.getReflections()).toEqual([])
  })

  it('exports JSON', () => {
    reflectionStorage.saveReflection('P', 'R', 1)
    const out = JSON.parse(reflectionStorage.exportReflections())
    expect(out.reflections).toHaveLength(1)
    expect(typeof out.exportedAt).toBe('string')
  })

  it('warns on corrupt storage and write failures', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem('react-mastery-reflections', '{bad')
    expect(reflectionStorage.getReflections()).toEqual([])
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    reflectionStorage.saveReflection('P', 'R', 1)
    expect(warn.mock.calls.length).toBeGreaterThanOrEqual(2)
  })
})
