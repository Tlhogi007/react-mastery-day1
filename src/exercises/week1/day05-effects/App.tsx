import { useState, type JSX } from 'react'
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
import VisualDiagram from '../../../components/VisualDiagram'
import VisualDiagrams from '../../../components/VisualDiagrams'
import { day05Challenges, day05Quiz, day05Debugging, day05RealWorld } from './challenges'

function Day05Effects(): JSX.Element {
    const [count, setCount] = useState(0)
    const [effectStep, setEffectStep] = useState<string | null>(null)

    const handleIncrement = (): void => {
        setEffectStep('render')
        setTimeout(() => setEffectStep('commit'), 100)
        setTimeout(() => setEffectStep('effect'), 200)
        setTimeout(() => setEffectStep(null), 1000)
        setCount(c => c + 1)
    }

    return (
        <div style={{ color: 'var(--text-primary)' }}>
            <HeroSection
                day={5}
                title="Effects & Closures"
                description="Master useEffect timing, cleanup, stale closures, and dependency array traps."
                progress={65}
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
                                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                        <li>Understand when useEffect runs in the React lifecycle</li>
                                        <li>Master cleanup functions and when they run</li>
                                        <li>Identify and fix stale closure bugs</li>
                                        <li>Understand dependency array traps and best practices</li>
                                        <li>Learn three approaches to fix closure issues</li>
                                    </ul>
                                </Card>

                                <Card
                                    title="Interactive Exercise: Effect Timing"
                                    icon="💡"
                                    style={{ marginBottom: '24px' }}
                                >
                                    <div style={{
                                        background: 'var(--bg-info)',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        marginBottom: '20px'
                                    }}>
                                        <p><strong>📝 Exercise:</strong> Click the button and watch the console to see when useEffect runs!</p>
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px' }}>
                                            Open your browser's developer console (F12 or Cmd+Option+I)
                                        </p>
                                    </div>

                                    <div style={{
                                        border: '2px solid var(--border-primary)',
                                        padding: '20px',
                                        borderRadius: '8px',
                                        textAlign: 'center' as const,
                                        background: 'var(--bg-section)',
                                        marginBottom: '20px'
                                    }}>
                                        <button
                                            onClick={handleIncrement}
                                            style={{
                                                padding: '12px 24px',
                                                fontSize: '18px',
                                                backgroundColor: 'var(--button-primary)',
                                                color: 'var(--button-text)',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Count: {count}
                                        </button>
                                    </div>

                                    <div style={{
                                        padding: '15px',
                                        background: 'var(--bg-section)',
                                        borderRadius: '8px',
                                        marginBottom: '20px'
                                    }}>
                                        <h3 style={{ marginTop: 0 }}>📊 Effect Timing Visualization</h3>
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                                            {['render', 'commit', 'effect'].map((step) => {
                                                const isActive = effectStep === step
                                                const stepNames: Record<string, string> = {
                                                    'render': '🔵 Render Phase',
                                                    'commit': '🟢 Commit Phase',
                                                    'effect': '⚡ Effect Runs'
                                                }
                                                return (
                                                    <div
                                                        key={step}
                                                        style={{
                                                            flex: '1 1 150px',
                                                            minWidth: '150px',
                                                            padding: '15px',
                                                            background: isActive ? 'var(--bg-warning)' : 'var(--bg-tertiary)',
                                                            borderRadius: '8px',
                                                            textAlign: 'center',
                                                            transition: 'all 0.3s',
                                                            border: isActive ? '3px solid var(--border-warning)' : '1px solid var(--border-color)',
                                                            transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                                            fontWeight: isActive ? 'bold' : 'normal'
                                                        }}
                                                    >
                                                        <div style={{ fontSize: '14px' }}>{stepNames[step]}</div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </Card>

                                <Card
                                    title="Key Concepts Explained"
                                    icon="🔑"
                                    style={{ marginBottom: '24px' }}
                                >
                                    <div style={{ marginBottom: '20px' }}>
                                        <h4>⏰ useEffect Timing</h4>
                                        <p>useEffect runs in the commit phase, after DOM updates:</p>
                                        <ul>
                                            <li><strong>Render Phase:</strong> Component function executes, returns JSX</li>
                                            <li><strong>Commit Phase:</strong> DOM updated, then effects run</li>
                                            <li><strong>Order:</strong> Cleanup → Effect (for each effect)</li>
                                            <li><strong>Why After DOM:</strong> Effects can safely access updated DOM</li>
                                        </ul>
                                        <p><strong>Timeline:</strong></p>
                                        <pre style={{ background: 'var(--bg-section)', padding: '10px', borderRadius: '4px', overflow: 'auto', fontSize: '12px', color: 'var(--text-primary)' }}>
                                            {`1. Render Phase: Component function runs
2. Commit Phase: DOM updated
3. Cleanup: Previous effect cleanup runs (if any)
4. Effect: New effect runs`}
                                        </pre>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <h4>🧹 Cleanup Functions</h4>
                                        <p>Cleanup functions run before the next effect or on unmount:</p>
                                        <ul>
                                            <li><strong>When:</strong> Before next effect with same dependencies, or on unmount</li>
                                            <li><strong>Purpose:</strong> Cancel subscriptions, timers, remove event listeners</li>
                                            <li><strong>Order:</strong> Cleanup runs before new effect setup</li>
                                            <li><strong>Example:</strong> Clear interval, unsubscribe, remove listener</li>
                                        </ul>
                                        <p><strong>Example:</strong></p>
                                        <pre style={{ background: 'var(--bg-section)', padding: '10px', borderRadius: '4px', overflow: 'auto', fontSize: '12px', color: 'var(--text-primary)' }}>
                                            {`useEffect(() => {
  const interval = setInterval(() => {
    // Do something
  }, 1000)
  
  // Cleanup: runs before next effect or unmount
  return () => {
    clearInterval(interval)
  }
}, [deps])`}
                                        </pre>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <h4>🔒 Stale Closures</h4>
                                        <p>Stale closures occur when effects capture old state/props values:</p>
                                        <ul>
                                            <li><strong>Cause:</strong> Missing or incomplete dependency array</li>
                                            <li><strong>Symptom:</strong> Effect uses old values instead of current ones</li>
                                            <li><strong>Fix 1:</strong> Add missing dependencies</li>
                                            <li><strong>Fix 2:</strong> Use updater functions (setState(c =&gt; c + 1))</li>
                                            <li><strong>Fix 3:</strong> Use refs to access latest values</li>
                                        </ul>
                                        <p><strong>Example:</strong></p>
                                        <pre style={{ background: 'var(--bg-section)', padding: '10px', borderRadius: '4px', overflow: 'auto', fontSize: '12px', color: 'var(--text-primary)' }}>
                                            {`// ❌ Stale closure: count is always 0
useEffect(() => {
  const interval = setInterval(() => {
    setCount(count + 1) // Uses stale count
  }, 1000)
  return () => clearInterval(interval)
}, []) // Missing count dependency

// ✅ Fix: Use updater function
useEffect(() => {
  const interval = setInterval(() => {
    setCount(c => c + 1) // Always uses latest
  }, 1000)
  return () => clearInterval(interval)
}, [])`}
                                        </pre>
                                    </div>

                                    <div>
                                        <h4>📋 Dependency Array Rules</h4>
                                        <p>Dependency array determines when effect runs:</p>
                                        <ul>
                                            <li><strong>Empty []:</strong> Runs once on mount, cleanup on unmount</li>
                                            <li><strong>With deps:</strong> Runs when dependencies change</li>
                                            <li><strong>No array:</strong> Runs every render (usually wrong!)</li>
                                            <li><strong>Rule:</strong> Include all values from component scope used in effect</li>
                                        </ul>
                                        <p><strong>ESLint Rule:</strong> Always use exhaustive-deps rule to catch missing dependencies</p>
                                    </div>
                                </Card>

                                <VisualDiagram
                                    title="useEffect Lifecycle"
                                    steps={[
                                        {
                                            title: 'Component Renders',
                                            content: 'Component function executes, returns JSX',
                                            visual: `function Component() {
  const [count, setCount] = useState(0)
  // Render phase
  return <div>{count}</div>
}`
                                        },
                                        {
                                            title: 'DOM Updated',
                                            content: 'React updates the DOM with new values',
                                            visual: `Commit Phase:
  - Update DOM
  - count: 0 → 1
  - DOM reflects new state`
                                        },
                                        {
                                            title: 'Cleanup Runs',
                                            content: 'Previous effect cleanup runs (if dependencies changed)',
                                            visual: `useEffect cleanup:
  - Clear previous interval
  - Unsubscribe
  - Remove listeners`
                                        },
                                        {
                                            title: 'Effect Runs',
                                            content: 'New effect runs after DOM update',
                                            visual: `useEffect(() => {
  // Can safely access updated DOM
  document.title = \`Count: \${count}\`
}, [count])`
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
                                    <h2 style={{ marginBottom: '20px' }}>Effect Timing Visualization</h2>
                                    <VisualDiagrams type="virtual-dom-diff" />
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <h2 style={{ marginBottom: '20px' }}>Try Code Examples</h2>
                                    <CodePlaygroundPresets presets={dayPresets[5] || []} />
                                </div>

                                {day05Challenges.length > 0 && (
                                    <div style={{ marginBottom: '24px' }}>
                                        <h2 style={{ marginBottom: '20px' }}>Practice Challenges</h2>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                                            gap: '20px'
                                        }}>
                                            {day05Challenges.map((challenge) => (
                                                <Challenge key={challenge.id} challenge={challenge} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <ReactDevToolsGuide
                                    day={5}
                                    focusAreas={[
                                        'Observe effect timing in Profiler',
                                        'See when cleanup functions run',
                                        'Debug stale closure issues'
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
                                {day05Quiz.length > 0 && (
                                    <Quiz
                                        questions={day05Quiz}
                                        title="Day 5: Self-Assessment Quiz"
                                        day={5}
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
                                {day05Debugging.length > 0 && (
                                    <div>
                                        <h2 style={{ marginBottom: '20px' }}>Debugging Scenarios</h2>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                                            gap: '20px'
                                        }}>
                                            {day05Debugging.map((scenario) => (
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
                                {day05RealWorld.length > 0 && (
                                    <RealWorldScenarios scenarios={day05RealWorld} currentDay={5} />
                                )}
                                <CrossDayConnections
                                    currentDay={5}
                                    connections={[
                                        {
                                            fromDay: 5,
                                            toDay: 1,
                                            connection: 'Effects → Rendering Pipeline',
                                            explanation: 'useEffect runs in the commit phase (Day 1), after DOM updates. Understanding the pipeline helps debug effect timing.'
                                        },
                                        {
                                            fromDay: 5,
                                            toDay: 2,
                                            connection: 'Effects → Reconciliation',
                                            explanation: 'Effects run after reconciliation completes. Understanding reconciliation (Day 2) helps you know when effects execute relative to DOM updates.'
                                        },
                                        {
                                            fromDay: 5,
                                            toDay: 4,
                                            connection: 'Effects → Memoization',
                                            explanation: 'Stale closures in effects (Day 5) can be fixed with useMemo/useCallback (Day 4) to create stable dependencies.'
                                        },
                                        {
                                            fromDay: 5,
                                            toDay: 6,
                                            connection: 'Effects → Context',
                                            explanation: 'Context values often trigger effects. Understanding both helps you manage side effects in context consumers (Day 6).'
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
                                <PersonalNotes day={5} />
                            </div>
                        )
                    },
                    {
                        id: 'reflection',
                        label: 'Reflection',
                        icon: '🤔',
                        content: (
                            <div>
                                <DailyReflection day={5} />
                            </div>
                        )
                    }
                ]}
            />
        </div>
    )
}

export default Day05Effects
