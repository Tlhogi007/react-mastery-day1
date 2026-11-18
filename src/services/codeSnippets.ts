/**
 * Code Snippets Library Service
 * Searchable collection of React patterns
 */

export interface CodeSnippet {
    id: string
    title: string
    description: string
    code: string
    category: string
    tags: string[]
    difficulty: 'easy' | 'medium' | 'hard'
    relatedDays: number[]
    language: 'javascript' | 'typescript' | 'jsx' | 'tsx'
}

const STORAGE_KEY = 'react-mastery-snippets'

// Default code snippets library
export const defaultSnippets: CodeSnippet[] = [
    {
        id: 'memo-basic',
        title: 'React.memo Basic Usage',
        description: 'Prevent re-renders when props haven\'t changed',
        code: `import { memo } from 'react'

const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  // Component only re-renders when 'data' prop changes
  return <div>{data.value}</div>
})`,
        category: 'memoization',
        tags: ['React.memo', 'optimization', 're-render'],
        difficulty: 'easy',
        relatedDays: [4],
        language: 'jsx'
    },
    {
        id: 'usememo-calculation',
        title: 'useMemo for Expensive Calculations',
        description: 'Memoize expensive calculations',
        code: `import { useMemo } from 'react'

function Component({ items }) {
  const expensiveValue = useMemo(() => {
    return items.reduce((sum, item) => {
      // Expensive calculation
      return sum + item.value * 2
    }, 0)
  }, [items])
  
  return <div>{expensiveValue}</div>
}`,
        category: 'memoization',
        tags: ['useMemo', 'optimization', 'calculation'],
        difficulty: 'medium',
        relatedDays: [4],
        language: 'jsx'
    },
    {
        id: 'usecallback-handler',
        title: 'useCallback for Event Handlers',
        description: 'Memoize function references',
        code: `import { useCallback, useState } from 'react'

function Parent() {
  const [count, setCount] = useState(0)
  
  const handleClick = useCallback(() => {
    setCount(c => c + 1)
  }, []) // Stable reference
  
  return <Child onClick={handleClick} />
}

const Child = memo(({ onClick }) => {
  return <button onClick={onClick}>Click</button>
})`,
        category: 'memoization',
        tags: ['useCallback', 'handlers', 'memo'],
        difficulty: 'medium',
        relatedDays: [4],
        language: 'jsx'
    },
    {
        id: 'context-split',
        title: 'Split Contexts by Concern',
        description: 'Reduce re-render blast radius',
        code: `import { createContext, useContext, useMemo } from 'react'

// Split contexts
const UserContext = createContext()
const ThemeContext = createContext()

function App() {
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState('light')
  
  // Memoize values
  const userValue = useMemo(() => ({ user, setUser }), [user])
  const themeValue = useMemo(() => ({ theme, setTheme }), [theme])
  
  return (
    <UserContext.Provider value={userValue}>
      <ThemeContext.Provider value={themeValue}>
        <Header /> {/* Only re-renders when user changes */}
        <Sidebar /> {/* Only re-renders when theme changes */}
      </ThemeContext.Provider>
    </UserContext.Provider>
  )
}`,
        category: 'context',
        tags: ['Context', 'optimization', 'split'],
        difficulty: 'hard',
        relatedDays: [6],
        language: 'jsx'
    },
    {
        id: 'effect-cleanup',
        title: 'useEffect with Cleanup',
        description: 'Proper cleanup for subscriptions and listeners',
        code: `import { useEffect, useState } from 'react'

function Component() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    const subscription = subscribeToData((newData) => {
      setData(newData)
    })
    
    // Cleanup function
    return () => {
      subscription.unsubscribe()
    }
  }, [])
  
  return <div>{data}</div>
}`,
        category: 'effects',
        tags: ['useEffect', 'cleanup', 'subscription'],
        difficulty: 'medium',
        relatedDays: [5],
        language: 'jsx'
    },
    {
        id: 'functional-update',
        title: 'Functional State Updates',
        description: 'Avoid stale closures with functional updates',
        code: `import { useEffect, useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      // Functional update avoids stale closure
      setCount(c => c + 1)
    }, 1000)
    
    return () => clearInterval(interval)
  }, []) // No dependency needed!
  
  return <div>{count}</div>
}`,
        category: 'effects',
        tags: ['useState', 'functional-update', 'stale-closure'],
        difficulty: 'medium',
        relatedDays: [5],
        language: 'jsx'
    },
    {
        id: 'stable-keys',
        title: 'Stable Keys for Lists',
        description: 'Use stable IDs instead of index keys',
        code: `// ❌ Bad: Index keys
{todos.map((todo, index) => (
  <TodoItem key={index} todo={todo} />
))}

// ✅ Good: Stable IDs
{todos.map(todo => (
  <TodoItem key={todo.id} todo={todo} />
))}

// ✅ Good: Generate stable ID if missing
{todos.map(todo => (
  <TodoItem 
    key={todo.id || \`todo-\${todo.text}-\${todo.createdAt}\`} 
    todo={todo} 
  />
))}`,
        category: 'reconciliation',
        tags: ['keys', 'lists', 'reconciliation'],
        difficulty: 'easy',
        relatedDays: [2],
        language: 'jsx'
    },
    {
        id: 'custom-hook',
        title: 'Custom Hook Pattern',
        description: 'Extract reusable logic into custom hooks',
        code: `// Custom hook
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue)
  
  const increment = useCallback(() => {
    setCount(c => c + 1)
  }, [])
  
  const decrement = useCallback(() => {
    setCount(c => c - 1)
  }, [])
  
  const reset = useCallback(() => {
    setCount(initialValue)
  }, [initialValue])
  
  return { count, increment, decrement, reset }
}

// Usage
function Component() {
  const { count, increment, decrement } = useCounter(10)
  
  return (
    <div>
      <button onClick={decrement}>-</button>
      <span>{count}</span>
      <button onClick={increment}>+</button>
    </div>
  )
}`,
        category: 'patterns',
        tags: ['custom-hook', 'reusability', 'patterns'],
        difficulty: 'medium',
        relatedDays: [4, 5],
        language: 'jsx'
    }
]

class CodeSnippetsService {
    /**
     * Get all snippets
     */
    getSnippets(): CodeSnippet[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                const custom = JSON.parse(stored) as CodeSnippet[]
                return [...defaultSnippets, ...custom]
            }
        } catch (error) {
            console.warn('Failed to load custom snippets:', error)
        }
        return defaultSnippets
    }

    /**
     * Search snippets
     */
    searchSnippets(query: string, filters?: {
        category?: string
        difficulty?: 'easy' | 'medium' | 'hard'
        day?: number
    }): CodeSnippet[] {
        let results = this.getSnippets()
        const lowerQuery = query.toLowerCase()

        // Text search
        if (query) {
            results = results.filter(snippet =>
                snippet.title.toLowerCase().includes(lowerQuery) ||
                snippet.description.toLowerCase().includes(lowerQuery) ||
                snippet.code.toLowerCase().includes(lowerQuery) ||
                snippet.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
            )
        }

        // Category filter
        if (filters?.category) {
            results = results.filter(snippet => snippet.category === filters.category)
        }

        // Difficulty filter
        if (filters?.difficulty) {
            results = results.filter(snippet => snippet.difficulty === filters.difficulty)
        }

        // Day filter
        if (filters?.day) {
            results = results.filter(snippet =>
                snippet.relatedDays.includes(filters.day!)
            )
        }

        return results
    }

    /**
     * Get snippets by category
     */
    getSnippetsByCategory(category: string): CodeSnippet[] {
        return this.getSnippets().filter(snippet => snippet.category === category)
    }

    /**
     * Get categories
     */
    getCategories(): string[] {
        const categories = new Set<string>()
        this.getSnippets().forEach(snippet => {
            categories.add(snippet.category)
        })
        return Array.from(categories).sort()
    }

    /**
     * Add custom snippet
     */
    addSnippet(snippet: Omit<CodeSnippet, 'id'>): string {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            const custom: CodeSnippet[] = stored ? JSON.parse(stored) : []
            
            const newSnippet: CodeSnippet = {
                ...snippet,
                id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            }
            custom.push(newSnippet)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(custom))
            return newSnippet.id
        } catch (error) {
            console.warn('Failed to save custom snippet:', error)
            return ''
        }
    }

    /**
     * Delete custom snippet
     */
    deleteSnippet(id: string): boolean {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (!stored) return false
            
            const custom = JSON.parse(stored) as CodeSnippet[]
            const filtered = custom.filter(s => s.id !== id)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
            return true
        } catch (error) {
            console.warn('Failed to delete snippet:', error)
            return false
        }
    }
}

export const codeSnippetsService = new CodeSnippetsService()
