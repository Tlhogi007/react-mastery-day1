import type { Challenge, QuizQuestion, DebuggingScenario, RealWorldScenario } from '../../../types/challenges'

export const day04Challenges: Challenge[] = [
  {
    id: 'day04-challenge-1',
    title: 'Optimize with React.memo',
    description: 'A component re-renders unnecessarily. Use React.memo to prevent re-renders when props haven\'t changed.',
    difficulty: 'medium',
    starterCode: `function UserCard({ user, onEdit }) {
  console.log('UserCard rendering')
  return (
    <div>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <button onClick={onEdit}>Edit</button>
    </div>
  )
}

// Parent re-renders frequently, causing UserCard to re-render
// even when user props haven't changed`,
    solution: `import { memo } from 'react'

const UserCard = memo(function UserCard({ user, onEdit }) {
  console.log('UserCard rendering')
  return (
    <div>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <button onClick={onEdit}>Edit</button>
    </div>
  )
})`,
    hints: [
      'Use React.memo to wrap the component',
      'React.memo does shallow comparison of props',
      'Ensure props are referentially stable'
    ],
    explanation: 'React.memo performs a shallow comparison of props. If props are referentially equal, it skips re-rendering.'
  }
]

export const day04Quiz: QuizQuestion[] = [
  {
    id: 'day04-q1',
    question: 'What is the primary purpose of React.memo?',
    options: [
      'To memoize expensive calculations',
      'To prevent re-renders when props haven\'t changed',
      'To cache API responses',
      'To optimize bundle size'
    ],
    correctAnswer: 1,
    explanation: 'React.memo is a higher-order component that prevents re-renders when props are referentially equal, not when they contain the same values.',
    difficulty: 'easy'
  },
  {
    id: 'day04-q2',
    question: 'When should you use useMemo?',
    options: [
      'For all expensive calculations',
      'Only when the calculation depends on props/state that change frequently',
      'To prevent all re-renders',
      'Instead of useState'
    ],
    correctAnswer: 1,
    explanation: 'useMemo should be used for expensive calculations that depend on specific values. Overusing it can actually hurt performance due to memoization overhead.',
    difficulty: 'medium'
  },
  {
    id: 'day04-q3',
    question: 'What is referential equality?',
    options: [
      'Comparing values by their content',
      'Comparing object references (===)',
      'Deep equality comparison',
      'Comparing by type'
    ],
    correctAnswer: 1,
    explanation: 'Referential equality uses === to check if two references point to the same object in memory, not if they have the same content.',
    difficulty: 'medium'
  },
  {
    id: 'day04-q4',
    question: 'What is the difference between useMemo and useCallback?',
    options: [
      'useMemo memoizes values, useCallback memoizes functions',
      'They are the same',
      'useMemo is for components, useCallback is for hooks',
      'useMemo is faster'
    ],
    correctAnswer: 0,
    explanation: 'useMemo memoizes the result of a computation, while useCallback memoizes the function itself. Both prevent unnecessary recalculations.',
    difficulty: 'medium'
  },
  {
    id: 'day04-q5',
    question: 'When should you NOT use memoization?',
    options: [
      'When props change frequently',
      'When the memoization overhead exceeds the computation cost',
      'For simple calculations',
      'All of the above'
    ],
    correctAnswer: 3,
    explanation: 'Memoization has overhead. Don\'t use it for simple calculations, when props change frequently, or when overhead exceeds benefit.',
    difficulty: 'medium'
  }
]

export const day04Debugging: DebuggingScenario[] = [
  {
    id: 'day04-debug-1',
    title: 'React.memo Not Working',
    description: 'You wrapped a component with React.memo but it still re-renders on every parent update.',
    buggyCode: `const MemoizedComponent = React.memo(Component)

function Parent() {
  const [count, setCount] = useState(0)
  const data = { value: 42 } // ❌ New object every render
  
  return <MemoizedComponent data={data} />
}`,
    fixedCode: `const MemoizedComponent = React.memo(Component)

function Parent() {
  const [count, setCount] = useState(0)
  const data = useMemo(() => ({ value: 42 }), []) // ✅ Stable reference
  
  return <MemoizedComponent data={data} />
}`,
    bugExplanation: 'React.memo uses shallow comparison. If you pass a new object every render, React.memo sees different props and re-renders. Memoize the object with useMemo.',
    hints: [
      'React.memo does shallow comparison',
      'New objects are created every render',
      'Use useMemo to create stable references'
    ]
  }
]

export const day04RealWorld: RealWorldScenario[] = [
  {
    id: 'day04-real-1',
    title: 'Dashboard Performance',
    description: 'A dashboard with 50 widgets re-renders when any single widget updates, causing lag.',
    problem: 'All widgets re-render because the parent passes new object references on every update, even though most widgets\' props haven\'t changed.',
    solution: 'Use React.memo on widgets and ensure props are memoized. Only widgets with changed props will re-render.',
    codeExample: `// Before: All widgets re-render
{widgets.map(w => <Widget key={w.id} config={w} />)}

// After: Only changed widgets re-render
const MemoizedWidget = React.memo(Widget)
{widgets.map(w => (
  <MemoizedWidget 
    key={w.id} 
    config={useMemo(() => w, [w.id, w.data])} 
  />
))}`,
    relatedDays: [4, 14]
  }
]
