import type { Challenge, QuizQuestion, DebuggingScenario, RealWorldScenario } from '../../../types/challenges'

export const day07Quiz: QuizQuestion[] = [
  {
    id: 'day07-q1',
    question: 'What is the difference between render phase and commit phase?',
    options: [
      'Render phase is faster',
      'Render phase is interruptible, commit phase is synchronous',
      'They are the same',
      'Commit phase happens first'
    ],
    correctAnswer: 1,
    explanation: 'Render phase is interruptible and can be paused for urgent work. Commit phase is synchronous and must complete atomically.',
    difficulty: 'medium'
  },
  {
    id: 'day07-q2',
    question: 'How does React\'s reconciliation algorithm work?',
    options: [
      'It compares the entire tree',
      'It compares element types and uses keys for lists',
      'It always re-renders everything',
      'It uses deep equality'
    ],
    correctAnswer: 1,
    explanation: 'Reconciliation compares element types. For lists, it uses keys to match items. This allows efficient updates.',
    difficulty: 'medium'
  },
  {
    id: 'day07-q3',
    question: 'What is Fiber and why was it introduced?',
    options: [
      'A faster rendering engine',
      'A unit of work that enables interruptible rendering',
      'A new component type',
      'A state management solution'
    ],
    correctAnswer: 1,
    explanation: 'Fiber is a unit of work that enables React to interrupt rendering for urgent updates, enabling concurrent features.',
    difficulty: 'medium'
  },
  {
    id: 'day07-q4',
    question: 'When should you use React.memo?',
    options: [
      'Always',
      'When a component receives props that rarely change',
      'Never, it\'s deprecated',
      'Only for class components'
    ],
    correctAnswer: 1,
    explanation: 'Use React.memo when a component receives props that change infrequently, preventing unnecessary re-renders.',
    difficulty: 'easy'
  },
  {
    id: 'day07-q5',
    question: 'What causes stale closures in useEffect?',
    options: [
      'Missing dependency array',
      'Using old state values because dependencies are missing',
      'Not cleaning up',
      'Running effects synchronously'
    ],
    correctAnswer: 1,
    explanation: 'Stale closures occur when effects capture old state/props values because the dependency array is missing or incomplete.',
    difficulty: 'medium'
  },
  {
    id: 'day07-q6',
    question: 'How can you reduce Context re-renders?',
    options: [
      'Never use Context',
      'Split contexts, memoize values, use React.memo on consumers',
      'Use smaller values',
      'Context always re-renders, nothing you can do'
    ],
    correctAnswer: 1,
    explanation: 'Reduce Context re-renders by splitting contexts by concern, memoizing provider values, and using React.memo on consumers.',
    difficulty: 'medium'
  },
  {
    id: 'day07-q7',
    question: 'Which Week 1 concept helps prevent unnecessary re-renders?',
    options: [
      'Only reconciliation',
      'React.memo, useMemo, useCallback, and Context optimization',
      'Only Fiber',
      'Only useEffect'
    ],
    correctAnswer: 1,
    explanation: 'Multiple Week 1 concepts help prevent re-renders: React.memo prevents component re-renders, useMemo/useCallback prevent recalculations, and Context optimization reduces consumer re-renders.',
    difficulty: 'hard'
  }
]

export const day07Challenges: Challenge[] = [
  {
    id: 'day07-challenge-1',
    title: 'Build Optimized Component',
    description: 'Create a component that uses all Week 1 optimization techniques: React.memo, useMemo, useCallback, and Context optimization.',
    difficulty: 'hard',
    starterCode: `import { useState, createContext, useContext } from 'react'

// Your task: Optimize this component using Week 1 concepts
function App() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('React')
  
  const data = { count, name }
  const handleClick = () => setCount(c => c + 1)
  
  return (
    <div>
      <ExpensiveComponent data={data} onClick={handleClick} />
    </div>
  )
}

function ExpensiveComponent({ data, onClick }) {
  const expensive = data.count * 1000 // Expensive calculation
  return (
    <div>
      <p>Expensive: {expensive}</p>
      <button onClick={onClick}>Increment</button>
    </div>
  )
}

export default App`,
    solution: `import { useState, memo, useMemo, useCallback, createContext, useContext } from 'react'

function App() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('React')
  
  // Day 4: Memoize object to prevent re-renders
  const data = useMemo(() => ({ count, name }), [count, name])
  
  // Day 4: Memoize callback
  const handleClick = useCallback(() => {
    setCount(c => c + 1)
  }, [])
  
  return (
    <div>
      <ExpensiveComponent data={data} onClick={handleClick} />
    </div>
  )
}

// Day 4: Memoize component
const ExpensiveComponent = memo(function ExpensiveComponent({ data, onClick }) {
  // Day 4: Memoize expensive calculation
  const expensive = useMemo(() => data.count * 1000, [data.count])
  
  return (
    <div>
      <p>Expensive: {expensive}</p>
      <button onClick={onClick}>Increment</button>
    </div>
  )
})

export default App`,
    hints: [
      'Use React.memo to prevent unnecessary re-renders',
      'Use useMemo to memoize the data object',
      'Use useCallback to memoize the click handler',
      'Use useMemo inside ExpensiveComponent for the calculation'
    ],
    explanation: 'This combines all Week 1 optimization techniques: React.memo prevents re-renders, useMemo prevents recalculations, and useCallback provides stable function references.'
  },
  {
    id: 'day07-challenge-2',
    title: 'Fix Week 1 Anti-patterns',
    description: 'Identify and fix all Week 1 anti-patterns in this code: index keys, stale closures, missing dependencies, and unnecessary re-renders.',
    difficulty: 'hard',
    starterCode: `import { useState, useEffect } from 'react'

function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React' },
    { id: 2, text: 'Master Week 1' }
  ])
  const [count, setCount] = useState(0)
  
  // Bug 1: Missing dependency
  useEffect(() => {
    console.log('Count:', count)
  }, [])
  
  // Bug 2: Stale closure
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(count + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  
  // Bug 3: Index keys
  return (
    <div>
      {todos.map((todo, index) => (
        <div key={index}>
          <input defaultValue={todo.text} />
          <button onClick={() => setTodos(todos.filter(t => t.id !== todo.id))}>
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}

export default TodoApp`,
    solution: `import { useState, useEffect } from 'react'

function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React' },
    { id: 2, text: 'Master Week 1' }
  ])
  const [count, setCount] = useState(0)
  
  // ✅ Fix 1: Add dependency
  useEffect(() => {
    console.log('Count:', count)
  }, [count])
  
  // ✅ Fix 2: Use updater function to avoid stale closure
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => c + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  
  // ✅ Fix 3: Use stable IDs as keys
  return (
    <div>
      {todos.map((todo) => (
        <div key={todo.id}>
          <input defaultValue={todo.text} />
          <button onClick={() => setTodos(todos.filter(t => t.id !== todo.id))}>
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}

export default TodoApp`,
    hints: [
      'Check useEffect dependency arrays',
      'Look at how count is used in the interval',
      'Examine the key prop in the map function',
      'Day 2: Keys should be stable and unique',
      'Day 5: Use updater functions to avoid stale closures'
    ],
    explanation: 'This fixes three Week 1 bugs: missing dependency in useEffect (Day 5), stale closure in interval (Day 5), and index keys causing reconciliation issues (Day 2).'
  }
]

export const day07Debugging: DebuggingScenario[] = [
  {
    id: 'day07-debug-1',
    title: 'Week 1 Bug Hunt',
    description: 'Find and fix all the Week 1 concept violations in this code',
    buggyCode: `import { useState, useEffect } from 'react'

function App() {
  const [items, setItems] = useState([
    { id: 1, text: 'Item 1' },
    { id: 2, text: 'Item 2' }
  ])
  const [count, setCount] = useState(0)
  
  // Bug 1: Missing dependency
  useEffect(() => {
    console.log('Count:', count)
  }, [])
  
  // Bug 2: Stale closure
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(count + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  
  // Bug 3: Index keys
  return (
    <div>
      {items.map((item, index) => (
        <div key={index}>{item.text}</div>
      ))}
      <button onClick={() => setItems([...items, { id: 3, text: 'Item 3' }])}>
        Add Item
      </button>
    </div>
  )
}

export default App`,
    fixedCode: `import { useState, useEffect } from 'react'

function App() {
  const [items, setItems] = useState([
    { id: 1, text: 'Item 1' },
    { id: 2, text: 'Item 2' }
  ])
  const [count, setCount] = useState(0)
  
  // ✅ Fix 1: Add dependency
  useEffect(() => {
    console.log('Count:', count)
  }, [count])
  
  // ✅ Fix 2: Use updater function
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => c + 1) // Avoids stale closure
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  
  // ✅ Fix 3: Use stable IDs as keys
  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>{item.text}</div>
      ))}
      <button onClick={() => setItems([...items, { id: 3, text: 'Item 3' }])}>
        Add Item
      </button>
    </div>
  )
}

export default App`,
    bugExplanation: 'This code has three Week 1 bugs: missing dependency in useEffect (Day 5), stale closure in interval (Day 5), and index keys causing reconciliation issues (Day 2).',
    hints: [
      'Check the useEffect dependency arrays',
      'Look at how count is used in the interval',
      'Examine the key prop in the map function'
    ]
  },
  {
    id: 'day07-debug-2',
    title: 'Performance Issues',
    description: 'Identify why this component re-renders unnecessarily and fix it',
    buggyCode: `import { useState, createContext, useContext } from 'react'

const AppContext = createContext()

function App() {
  const [user, setUser] = useState({ name: 'John' })
  const [theme, setTheme] = useState('light')
  
  // Bug: New object every render
  const value = { user, setUser, theme, setTheme }
  
  return (
    <AppContext.Provider value={value}>
      <UserProfile />
      <ThemeToggle />
    </AppContext.Provider>
  )
}

function UserProfile() {
  const { user } = useContext(AppContext)
  console.log('UserProfile rendering')
  return <div>{user.name}</div>
}

function ThemeToggle() {
  const { theme, setTheme } = useContext(AppContext)
  console.log('ThemeToggle rendering')
  return (
    <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
      {theme}
    </button>
  )
}

export default App`,
    fixedCode: `import { useState, createContext, useContext, useMemo, memo } from 'react'

const AppContext = createContext()

function App() {
  const [user, setUser] = useState({ name: 'John' })
  const [theme, setTheme] = useState('light')
  
  // ✅ Fix: Memoize context value
  const value = useMemo(() => ({ user, setUser, theme, setTheme }), [user, theme])
  
  return (
    <AppContext.Provider value={value}>
      <UserProfile />
      <ThemeToggle />
    </AppContext.Provider>
  )
}

// ✅ Fix: Memoize consumers
const UserProfile = memo(function UserProfile() {
  const { user } = useContext(AppContext)
  console.log('UserProfile rendering')
  return <div>{user.name}</div>
})

const ThemeToggle = memo(function ThemeToggle() {
  const { theme, setTheme } = useContext(AppContext)
  console.log('ThemeToggle rendering')
  return (
    <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
      {theme}
    </button>
  )
})

export default App`,
    bugExplanation: 'The context value is recreated on every render, causing all consumers to re-render. Memoizing the value and consumers prevents unnecessary re-renders.',
    hints: [
      'The context value is a new object every render',
      'All context consumers re-render when value changes',
      'Use useMemo to memoize the context value',
      'Use React.memo on consumer components'
    ]
  }
]

export const day07RealWorld: RealWorldScenario[] = [
  {
    id: 'day07-realworld-1',
    title: 'Performance Optimization Project',
    description: 'A real-world scenario combining all Week 1 concepts',
    problem: `You're working on a dashboard that's slow. The component re-renders on every state change, even when unrelated data updates. Users report lag when typing in search inputs. The dashboard has:
- A user profile section
- A theme switcher
- A data table with filters
- Real-time updates

All components re-render when any state changes.`,
    solution: `Apply Week 1 optimization techniques:
1. Split Context (Day 6): Separate UserContext and ThemeContext
2. Memoize provider values (Day 6): Use useMemo for context values
3. Memoize components (Day 4): Use React.memo on expensive components
4. Memoize calculations (Day 4): Use useMemo for filtered data
5. Memoize callbacks (Day 4): Use useCallback for event handlers
6. Fix stale closures (Day 5): Use updater functions in effects
7. Use proper keys (Day 2): Stable IDs for list items`,
    codeExample: `import { useState, useMemo, useCallback, memo, createContext, useContext } from 'react'

// Day 6: Split contexts
const UserContext = createContext()
const ThemeContext = createContext()

function Dashboard() {
  const [user, setUser] = useState({ name: 'John' })
  const [theme, setTheme] = useState('light')
  const [data, setData] = useState([...])
  const [filter, setFilter] = useState('')
  
  // Day 6: Memoize context values
  const userValue = useMemo(() => ({ user, setUser }), [user])
  const themeValue = useMemo(() => ({ theme, setTheme }), [theme])
  
  // Day 4: Memoize filtered data
  const filteredData = useMemo(() => 
    data.filter(item => item.name.includes(filter)),
    [data, filter]
  )
  
  // Day 4: Memoize callback
  const handleFilterChange = useCallback((value) => {
    setFilter(value)
  }, [])
  
  return (
    <UserContext.Provider value={userValue}>
      <ThemeContext.Provider value={themeValue}>
        <UserProfile />
        <ThemeToggle />
        <DataTable data={filteredData} onFilterChange={handleFilterChange} />
      </ThemeContext.Provider>
    </UserContext.Provider>
  )
}

// Day 4: Memoized components
const UserProfile = memo(() => {
  const { user } = useContext(UserContext)
  return <div>{user.name}</div>
})

const ThemeToggle = memo(() => {
  const { theme, setTheme } = useContext(ThemeContext)
  return <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
    {theme}
  </button>
})

const DataTable = memo(({ data, onFilterChange }) => {
  return (
    <div>
      <input onChange={(e) => onFilterChange(e.target.value)} />
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
})`,
    relatedDays: [1, 2, 4, 5, 6]
  },
  {
    id: 'day07-realworld-2',
    title: 'Context Re-render Blast Radius',
    description: 'Real-world problem: Context causing unnecessary re-renders',
    problem: `A large e-commerce app uses a single AppContext with user, cart, theme, and notifications. Every time the cart updates, ALL components re-render, including:
- Header (only needs user)
- Sidebar (only needs theme)
- Product list (only needs products)
- Cart summary (needs cart)

This causes performance issues on mobile devices.`,
    solution: `Split the monolithic context into focused contexts:
1. UserContext - for user data
2. ThemeContext - for theme preferences
3. CartContext - for cart state
4. NotificationContext - for notifications

Each component only subscribes to the context it needs. Memoize provider values and use React.memo on consumers.`,
    codeExample: `import { createContext, useContext, useMemo, memo } from 'react'

// Day 6: Split contexts by concern
const UserContext = createContext()
const ThemeContext = createContext()
const CartContext = createContext()

function App() {
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState('light')
  const [cart, setCart] = useState([])
  
  // Day 6: Memoize each context value
  const userValue = useMemo(() => ({ user, setUser }), [user])
  const themeValue = useMemo(() => ({ theme, setTheme }), [theme])
  const cartValue = useMemo(() => ({ cart, setCart }), [cart])
  
  return (
    <UserContext.Provider value={userValue}>
      <ThemeContext.Provider value={themeValue}>
        <CartContext.Provider value={cartValue}>
          <Header /> {/* Only subscribes to UserContext */}
          <Sidebar /> {/* Only subscribes to ThemeContext */}
          <ProductList /> {/* Doesn't need any context */}
          <CartSummary /> {/* Only subscribes to CartContext */}
        </CartContext.Provider>
      </ThemeContext.Provider>
    </UserContext.Provider>
  )
}

// Day 4: Memoized consumers
const Header = memo(() => {
  const { user } = useContext(UserContext)
  return <div>Welcome, {user?.name}</div>
})

const Sidebar = memo(() => {
  const { theme } = useContext(ThemeContext)
  return <div className={theme}>Sidebar</div>
})

const CartSummary = memo(() => {
  const { cart } = useContext(CartContext)
  return <div>Items: {cart.length}</div>
})`,
    relatedDays: [4, 6]
  }
]
