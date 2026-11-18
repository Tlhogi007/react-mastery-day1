/**
 * Maps day numbers to topics for question generation
 */
export const dayTopicMap: Record<number, string> = {
  1: 'rendering pipeline',
  2: 'reconciliation',
  3: 'fiber architecture',
  4: 'memoization',
  5: 'effects closures',
  6: 'context',
  7: 'weekly reflection',
  8: 'concurrent rendering',
  9: 'startTransition',
  10: 'automatic batching',
  11: 'suspense',
  12: 'ssr hydration',
  13: 'code splitting',
  14: 'performance audit',
  15: 'state strategy',
  16: 'state colocation',
  17: 'optimistic ui',
  18: 'micro-frontend',
  19: 'error boundaries',
  20: 'server components',
  21: 'architecture review',
  22: 'core concepts',
  23: 'debugging',
  24: 'trade-offs',
  25: 'whiteboard architecture',
  26: 'performance deep dive',
  27: 'behavioral technical',
  28: 'mock interview',
  29: 'staff-level thinking',
  30: 'final synthesis'
}

/**
 * Get topic for a specific day
 */
export function getTopicForDay(day: number): string {
  return dayTopicMap[day] || 'react'
}

/**
 * Get keywords for a topic (for AI generation)
 * Expanded with React internals keywords
 */
export function getTopicKeywords(topic: string): string[] {
  const keywordMap: Record<string, string[]> = {
    'rendering pipeline': ['Render Phase', 'Commit Phase', 'Virtual DOM', 'setState', 'DOM mutation', 'browser paint', 'reconciliation'],
    'reconciliation': ['Type Comparison', 'Keys', 'List Diffing', 'O(n) complexity', 'element matching', 'Virtual DOM diffing'],
    'fiber architecture': ['Fiber node', 'Current tree', 'WorkInProgress tree', 'alternate pointer', 'unit of work', 'interruptible', 'linked list'],
    'memoization': ['React.memo', 'useMemo', 'useCallback', 'referential equality', 'bailouts', 'shallow comparison'],
    'effects closures': ['useEffect', 'stale closures', 'dependency array', 'cleanup', 'timing', 'commit phase'],
    'context': ['Context API', 're-render propagation', 'provider value', 'consumer', 'blast radius', 'memoization'],
    'concurrent rendering': ['Fiber', 'interruptible', 'priority lanes', 'time slicing', 'concurrent mode', 'startTransition'],
    'startTransition': ['non-urgent updates', 'transitions', 'useTransition', 'priority', 'urgent vs non-urgent'],
    'automatic batching': ['batching', 'state updates', 're-renders', 'React 18', 'flushSync'],
    'suspense': ['Suspense boundaries', 'promise throwing', 'fallback', 'loading states', 'error boundaries'],
    'ssr hydration': ['server-side rendering', 'hydration', 'mismatch', 'deterministic rendering', 'event listeners'],
    'code splitting': ['React.lazy', 'dynamic import', 'route-based', 'bundle size', 'chunking']
  }

  const topicLower = topic.toLowerCase()
  for (const [key, keywords] of Object.entries(keywordMap)) {
    if (topicLower.includes(key)) {
      return keywords
    }
  }

  return [topic, 'React internals', 'rendering pipeline']
}
