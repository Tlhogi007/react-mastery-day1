import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  shouldNudgeDaySkip: vi.fn(),
}))

vi.mock('../lab/exercisesRegistry', () => {
  const Comp = () => null
  const exercises = {
    'day-a': { day: 1, week: 1, component: Comp },
    'day-b': { day: 2, week: 1, component: Comp },
    'day-c': { day: 3, week: 1, component: Comp },
  }
  return {
    exercises,
    exerciseKeyForDay: (day: number) =>
      Object.entries(exercises).find(([, v]) => v.day === day)?.[0],
  }
})
vi.mock('../lib/learningPath', () => ({
  shouldNudgeDaySkip: mocks.shouldNudgeDaySkip,
}))

import { useLabNavigation } from './useLabNavigation'
import { progressStorage } from '../services/progressStorage'

afterEach(() => cleanup())

function toasts() {
  const received: Array<{ message: string; type: string }> = []
  const handler = (e: Event) => received.push((e as CustomEvent).detail)
  window.addEventListener('showToast', handler)
  return { received, stop: () => window.removeEventListener('showToast', handler) }
}

function setup(over: Partial<Parameters<typeof useLabNavigation>[0]> = {}) {
  const onProgressBump = vi.fn()
  const hook = renderHook(
    (props: { epoch: number }) =>
      useLabNavigation({
        initialExercise: 'day-a',
        initialView: 'exercises',
        initialTools: true,
        shortcutsEnabled: true,
        onProgressBump,
        progressEpoch: props.epoch,
        ...over,
      }),
    { initialProps: { epoch: 0 } },
  )
  return { ...hook, onProgressBump }
}

beforeEach(() => {
  mocks.shouldNudgeDaySkip.mockReset().mockReturnValue(false)
  // progressStorage default object is shared across getProgress() calls when storage is empty;
  // always persist an explicit state so tests are isolated.
  progressStorage.saveProgress({
    completedDays: [],
    completedQuizzes: {},
    currentStreak: 0,
    lastActivityDate: '',
    quizScores: {},
  })
})

describe('useLabNavigation', () => {
  it('exposes initial state and exercise data', () => {
    const { result } = setup()
    expect(result.current.currentView).toBe('exercises')
    expect(result.current.currentExercise).toBe('day-a')
    expect(result.current.showTools).toBe(true)
    expect(result.current.currentExerciseData.day).toBe(1)
    expect(result.current.ExerciseComponent).toBeTypeOf('function')
    expect(result.current.isCurrentDayCompleted).toBe(false)
  })

  it('handleExerciseSelect switches exercise, resets view/tools, tracks and saves tab', () => {
    const { result } = setup({ initialView: 'settings' })
    act(() => result.current.handleExerciseSelect('day-b'))
    expect(result.current.currentExercise).toBe('day-b')
    expect(result.current.currentView).toBe('exercises')
    expect(result.current.showTools).toBe(false)
    expect(sessionStorage.getItem('rm-active-tab')).toBe('learn')
    expect(localStorage.getItem('react-mastery-analytics')).toContain('exercise_complete')
  })

  it('does not reset active tab when selecting the same exercise', () => {
    const { result } = setup()
    sessionStorage.setItem('rm-active-tab', 'practice')
    act(() => result.current.handleExerciseSelect('day-a'))
    expect(sessionStorage.getItem('rm-active-tab')).toBe('practice')
  })

  it('shows a nudge toast when skipping ahead', () => {
    mocks.shouldNudgeDaySkip.mockReturnValue(true)
    const t = toasts()
    const { result } = setup()
    act(() => result.current.handleExerciseSelect('day-c'))
    t.stop()
    expect(t.received).toHaveLength(1)
    expect(t.received[0]).toMatchObject({ type: 'info' })
    expect(t.received[0].message).toContain('Day 2')
  })

  it('handleNavigateToDay selects existing days and toasts for missing ones', () => {
    const t = toasts()
    const { result } = setup()
    act(() => result.current.handleNavigateToDay(3))
    expect(result.current.currentExercise).toBe('day-c')
    act(() => result.current.handleNavigateToDay(99))
    t.stop()
    expect(result.current.currentExercise).toBe('day-c')
    expect(t.received).toEqual([{ message: 'Day 99 is not available yet', type: 'error' }])
  })

  it('handleMarkComplete marks once, bumps progress and toasts', () => {
    const t = toasts()
    const { result, rerender, onProgressBump } = setup()
    act(() => result.current.handleMarkComplete())
    expect(progressStorage.isDayCompleted(1)).toBe(true)
    expect(onProgressBump).toHaveBeenCalledTimes(1)
    expect(t.received).toEqual([{ message: 'Day 1 marked complete', type: 'success' }])
    rerender({ epoch: 1 })
    expect(result.current.isCurrentDayCompleted).toBe(true)
    act(() => result.current.handleMarkComplete())
    t.stop()
    expect(onProgressBump).toHaveBeenCalledTimes(1)
    expect(t.received).toHaveLength(1)
  })

  it('keyboard shortcuts navigate next/previous within bounds when enabled', () => {
    const { result } = setup({ initialExercise: 'day-b' })
    const press = (key: string) =>
      act(() => {
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
      })
    press('j')
    expect(result.current.currentExercise).toBe('day-c')
    press('j') // at end: no-op
    expect(result.current.currentExercise).toBe('day-c')
    press('k')
    press('k')
    expect(result.current.currentExercise).toBe('day-a')
    press('k') // at start: no-op
    expect(result.current.currentExercise).toBe('day-a')
  })

  it('ignores shortcuts when disabled', () => {
    const { result } = setup({ shortcutsEnabled: false })
    act(() => {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', bubbles: true }))
    })
    expect(result.current.currentExercise).toBe('day-a')
  })

  it('setters update view, exercise and tools directly', () => {
    const { result } = setup()
    act(() => {
      result.current.setCurrentView('community')
      result.current.setShowTools(false)
      result.current.setCurrentExercise('day-c')
    })
    expect(result.current.currentView).toBe('community')
    expect(result.current.showTools).toBe(false)
    expect(result.current.currentExercise).toBe('day-c')
  })
})
