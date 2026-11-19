import type { QuizQuestion } from '../../types/challenges'

export function asLocal(q: QuizQuestion): QuizQuestion {
  return q.source === 'ai' ? q : { ...q, source: 'local' }
}

export function asAi(q: QuizQuestion): QuizQuestion {
  return { ...q, source: 'ai' }
}

export function isLocalQuestion(q: QuizQuestion | undefined): boolean {
  return Boolean(q && q.source !== 'ai')
}
