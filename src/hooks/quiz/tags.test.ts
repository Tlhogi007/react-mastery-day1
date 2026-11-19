import { describe, expect, it } from 'vitest'
import type { QuizQuestion } from '../../types/challenges'
import { asAi, asLocal, isLocalQuestion } from './tags'

const q = (extra: Partial<QuizQuestion> = {}): QuizQuestion => ({
  id: 'q1',
  question: 'Q?',
  options: ['a', 'b'],
  correctAnswer: 0,
  explanation: 'because',
  ...extra,
})

describe('quiz tags', () => {
  it('asLocal tags untagged questions as local without mutating', () => {
    const original = q()
    const out = asLocal(original)
    expect(out.source).toBe('local')
    expect(original.source).toBeUndefined()
  })

  it('asLocal preserves ai questions (same reference)', () => {
    const ai = q({ source: 'ai' })
    expect(asLocal(ai)).toBe(ai)
  })

  it('asAi always tags ai', () => {
    expect(asAi(q({ source: 'local' })).source).toBe('ai')
  })

  it('isLocalQuestion', () => {
    expect(isLocalQuestion(undefined)).toBe(false)
    expect(isLocalQuestion(q())).toBe(true)
    expect(isLocalQuestion(q({ source: 'local' }))).toBe(true)
    expect(isLocalQuestion(q({ source: 'ai' }))).toBe(false)
  })
})
