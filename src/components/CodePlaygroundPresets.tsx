/**
 * Code Playground Presets Component
 * Provides pre-loaded code examples for each day
 */

import { useState, type JSX } from 'react'
import CodePlayground from './CodePlayground'

export interface CodePreset {
    id: string
    title: string
    code: string
    language: 'javascript' | 'typescript' | 'jsx' | 'tsx'
    description?: string
}

interface CodePlaygroundPresetsProps {
    presets: CodePreset[]
    onPresetSelect?: (preset: CodePreset) => void
}

// Day-specific code presets
export const dayPresets: Record<number, CodePreset[]> = {
    1: [
        {
            id: 'render-phase',
            title: 'Render Phase Example',
            description: 'See how the render phase works',
            language: 'jsx',
            code: `import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)
  
  // This runs during RENDER phase
  console.log('🔵 RENDER PHASE: Component function executing')
  console.log('🔵 RENDER PHASE: Creating Virtual DOM tree')
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  )
}

export default Counter`
        },
        {
            id: 'commit-phase',
            title: 'Commit Phase Example',
            description: 'See how useEffect runs in commit phase',
            language: 'jsx',
            code: `import { useState, useEffect } from 'react'

function Counter() {
  const [count, setCount] = useState(0)
  
  // This runs during COMMIT phase
  useEffect(() => {
    console.log('🟢 COMMIT PHASE: DOM updated')
    console.log('🟢 COMMIT PHASE: Side effects run here')
    
    return () => {
      console.log('🧹 CLEANUP: Previous effect cleanup')
    }
  }, [count])
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  )
}

export default Counter`
        }
    ],
    4: [
        {
            id: 'react-memo',
            title: 'React.memo Example',
            description: 'Prevent unnecessary re-renders with React.memo',
            language: 'jsx',
            code: `import { memo, useState } from 'react'

// Without memo - re-renders on every parent update
function ExpensiveComponent({ data }) {
  console.log('Rendering ExpensiveComponent')
  return <div>{data.value}</div>
}

// With memo - only re-renders when props change
const MemoizedComponent = memo(function ExpensiveComponent({ data }) {
  console.log('Rendering MemoizedComponent')
  return <div>{data.value}</div>
})

function App() {
  const [count, setCount] = useState(0)
  const [data] = useState({ value: 42 })
  
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      {/* This will re-render on every count change */}
      <ExpensiveComponent data={data} />
      {/* This won't re-render unless data changes */}
      <MemoizedComponent data={data} />
    </div>
  )
}

export default App`
        },
        {
            id: 'use-memo',
            title: 'useMemo Example',
            description: 'Memoize expensive calculations',
            language: 'jsx',
            code: `import { useMemo, useState } from 'react'

function ExpensiveList({ items, filter }) {
  // Without useMemo - recalculates on every render
  const filtered = items.filter(item => 
    item.name.includes(filter)
  )
  
  // With useMemo - only recalculates when items or filter change
  const memoizedFiltered = useMemo(() => {
    console.log('Filtering items...')
    return items.filter(item => 
      item.name.includes(filter)
    )
  }, [items, filter])
  
  return (
    <div>
      <p>Filtered items: {memoizedFiltered.length}</p>
      {memoizedFiltered.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}

export default ExpensiveList`
        },
        {
            id: 'use-callback',
            title: 'useCallback Example',
            description: 'Create stable function references',
            language: 'jsx',
            code: `import { useCallback, useState, memo } from 'react'

const Button = memo(function Button({ onClick, label }) {
  console.log('Rendering Button:', label)
  return <button onClick={onClick}>{label}</button>
})

function App() {
  const [count, setCount] = useState(0)
  
  // Without useCallback - new function on every render
  const handleClick1 = () => {
    console.log('Clicked')
  }
  
  // With useCallback - stable function reference
  const handleClick2 = useCallback(() => {
    console.log('Clicked')
  }, [])
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
      {/* Re-renders on every count change */}
      <Button onClick={handleClick1} label="Without useCallback" />
      {/* Doesn't re-render */}
      <Button onClick={handleClick2} label="With useCallback" />
    </div>
  )
}

export default App`
        }
    ],
    2: [
        {
            id: 'keys-problem',
            title: 'Keys Problem Example',
            description: 'See what happens when using index as keys',
            language: 'jsx',
            code: `import { useState } from 'react'

function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React' },
    { id: 2, text: 'Master Reconciliation' },
    { id: 3, text: 'Build apps' }
  ])

  // ❌ Using index as key - causes bugs
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

// ✅ Using stable ID as key - fixes bugs
function TodoListFixed() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React' },
    { id: 2, text: 'Master Reconciliation' },
    { id: 3, text: 'Build apps' }
  ])

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

export default TodoList`
        },
        {
            id: 'type-comparison',
            title: 'Type Comparison Rule',
            description: 'Understand how React compares element types',
            language: 'jsx',
            code: `import { useState } from 'react'

// React compares element types
function App() {
  const [showDiv, setShowDiv] = useState(true)
  
  return (
    <div>
      <button onClick={() => setShowDiv(!showDiv)}>
        Toggle
      </button>
      
      {/* Type changes: div → span */}
      {/* React will unmount div and mount span */}
      {showDiv ? (
        <div>I'm a div</div>
      ) : (
        <span>I'm a span</span>
      )}
      
      {/* Same type, only props change */}
      {/* React will update props, keep same instance */}
      <div className={showDiv ? 'active' : 'inactive'}>
        Same element, different props
      </div>
    </div>
  )
}

export default App`
        }
    ],
    3: [
        {
            id: 'fiber-structure',
            title: 'Fiber Node Structure',
            description: 'Understand the structure of a Fiber node',
            language: 'jsx',
            code: `// Fiber Node Structure (simplified)
interface FiberNode {
  // Component info
  type: Function | string | null
  key: string | null
  props: any
  
  // Tree structure (linked list)
  child: FiberNode | null      // First child
  sibling: FiberNode | null     // Next sibling
  return: FiberNode | null      // Parent
  
  // Work tracking
  alternate: FiberNode | null   // WorkInProgress ↔ Current
  effectTag: number             // What needs to be done
  updateQueue: any              // State updates
  
  // State
  memoizedState: any            // Current state
  memoizedProps: any             // Current props
}

// Example: Component tree
// <App>
//   <Header />
//   <Content />
// </App>
//
// Fiber structure:
// App (child: Header, sibling: null)
//   └─ Header (child: null, sibling: Content, return: App)
//   └─ Content (child: null, sibling: null, return: App)`
        },
        {
            id: 'current-workinprogress',
            title: 'Current vs WorkInProgress Trees',
            description: 'Understand how React maintains two trees',
            language: 'jsx',
            code: `// React maintains two Fiber trees:

// 1. Current Tree (what's committed to DOM)
//    - Represents the current UI
//    - Points to actual DOM nodes
//    - Stable during render phase

// 2. WorkInProgress Tree (being built)
//    - Represents the next UI
//    - Built during render phase
//    - Swaps with Current after commit

// Example flow:
function App() {
  const [count, setCount] = useState(0)
  
  // Render phase:
  // - React builds WorkInProgress tree
  // - Compares with Current tree
  // - Determines what changed
  
  // Commit phase:
  // - Apply changes to DOM
  // - WorkInProgress becomes Current
  // - Old Current is discarded
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  )
}

// After setCount:
// 1. Build WorkInProgress tree
// 2. Diff with Current tree
// 3. Mark <p> as needing update
// 4. Commit: Update DOM
// 5. Swap trees`
        },
        {
            id: 'fiber-traversal',
            title: 'Fiber Traversal Order',
            description: 'See how Fiber traverses the component tree',
            language: 'jsx',
            code: `// Fiber uses depth-first traversal
// Order: Current → Child → Sibling → Return to Parent

// Component tree:
// <App>
//   <Header>
//     <Logo />
//     <Nav />
//   </Header>
//   <Content>
//     <Article />
//     <Sidebar />
//   </Content>
//   <Footer />
// </App>

// Fiber traversal order:
// 1. App (process current)
// 2. Header (go to child)
// 3. Logo (go to child)
// 4. Nav (go to sibling)
// 5. Content (return to parent, go to sibling)
// 6. Article (go to child)
// 7. Sidebar (go to sibling)
// 8. Footer (return to parent, go to sibling)

// This linked list structure allows:
// - Easy interruption at any point
// - Resuming from where we left off
// - Prioritizing urgent updates

function App() {
  return (
    <div>
      <Header />
      <Content />
      <Footer />
    </div>
  )
}

function Header() {
  return (
    <div>
      <Logo />
      <Nav />
    </div>
  )
}

function Content() {
  return (
    <div>
      <Article />
      <Sidebar />
    </div>
  )
}`
        },
        {
            id: 'interruptible-rendering',
            title: 'Interruptible Rendering',
            description: 'Understand how Fiber enables interruption',
            language: 'jsx',
            code: `// Fiber enables interruptible rendering
// React can pause work, handle urgent updates, then resume

// Example: Heavy computation that can be interrupted
function HeavyList({ items }) {
  // Without Fiber: This blocks the UI
  // With Fiber: React can interrupt this to handle:
  // - User input (urgent)
  // - Animation frames (urgent)
  // - Then resume the heavy work (non-urgent)
  
  return (
    <div>
      {items.map(item => (
        <ExpensiveItem key={item.id} data={item} />
      ))}
    </div>
  )
}

// React's priority system:
// - Urgent: User input, animations (synchronous)
// - Normal: Data updates, UI updates
// - Low: Background work, transitions

// Fiber allows React to:
// 1. Start rendering HeavyList (low priority)
// 2. Interrupt when user types (urgent)
// 3. Handle the input immediately
// 4. Resume HeavyList rendering

// This keeps the UI responsive even during heavy work`
        }
    ],
    5: [
        {
            id: 'use-effect-timing',
            title: 'useEffect Timing',
            description: 'Understand when useEffect runs',
            language: 'jsx',
            code: `import { useState, useEffect } from 'react'

function Component() {
  const [count, setCount] = useState(0)
  
  console.log('1. Render phase: Component function executing')
  
  useEffect(() => {
    console.log('3. Commit phase: useEffect runs AFTER DOM update')
    document.title = \`Count: \${count}\`
    
    return () => {
      console.log('4. Cleanup: Runs before next effect or unmount')
    }
  }, [count])
  
  console.log('2. Render phase: Returning JSX')
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  )
}

export default Component`
        },
        {
            id: 'dependency-array',
            title: 'Dependency Array Patterns',
            description: 'Learn dependency array best practices',
            language: 'jsx',
            code: `import { useState, useEffect } from 'react'

function Component() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('React')
  
  // ✅ Empty array: runs once on mount
  useEffect(() => {
    console.log('Mounted')
    return () => console.log('Unmounted')
  }, [])
  
  // ✅ With dependencies: runs when dependencies change
  useEffect(() => {
    console.log('Count changed:', count)
  }, [count])
  
  // ❌ Missing dependency: ESLint warning
  useEffect(() => {
    console.log('Name:', name) // name not in deps
  }, [])
  
  // ✅ Fixed: include all dependencies
  useEffect(() => {
    console.log('Name:', name)
  }, [name])
  
  return (
    <div>
      <p>Count: {count}</p>
      <p>Name: {name}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={() => setName('Vue')}>Change Name</button>
    </div>
  )
}

export default Component`
        }
    ],
    6: [
        {
            id: 'context-basics',
            title: 'Context Basics',
            description: 'Create and use React Context',
            language: 'jsx',
            code: `import { createContext, useContext, useState } from 'react'

// Create context
const ThemeContext = createContext()

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

function ThemedButton() {
  // Use context
  const { theme, setTheme } = useContext(ThemeContext)
  
  return (
    <button 
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      style={{
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)'
      }}
    >
      Current theme: {theme}
    </button>
  )
}

function App() {
  return (
    <ThemeProvider>
      <ThemedButton />
    </ThemeProvider>
  )
}

export default App`
        },
        {
            id: 'context-optimization',
            title: 'Context Optimization',
            description: 'Prevent unnecessary re-renders with memoization',
            language: 'jsx',
            code: `import { createContext, useContext, useState, useMemo, memo } from 'react'

const UserContext = createContext()
const ThemeContext = createContext()

// ❌ Without optimization: all consumers re-render
function UserProviderBad({ children }) {
  const [user, setUser] = useState({ name: 'John' })
  const [theme, setTheme] = useState('light')
  
  return (
    <UserContext.Provider value={{ user, setUser, theme, setTheme }}>
      {children}
    </UserContext.Provider>
  )
}

// ✅ With optimization: split contexts and memoize
function UserProvider({ children }) {
  const [user, setUser] = useState({ name: 'John' })
  const userValue = useMemo(() => ({ user, setUser }), [user])
  
  return (
    <UserContext.Provider value={userValue}>
      {children}
    </UserContext.Provider>
  )
}

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')
  const themeValue = useMemo(() => ({ theme, setTheme }), [theme])
  
  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  )
}

// Memoized consumer to prevent re-renders
const ThemedComponent = memo(function ThemedComponent() {
  const { theme } = useContext(ThemeContext)
  console.log('ThemedComponent rendered')
  return <div>Theme: {theme}</div>
})

function App() {
  return (
    <UserProvider>
      <ThemeProvider>
        <ThemedComponent />
      </ThemeProvider>
    </UserProvider>
  )
}

export default App`
        }
    ],
    7: [
        {
            id: 'week1-review',
            title: 'Week 1 Concepts Review',
            description: 'Review all Week 1 concepts in one example',
            language: 'jsx',
            code: `import { useState, useEffect, memo, useMemo, useCallback, createContext, useContext } from 'react'

// Day 1: Render vs Commit Phase
function RenderCommitDemo() {
  const [count, setCount] = useState(0)
  
  console.log('🔵 RENDER PHASE: Component executing')
  
  useEffect(() => {
    console.log('🟢 COMMIT PHASE: Effect running after DOM update')
    return () => console.log('🧹 CLEANUP')
  }, [count])
  
  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
}

// Day 2: Keys and Reconciliation
function KeyDemo() {
  const [items, setItems] = useState([
    { id: 1, text: 'Item 1' },
    { id: 2, text: 'Item 2' }
  ])
  
  // ✅ Good: Using stable IDs
  return items.map(item => (
    <div key={item.id}>{item.text}</div>
  ))
}

// Day 4: Memoization
const MemoizedComponent = memo(function Component({ data }) {
  return <div>{data.value}</div>
})

function MemoDemo() {
  const [count, setCount] = useState(0)
  const data = useMemo(() => ({ value: 42 }), [])
  const handleClick = useCallback(() => console.log('clicked'), [])
  
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <MemoizedComponent data={data} />
    </div>
  )
}

// Day 5: Effects and Closures
function EffectDemo() {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => c + 1) // ✅ Using updater to avoid stale closure
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  
  return <div>Count: {count}</div>
}

// Day 6: Context Optimization
const ThemeContext = createContext()

function ContextDemo() {
  const [theme, setTheme] = useState('light')
  const value = useMemo(() => ({ theme, setTheme }), [theme])
  
  return (
    <ThemeContext.Provider value={value}>
      <ThemedComponent />
    </ThemeContext.Provider>
  )
}

const ThemedComponent = memo(function ThemedComponent() {
  const { theme } = useContext(ThemeContext)
  return <div>Theme: {theme}</div>
})

export default RenderCommitDemo`
        },
        {
            id: 'comprehensive-example',
            title: 'Complete Week 1 Example',
            description: 'All concepts working together in one optimized component',
            language: 'jsx',
            code: `import { useState, useEffect, memo, useMemo, useCallback, createContext, useContext } from 'react'

// Optimized component using all Week 1 concepts
const ThemeContext = createContext()

function App() {
  const [count, setCount] = useState(0)
  const [theme, setTheme] = useState('light')
  
  // Day 4: Memoize context value
  const themeValue = useMemo(() => ({ theme, setTheme }), [theme])
  
  // Day 4: Memoize callback
  const handleIncrement = useCallback(() => {
    setCount(c => c + 1)
  }, [])
  
  // Day 1: Render phase (this function)
  console.log('🔵 RENDER PHASE: App rendering')
  
  // Day 5: Effect in commit phase
  useEffect(() => {
    console.log('🟢 COMMIT PHASE: Effect running')
    document.title = \`Count: \${count}\`
  }, [count])
  
  return (
    <ThemeContext.Provider value={themeValue}>
      <div>
        <Counter count={count} onIncrement={handleIncrement} />
        <ThemedButton />
      </div>
    </ThemeContext.Provider>
  )
}

// Day 4: Memoized component
const Counter = memo(function Counter({ count, onIncrement }) {
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={onIncrement}>Increment</button>
    </div>
  )
})

// Day 6: Memoized context consumer
const ThemedButton = memo(function ThemedButton() {
  const { theme, setTheme } = useContext(ThemeContext)
  return (
    <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
      Theme: {theme}
    </button>
  )
})

export default App`
        }
    ]
}

function CodePlaygroundPresets({ presets, onPresetSelect }: CodePlaygroundPresetsProps): JSX.Element {
    const [selectedPreset, setSelectedPreset] = useState<CodePreset | null>(null)

    const handlePresetClick = (preset: CodePreset): void => {
        setSelectedPreset(preset)
        onPresetSelect?.(preset)
    }

    if (presets.length === 0) {
        return <></>
    }

    return (
        <div style={{ marginTop: '20px' }}>
            <div style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                marginBottom: '16px'
            }}>
                {presets.map(preset => (
                    <button
                        key={preset.id}
                        onClick={() => handlePresetClick(preset)}
                        style={{
                            padding: '8px 16px',
                            background: selectedPreset?.id === preset.id
                                ? 'var(--button-primary)'
                                : 'var(--bg-section)',
                            color: selectedPreset?.id === preset.id
                                ? 'var(--button-text)'
                                : 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            if (selectedPreset?.id !== preset.id) {
                                e.currentTarget.style.background = 'var(--bg-tertiary)'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (selectedPreset?.id !== preset.id) {
                                e.currentTarget.style.background = 'var(--bg-section)'
                            }
                        }}
                    >
                        💻 {preset.title}
                    </button>
                ))}
            </div>

            {selectedPreset && (
                <div>
                    {selectedPreset.description && (
                        <p style={{
                            fontSize: '14px',
                            color: 'var(--text-secondary)',
                            marginBottom: '12px'
                        }}>
                            {selectedPreset.description}
                        </p>
                    )}
                    <CodePlayground
                        initialCode={selectedPreset.code}
                        title={selectedPreset.title}
                        language={selectedPreset.language}
                        height={400}
                    />
                </div>
            )}
        </div>
    )
}

export default CodePlaygroundPresets
