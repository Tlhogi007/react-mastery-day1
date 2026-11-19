import { lazy } from 'react'
import type { ExerciseKey, ExercisesRegistry } from '../types/exercises'

const Day01RenderingPipeline = lazy(() => import('../exercises/week1/day01-rendering-pipeline/App'))
const Day02Reconciliation = lazy(() => import('../exercises/week1/day02-reconciliation/App'))
const Day03Fiber = lazy(() => import('../exercises/week1/day03-fiber/App'))
const Day04Memoization = lazy(() => import('../exercises/week1/day04-memoization/App'))
const Day05Effects = lazy(() => import('../exercises/week1/day05-effects/App'))
const Day06Context = lazy(() => import('../exercises/week1/day06-context/App'))
const Day07Reflection = lazy(() => import('../exercises/week1/day07-reflection/App'))

export const exercises: ExercisesRegistry = {
  'day01-rendering-pipeline': {
    title: 'Day 1: Rendering Pipeline',
    component: Day01RenderingPipeline,
    week: 1,
    day: 1,
    description: 'Understand Render Phase vs Commit Phase, Virtual DOM, and Diffing basics',
  },
  'day02-reconciliation': {
    title: 'Day 2: Reconciliation Deep Dive',
    component: Day02Reconciliation,
    week: 1,
    day: 2,
    description: 'Master Type Comparison Rule, Keys and Identity, and List Diffing Complexity',
  },
  'day03-fiber': {
    title: 'Day 3: Fiber Architecture',
    component: Day03Fiber,
    week: 1,
    day: 3,
    description: 'Understand Fiber Node Structure, Current vs WorkInProgress tree, and Unit of Work model',
  },
  'day04-memoization': {
    title: 'Day 4: Bailouts & Memoization',
    component: Day04Memoization,
    week: 1,
    day: 4,
    description: 'Master React.memo, useMemo, useCallback, and referential equality',
  },
  'day05-effects': {
    title: 'Day 5: Effects & Closures',
    component: Day05Effects,
    week: 1,
    day: 5,
    description: 'Master useEffect timing, cleanup, stale closures, and dependency array traps',
  },
  'day06-context': {
    title: 'Day 6: Context & Re-render Propagation',
    component: Day06Context,
    week: 1,
    day: 6,
    description: 'Understand why all consumers re-render, splitting contexts, and memoizing provider values',
  },
  'day07-reflection': {
    title: 'Day 7: Weekly Deep Reflection',
    component: Day07Reflection,
    week: 1,
    day: 7,
    description: 'Test your understanding of Week 1 concepts - be able to explain without notes',
  },
}

export interface SearchResult {
  day: number
  title: string
  section: string
  content: string
}

const CONCEPT_MAP: Record<string, { day: number; concepts: string[] }> = {
  'render phase': { day: 1, concepts: ['Render Phase', 'Rendering Pipeline'] },
  'commit phase': { day: 1, concepts: ['Commit Phase', 'DOM Updates'] },
  'virtual dom': { day: 1, concepts: ['Virtual DOM', 'Diffing'] },
  reconciliation: { day: 2, concepts: ['Reconciliation', 'Keys'] },
  keys: { day: 2, concepts: ['Keys', 'Identity'] },
  fiber: { day: 3, concepts: ['Fiber', 'Architecture'] },
  memo: { day: 4, concepts: ['Memoization', 'React.memo'] },
  usememo: { day: 4, concepts: ['useMemo', 'Memoization'] },
  usecallback: { day: 4, concepts: ['useCallback', 'Memoization'] },
}

const DAY_KEYS: Record<number, ExerciseKey> = {
  1: 'day01-rendering-pipeline',
  2: 'day02-reconciliation',
  3: 'day03-fiber',
  4: 'day04-memoization',
  5: 'day05-effects',
  6: 'day06-context',
  7: 'day07-reflection',
}

/** Filter exercises + concept matches. Does not navigate. */
export function searchExercises(query: string): SearchResult[] {
  if (query.length === 0) return []

  const q = query.toLowerCase()
  const results: SearchResult[] = []

  Object.values(exercises).forEach((exercise) => {
    if (
      exercise.title.toLowerCase().includes(q) ||
      exercise.description?.toLowerCase().includes(q)
    ) {
      results.push({
        day: exercise.day,
        title: exercise.title,
        section: 'Exercise',
        content: exercise.description || '',
      })
    }
  })

  Object.entries(CONCEPT_MAP).forEach(([term, data]) => {
    if (!q.includes(term)) return
    data.concepts.forEach((concept) => {
      results.push({
        day: data.day,
        title: exercises[DAY_KEYS[data.day]]?.title || '',
        section: concept,
        content: `Learn about ${concept} in Day ${data.day}`,
      })
    })
  })

  return results.slice(0, 10)
}

export function exerciseKeyForDay(day: number): ExerciseKey | undefined {
  const entry = (Object.entries(exercises) as [ExerciseKey, (typeof exercises)[ExerciseKey]][]).find(
    ([, exercise]) => exercise.day === day,
  )
  return entry?.[0]
}
