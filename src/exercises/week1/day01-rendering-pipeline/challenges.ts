import type { Challenge, QuizQuestion, DebuggingScenario, RealWorldScenario } from '../../../types/challenges'

export const day01Challenges: Challenge[] = [
  {
    id: 'day01-challenge-1',
    title: 'Fix Excessive Re-renders',
    description: 'A component re-renders on every parent update. Optimize it to only re-render when its props actually change.',
    difficulty: 'medium',
    starterCode: `function ExpensiveComponent({ data, onUpdate }) {
  // This component re-renders even when 'data' hasn't changed
  console.log('Rendering ExpensiveComponent')
  
  const expensiveValue = data.items.reduce((sum, item) => {
    // Expensive calculation
    return sum + item.value * 2
  }, 0)
  
  return (
    <div>
      <p>Expensive Value: {expensiveValue}</p>
      <button onClick={onUpdate}>Update</button>
    </div>
  )
}

// Your task: Prevent unnecessary re-renders`,
    solution: `import { memo, useMemo } from 'react'

const ExpensiveComponent = memo(function ExpensiveComponent({ data, onUpdate }) {
  console.log('Rendering ExpensiveComponent')
  
  const expensiveValue = useMemo(() => {
    return data.items.reduce((sum, item) => {
      return sum + item.value * 2
    }, 0)
  }, [data.items])
  
  return (
    <div>
      <p>Expensive Value: {expensiveValue}</p>
      <button onClick={onUpdate}>Update</button>
    </div>
  )
})`,
    hints: [
      'Use React.memo to prevent re-renders when props haven\'t changed',
      'Use useMemo to memoize expensive calculations',
      'Ensure the data prop has stable reference equality'
    ],
    explanation: 'React.memo prevents re-renders when props are referentially equal. useMemo prevents recalculating expensive values.'
  }
]

export const day01Quiz: QuizQuestion[] = [
  {
    id: 'day01-q1',
    question: 'When does the render phase execute?',
    options: [
      'Only when state changes',
      'When React needs to determine what changed (can be interrupted)',
      'Only during initial mount',
      'After DOM updates'
    ],
    correctAnswer: 1,
    explanation: 'The render phase executes whenever React needs to determine what changed. It can be interrupted in React 18+ to handle urgent work.',
    difficulty: 'easy'
  },
  {
    id: 'day01-q2',
    question: 'What happens during the commit phase?',
    options: [
      'Component functions are called',
      'Virtual DOM is created',
      'DOM is updated and effects run (synchronous)',
      'Diffing occurs'
    ],
    correctAnswer: 2,
    explanation: 'The commit phase is synchronous and applies DOM updates, runs effects, and executes cleanup functions.',
    difficulty: 'easy'
  },
  {
    id: 'day01-q3',
    question: 'Why is the render phase interruptible but commit phase is not?',
    options: [
      'Render phase is faster',
      'Commit phase must be atomic to prevent visual glitches',
      'Render phase doesn\'t matter',
      'Commit phase is optional'
    ],
    correctAnswer: 1,
    explanation: 'Commit phase must be atomic - if interrupted, you\'d see partial DOM updates causing visual glitches. Effects must run in order.',
    difficulty: 'medium'
  },
  {
    id: 'day01-q4',
    question: 'What is the Virtual DOM?',
    options: [
      'A faster version of the real DOM',
      'A JavaScript representation of the DOM used for efficient diffing',
      'A browser API',
      'A React component type'
    ],
    correctAnswer: 1,
    explanation: 'The Virtual DOM is a JavaScript representation of the DOM that React uses to efficiently determine what changed before updating the real DOM.',
    difficulty: 'easy'
  },
  {
    id: 'day01-q5',
    question: 'What is the relationship between render phase and commit phase?',
    options: [
      'They run in parallel',
      'Render phase must complete before commit phase starts',
      'Commit phase runs first',
      'They are independent'
    ],
    correctAnswer: 1,
    explanation: 'The render phase must complete (or be interrupted) before the commit phase can start. Commit phase applies the changes determined during render.',
    difficulty: 'medium'
  }
]

export const day01Debugging: DebuggingScenario[] = [
  {
    id: 'day01-debug-1',
    title: 'Component Re-renders on Every Keystroke',
    description: 'A search input causes the entire app to re-render on every keystroke, making it laggy.',
    buggyCode: `function App() {
  const [search, setSearch] = useState('')
  const [data, setData] = useState(largeDataSet)
  
  const filtered = data.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  )
  
  return (
    <div>
      <input 
        value={search} 
        onChange={(e) => setSearch(e.target.value)} 
      />
      <ExpensiveList items={filtered} />
    </div>
  )
}`,
    fixedCode: `import { useMemo, useState } from 'react'

function App() {
  const [search, setSearch] = useState('')
  const [data, setData] = useState(largeDataSet)
  
  const filtered = useMemo(() => {
    return data.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [data, search])
  
  return (
    <div>
      <input 
        value={search} 
        onChange={(e) => setSearch(e.target.value)} 
      />
      <ExpensiveList items={filtered} />
    </div>
  )
}`,
    bugExplanation: 'The filter operation runs on every render. Even though the result might be the same, React re-renders ExpensiveList. useMemo ensures the filtered array only changes when data or search changes.',
    hints: [
      'The filter runs on every render',
      'Even if the result is the same, React sees a new array reference',
      'Use useMemo to memoize the filtered result'
    ]
  }
]

export const day01RealWorld: RealWorldScenario[] = [
  {
    id: 'day01-real-1',
    title: 'Dashboard Performance Issue',
    description: 'A dashboard with multiple charts becomes unresponsive when data updates.',
    problem: 'The dashboard has 5 chart components. When new data arrives, all charts re-render even though only one chart\'s data changed. This causes the UI to freeze for 200ms.',
    solution: 'Use React.memo on chart components and ensure data props have stable references. Only the chart with changed data should re-render.',
    codeExample: `// Before: All charts re-render
<Chart data={chart1Data} />
<Chart data={chart2Data} />
<Chart data={chart3Data} />

// After: Only changed chart re-renders
const MemoizedChart = React.memo(Chart)
<MemoizedChart data={chart1Data} />
<MemoizedChart data={chart2Data} />
<MemoizedChart data={chart3Data} />`,
    relatedDays: [1, 4]
  },
  {
    id: 'day01-real-2',
    title: 'Form Input Lag During Heavy Rendering',
    description: 'A form with many fields becomes laggy when typing, especially on slower devices.',
    problem: 'The form component re-renders on every keystroke. During render phase, React processes all 50 form fields, causing input lag of 100-200ms per keystroke. Users notice the delay.',
    solution: 'Understand that render phase is interruptible (Day 1). Use React 18 concurrent features like startTransition to mark form updates as non-urgent, keeping input responsive. Split form into smaller components to reduce render work.',
    codeExample: `// Understanding the problem:
// Every keystroke triggers:
// 1. Render phase (interruptible) - processes all fields
// 2. Commit phase (synchronous) - updates DOM

// Solution: Use concurrent features (Week 2)
import { startTransition } from 'react'

function Form() {
  const [input, setInput] = useState('')
  const [filtered, setFiltered] = useState([])
  
  const handleChange = (value) => {
    setInput(value) // Urgent - updates input immediately
    
    startTransition(() => {
      // Non-urgent - can be interrupted
      setFiltered(data.filter(item => 
        item.name.includes(value)
      ))
    })
  }
  
  return <input value={input} onChange={(e) => handleChange(e.target.value)} />
}`,
    relatedDays: [1, 8]
  }
]
