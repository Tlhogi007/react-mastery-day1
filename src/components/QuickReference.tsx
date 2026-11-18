/**
 * Quick Reference Cheatsheet Component
 * One-page React internals reference guide
 */

import { useState, type JSX } from 'react'
import Card from './Card'
import Tabs from './Tabs'

interface ReferenceSection {
    id: string
    title: string
    icon: string
    content: JSX.Element
}

function QuickReference(): JSX.Element {
    const [searchTerm, setSearchTerm] = useState<string>('')

    const sections: ReferenceSection[] = [
        {
            id: 'rendering',
            title: 'Rendering Pipeline',
            icon: '⚙️',
            content: (
                <div>
                    <div style={{ marginBottom: '20px' }}>
                        <h4>Render Phase (Interruptible)</h4>
                        <ul>
                            <li><code>setState()</code> → schedules update</li>
                            <li>Component functions called</li>
                            <li>Virtual DOM created</li>
                            <li>Diffing occurs</li>
                            <li>Can be interrupted for urgent work</li>
                        </ul>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <h4>Commit Phase (Synchronous)</h4>
                        <ul>
                            <li>DOM updates applied</li>
                            <li><code>useEffect</code> runs</li>
                            <li>Cleanup functions execute</li>
                            <li>Must complete atomically</li>
                        </ul>
                    </div>
                    <div>
                        <h4>Key Points</h4>
                        <pre style={{ background: 'var(--bg-section)', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                            {`setState() → Render Phase → Commit Phase → Browser Paint`}
                        </pre>
                    </div>
                </div>
            )
        },
        {
            id: 'reconciliation',
            title: 'Reconciliation',
            icon: '🔄',
            content: (
                <div>
                    <div style={{ marginBottom: '20px' }}>
                        <h4>Type Comparison Rule</h4>
                        <ul>
                            <li><strong>Same type:</strong> Update props, keep instance</li>
                            <li><strong>Different type:</strong> Unmount old, mount new</li>
                        </ul>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <h4>Keys</h4>
                        <ul>
                            <li><strong>Good:</strong> Stable, unique, predictable (id, uuid)</li>
                            <li><strong>Bad:</strong> Index, random, duplicates</li>
                            <li><strong>Complexity:</strong> O(n) with keys, O(n²) without</li>
                        </ul>
                    </div>
                    <div>
                        <h4>Quick Tips</h4>
                        <pre style={{ background: 'var(--bg-section)', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                            {`// ❌ Bad
{todos.map((todo, i) => <Todo key={i} />)}

// ✅ Good
{todos.map(todo => <Todo key={todo.id} />)}`}
                        </pre>
                    </div>
                </div>
            )
        },
        {
            id: 'fiber',
            title: 'Fiber Architecture',
            icon: '🌲',
            content: (
                <div>
                    <div style={{ marginBottom: '20px' }}>
                        <h4>Fiber Node Structure</h4>
                        <ul>
                            <li><code>type</code> - Component type</li>
                            <li><code>child</code> - First child</li>
                            <li><code>sibling</code> - Next sibling</li>
                            <li><code>return</code> - Parent</li>
                            <li><code>alternate</code> - WorkInProgress ↔ Current</li>
                        </ul>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <h4>Two Trees</h4>
                        <ul>
                            <li><strong>Current:</strong> Committed to DOM</li>
                            <li><strong>WorkInProgress:</strong> Being built</li>
                            <li>Swap after commit</li>
                        </ul>
                    </div>
                    <div>
                        <h4>Why Fiber?</h4>
                        <ul>
                            <li>Enables interruptible rendering</li>
                            <li>Allows concurrent features</li>
                            <li>Priority-based updates</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'memoization',
            title: 'Memoization',
            icon: '💾',
            content: (
                <div>
                    <div style={{ marginBottom: '20px' }}>
                        <h4>React.memo</h4>
                        <pre style={{ background: 'var(--bg-section)', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                            {`const Memoized = React.memo(Component)
// Prevents re-render when props are referentially equal`}
                        </pre>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <h4>useMemo</h4>
                        <pre style={{ background: 'var(--bg-section)', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                            {`const value = useMemo(() => 
  expensiveCalculation(), 
  [deps]
)
// Memoizes computed values`}
                        </pre>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <h4>useCallback</h4>
                        <pre style={{ background: 'var(--bg-section)', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                            {`const handler = useCallback(() => {
  // do something
}, [deps])
// Memoizes function references`}
                        </pre>
                    </div>
                    <div>
                        <h4>When to Use</h4>
                        <ul>
                            <li>Expensive calculations</li>
                            <li>Props that rarely change</li>
                            <li>Stable function references</li>
                            <li><strong>Don't overuse!</strong> Overhead can exceed benefit</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'effects',
            title: 'Effects & Closures',
            icon: '⚡',
            content: (
                <div>
                    <div style={{ marginBottom: '20px' }}>
                        <h4>useEffect Timing</h4>
                        <ul>
                            <li>Runs <strong>after</strong> render and DOM update</li>
                            <li>Part of commit phase</li>
                            <li>Cleanup runs before next effect or unmount</li>
                        </ul>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <h4>Stale Closures</h4>
                        <pre style={{ background: 'var(--bg-section)', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                            {`// ❌ Stale closure
useEffect(() => {
  setCount(count + 1) // Uses old count
}, [])

// ✅ Fix 1: Add dependency
}, [count])

// ✅ Fix 2: Functional update
setCount(c => c + 1)

// ✅ Fix 3: useRef
const countRef = useRef(count)
countRef.current = count`}
                        </pre>
                    </div>
                    <div>
                        <h4>Dependency Array Rules</h4>
                        <ul>
                            <li>Empty <code>[]</code> = run once on mount</li>
                            <li>No array = run every render</li>
                            <li>Include all values used inside</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'context',
            title: 'Context',
            icon: '🌐',
            content: (
                <div>
                    <div style={{ marginBottom: '20px' }}>
                        <h4>Why All Consumers Re-render</h4>
                        <ul>
                            <li>All consumers subscribe to same value</li>
                            <li>Value change = all consumers notified</li>
                            <li>No selective updates</li>
                        </ul>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <h4>Optimization Strategies</h4>
                        <pre style={{ background: 'var(--bg-section)', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                            {`// 1. Split contexts
<UserContext.Provider>
  <ThemeContext.Provider>
    ...

// 2. Memoize value
const value = useMemo(() => 
  ({ user, setUser }), 
  [user]
)

// 3. Memoize consumers
const Consumer = memo(() => {
  const { user } = useContext(UserContext)
  return <div>{user.name}</div>
})`}
                        </pre>
                    </div>
                    <div>
                        <h4>Blast Radius</h4>
                        <ul>
                            <li>Number of components that re-render</li>
                            <li>Goal: Minimize blast radius</li>
                            <li>Split by concern, memoize values</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'keyboard',
            title: 'Keyboard Shortcuts',
            icon: '⌨️',
            content: (
                <div>
                    <div style={{ marginBottom: '20px' }}>
                        <h4>Navigation</h4>
                        <ul>
                            <li><kbd>j</kbd> / <kbd>k</kbd> - Next/Previous exercise</li>
                            <li><kbd>→</kbd> / <kbd>←</kbd> - Next/Previous exercise</li>
                            <li><kbd>r</kbd> - Random exercise</li>
                            <li><kbd>c</kbd> - Continue learning</li>
                        </ul>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <h4>Quiz</h4>
                        <ul>
                            <li><kbd>1-4</kbd> - Select answer option</li>
                            <li><kbd>Space</kbd> / <kbd>Enter</kbd> - Next question</li>
                            <li><kbd>s</kbd> - Skip question</li>
                            <li><kbd>j</kbd> / <kbd>k</kbd> - Navigate questions</li>
                        </ul>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <h4>General</h4>
                        <ul>
                            <li><kbd>?</kbd> - Show help</li>
                            <li><kbd>/</kbd> - Focus search</li>
                            <li><kbd>Esc</kbd> - Close modals</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'patterns',
            title: 'Common Patterns',
            icon: '📋',
            content: (
                <div>
                    <div style={{ marginBottom: '20px' }}>
                        <h4>Optimized Component</h4>
                        <pre style={{ background: 'var(--bg-section)', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                            {`const Component = memo(({ data, onClick }) => {
  const value = useMemo(() => 
    expensiveCalc(data), 
    [data]
  )
  const handler = useCallback(() => {
    onClick()
  }, [onClick])
  
  return <div onClick={handler}>{value}</div>
})`}
                        </pre>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <h4>Context Optimization</h4>
                        <pre style={{ background: 'var(--bg-section)', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                            {`// Split contexts
const UserContext = createContext()
const ThemeContext = createContext()

// Memoize value
const value = useMemo(() => 
  ({ user, setUser }), 
  [user]
)

// Memoize consumer
const UserProfile = memo(() => {
  const { user } = useContext(UserContext)
  return <div>{user.name}</div>
})`}
                        </pre>
                    </div>
                    <div>
                        <h4>Effect Patterns</h4>
                        <pre style={{ background: 'var(--bg-section)', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
                            {`// Mount only
useEffect(() => {
  // setup
  return () => {
    // cleanup
  }
}, [])

// On dependency change
useEffect(() => {
  // effect
}, [dep])

// Functional update (avoid stale closure)
setCount(c => c + 1)`}
                        </pre>
                    </div>
                </div>
            )
        }
    ]

    const filteredSections = sections.filter(section =>
        section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const containerStyle: React.CSSProperties = {
        color: 'var(--text-primary)',
        padding: 0,
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        minWidth: 0,
    }

    const searchStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid var(--border-primary)',
        background: 'var(--bg-section)',
        color: 'var(--text-primary)',
        fontSize: '16px',
        marginBottom: '20px'
    }

    return (
        <div className="tool-panel" style={containerStyle}>
            <div className="tool-panel__hero" style={{ marginBottom: '20px' }}>
                <h1 className="tool-panel__title">Quick Reference</h1>
                <p className="tool-panel__lead">
                    React internals cheatsheet — search and skim.
                </p>
            </div>

            <input
                type="text"
                placeholder="Search reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={searchStyle}
            />

            <Tabs
                tabs={filteredSections.map(section => ({
                    id: section.id,
                    label: section.title,
                    icon: section.icon,
                    content: (
                        <Card
                            title={section.title}
                            icon={section.icon}
                            style={{ marginBottom: '20px' }}
                        >
                            {section.content}
                        </Card>
                    )
                }))}
            />
        </div>
    )
}

export default QuickReference
