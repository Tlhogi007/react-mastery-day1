import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flashcardStorage } from './flashcardStorage'

const DAY = 24 * 60 * 60 * 1000

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-19T12:00:00Z'))
  flashcardStorage.clearAll()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('creation', () => {
  it('creates a custom flashcard with SM-2 defaults', () => {
    const id = flashcardStorage.createFlashcard('front', 'back', 1, 'rendering')
    const [card] = flashcardStorage.getFlashcards()
    expect(card).toMatchObject({
      id,
      front: 'front',
      back: 'back',
      day: 1,
      topic: 'rendering',
      difficulty: 'medium',
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      lastReviewDate: null,
    })
    expect(card.nextReviewDate).toBe(new Date().toISOString())
  })

  it('creates from quiz question with explicit difficulty', () => {
    const id = flashcardStorage.createFromQuizQuestion('q1', 'Q', 'Because', 2, 'keys', 'hard')
    expect(id).toMatch(/^card-q1-/)
    expect(flashcardStorage.getFlashcards()[0]).toMatchObject({ front: 'Q', back: 'Because', difficulty: 'hard' })
    flashcardStorage.createFromQuizQuestion('q2', 'Q', 'B', 2, 'keys')
    expect(flashcardStorage.getFlashcards()[1].difficulty).toBe('medium')
  })

  it('filters by day', () => {
    flashcardStorage.createFlashcard('a', 'b', 1, 't')
    flashcardStorage.createFlashcard('a', 'b', 2, 't')
    expect(flashcardStorage.getFlashcardsForDay(2)).toHaveLength(1)
  })
})

describe('reviewFlashcard (SM-2)', () => {
  function newCard() {
    return flashcardStorage.createFlashcard('f', 'b', 1, 't')
  }
  const get = (id: string) => flashcardStorage.getFlashcards().find((c) => c.id === id)!

  it('returns false for unknown card', () => {
    expect(flashcardStorage.reviewFlashcard('missing', 5)).toBe(false)
  })

  it('first success → 1 day, second → 6 days, then interval × ease', () => {
    const id = newCard()
    flashcardStorage.reviewFlashcard(id, 5)
    expect(get(id)).toMatchObject({ interval: 1, repetitions: 1 })
    expect(get(id).easeFactor).toBeCloseTo(2.6, 5)

    flashcardStorage.reviewFlashcard(id, 5)
    expect(get(id)).toMatchObject({ interval: 6, repetitions: 2 })

    flashcardStorage.reviewFlashcard(id, 5)
    const c = get(id)
    expect(c.repetitions).toBe(3)
    expect(c.easeFactor).toBeCloseTo(2.8, 5)
    expect(c.interval).toBe(Math.round(6 * 2.8))
    expect(c.lastReviewDate).toBe(new Date().toISOString())
    expect(new Date(c.nextReviewDate).getTime()).toBe(Date.now() + c.interval * DAY)
  })

  it('quality 3 passes but lowers ease factor', () => {
    const id = newCard()
    flashcardStorage.reviewFlashcard(id, 3)
    expect(get(id).repetitions).toBe(1)
    expect(get(id).easeFactor).toBeCloseTo(2.36, 5)
  })

  it('failing quality resets repetitions and interval', () => {
    const id = newCard()
    flashcardStorage.reviewFlashcard(id, 5)
    flashcardStorage.reviewFlashcard(id, 5)
    flashcardStorage.reviewFlashcard(id, 1)
    expect(get(id)).toMatchObject({ interval: 0, repetitions: 0 })
    expect(get(id).nextReviewDate).toBe(new Date().toISOString())
  })

  it('never drops ease factor below 1.3', () => {
    const id = newCard()
    for (let i = 0; i < 20; i++) flashcardStorage.reviewFlashcard(id, 0)
    expect(get(id).easeFactor).toBe(1.3)
  })
})

describe('due / stats / update / delete', () => {
  it('due and needing-review lists', () => {
    const a = flashcardStorage.createFlashcard('a', 'b', 1, 't')
    const b = flashcardStorage.createFlashcard('c', 'd', 1, 't')
    flashcardStorage.reviewFlashcard(b, 5) // due in 1 day
    expect(flashcardStorage.getDueFlashcards().map((c) => c.id)).toEqual([a])
    expect(flashcardStorage.getFlashcardsNeedingReview().map((c) => c.id)).toEqual([a])
    vi.setSystemTime(new Date(Date.now() + 2 * DAY))
    expect(flashcardStorage.getDueFlashcards()).toHaveLength(2)
  })

  it('needing-review includes never-reviewed cards scheduled in future', () => {
    const id = flashcardStorage.createFlashcard('a', 'b', 1, 't')
    flashcardStorage.updateFlashcard(id, { nextReviewDate: new Date(Date.now() + DAY).toISOString() })
    expect(flashcardStorage.getDueFlashcards()).toEqual([])
    expect(flashcardStorage.getFlashcardsNeedingReview()).toHaveLength(1)
  })

  it('stats count total/due/mastered/struggling', () => {
    const a = flashcardStorage.createFlashcard('a', 'b', 1, 't')
    const b = flashcardStorage.createFlashcard('c', 'd', 1, 't')
    flashcardStorage.updateFlashcard(a, {
      interval: 45,
      nextReviewDate: new Date(Date.now() + DAY).toISOString(),
    })
    flashcardStorage.updateFlashcard(b, { easeFactor: 1.4 })
    flashcardStorage.updateFlashcard(b, { easeFactor: 1.3 })
    expect(flashcardStorage.getStats()).toEqual({ total: 2, due: 1, mastered: 1, struggling: 1 })
  })

  it('update returns false for missing; delete removes', () => {
    expect(flashcardStorage.updateFlashcard('missing', { front: 'x' })).toBe(false)
    const id = flashcardStorage.createFlashcard('a', 'b', 1, 't')
    expect(flashcardStorage.updateFlashcard(id, { front: 'x' })).toBe(true)
    expect(flashcardStorage.getFlashcards()[0].front).toBe('x')
    expect(flashcardStorage.deleteFlashcard(id)).toBe(true)
    expect(flashcardStorage.getFlashcards()).toEqual([])
  })

  it('warns on corrupt storage and write failure', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem('react-mastery-flashcards', '{bad')
    expect(flashcardStorage.getFlashcards()).toEqual([])
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    flashcardStorage.createFlashcard('a', 'b', 1, 't')
    expect(warn.mock.calls.length).toBeGreaterThanOrEqual(2)
  })
})
