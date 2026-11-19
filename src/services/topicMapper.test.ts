import { describe, expect, it } from 'vitest'
import { dayTopicMap, getTopicForDay, getTopicKeywords } from './topicMapper'

describe('getTopicForDay', () => {
  it('maps all 30 days', () => {
    expect(Object.keys(dayTopicMap)).toHaveLength(30)
    expect(getTopicForDay(1)).toBe('rendering pipeline')
    expect(getTopicForDay(30)).toBe('final synthesis')
  })

  it('falls back to react for unknown days', () => {
    expect(getTopicForDay(0)).toBe('react')
    expect(getTopicForDay(99)).toBe('react')
  })
})

describe('getTopicKeywords', () => {
  it('returns keywords for known topics (case-insensitive substring)', () => {
    expect(getTopicKeywords('rendering pipeline')).toContain('Render Phase')
    expect(getTopicKeywords('Deep Dive: SUSPENSE patterns')).toContain('Suspense boundaries')
    expect(getTopicKeywords('code splitting')).toContain('React.lazy')
  })

  it('returns a generic fallback for unknown topics', () => {
    expect(getTopicKeywords('quantum')).toEqual(['quantum', 'React internals', 'rendering pipeline'])
  })

  it('every mapped day topic with a keyword entry resolves', () => {
    expect(getTopicKeywords(getTopicForDay(11))).toContain('promise throwing')
  })
})
