/**
 * Code Review Exercises Service
 * Real-world React codebases for review practice
 */

import type { CodeReviewExercise } from '../types/codeReview'

export const codeReviewExercises: CodeReviewExercise[] = [
    {
        id: 'review-1',
        title: 'Performance Issues in Todo App',
        description: 'Review this Todo app code. Find all performance issues and bugs.',
        code: `import { useState } from 'react'

function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React', completed: false },
    { id: 2, text: 'Master Week 1', completed: false }
  ])
  const [filter, setFilter] = useState('all')
  
  // Bug 1: Index keys
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return todo.completed
    return true
  })
  
  return (
    <div>
      <input 
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      {filteredTodos.map((todo, index) => (
        <TodoItem 
          key={index}  // Bug 1: Index key
          todo={todo}
          onToggle={() => {
            setTodos(todos.map(t => 
              t.id === todo.id ? { ...t, completed: !t.completed } : t
            ))
          }}
        />
      ))}
    </div>
  )
}

function TodoItem({ todo, onToggle }) {
  // Bug 2: Expensive calculation on every render
  const expensiveValue = todo.text.split('').reverse().join('').toUpperCase()
  
  return (
    <div>
      <input 
        type="checkbox"
        checked={todo.completed}
        onChange={onToggle}
      />
      <span>{todo.text}</span>
      <span>{expensiveValue}</span>
    </div>
  )
}`,
        bugs: [
            {
                id: 'bug-1',
                line: 18,
                description: 'Using index as key causes bugs when filtering/reordering',
                severity: 'high',
                fix: 'Use todo.id as key instead of index'
            },
            {
                id: 'bug-2',
                line: 30,
                description: 'Expensive calculation runs on every render, even when todo.text hasn\'t changed',
                severity: 'medium',
                fix: 'Use useMemo to memoize the calculation'
            },
            {
                id: 'bug-3',
                line: 22,
                description: 'onToggle creates new function on every render, causing TodoItem to re-render unnecessarily',
                severity: 'medium',
                fix: 'Use useCallback to memoize the handler'
            }
        ],
        expertSolution: `import { useState, useMemo, useCallback, memo } from 'react'

function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React', completed: false },
    { id: 2, text: 'Master Week 1', completed: false }
  ])
  const [filter, setFilter] = useState('all')
  
  // Memoize filtered todos
  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      if (filter === 'active') return !todo.completed
      if (filter === 'completed') return todo.completed
      return true
    })
  }, [todos, filter])
  
  // Memoize toggle handler
  const handleToggle = useCallback((id) => {
    setTodos(todos => todos.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ))
  }, [])
  
  return (
    <div>
      <input 
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      {filteredTodos.map(todo => (
        <TodoItem 
          key={todo.id}  // ✅ Stable key
          todo={todo}
          onToggle={handleToggle}
        />
      ))}
    </div>
  )
}

// Memoize TodoItem
const TodoItem = memo(function TodoItem({ todo, onToggle }) {
  // Memoize expensive calculation
  const expensiveValue = useMemo(() => {
    return todo.text.split('').reverse().join('').toUpperCase()
  }, [todo.text])
  
  return (
    <div>
      <input 
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span>{todo.text}</span>
      <span>{expensiveValue}</span>
    </div>
  )
})`,
        explanation: 'This code has three main issues: index keys cause bugs when filtering, expensive calculations run unnecessarily, and new function references cause re-renders. The solution uses React.memo, useMemo, and useCallback to optimize performance.',
        difficulty: 'medium',
        day: 4,
        category: 'performance',
        hints: [
            'Look at the key prop in the map function',
            'Check if expensive calculations are memoized',
            'See if event handlers are stable references'
        ]
    },
    {
        id: 'review-2',
        title: 'Stale Closure Bug in Counter',
        description: 'Find the stale closure bug in this counter component.',
        code: `import { useState, useEffect } from 'react'

function Counter() {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(count + 1)  // Bug: Uses stale count
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])  // Bug: Missing count dependency
  
  return <div>Count: {count}</div>
}`,
        bugs: [
            {
                id: 'bug-1',
                line: 7,
                description: 'Stale closure: count value is captured from initial render (always 0)',
                severity: 'high',
                fix: 'Use functional update: setCount(c => c + 1)'
            },
            {
                id: 'bug-2',
                line: 10,
                description: 'Missing dependency: count should be in dependency array, or use functional update',
                severity: 'high',
                fix: 'Either add [count] to dependencies or use functional update'
            }
        ],
        expertSolution: `import { useState, useEffect } from 'react'

function Counter() {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      // ✅ Functional update avoids stale closure
      setCount(c => c + 1)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])  // ✅ No dependency needed with functional update
  
  return <div>Count: {count}</div>
}`,
        explanation: 'The bug is a classic stale closure. The effect captures the initial count value (0) and never sees updates. Using a functional update (setCount(c => c + 1)) ensures we always use the latest state value.',
        difficulty: 'easy',
        day: 5,
        category: 'effects',
        hints: [
            'What value does count have when the effect first runs?',
            'Does the interval callback see updated count values?',
            'Check the dependency array'
        ]
    },
    {
        id: 'review-3',
        title: 'Context Re-render Blast Radius',
        description: 'Find the performance issue in this Context implementation.',
        code: `import { createContext, useContext, useState } from 'react'

const AppContext = createContext()

function App() {
  const [user, setUser] = useState({ name: 'John', email: 'john@example.com' })
  const [theme, setTheme] = useState('light')
  const [notifications, setNotifications] = useState([])
  
  // Bug: Single context with all state
  const value = {
    user,
    setUser,
    theme,
    setTheme,
    notifications,
    setNotifications
  }
  
  return (
    <AppContext.Provider value={value}>
      <Header />
      <Sidebar />
      <MainContent />
    </AppContext.Provider>
  )
}

function Header() {
  const { user, theme } = useContext(AppContext)
  return <header>Welcome {user.name} - Theme: {theme}</header>
}

function Sidebar() {
  const { notifications } = useContext(AppContext)
  return <aside>You have {notifications.length} notifications</aside>
}

function MainContent() {
  const { user } = useContext(AppContext)
  return <main>Content for {user.name}</main>
}`,
        bugs: [
            {
                id: 'bug-1',
                line: 11,
                description: 'Single context combines all state, causing all consumers to re-render when any value changes',
                severity: 'high',
                fix: 'Split into separate contexts: UserContext, ThemeContext, NotificationsContext'
            },
            {
                id: 'bug-2',
                line: 11,
                description: 'Context value object is recreated on every render, causing unnecessary re-renders',
                severity: 'medium',
                fix: 'Use useMemo to memoize the context value'
            }
        ],
        expertSolution: `import { createContext, useContext, useState, useMemo, memo } from 'react'

// Split contexts by concern
const UserContext = createContext()
const ThemeContext = createContext()
const NotificationsContext = createContext()

function App() {
  const [user, setUser] = useState({ name: 'John', email: 'john@example.com' })
  const [theme, setTheme] = useState('light')
  const [notifications, setNotifications] = useState([])
  
  // Memoize each context value
  const userValue = useMemo(() => ({ user, setUser }), [user])
  const themeValue = useMemo(() => ({ theme, setTheme }), [theme])
  const notificationsValue = useMemo(() => ({ notifications, setNotifications }), [notifications])
  
  return (
    <UserContext.Provider value={userValue}>
      <ThemeContext.Provider value={themeValue}>
        <NotificationsContext.Provider value={notificationsValue}>
          <Header />
          <Sidebar />
          <MainContent />
        </NotificationsContext.Provider>
      </ThemeContext.Provider>
    </UserContext.Provider>
  )
}

// Memoize consumers to prevent unnecessary re-renders
const Header = memo(function Header() {
  const { user } = useContext(UserContext)
  const { theme } = useContext(ThemeContext)
  return <header>Welcome {user.name} - Theme: {theme}</header>
})

const Sidebar = memo(function Sidebar() {
  const { notifications } = useContext(NotificationsContext)
  return <aside>You have {notifications.length} notifications</aside>
})

const MainContent = memo(function MainContent() {
  const { user } = useContext(UserContext)
  return <main>Content for {user.name}</main>
})`,
        explanation: 'The main issues are: 1) All state in one context causes all consumers to re-render when any value changes, 2) The context value object is recreated every render. The solution splits contexts by concern and memoizes both values and consumers.',
        difficulty: 'hard',
        day: 6,
        category: 'context',
        hints: [
            'How many components re-render when notifications change?',
            'Is the context value object stable across renders?',
            'Can you split the context by concern?'
        ]
    },
    {
        id: 'review-4',
        title: 'Missing Dependency in useEffect',
        description: 'Find the bugs in this effect hook.',
        code: `import { useState, useEffect } from 'react'

function UserProfile({ userId }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchUser() {
      setLoading(true)
      const response = await fetch(\`/api/users/\${userId}\`)
      const data = await response.json()
      setUser(data)
      setLoading(false)
    }
    
    fetchUser()
  }, []) // Bug: Missing userId dependency
  
  if (loading) return <div>Loading...</div>
  return <div>{user?.name}</div>
}`,
        bugs: [
            {
                id: 'bug-1',
                line: 13,
                description: 'Missing userId in dependency array - effect won\'t re-run when userId changes',
                severity: 'high',
                fix: 'Add userId to dependency array: [userId]'
            },
            {
                id: 'bug-2',
                line: 7,
                description: 'No cleanup function - if component unmounts or userId changes, state updates may occur after unmount',
                severity: 'medium',
                fix: 'Add cleanup to cancel fetch or ignore stale responses'
            }
        ],
        expertSolution: `import { useState, useEffect, useRef } from 'react'

function UserProfile({ userId }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const abortControllerRef = useRef(null)
  
  useEffect(() => {
    // Cancel previous request if userId changes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    const controller = new AbortController()
    abortControllerRef.current = controller
    
    async function fetchUser() {
      try {
        setLoading(true)
        const response = await fetch(\`/api/users/\${userId}\`, {
          signal: controller.signal
        })
        const data = await response.json()
        
        // Only update if not aborted
        if (!controller.signal.aborted) {
          setUser(data)
          setLoading(false)
        }
      } catch (error) {
        if (error.name !== 'AbortError' && !controller.signal.aborted) {
          setLoading(false)
          console.error('Failed to fetch user:', error)
        }
      }
    }
    
    fetchUser()
    
    // Cleanup: abort request if component unmounts or userId changes
    return () => {
      controller.abort()
    }
  }, [userId]) // ✅ Include userId dependency
  
  if (loading) return <div>Loading...</div>
  return <div>{user?.name}</div>
}`,
        explanation: 'The main bugs are: 1) Missing userId dependency means the effect won\'t re-run when userId changes, 2) No cleanup means state updates can occur after unmount. The solution adds the dependency and implements proper cleanup with AbortController.',
        difficulty: 'medium',
        day: 5,
        category: 'effects',
        hints: [
            'What happens when userId prop changes?',
            'What if the component unmounts while fetching?',
            'Check the dependency array'
        ]
    },
    {
        id: 'review-5',
        title: 'Unnecessary Re-renders from Props',
        description: 'Find the performance issues in this component.',
        code: `import { useState } from 'react'

function Parent() {
  const [count, setCount] = useState(0)
  const [items, setItems] = useState([1, 2, 3])
  
  const handleClick = () => {
    setCount(c => c + 1)
  }
  
  const processItems = (items) => {
    // Expensive operation
    return items.map(item => item * 2).filter(x => x > 2)
  }
  
  return (
    <div>
      <button onClick={handleClick}>Count: {count}</button>
      <ExpensiveChild 
        items={items}
        processedItems={processItems(items)} // Bug: Recalculated every render
        onClick={handleClick} // Bug: New function every render
      />
    </div>
  )
}

function ExpensiveChild({ items, processedItems, onClick }) {
  console.log('ExpensiveChild rendered')
  return (
    <div>
      <div>Items: {items.length}</div>
      <div>Processed: {processedItems.length}</div>
      <button onClick={onClick}>Increment</button>
    </div>
  )
}`,
        bugs: [
            {
                id: 'bug-1',
                line: 15,
                description: 'processItems(items) is called on every render, even when items haven\'t changed',
                severity: 'high',
                fix: 'Use useMemo to memoize the processed items'
            },
            {
                id: 'bug-2',
                line: 16,
                description: 'handleClick creates a new function reference on every render, causing ExpensiveChild to re-render',
                severity: 'medium',
                fix: 'Use useCallback to memoize the handler'
            },
            {
                id: 'bug-3',
                line: 24,
                description: 'ExpensiveChild is not memoized, so it re-renders even when props haven\'t changed',
                severity: 'medium',
                fix: 'Wrap ExpensiveChild with React.memo'
            }
        ],
        expertSolution: `import { useState, useMemo, useCallback, memo } from 'react'

function Parent() {
  const [count, setCount] = useState(0)
  const [items, setItems] = useState([1, 2, 3])
  
  // Memoize handler
  const handleClick = useCallback(() => {
    setCount(c => c + 1)
  }, [])
  
  // Memoize expensive calculation
  const processedItems = useMemo(() => {
    return items.map(item => item * 2).filter(x => x > 2)
  }, [items])
  
  return (
    <div>
      <button onClick={handleClick}>Count: {count}</button>
      <ExpensiveChild 
        items={items}
        processedItems={processedItems} // ✅ Memoized
        onClick={handleClick} // ✅ Stable reference
      />
    </div>
  )
}

// Memoize component
const ExpensiveChild = memo(function ExpensiveChild({ items, processedItems, onClick }) {
  console.log('ExpensiveChild rendered')
  return (
    <div>
      <div>Items: {items.length}</div>
      <div>Processed: {processedItems.length}</div>
      <button onClick={onClick}>Increment</button>
    </div>
  )
})`,
        explanation: 'Three performance issues: 1) Expensive calculation runs on every render, 2) New function reference causes child re-renders, 3) Child component not memoized. The solution uses useMemo, useCallback, and React.memo to prevent unnecessary work.',
        difficulty: 'medium',
        day: 4,
        category: 'performance',
        hints: [
            'Is the expensive calculation memoized?',
            'Are function references stable?',
            'Is the child component memoized?'
        ]
    },
    {
        id: 'review-6',
        title: 'Memory Leak from Event Listener',
        description: 'Find the memory leak in this component.',
        code: `import { useState, useEffect } from 'react'

function WindowResizeTracker() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })
  
  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    window.addEventListener('resize', handleResize)
    // Bug: No cleanup - event listener never removed
  }, [])
  
  return <div>Window: {windowSize.width} x {windowSize.height}</div>
}`,
        bugs: [
            {
                id: 'bug-1',
                line: 14,
                description: 'Event listener is never removed, causing memory leak when component unmounts',
                severity: 'high',
                fix: 'Return cleanup function to remove event listener'
            },
            {
                id: 'bug-2',
                line: 6,
                description: 'Stale closure: windowSize state might be stale in handleResize',
                severity: 'low',
                fix: 'Use functional update or ensure handleResize doesn\'t depend on state'
            }
        ],
        expertSolution: `import { useState, useEffect } from 'react'

function WindowResizeTracker() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })
  
  useEffect(() => {
    function handleResize() {
      // ✅ Functional update avoids stale closure
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    window.addEventListener('resize', handleResize)
    
    // ✅ Cleanup: remove event listener
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])
  
  return <div>Window: {windowSize.width} x {windowSize.height}</div>
}`,
        explanation: 'The main bug is a memory leak: the event listener is never removed when the component unmounts. The solution adds a cleanup function to remove the listener. Also using functional update pattern for safety.',
        difficulty: 'easy',
        day: 5,
        category: 'effects',
        hints: [
            'What happens to the event listener when the component unmounts?',
            'Is there a cleanup function?',
            'Check the useEffect return value'
        ]
    },
    {
        id: 'review-7',
        title: 'Infinite Loop from State Update',
        description: 'Find the infinite loop bug.',
        code: `import { useState, useEffect } from 'react'

function Counter() {
  const [count, setCount] = useState(0)
  const [doubled, setDoubled] = useState(0)
  
  useEffect(() => {
    setDoubled(count * 2) // Bug: Updates state, triggers re-render
  }, [count, doubled]) // Bug: doubled in dependencies causes loop
  
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <div>Doubled: {doubled}</div>
    </div>
  )
}`,
        bugs: [
            {
                id: 'bug-1',
                line: 7,
                description: 'doubled is in dependency array but also updated in effect, causing infinite loop',
                severity: 'critical',
                fix: 'Remove doubled from dependency array: [count]'
            },
            {
                id: 'bug-2',
                line: 6,
                description: 'Unnecessary effect - can use useMemo or calculate directly in render',
                severity: 'low',
                fix: 'Use useMemo instead of useEffect for derived state'
            }
        ],
        expertSolution: `import { useState, useMemo } from 'react'

function Counter() {
  const [count, setCount] = useState(0)
  
  // ✅ Use useMemo for derived state instead of useEffect
  const doubled = useMemo(() => count * 2, [count])
  
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <div>Doubled: {doubled}</div>
    </div>
  )
}`,
        explanation: 'The infinite loop is caused by including doubled in the dependency array while also updating it in the effect. The solution uses useMemo for derived state instead of useEffect, which is the correct pattern for computed values.',
        difficulty: 'easy',
        day: 5,
        category: 'effects',
        hints: [
            'What happens when doubled changes?',
            'Is doubled in the dependency array?',
            'Can you use useMemo instead of useEffect?'
        ]
    },
    {
        id: 'review-8',
        title: 'Race Condition in Async Effect',
        description: 'Find the race condition bug.',
        code: `import { useState, useEffect } from 'react'

function UserDetails({ userId }) {
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    let cancelled = false
    
    async function fetchUser() {
      try {
        const response = await fetch(\`/api/users/\${userId}\`)
        const data = await response.json()
        
        if (!cancelled) {
          setUser(data) // Bug: Race condition if userId changes quickly
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
        }
      }
    }
    
    fetchUser()
    
    return () => {
      cancelled = true
    }
  }, [userId])
  
  if (error) return <div>Error: {error}</div>
  if (!user) return <div>Loading...</div>
  return <div>{user.name}</div>
}`,
        bugs: [
            {
                id: 'bug-1',
                line: 12,
                description: 'Race condition: If userId changes quickly, older requests may complete after newer ones, overwriting correct data',
                severity: 'high',
                fix: 'Use AbortController or track request ID to ignore stale responses'
            }
        ],
        expertSolution: `import { useState, useEffect, useRef } from 'react'

function UserDetails({ userId }) {
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  const requestIdRef = useRef(0)
  
  useEffect(() => {
    // Increment request ID for this userId
    const currentRequestId = ++requestIdRef.current
    
    async function fetchUser() {
      try {
        const response = await fetch(\`/api/users/\${userId}\`)
        const data = await response.json()
        
        // ✅ Only update if this is still the latest request
        if (currentRequestId === requestIdRef.current) {
          setUser(data)
          setError(null)
        }
      } catch (err) {
        // ✅ Only update error if this is still the latest request
        if (currentRequestId === requestIdRef.current) {
          setError(err.message)
        }
      }
    }
    
    fetchUser()
    
    return () => {
      // Mark this request as stale
      requestIdRef.current = -1
    }
  }, [userId])
  
  if (error) return <div>Error: {error}</div>
  if (!user) return <div>Loading...</div>
  return <div>{user.name}</div>
}`,
        explanation: 'The race condition occurs when userId changes quickly - older requests may complete after newer ones and overwrite the correct data. The solution uses a request ID to track which request is current and ignore stale responses.',
        difficulty: 'hard',
        day: 5,
        category: 'effects',
        hints: [
            'What happens if userId changes before the first request completes?',
            'Can older requests overwrite newer data?',
            'How can you track which request is current?'
        ]
    }
]
