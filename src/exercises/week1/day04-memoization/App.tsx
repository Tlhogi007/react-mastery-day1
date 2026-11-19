import { type JSX } from 'react'
import '../../exerciseLayout.css'
import Quiz from '../../../components/Quiz'
import DebuggingScenario from '../../../components/DebuggingScenario'
import RealWorldScenarios from '../../../components/RealWorldScenarios'
import CrossDayConnections from '../../../components/CrossDayConnections'
import HeroSection from '../../../components/HeroSection'
import Tabs from '../../../components/Tabs'
import Card from '../../../components/Card'
import PersonalNotes from '../../../components/PersonalNotes'
import DailyReflection from '../../../components/DailyReflection'
import VisualDiagram from '../../../components/VisualDiagram'
import { Accordion, CollapsibleSection } from '../../../components/ui/CollapsibleSection'
import { MemoizationPracticeSection } from '../../../components/MemoizationPracticeSection'
import { PracticeExtras } from '../../../components/PracticeExtras'
import { dayPresets } from '../../../components/CodePlaygroundPresets'
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

                <p
                  style={{
                    margin: '0 0 16px',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.45,
                  }}
                >
                  Practice has live demos — open Key Concepts below when you want the deep dive.
                </p>

                <Accordion style={{ marginBottom: 20 }}>
                  <CollapsibleSection title="React.memo" defaultOpen>
                    <p>Higher-order component that skips re-renders when props are shallowly equal.</p>
                    <ul>
                      <li><strong>Shallow compare</strong> props</li>
                      <li><strong>Use</strong> when props rarely change</li>
                      <li><strong>Avoid</strong> when parents pass new objects/functions every render</li>
                    </ul>
                    <pre className="lesson-code">
{`const Memoized = memo(function Comp({ data }) {
  return <div>{data.value}</div>
})
const data = useMemo(() => ({ value: 42 }), [])
<Memoized data={data} />`}
                    </pre>
                  </CollapsibleSection>

                  <CollapsibleSection title="useMemo">
                    <p>Caches an expensive calculation until dependencies change.</p>
                    <ul>
                      <li><strong>Use</strong> for filtering, sorting, heavy math</li>
                      <li><strong>Skip</strong> trivial work — overhead can cost more</li>
                    </ul>
                    <pre className="lesson-code">
{`const filtered = useMemo(
  () => items.filter((i) => i.name.includes(q)),
  [items, q],
)`}
                    </pre>
                  </CollapsibleSection>

                  <CollapsibleSection title="useCallback">
                    <p>Keeps a stable function reference for memoized children.</p>
                    <ul>
                      <li><strong>Use</strong> when passing handlers into <code>memo</code> components</li>
                      <li><strong>Skip</strong> if the child is not memoized</li>
                    </ul>
                    <pre className="lesson-code">
{`const onClick = useCallback(() => setCount((c) => c + 1), [])
<MemoizedButton onClick={onClick} />`}
                    </pre>
                  </CollapsibleSection>

                  <CollapsibleSection title="Referential equality">
                    <p>React compares props with <code>Object.is</code> / reference equality.</p>
                    <ul>
                      <li>Primitives: by value</li>
                      <li>Objects / arrays / functions: by reference</li>
                    </ul>
                    <pre className="lesson-code">
{`// new object every render → memo child still updates
<data={{ value: 42 }} />
// stable → memo can bail out
const data = useMemo(() => ({ value: 42 }), [])`}
                    </pre>
                  </CollapsibleSection>
                

                <CollapsibleSection title="Memoization flow diagram">
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
DOM updated (even if nothing changed)`,
                      },
                      {
                        title: 'With React.memo',
                        content: 'Component skips re-render if props unchanged',
                        visual: `Parent updates
    ↓
React.memo checks props
    ↓
Props same? → Skip re-render ✅
Props different? → Re-render`,
                      },
                      {
                        title: 'With useMemo',
                        content: 'Expensive calculation only runs when dependencies change',
                        visual: `Component renders
    ↓
useMemo checks dependencies
    ↓
Deps same? → Return cached value ✅
Deps different? → Recalculate`,
                      },
                      {
                        title: 'With useCallback',
                        content: 'Function reference stays stable when dependencies unchanged',
                        visual: `Component renders
    ↓
useCallback checks dependencies
    ↓
Deps same? → Return same function ✅
Deps different? → Create new function`,
                      },
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
                <MemoizationPracticeSection />
                <PracticeExtras
                  challenges={day04Challenges}
                  presets={dayPresets[4] || []}
                  day={4}
                  focusAreas={[
                    'Use Profiler to identify wasted renders',
                    'See which components re-render unnecessarily',
                    'Measure performance before and after memoization',
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
