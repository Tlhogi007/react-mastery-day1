import { useState, type JSX } from 'react'
import '../../exerciseLayout.css'
import Challenge from '../../../components/Challenge'
import Quiz from '../../../components/Quiz'
import DebuggingScenario from '../../../components/DebuggingScenario'
import RealWorldScenarios from '../../../components/RealWorldScenarios'
import ReactDevToolsGuide from '../../../components/ReactDevToolsGuide'
import VisualDiagram from '../../../components/VisualDiagram'
import CrossDayConnections from '../../../components/CrossDayConnections'
import HeroSection from '../../../components/HeroSection'
import Tabs from '../../../components/Tabs'
import Card from '../../../components/Card'
import CodePlaygroundPresets, { dayPresets } from '../../../components/CodePlaygroundPresets'
import VisualDiagrams from '../../../components/VisualDiagrams'
import PersonalNotes from '../../../components/PersonalNotes'
import DailyReflection from '../../../components/DailyReflection'
import ReconciliationTodoDemo from './components/ReconciliationTodoDemo'
import TypeComparisonDemo from './components/TypeComparisonDemo'
import KeyConceptsSection from './components/KeyConceptsSection'
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
                  <div style={{
                    background: 'var(--bg-warning)',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={useIndexKeys}
                        onChange={(e) => setUseIndexKeys(e.target.checked)}
                        style={{ marginRight: '8px', cursor: 'pointer' }}
                      />
                      <strong>Use Index Keys (BUG MODE)</strong> - Toggle to see the difference!
                    </label>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', marginLeft: '24px' }}>
                      {useIndexKeys 
                        ? '⚠️ Using index keys - state will be preserved incorrectly when reordering'
                        : '✅ Using proper keys - state will be preserved correctly'}
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

                <Card
                  title="Key Concepts Explained"
                  icon="🔑"
                  style={{ marginBottom: '24px' }}
                >
                  <KeyConceptsSection />

                  <div
                    className="lesson-prose"
                    style={{
                      background: 'var(--bg-warning)',
                      padding: 'clamp(12px, 3vw, 15px)',
                      borderRadius: '8px',
                      marginTop: '20px',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <h4 style={{ marginTop: 0 }}>🐛 The Index Key Bug Explained</h4>
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
                  </div>
                </Card>

                <Card
                  title="Common Mistakes in Production"
                  icon="⚠️"
                  style={{ marginBottom: '24px' }}
                >
                  <p><strong>Real-world scenarios where index keys cause bugs:</strong></p>
                  <ul>
                    <li><strong>Sortable Lists:</strong> User sorts a list, then edits an item - edits appear on wrong item!</li>
                    <li><strong>Filterable Lists:</strong> User filters, checks items, then changes filter - checked state moves!</li>
                    <li><strong>Dynamic Lists:</strong> Items added/removed, user interacts with items - state gets mixed up!</li>
                    <li><strong>Drag & Drop:</strong> User reorders items, then toggles something - toggle appears on wrong item!</li>
                  </ul>
                  <p><strong>Solution:</strong> Always use stable, unique keys from your data (id, uuid, etc.)</p>
                </Card>

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
              </div>
            )
          },
          {
            id: 'practice',
            label: 'Practice',
            icon: '💻',
            content: (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ marginBottom: '20px' }}>Reconciliation Visualization</h2>
                  <VisualDiagrams type="reconciliation" />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ marginBottom: '20px' }}>Try Code Examples</h2>
                  <CodePlaygroundPresets presets={dayPresets[2] || []} />
                </div>

                {day02Challenges.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ marginBottom: '20px' }}>Practice Challenges</h2>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                      gap: '20px'
                    }}>
                      {day02Challenges.map((challenge) => (
                        <Challenge key={challenge.id} challenge={challenge} />
                      ))}
                    </div>
                  </div>
                )}
                <ReactDevToolsGuide 
                  day={2} 
                  focusAreas={[
                    'Use Components tab to inspect keys',
                    'Watch component state when reordering with index keys',
                    'See how keys affect component identity'
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
