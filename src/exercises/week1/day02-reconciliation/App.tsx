import { useState, type JSX } from 'react'
import '../../exerciseLayout.css'
import Quiz from '../../../components/Quiz'
import DebuggingScenario from '../../../components/DebuggingScenario'
import RealWorldScenarios from '../../../components/RealWorldScenarios'
import VisualDiagram from '../../../components/VisualDiagram'
import CrossDayConnections from '../../../components/CrossDayConnections'
import HeroSection from '../../../components/HeroSection'
import Tabs from '../../../components/Tabs'
import Card from '../../../components/Card'
import { dayPresets } from '../../../components/CodePlaygroundPresets'
import VisualDiagrams from '../../../components/VisualDiagrams'
import PersonalNotes from '../../../components/PersonalNotes'
import DailyReflection from '../../../components/DailyReflection'
import { Accordion, CollapsibleSection } from '../../../components/ui/CollapsibleSection'
import { PracticeExtras } from '../../../components/PracticeExtras'
import ReconciliationTodoDemo from './components/ReconciliationTodoDemo'
import TypeComparisonDemo from './components/TypeComparisonDemo'
import { day02Challenges, day02Quiz, day02Debugging, day02RealWorld } from './challenges'

interface TodoItem {
  id: string
  text: string
  completed: boolean
}

function Day02Reconciliation(): JSX.Element {
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: '1', text: 'Learn React', completed: false },
    { id: '2', text: 'Master Reconciliation', completed: false },
    { id: '3', text: 'Build awesome apps', completed: false },
  ])

  const [useIndexKeys, setUseIndexKeys] = useState<boolean>(true)

  const toggleTodo = (id: string): void => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const moveUp = (index: number): void => {
    if (index === 0) return
    const newTodos = [...todos]
    const temp = newTodos[index]
    newTodos[index] = newTodos[index - 1]
    newTodos[index - 1] = temp
    setTodos(newTodos)
  }

  const moveDown = (index: number): void => {
    if (index === todos.length - 1) return
    const newTodos = [...todos]
    const temp = newTodos[index]
    newTodos[index] = newTodos[index + 1]
    newTodos[index + 1] = temp
    setTodos(newTodos)
  }

  const containerStyle: React.CSSProperties = {
    color: 'var(--text-primary)'
  }

  return (
    <div style={containerStyle}>
      <HeroSection
        day={2}
        title="Reconciliation Deep Dive"
        description="Master Type Comparison Rule, Keys and Identity, and List Diffing Complexity."
      />

      <Tabs
        tabs={[
          {
            id: 'learn',
            label: 'Learn',
            icon: '📚',
            content: (
              <div>
                <Card
                  title="Learning Objectives"
                  icon="🎯"
                  style={{ marginBottom: '24px' }}
                >
                  <ul className="lesson-task-list" style={{ margin: 0 }}>
                    <li>Understand Type Comparison Rule</li>
                    <li>Master Keys and Identity</li>
                    <li>Learn List Diffing Complexity</li>
                    <li>Observe state bugs with index keys</li>
                  </ul>
                </Card>

                <Card
                  title="Interactive Exercise"
                  icon="💡"
                  style={{ marginBottom: '24px' }}
                >
                  <div
                    style={{
                      background: 'var(--bg-warning)',
                      color: 'var(--text-on-warning)',
                      padding: '12px 14px',
                      borderRadius: 8,
                      marginBottom: 20,
                      boxSizing: 'border-box',
                    }}
                  >
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        cursor: 'pointer',
                        margin: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={useIndexKeys}
                        onChange={(e) => setUseIndexKeys(e.target.checked)}
                        style={{
                          width: 16,
                          height: 16,
                          margin: '2px 0 0',
                          flexShrink: 0,
                          cursor: 'pointer',
                        }}
                      />
                      <span style={{ minWidth: 0 }}>
                        <strong>Use index keys (bug mode)</strong>
                        <span style={{ fontWeight: 400 }}> — toggle to compare</span>
                      </span>
                    </label>
                    <p
                      style={{
                        fontSize: 12,
                        margin: '10px 0 0',
                        paddingLeft: 26,
                        lineHeight: 1.45,
                        color: 'var(--text-on-warning)',
                        opacity: 0.9,
                      }}
                    >
                      {useIndexKeys
                        ? 'Using index keys — local row state sticks to the slot when you reorder.'
                        : 'Using stable id keys — local row state travels with the item.'}
                    </p>
                  </div>

                  <ReconciliationTodoDemo
                    todos={todos}
                    useIndexKeys={useIndexKeys}
                    onToggleTodo={toggleTodo}
                    onMoveUp={moveUp}
                    onMoveDown={moveDown}
                  />
                </Card>

                <Card
                  title="Type Comparison Lab"
                  icon="🔀"
                  style={{ marginBottom: '24px' }}
                >
                  <TypeComparisonDemo />
                </Card>

                <p
                  style={{
                    margin: '0 0 16px',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.45,
                  }}
                >
                  Try the todo demo above first — open Key Concepts below for the deep dive.
                </p>

                <Accordion style={{ marginBottom: 20 }}>
                  <CollapsibleSection title="Type Comparison Rule" defaultOpen>
                    <p>React's reconciliation algorithm first checks if element types match:</p>
                    <ul>
                      <li><strong>Same Type:</strong> React updates the existing element with new props</li>
                      <li><strong>Different Type:</strong> React unmounts the old element completely and mounts a new one</li>
                    </ul>
                    <p><strong>Example:</strong></p>
                    <pre className="lesson-code">
{`// Same type - React updates props
<div className="old"> → <div className="new"> ✅ Updates

// Different type - React replaces
<div> → <span> ❌ Unmounts div, mounts span`}
                    </pre>
                    <p><strong>Why it matters:</strong> When types differ, React destroys the old component (losing state) and creates a new one. This is why you should avoid changing component types dynamically.</p>
                  </CollapsibleSection>

                  <CollapsibleSection title="Keys and Identity">
                    <p>Keys help React identify which items are the same across renders:</p>
                    <ul>
                      <li><strong>Purpose:</strong> Keys provide a stable identity for list items</li>
                      <li><strong>Matching:</strong> React uses keys to match old and new elements</li>
                      <li><strong>State Preservation:</strong> Same key = same component instance = state preserved</li>
                      <li><strong>Different Key:</strong> Different key = different component = state lost</li>
                    </ul>
                    <p><strong>Good Keys:</strong></p>
                    <ul>
                      <li>✅ Stable (don't change between renders)</li>
                      <li>✅ Unique (no duplicates in the list)</li>
                      <li>✅ Predictable (not random values)</li>
                      <li>✅ From data (item.id, item.uuid, etc.)</li>
                    </ul>
                    <p><strong>Bad Keys:</strong></p>
                    <ul>
                      <li>❌ Index (changes when items move)</li>
                      <li>❌ Random values (new key every render)</li>
                      <li>❌ Non-unique values (duplicates)</li>
                    </ul>
                    <p><strong>In this exercise:</strong> When using index keys, moving an item changes its key, so React thinks it's a different item and loses its state (like the checked status).</p>
                  </CollapsibleSection>

                  <CollapsibleSection title="List Diffing Complexity">
                    <p>React's algorithm for efficiently updating lists:</p>
                    <ul>
                      <li><strong>With Keys:</strong> O(n) complexity - React can quickly match items by key</li>
                      <li><strong>Without Keys:</strong> O(n²) complexity in worst case - React must compare every item with every other item</li>
                      <li><strong>Efficiency:</strong> Keys allow React to skip items that haven't moved</li>
                    </ul>
                    <p><strong>How it works:</strong></p>
                    <ol>
                      <li>React creates a map of old items by key</li>
                      <li>React iterates through new items</li>
                      <li>For each new item, React looks up the old item by key</li>
                      <li>If found: update the existing item</li>
                      <li>If not found: mount a new item</li>
                      <li>Items not in new list: unmount</li>
                    </ol>
                    <p><strong>Performance Impact:</strong> With 1000 items, proper keys make updates ~1000x faster than without keys!</p>
                  </CollapsibleSection>

                  <CollapsibleSection title="The Index Key Bug Explained">
                    <p style={{ marginBottom: 8 }}>
                      <strong>Index keys — reorder Item A down:</strong>
                    </p>
                    <pre className="lesson-code">{`// Before
[ key:0 ItemA★, key:1 ItemB, key:2 ItemC ]

// After (keys stay on the slot)
[ key:0 ItemB, key:1 ItemA★, key:2 ItemC ]
// ❌ React: “key 0 / 1 = same component” → props swap, fiber stays`}</pre>
                    <ul>
                      <li>React matches by <strong>key</strong>, not by the item data.</li>
                      <li>Index keys keep the fiber at that position; props update underneath.</li>
                      <li>Local state, focus, and handlers can stick to the wrong row.</li>
                      <li>Controlled props may look fine — the identity bug is still there.</li>
                    </ul>
                    <p style={{ marginBottom: 8 }}>
                      <strong>Stable id keys:</strong>
                    </p>
                    <pre className="lesson-code">{`// Before
[ key:"a" ItemA★, key:"b" ItemB, key:"c" ItemC ]

// After
[ key:"b" ItemB, key:"a" ItemA★, key:"c" ItemC ]
// ✅ Fiber for "a" moves with Item A — state stays correct`}</pre>
                    <p style={{ marginBottom: 0, fontSize: 14, lineHeight: 1.45 }}>
                      Same key → same component instance. Checked state and notes travel with the item.
                    </p>
                  </CollapsibleSection>
                

                <CollapsibleSection title="Common mistakes in production" style={{ marginBottom: 12 }}>
                  <p><strong>Real-world scenarios where index keys cause bugs:</strong></p>
                  <ul>
                    <li><strong>Sortable Lists:</strong> User sorts a list, then edits an item - edits appear on wrong item!</li>
                    <li><strong>Filterable Lists:</strong> User filters, checks items, then changes filter - checked state moves!</li>
                    <li><strong>Dynamic Lists:</strong> Items added/removed, user interacts with items - state gets mixed up!</li>
                    <li><strong>Drag & Drop:</strong> User reorders items, then toggles something - toggle appears on wrong item!</li>
                  </ul>
                  <p><strong>Solution:</strong> Always use stable, unique keys from your data (id, uuid, etc.)</p>
                </CollapsibleSection>

                <CollapsibleSection title="Reconciliation process diagram">
                  <VisualDiagram
                  title="Reconciliation Process"
                  steps={[
                    {
                      title: 'Initial Render',
                      content: 'React creates components with keys',
                      visual: `[\n  { key: 0, component: ItemA },\n  { key: 1, component: ItemB },\n  { key: 2, component: ItemC }\n]`
                    },
                    {
                      title: 'After Reorder',
                      content: 'Items moved, but keys stay the same (if using index)',
                      visual: `[\n  { key: 0, component: ItemB },  // ❌ Wrong match!\n  { key: 1, component: ItemA },  // ❌ Wrong match!\n  { key: 2, component: ItemC }\n]`
                    },
                    {
                      title: 'React\'s Matching',
                      content: 'React matches by key, not by data',
                      visual: `React thinks:\nKey 0 = Same component → Updates props\nKey 1 = Same component → Updates props\n\nResult: State stays with key, not item!`
                    },
                    {
                      title: 'With Proper Keys',
                      content: 'Keys identify items correctly',
                      visual: `[\n  { key: "b", component: ItemB },  // ✅ Correct\n  { key: "a", component: ItemA },  // ✅ Correct\n  { key: "c", component: ItemC }\n]\n\nReact matches by key:\nKey "a" = ItemA → Moves correctly\nKey "b" = ItemB → Moves correctly`
                    }
                  ]}
                />
                </CollapsibleSection>
                </Accordion>
              </div>
            )
          },
          {
            id: 'practice',
            label: 'Practice',
            icon: '💻',
            content: (
              <div>
                <PracticeExtras
                  lead={(
                    <CollapsibleSection title="Visual diagrams" style={{ marginBottom: 12 }}>
                      <VisualDiagrams type="reconciliation" />
                    </CollapsibleSection>
                  )}
                  challenges={day02Challenges}
                  presets={dayPresets[2] || []}
                  day={2}
                  focusAreas={[
                    'Use Components tab to inspect keys',
                    'Watch component state when reordering with index keys',
                    'See how keys affect component identity',
                  ]}
                />
              </div>
            )
          },
          {
            id: 'quiz',
            label: 'Quiz',
            icon: '🧪',
            content: (
              <div>
                {day02Quiz.length > 0 && (
                  <Quiz 
                    questions={day02Quiz} 
                    title="Day 2: Self-Assessment Quiz"
                    day={2}
                    enableAI={true}
                  />
                )}
              </div>
            )
          },
          {
            id: 'debug',
            label: 'Debug',
            icon: '🐛',
            content: (
              <div>
                {day02Debugging.length > 0 && (
                  <div>
                    <h2 style={{ marginBottom: '20px' }}>Debugging Scenarios</h2>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                      gap: '20px'
                    }}>
                      {day02Debugging.map((scenario) => (
                        <DebuggingScenario key={scenario.id} scenario={scenario} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          },
          {
            id: 'realworld',
            label: 'Real World',
            icon: '🌍',
            content: (
              <div>
                {day02RealWorld.length > 0 && (
                  <RealWorldScenarios scenarios={day02RealWorld} currentDay={2} />
                )}
                <CrossDayConnections
                  currentDay={2}
                  connections={[
                    {
                      fromDay: 2,
                      toDay: 1,
                      connection: 'Reconciliation → Rendering Pipeline',
                      explanation: 'Reconciliation happens during the render phase (Day 1). React uses keys to efficiently determine what changed.'
                    },
                    {
                      fromDay: 2,
                      toDay: 3,
                      connection: 'Reconciliation → Fiber',
                      explanation: 'Fiber (Day 3) performs reconciliation. Each Fiber node represents a unit of reconciliation work.'
                    },
                    {
                      fromDay: 2,
                      toDay: 4,
                      connection: 'Keys → Memoization',
                      explanation: 'Proper keys (Day 2) work together with memoization (Day 4). React.memo uses keys to determine if props changed.'
                    }
                  ]}
                />
              </div>
            )
          },
          {
            id: 'notes',
            label: 'Notes',
            icon: '📝',
            content: (
              <div>
                <PersonalNotes day={2} />
              </div>
            )
          },
          {
            id: 'reflection',
            label: 'Reflection',
            icon: '🤔',
            content: (
              <div>
                <DailyReflection day={2} />
              </div>
            )
          }
        ]}
      />
    </div>
  )
}

export default Day02Reconciliation
