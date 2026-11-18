import { type JSX } from 'react'
import Quiz from '../../../components/Quiz'
import Challenge from '../../../components/Challenge'
import DebuggingScenario from '../../../components/DebuggingScenario'
import RealWorldScenarios from '../../../components/RealWorldScenarios'
import CrossDayConnections from '../../../components/CrossDayConnections'
import HeroSection from '../../../components/HeroSection'
import Tabs from '../../../components/Tabs'
import Card from '../../../components/Card'
import CodePlaygroundPresets, { dayPresets } from '../../../components/CodePlaygroundPresets'
import PersonalNotes from '../../../components/PersonalNotes'
import DailyReflection from '../../../components/DailyReflection'
import VisualDiagram from '../../../components/VisualDiagram'
import ReactDevToolsGuide from '../../../components/ReactDevToolsGuide'
import { day07Quiz, day07Challenges, day07Debugging, day07RealWorld } from './challenges'

function Day07Reflection(): JSX.Element {
  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <HeroSection
        day={7}
        title="Weekly Deep Reflection"
        description="Test your understanding of Week 1 concepts - be able to explain without notes."
      />

      <Tabs
        tabs={[
          {
            id: 'review',
            label: 'Review',
            icon: '📚',
            content: (
              <div>
                <Card
                  title="Week 1 Review"
                  icon="📚"
                  style={{ marginBottom: '24px' }}
                >
                  <p><strong>Be able to explain without notes:</strong></p>
                  <ul>
                    <li>✅ Reconciliation - How React determines what changed</li>
                    <li>✅ Fiber - The architecture that enables concurrent rendering</li>
                    <li>✅ Effect Timing - When effects run and why</li>
                    <li>✅ Bailouts - How React.memo, useMemo, useCallback prevent re-renders</li>
                    <li>✅ Context - Why all consumers re-render and how to optimize</li>
                  </ul>
                  <p style={{ marginTop: '15px', fontStyle: 'italic' }}>
                    <strong>If you can teach it, you own it.</strong>
                  </p>
                </Card>

                <Card
                  title="Reflection Questions"
                  icon="🎯"
                  style={{ marginBottom: '24px' }}
                >
                  <p>Answer these without looking at your notes:</p>
                  <ol>
                    <li>What happens from setState to DOM mutation? (Day 1)</li>
                    <li>Why do index keys cause bugs in reorderable lists? (Day 2)</li>
                    <li>How does Fiber enable interruptible rendering? (Day 3)</li>
                    <li>When should you use React.memo vs useMemo? (Day 4)</li>
                    <li>What causes stale closures in useEffect? (Day 5)</li>
                    <li>How can you reduce Context re-renders? (Day 6)</li>
                  </ol>
                </Card>

                <Card
                  title="Key Concepts Summary"
                  icon="🔑"
                  style={{ marginBottom: '24px' }}
                >
                  <div style={{ marginBottom: '20px' }}>
                    <h4>Week 1 Core Concepts</h4>
                    <ul>
                      <li><strong>Day 1 - Rendering Pipeline:</strong> Render phase (interruptible) vs Commit phase (synchronous). Virtual DOM enables efficient updates.</li>
                      <li><strong>Day 2 - Reconciliation:</strong> React compares element types and uses keys for lists. Index keys cause bugs when items reorder.</li>
                      <li><strong>Day 3 - Fiber:</strong> Unit of work model enables interruptible rendering. Current vs WorkInProgress trees.</li>
                      <li><strong>Day 4 - Memoization:</strong> React.memo prevents re-renders, useMemo prevents recalculations, useCallback provides stable function references.</li>
                      <li><strong>Day 5 - Effects:</strong> useEffect runs in commit phase after DOM updates. Stale closures occur with missing dependencies.</li>
                      <li><strong>Day 6 - Context:</strong> All consumers re-render when value changes. Split contexts and memoize values to optimize.</li>
                    </ul>
                  </div>

                  <div>
                    <h4>Common Patterns</h4>
                    <ul>
                      <li><strong>Optimization Pattern:</strong> React.memo + useMemo + useCallback for expensive components</li>
                      <li><strong>Context Pattern:</strong> Split by concern + memoize values + memoize consumers</li>
                      <li><strong>Effect Pattern:</strong> Include all dependencies + use updater functions for state</li>
                      <li><strong>Key Pattern:</strong> Always use stable, unique IDs from data, never index</li>
                    </ul>
                  </div>
                </Card>

                <VisualDiagram
                  title="Week 1 Concepts Flow"
                  steps={[
                    {
                      title: 'User Action',
                      content: 'User interacts with component',
                      visual: `User clicks button
    ↓
Event handler fires`
                    },
                    {
                      title: 'State Update',
                      content: 'setState schedules update (Day 1)',
                      visual: `setState() called
    ↓
React schedules update
    ↓
Render phase begins`
                    },
                    {
                      title: 'Render Phase',
                      content: 'Component re-executes, creates Virtual DOM (Day 1)',
                      visual: `Render Phase (Day 1):
  - Component function runs
  - Virtual DOM created
  - Reconciliation (Day 2)
  - Fiber processes (Day 3)`
                    },
                    {
                      title: 'Commit Phase',
                      content: 'DOM updated, effects run (Day 5)',
                      visual: `Commit Phase:
  - DOM updated
  - useEffect runs (Day 5)
  - Cleanup runs
  - Browser paints`
                    },
                    {
                      title: 'Optimization',
                      content: 'Memoization prevents unnecessary work (Day 4)',
                      visual: `Optimization (Day 4):
  - React.memo skips re-render
  - useMemo caches calculation
  - useCallback stable function
  - Context memoized (Day 6)`
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
                  <h2 style={{ marginBottom: '20px' }}>Try Code Examples</h2>
                  <CodePlaygroundPresets presets={dayPresets[7] || []} />
                </div>

                {day07Challenges.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ marginBottom: '20px' }}>Practice Challenges</h2>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                      gap: '20px'
                    }}>
                      {day07Challenges.map((challenge) => (
                        <Challenge key={challenge.id} challenge={challenge} />
                      ))}
                    </div>
                  </div>
                )}

                {day07Debugging.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ marginBottom: '20px' }}>Debugging Scenarios</h2>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                      gap: '20px'
                    }}>
                      {day07Debugging.map((scenario) => (
                        <DebuggingScenario key={scenario.id} scenario={scenario} />
                      ))}
                    </div>
                  </div>
                )}

                <ReactDevToolsGuide 
                  day={7} 
                  focusAreas={[
                    'Use Profiler to review Week 1 concepts',
                    'See render phase vs commit phase',
                    'Observe memoization preventing re-renders',
                    'Watch Context re-render propagation',
                    'Measure performance improvements'
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
                {day07Quiz.length > 0 && (
                  <Quiz 
                    questions={day07Quiz} 
                    title="Day 7: Week 1 Comprehensive Quiz"
                    day={7}
                    enableAI={true}
                  />
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
                {day07RealWorld.length > 0 && (
                  <RealWorldScenarios scenarios={day07RealWorld} currentDay={7} />
                )}
              </div>
            )
          },
          {
            id: 'connections',
            label: 'Connections',
            icon: '🔗',
            content: (
              <div>
                <CrossDayConnections
                  currentDay={7}
                  connections={[
                    {
                      fromDay: 7,
                      toDay: 8,
                      connection: 'Week 1 → Week 2',
                      explanation: 'Week 1 fundamentals (reconciliation, Fiber, memoization) are the foundation for Week 2\'s concurrent rendering features.'
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
                <PersonalNotes day={7} />
              </div>
            )
          },
          {
            id: 'reflection',
            label: 'Reflection',
            icon: '🤔',
            content: (
              <div>
                <DailyReflection day={7} />
              </div>
            )
          }
        ]}
      />
    </div>
  )
}

export default Day07Reflection
