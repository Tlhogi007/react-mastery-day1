import { type JSX } from 'react'
import '../../exerciseLayout.css'
import Challenge from '../../../components/Challenge'
import Quiz from '../../../components/Quiz'
import DebuggingScenario from '../../../components/DebuggingScenario'
import RealWorldScenarios from '../../../components/RealWorldScenarios'
import ReactDevToolsGuide from '../../../components/ReactDevToolsGuide'
import CrossDayConnections from '../../../components/CrossDayConnections'
import HeroSection from '../../../components/HeroSection'
import Tabs from '../../../components/Tabs'
import Card from '../../../components/Card'
import CodePlaygroundPresets, { dayPresets } from '../../../components/CodePlaygroundPresets'
import PersonalNotes from '../../../components/PersonalNotes'
import DailyReflection from '../../../components/DailyReflection'
import MemoizationDemo from '../../../components/MemoizationDemo'
import VisualDiagram from '../../../components/VisualDiagram'
import PerformanceMonitor from '../../../components/PerformanceMonitor'
import { day04Challenges, day04Quiz, day04Debugging, day04RealWorld } from './challenges'

function Day04Memoization(): JSX.Element {
  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <HeroSection
        day={4}
        title="Bailouts & Memoization"
        description="Master React.memo, useMemo, useCallback, and referential equality to prevent unnecessary re-renders."
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
                    <li>Understand when and why React re-renders components</li>
                    <li>Master React.memo for component-level optimization</li>
                    <li>Use useMemo for expensive calculations</li>
                    <li>Use useCallback for stable function references</li>
                    <li>Understand referential equality and its impact</li>
                  </ul>
                </Card>

                <Card
                  title="Interactive Exercise: Memoization in Action"
                  icon="💡"
                  style={{ marginBottom: '24px' }}
                >
                  <div style={{
                    background: 'var(--bg-info)',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    <p><strong>📝 Exercise:</strong> Go to the Practice tab and interact with the memoization demos. Watch the render counts to see how memoization prevents unnecessary re-renders!</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px' }}>
                      Open your browser's developer console (F12 or Cmd+Option+I) to see render logs
                    </p>
                  </div>
                </Card>

                <Card
                  title="Key Concepts Explained"
                  icon="🔑"
                  style={{ marginBottom: '24px' }}
                >
                  <div style={{ marginBottom: '20px' }}>
                    <h4>🛡️ React.memo</h4>
                    <p>React.memo is a higher-order component that prevents re-renders when props haven't changed:</p>
                    <ul>
                      <li><strong>Shallow Comparison:</strong> React.memo does a shallow comparison of props</li>
                      <li><strong>Referential Equality:</strong> If props are referentially equal, component skips re-render</li>
                      <li><strong>When to Use:</strong> Components that receive props that rarely change</li>
                      <li><strong>When NOT to Use:</strong> Components that receive new object/function props every render</li>
                    </ul>
                    <p><strong>Example:</strong></p>
                    <pre className="lesson-code">
{`const MemoizedComponent = memo(function Component({ data }) {
  return <div>{data.value}</div>
})

// ✅ Good: data is memoized
const data = useMemo(() => ({ value: 42 }), [])
<MemoizedComponent data={data} />

// ❌ Bad: new object every render
<MemoizedComponent data={{ value: 42 }} />`}
                    </pre>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <h4>💾 useMemo</h4>
                    <p>useMemo memoizes the result of an expensive calculation:</p>
                    <ul>
                      <li><strong>Purpose:</strong> Prevent recalculating expensive values on every render</li>
                      <li><strong>Dependencies:</strong> Only recalculates when dependencies change</li>
                      <li><strong>When to Use:</strong> Expensive calculations (filtering, sorting, complex math)</li>
                      <li><strong>When NOT to Use:</strong> Simple calculations (overhead isn't worth it)</li>
                    </ul>
                    <p><strong>Example:</strong></p>
                    <pre className="lesson-code">
{`// ❌ Without useMemo: recalculates every render
const filtered = items.filter(item =>
  item.name.includes(filter)
)

// ✅ With useMemo: only when items/filter change
const filtered = useMemo(
  () => items.filter(item => item.name.includes(filter)),
  [items, filter]
)`}
                    </pre>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <h4>🔗 useCallback</h4>
                    <p>useCallback memoizes a function to provide a stable reference:</p>
                    <ul>
                      <li><strong>Purpose:</strong> Prevent creating new function references on every render</li>
                      <li><strong>Stable Reference:</strong> Same function reference when dependencies unchanged</li>
                      <li><strong>When to Use:</strong> Functions passed as props to memoized components</li>
                      <li><strong>When NOT to Use:</strong> Functions that are recreated anyway (no benefit)</li>
                    </ul>
                    <p><strong>Example:</strong></p>
                    <pre className="lesson-code">
{`// ❌ Without useCallback: new function every render
const handleClick = () => setCount(c => c + 1)

// ✅ With useCallback: same function reference
const handleClick = useCallback(() => {
  setCount(c => c + 1)
}, [])

// MemoizedButton skips unnecessary re-renders
<MemoizedButton onClick={handleClick} />`}
                    </pre>
                  </div>

                  <div>
                    <h4>⚖️ Referential Equality</h4>
                    <p>React uses referential equality (===) to determine if props changed:</p>
                    <ul>
                      <li><strong>Primitives:</strong> Compared by value (1 === 1 is true)</li>
                      <li><strong>Objects/Arrays:</strong> Compared by reference ({'{'} a: 1 {'}'} !== {'{'} a: 1 {'}'})</li>
                      <li><strong>Functions:</strong> Compared by reference (() ={'>'} {'{}'} !== () ={'>'} {'{}'})</li>
                      <li><strong>Impact:</strong> New object/function props cause re-renders even if values are the same</li>
                    </ul>
                    <p><strong>This is why memoization matters:</strong></p>
                    <pre className="lesson-code">
{`// Every render creates new objects/functions
function App() {
  const data = { value: 42 } // ❌ new object
  const handleClick = () => {} // ❌ new function

  return (
    <MemoizedComponent
      data={data}
      onClick={handleClick}
    />
  )
  // Re-renders every time — props look "new"
}

// Memoization provides stable references
function App() {
  const data = useMemo(() => ({ value: 42 }), []) // ✅
  const handleClick = useCallback(() => {}, []) // ✅

  return (
    <MemoizedComponent
      data={data}
      onClick={handleClick}
    />
  )
  // Skips re-render when references stay the same
}`}
                    </pre>
                  </div>
                </Card>

                <VisualDiagram
                  title="Memoization Flow"
                  steps={[
                    {
                      title: 'Without Memoization',
                      content: 'Component re-renders on every parent update',
                      visual: `Parent updates
    ↓
Child re-renders
    ↓
Expensive calculation runs
    ↓
New function created
    ↓
DOM updated (even if nothing changed)`
                    },
                    {
                      title: 'With React.memo',
                      content: 'Component skips re-render if props unchanged',
                      visual: `Parent updates
    ↓
React.memo checks props
    ↓
Props same? → Skip re-render ✅
Props different? → Re-render`
                    },
                    {
                      title: 'With useMemo',
                      content: 'Expensive calculation only runs when dependencies change',
                      visual: `Component renders
    ↓
useMemo checks dependencies
    ↓
Deps same? → Return cached value ✅
Deps different? → Recalculate`
                    },
                    {
                      title: 'With useCallback',
                      content: 'Function reference stays stable when dependencies unchanged',
                      visual: `Component renders
    ↓
useCallback checks dependencies
    ↓
Deps same? → Return same function ✅
Deps different? → Create new function`
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
                  <h2 style={{ marginBottom: '20px' }}>Interactive Memoization Demos</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <MemoizationDemo type="memo" />
                    <MemoizationDemo type="useMemo" />
                    <MemoizationDemo type="useCallback" />
                  </div>
                  <PerformanceMonitor componentName="Day04Memoization" />
                </div>

                {day04Challenges.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ marginBottom: '20px' }}>Practice Challenges</h2>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                      gap: '20px'
                    }}>
                      {day04Challenges.map((challenge) => (
                        <Challenge key={challenge.id} challenge={challenge} />
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ marginBottom: '20px' }}>Try Code Examples</h2>
                  <CodePlaygroundPresets presets={dayPresets[4] || []} />
                </div>

                <ReactDevToolsGuide 
                  day={4} 
                  focusAreas={[
                    'Use Profiler to identify wasted renders',
                    'See which components re-render unnecessarily',
                    'Measure performance before and after memoization'
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
                {day04Quiz.length > 0 && (
                  <Quiz 
                    questions={day04Quiz} 
                    title="Day 4: Self-Assessment Quiz"
                    day={4}
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
                {day04Debugging.length > 0 && (
                  <div>
                    <h2 style={{ marginBottom: '20px' }}>Debugging Scenarios</h2>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                      gap: '20px'
                    }}>
                      {day04Debugging.map((scenario) => (
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
                {day04RealWorld.length > 0 && (
                  <RealWorldScenarios scenarios={day04RealWorld} currentDay={4} />
                )}
                <CrossDayConnections
                  currentDay={4}
                  connections={[
                    {
                      fromDay: 4,
                      toDay: 1,
                      connection: 'Memoization → Rendering Pipeline',
                      explanation: 'Understanding when renders happen (Day 1) helps you know when to use memoization (Day 4) to prevent unnecessary renders.'
                    },
                    {
                      fromDay: 4,
                      toDay: 2,
                      connection: 'Memoization → Reconciliation',
                      explanation: 'Memoization works with reconciliation (Day 2). React.memo uses referential equality to determine if reconciliation is needed.'
                    },
                    {
                      fromDay: 4,
                      toDay: 6,
                      connection: 'Memoization → Context',
                      explanation: 'Memoizing Context provider values (Day 6) prevents unnecessary re-renders, working together with React.memo (Day 4).'
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
                <PersonalNotes day={4} />
              </div>
            )
          },
          {
            id: 'reflection',
            label: 'Reflection',
            icon: '🤔',
            content: (
              <div>
                <DailyReflection day={4} />
              </div>
            )
          }
        ]}
      />
    </div>
  )
}

export default Day04Memoization
