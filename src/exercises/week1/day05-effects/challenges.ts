import type { Challenge, QuizQuestion, DebuggingScenario, RealWorldScenario } from '../../../types/challenges'

export const day05Challenges: Challenge[] = [
  {
    id: 'day05-challenge-1',
    title: 'Fix Stale Closure Bug',
    description: 'An effect uses an old state value. Fix it using three different approaches.',
    difficulty: 'hard',
    starterCode: `function Counter() {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      console.log(count) // ❌ Always logs 0
      setCount(count + 1)
    }, 1000)
    
    return () => clearInterval(interval)
  }, []) // Missing count dependency
  
  return <div>{count}</div>
}`,
    solution: `// Approach 1: Add dependency
useEffect(() => {
  const interval = setInterval(() => {
    setCount(count + 1)
  }, 1000)
  return () => clearInterval(interval)
}, [count]) // ✅ Include count

// Approach 2: Functional update
useEffect(() => {
  const interval = setInterval(() => {
    setCount(prev => prev + 1) // ✅ Use functional update
  }, 1000)
  return () => clearInterval(interval)
}, [])

// Approach 3: useRef for latest value
const countRef = useRef(count)
countRef.current = count
useEffect(() => {
  const interval = setInterval(() => {
    setCount(countRef.current + 1)
  }, 1000)
  return () => clearInterval(interval)
}, [])`,
    hints: [
      'Add missing dependencies to dependency array',
      'Use functional state updates',
      'Use useRef to store latest value'
    ],
    explanation: 'Stale closures occur when effects capture old values. Fix by including dependencies, using functional updates, or storing latest value in ref.'
  }
]

export const day05Quiz: QuizQuestion[] = [
  {
    id: 'day05-q1',
    question: 'When does useEffect run?',
    options: [
      'Before render',
      'After render and after DOM updates',
      'During render',
      'Only on mount'
    ],
    correctAnswer: 1,
    explanation: 'useEffect runs after the render phase and after the browser has painted the DOM updates. This is part of the commit phase.',
    difficulty: 'easy'
  },
  {
    id: 'day05-q2',
    question: 'What causes a stale closure in useEffect?',
    options: [
      'Missing dependency array',
      'Using old state values in the effect',
      'Not cleaning up',
      'Running effects synchronously'
    ],
    correctAnswer: 1,
    explanation: 'Stale closures occur when an effect captures old state/props values because the dependency array is missing or incomplete.',
    difficulty: 'medium'
  },
  {
    id: 'day05-q3',
    question: 'What is the cleanup function in useEffect used for?',
    options: [
      'To clean up state',
      'To unsubscribe from subscriptions, remove event listeners, or cancel requests',
      'To reset props',
      'To prevent re-renders'
    ],
    correctAnswer: 1,
    explanation: 'The cleanup function runs before the effect runs again or when the component unmounts, allowing you to clean up side effects.',
    difficulty: 'easy'
  },
  {
    id: 'day05-q4',
    question: 'Why might useEffect run twice in development?',
    options: [
      'It\'s a bug',
      'React StrictMode intentionally double-invokes effects',
      'The dependency array is wrong',
      'The component renders twice'
    ],
    correctAnswer: 1,
    explanation: 'React StrictMode in development intentionally runs effects twice to help detect side effects and ensure cleanup works correctly.',
    difficulty: 'medium'
  },
  {
    id: 'day05-q5',
    question: 'What happens if you forget to include a dependency in the dependency array?',
    options: [
      'Nothing, it works fine',
      'The effect uses stale values',
      'React throws an error',
      'The effect never runs'
    ],
    correctAnswer: 1,
    explanation: 'Missing dependencies cause the effect to use stale values from when it was created, leading to bugs.',
    difficulty: 'medium'
  },
  {
    id: 'day05-q6',
    question: 'How can you fix a stale closure without adding dependencies?',
    options: [
      'You can\'t, you must add dependencies',
      'Use functional state updates or useRef to store latest value',
      'Remove the dependency array',
      'Use useLayoutEffect instead'
    ],
    correctAnswer: 1,
    explanation: 'You can use functional state updates (setState(prev => ...)) or useRef to store the latest value, avoiding stale closures without adding dependencies.',
    difficulty: 'hard'
  }
]

export const day05Debugging: DebuggingScenario[] = [
  {
    id: 'day05-debug-1',
    title: 'Effect Runs on Every Render',
    description: 'An effect that should only run once runs on every render, causing performance issues.',
    buggyCode: `function Component({ userId }) {
  useEffect(() => {
    fetchUser(userId)
  }) // ❌ Missing dependency array
  
  return <div>...</div>
}`,
    fixedCode: `function Component({ userId }) {
  useEffect(() => {
    fetchUser(userId)
  }, [userId]) // ✅ Include userId in dependencies
  
  return <div>...</div>
}`,
    bugExplanation: 'Missing dependency array causes the effect to run after every render. Add dependencies to control when it runs.',
    hints: [
      'Effects without dependency arrays run after every render',
      'Add a dependency array with the values the effect depends on',
      'Empty array [] means run only on mount'
    ]
  }
]

export const day05RealWorld: RealWorldScenario[] = [
  {
    id: 'day05-real-1',
    title: 'Memory Leak from Event Listeners',
    description: 'A component adds event listeners but doesn\'t clean them up, causing memory leaks.',
    problem: 'Event listeners accumulate on every re-render because cleanup function is missing, causing memory leaks and performance degradation.',
    solution: 'Always return a cleanup function from useEffect that removes event listeners.',
    codeExample: `// Before: Memory leak
useEffect(() => {
  window.addEventListener('resize', handleResize)
  // ❌ No cleanup
}, [])

// After: Proper cleanup
useEffect(() => {
  window.addEventListener('resize', handleResize)
  return () => {
    window.removeEventListener('resize', handleResize) // ✅ Cleanup
  }
}, [])`,
    relatedDays: [5, 14]
  }
]
