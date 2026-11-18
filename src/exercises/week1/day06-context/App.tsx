import { useState, type JSX } from 'react'
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
import VisualDiagrams from '../../../components/VisualDiagrams'
import VisualDiagram from '../../../components/VisualDiagram'
import PerformanceMonitor from '../../../components/PerformanceMonitor'
import { day06Challenges, day06Quiz, day06Debugging, day06RealWorld } from './challenges'

function Day06Context(): JSX.Element {
  const [user, setUser] = useState({ name: 'John', id: 1 })
  const [theme, setTheme] = useState('light')
  const [renderCount, setRenderCount] = useState({ header: 0, sidebar: 0, content: 0 })

  const handleUserChange = (): void => {
    setUser({ name: 'Jane', id: 2 })
    setRenderCount(prev => ({ ...prev, header: prev.header + 1 }))
  }

  const handleThemeChange = (): void => {
    setTheme(t => t === 'light' ? 'dark' : 'light')
    setRenderCount(prev => ({ ...prev, sidebar: prev.sidebar + 1 }))
  }

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <HeroSection
        day={6}
        title="Context & Re-render Propagation"
        description="Understand why all consumers re-render, splitting contexts, and memoizing provider values."
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
                    <li>Understand why all Context consumers re-render</li>
                    <li>Learn to split contexts by concern</li>
                    <li>Master memoizing provider values</li>
                    <li>Understand the blast radius concept</li>
                    <li>Build optimized Context patterns</li>
                  </ul>
                </Card>

                <Card
                  title="Interactive Exercise: Context Re-render Blast Radius"
                  icon="💡"
                  style={{ marginBottom: '24px' }}
                >
                  <div style={{
                    background: 'var(--bg-warning)',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    <p><strong>📝 Exercise:</strong> Click the buttons below to see how Context updates cause all consumers to re-render!</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px' }}>
                      Watch the render counts increase for all components, even when they don't use the changed value
                    </p>
                  </div>

                  <div style={{
                    border: '2px solid var(--border-primary)',
                    padding: '20px',
                    borderRadius: '8px',
                    background: 'var(--bg-section)',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                      <button
                        onClick={handleUserChange}
                        style={{
                          padding: '8px 16px',
                          background: 'var(--button-primary)',
                          color: 'var(--button-text)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Change User
                      </button>
                      <button
                        onClick={handleThemeChange}
                        style={{
                          padding: '8px 16px',
                          background: 'var(--button-primary)',
                          color: 'var(--button-text)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Change Theme
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '4px' }}>
                        <div>Header (needs user)</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          User: {user.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          Rendered: {renderCount.header} times
                        </div>
                      </div>
                      <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '4px' }}>
                        <div>Sidebar (needs theme)</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          Theme: {theme}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          Rendered: {renderCount.sidebar} times
                        </div>
                      </div>
                      <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '4px' }}>
                        <div>Content (needs neither)</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          Rendered: {renderCount.content} times
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px' }}>
                      💡 Notice: All components re-render when ANY context value changes, even if they don't use it!
                    </p>
                  </div>
                </Card>

                <Card
                  title="Key Concepts Explained"
                  icon="🔑"
                  style={{ marginBottom: '24px' }}
                >
                  <div style={{ marginBottom: '20px' }}>
                    <h4>🌐 Why All Consumers Re-render</h4>
                    <p>When Context value changes, React re-renders ALL consumers:</p>
                    <div className="lesson-points">
                      <div className="lesson-points__item"><span><strong>No Selective Updates:</strong> React doesn&apos;t track which values each consumer uses</span></div>
                      <div className="lesson-points__item"><span><strong>Simple Implementation:</strong> Easier to implement, but less efficient</span></div>
                      <div className="lesson-points__item"><span><strong>Blast Radius:</strong> One context update affects all consumers</span></div>
                      <div className="lesson-points__item"><span><strong>Solution:</strong> Split contexts, memoize values, memoize consumers</span></div>
                    </div>
                    <p><strong>Example:</strong></p>
                    <pre className="lesson-code">
{`// ❌ Single context — all consumers re-render
<AppContext.Provider
  value={{ user, theme }}
>
  <Header />   {/* theme change hits this */}
  <Sidebar />  {/* user change hits this */}
  <Content />  {/* any change hits this */}
</AppContext.Provider>

// ✅ Split — only relevant consumers re-render
<UserContext.Provider value={user}>
  <ThemeContext.Provider value={theme}>
    <Header />   {/* user only */}
    <Sidebar />  {/* theme only */}
    <Content />  {/* neither */}
  </ThemeContext.Provider>
</UserContext.Provider>`}
                    </pre>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <h4>✂️ Splitting Contexts</h4>
                    <p>Split contexts by concern to reduce blast radius:</p>
                    <div className="lesson-points">
                      <div className="lesson-points__item"><span><strong>By Concern:</strong> UserContext, ThemeContext, CartContext</span></div>
                      <div className="lesson-points__item"><span><strong>By Update Frequency:</strong> Static vs dynamic context</span></div>
                      <div className="lesson-points__item"><span><strong>By Scope:</strong> Global vs feature context</span></div>
                      <div className="lesson-points__item"><span><strong>Rule:</strong> If values change independently, split them</span></div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <h4>💾 Memoizing Provider Values</h4>
                    <p>Memoize context values to prevent unnecessary re-renders:</p>
                    <div className="lesson-points">
                      <div className="lesson-points__item"><span><strong>Problem:</strong> New object every render → all consumers re-render</span></div>
                      <div className="lesson-points__item"><span><strong>Solution:</strong> useMemo for a stable reference</span></div>
                      <div className="lesson-points__item"><span><strong>When:</strong> Always memoize object/array context values</span></div>
                      <div className="lesson-points__item"><span><strong>Dependencies:</strong> Include every value used in the context value</span></div>
                    </div>
                    <p><strong>Example:</strong></p>
                    <pre className="lesson-code">
{`// ❌ New object every render
const value = { user, setUser }
<Context.Provider value={value} />

// ✅ Same reference when user unchanged
const value = useMemo(
  () => ({ user, setUser }),
  [user]
)
<Context.Provider value={value} />`}
                    </pre>
                  </div>

                  <div>
                    <h4>🎯 Blast Radius Concept</h4>
                    <p>Blast radius = how many components re-render when context updates:</p>
                    <div className="lesson-points">
                      <div className="lesson-points__item"><span><strong>Large:</strong> One fat context → many re-renders</span></div>
                      <div className="lesson-points__item"><span><strong>Small:</strong> Split contexts → fewer re-renders</span></div>
                      <div className="lesson-points__item"><span><strong>Zero:</strong> Memoized consumers → no waste</span></div>
                      <div className="lesson-points__item"><span><strong>Goal:</strong> Minimize blast radius for better performance</span></div>
                    </div>
                  </div>
                </Card>

                <VisualDiagram
                  title="Context Re-render Propagation"
                  steps={[
                    {
                      title: 'Context Value Changes',
                      content: 'Provider value updates',
                      visual: `AppContext.Provider
  value={{ user, theme }}
  ↓
  value changes`
                    },
                    {
                      title: 'All Consumers Re-render',
                      content: 'Every consumer component re-renders',
                      visual: `All consumers re-render:
  - Header (uses user) ✅
  - Sidebar (uses theme) ✅
  - Content (uses neither) ❌
  - Footer (uses neither) ❌`
                    },
                    {
                      title: 'Split Contexts',
                      content: 'Split by concern to reduce blast radius',
                      visual: `UserContext.Provider
  ↓ Only Header re-renders
  
ThemeContext.Provider
  ↓ Only Sidebar re-renders
  
Content & Footer don't re-render!`
                    },
                    {
                      title: 'Memoized Consumers',
                      content: 'Use React.memo to prevent unnecessary re-renders',
                      visual: `const Header = memo(() => {
  const { user } = useContext(UserContext)
  // Only re-renders when user changes
})`
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
                  <h2 style={{ marginBottom: '20px' }}>Context Propagation Visualization</h2>
                  <VisualDiagrams type="context-propagation" />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ marginBottom: '20px' }}>Try Code Examples</h2>
                  <CodePlaygroundPresets presets={dayPresets[6] || []} />
                </div>

                <PerformanceMonitor componentName="Day06Context" />

                {day06Challenges.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ marginBottom: '20px' }}>Practice Challenges</h2>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                      gap: '20px'
                    }}>
                      {day06Challenges.map((challenge) => (
                        <Challenge key={challenge.id} challenge={challenge} />
                      ))}
                    </div>
                  </div>
                )}
                <ReactDevToolsGuide 
                  day={6} 
                  focusAreas={[
                    'Use Profiler to see Context re-render propagation',
                    'Measure re-render difference with and without optimization',
                    'Identify which consumers re-render unnecessarily'
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
                {day06Quiz.length > 0 && (
                  <Quiz 
                    questions={day06Quiz} 
                    title="Day 6: Self-Assessment Quiz"
                    day={6}
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
                {day06Debugging.length > 0 && (
                  <div>
                    <h2 style={{ marginBottom: '20px' }}>Debugging Scenarios</h2>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                      gap: '20px'
                    }}>
                      {day06Debugging.map((scenario) => (
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
                {day06RealWorld.length > 0 && (
                  <RealWorldScenarios scenarios={day06RealWorld} currentDay={6} />
                )}
                <CrossDayConnections
                  currentDay={6}
                  connections={[
                    {
                      fromDay: 6,
                      toDay: 1,
                      connection: 'Context → Rendering Pipeline',
                      explanation: 'Context updates trigger re-renders in the render phase (Day 1). Understanding the pipeline helps optimize Context usage.'
                    },
                    {
                      fromDay: 6,
                      toDay: 2,
                      connection: 'Context → Reconciliation',
                      explanation: 'Context consumers are reconciled like any other component (Day 2). Proper keys help React efficiently update context consumers.'
                    },
                    {
                      fromDay: 6,
                      toDay: 3,
                      connection: 'Context → Fiber',
                      explanation: 'Context propagation happens during Fiber traversal (Day 3). Each consumer is a Fiber node that can be interrupted.'
                    },
                    {
                      fromDay: 6,
                      toDay: 4,
                      connection: 'Context → Memoization',
                      explanation: 'Memoizing Context provider values (Day 6) uses useMemo (Day 4) to prevent unnecessary re-renders. React.memo on consumers also helps.'
                    },
                    {
                      fromDay: 6,
                      toDay: 5,
                      connection: 'Context → Effects',
                      explanation: 'Context values often trigger effects (Day 5). Understanding both helps you manage side effects in context consumers.'
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
                <PersonalNotes day={6} />
              </div>
            )
          },
          {
            id: 'reflection',
            label: 'Reflection',
            icon: '🤔',
            content: (
              <div>
                <DailyReflection day={6} />
              </div>
            )
          }
        ]}
      />
    </div>
  )
}

export default Day06Context
