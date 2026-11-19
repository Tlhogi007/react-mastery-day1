import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyQuizProgress,
  clearQuizProgress,
  consumeAiResumePending,
  loadQuizProgress,
  markAiResumePending,
  peekAiResumePending,
  peekQuizProgress,
  saveQuizProgress,
  type QuizProgressSnapshot,
} from './quizResume'

const snap = (p: Partial<QuizProgressSnapshot> = {}): QuizProgressSnapshot => ({
  day: 2,
  currentQuestionIndex: 1,
  selectedAnswer: null,
  score: 1,
  completed: false,
  localQuestionsCompleted: false,
  aiEnabled: false,
  aiQuestionsLoaded: false,
  allQuestions: [{ id: 'q1', question: 'Q?', options: ['a', 'b'], correctAnswer: 0 } as never],
  usedLocalQuestionIds: ['q1'],
  incorrectAnswerIds: [],
  totalTimeSpent: 5,
  at: Date.now(),
  ...p,
})

afterEach(() => {
  vi.useRealTimers()
})

describe('AI resume pending', () => {
  it('marks, peeks and consumes', () => {
    expect(peekAiResumePending()).toBeNull()
    markAiResumePending({ day: 3, mode: 'generate', count: 5 })
    expect(peekAiResumePending()).toMatchObject({ day: 3, mode: 'generate', count: 5 })
    expect(consumeAiResumePending(4)).toBeNull()
    expect(consumeAiResumePending(3)).toMatchObject({ day: 3 })
    expect(peekAiResumePending()).toBeNull()
  })

  it('consume without day matches any', () => {
    markAiResumePending({ day: 1, mode: 'toggle' })
    expect(consumeAiResumePending()).toMatchObject({ mode: 'toggle' })
    expect(consumeAiResumePending()).toBeNull()
  })

  it('discards stale flags', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-19T12:00:00Z'))
    markAiResumePending({ day: 1, mode: 'toggle' })
    vi.setSystemTime(new Date('2026-11-19T12:31:00Z'))
    expect(peekAiResumePending()).toBeNull()
    expect(sessionStorage.getItem('rm-ai-resume')).toBeNull()
  })

  it('discards entries without a day and handles corrupt JSON', () => {
    sessionStorage.setItem('rm-ai-resume', JSON.stringify({ at: Date.now() }))
    expect(peekAiResumePending()).toBeNull()
    sessionStorage.setItem('rm-ai-resume', '{bad')
    expect(peekAiResumePending()).toBeNull()
  })

  it('tolerates storage failures', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('x')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('x')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('x')
    })
    expect(() => markAiResumePending({ day: 1, mode: 'toggle' })).not.toThrow()
    expect(peekAiResumePending()).toBeNull()
    expect(peekQuizProgress()).toBeNull()
    expect(() => clearQuizProgress()).not.toThrow()
  })
})

describe('quiz progress', () => {
  it('saves, peeks and loads by day, emitting dirty event', () => {
    const spy = vi.fn()
    window.addEventListener('rm-progress-changed', spy)
    saveQuizProgress(snap())
    expect(spy).toHaveBeenCalled()
    window.removeEventListener('rm-progress-changed', spy)
    expect(peekQuizProgress()?.day).toBe(2)
    expect(loadQuizProgress(2)?.score).toBe(1)
    expect(loadQuizProgress(3)).toBeNull()
  })

  it('returns null / removes when nothing, stale, or empty questions', () => {
    expect(peekQuizProgress()).toBeNull()
    expect(loadQuizProgress(1)).toBeNull()

    sessionStorage.setItem('rm-quiz-progress', JSON.stringify(snap({ at: Date.now() - 31 * 60_000 })))
    expect(peekQuizProgress()).toBeNull()
    expect(sessionStorage.getItem('rm-quiz-progress')).toBeNull()

    sessionStorage.setItem('rm-quiz-progress', JSON.stringify(snap({ allQuestions: [] })))
    expect(peekQuizProgress()).toBeNull()

    sessionStorage.setItem('rm-quiz-progress', '{bad')
    expect(peekQuizProgress()).toBeNull()
  })

  it('applyQuizProgress handles null, stale, empty, and valid', () => {
    applyQuizProgress(snap())
    expect(peekQuizProgress()).not.toBeNull()
    applyQuizProgress(null)
    expect(peekQuizProgress()).toBeNull()

    applyQuizProgress(snap())
    applyQuizProgress(snap({ at: Date.now() - 31 * 60_000 }))
    expect(sessionStorage.getItem('rm-quiz-progress')).toBeNull()

    applyQuizProgress(snap())
    applyQuizProgress(snap({ allQuestions: [] }))
    expect(sessionStorage.getItem('rm-quiz-progress')).toBeNull()
  })

  it('clearQuizProgress removes and emits', () => {
    saveQuizProgress(snap())
    const spy = vi.fn()
    window.addEventListener('rm-progress-changed', spy)
    clearQuizProgress()
    window.removeEventListener('rm-progress-changed', spy)
    expect(spy).toHaveBeenCalled()
    expect(peekQuizProgress()).toBeNull()
  })

  it('swallows dirty-event failures', () => {
    vi.spyOn(window, 'dispatchEvent').mockImplementation(() => {
      throw new Error('x')
    })
    expect(() => saveQuizProgress(snap())).not.toThrow()
  })
})
