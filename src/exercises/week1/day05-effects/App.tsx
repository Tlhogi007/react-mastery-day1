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
import '../../exerciseLayout.css'

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
                                    <div className="exercise-callout">
                                        <p style={{ margin: 0 }}>
                                            <strong>Exercise:</strong> Tap the button and watch when
                                            useEffect runs (console on desktop, timing notes below).
                                        </p>
                                        <p className="exercise-callout-hint">
                                            Desktop: open the browser console (F12 or Cmd+Option+I).
                                        </p>
                                    </div>

                                    <div className="effect-timing-demo">
                                        <button
                                            type="button"
                                            className="lesson-full-btn effect-timing-demo__count"
                                            onClick={handleIncrement}
                                        >
                                            Count: {count}
                                        </button>

                                        <div className="effect-timing-demo__panel">
                                            <h3 className="effect-timing-demo__title">Effect Timing Visualization</h3>
                                            <div className="effect-timing-demo__steps">
                                                {(['render', 'commit', 'effect'] as const).map((step) => {
                                                    const isActive = effectStep === step
                                                    const stepNames: Record<string, string> = {
                                                        render: 'Render Phase',
                                                        commit: 'Commit Phase',
                                                        effect: 'Effect Runs',
                                                    }
                                                    return (
                                                        <div
                                                            key={step}
                                                            className={`effect-timing-demo__step${isActive ? ' is-active' : ''}`}
                                                        >
                                                            {stepNames[step]}
                                                        </div>
                                                    )
                                                })}
                                            </div>
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
                                        <div className="lesson-points">
                                            <div className="lesson-points__item"><span><strong>Render Phase:</strong> Component function executes, returns JSX</span></div>
                                            <div className="lesson-points__item"><span><strong>Commit Phase:</strong> DOM updated, then effects run</span></div>
                                            <div className="lesson-points__item"><span><strong>Order:</strong> Cleanup → Effect (for each effect)</span></div>
                                            <div className="lesson-points__item"><span><strong>Why After DOM:</strong> Effects can safely access updated DOM</span></div>
                                        </div>
                                        <p><strong>Timeline:</strong></p>
                                        <pre className="lesson-code">{`1. Render: component function runs
2. Commit: DOM updated
3. Cleanup: previous effect cleanup (if any)
4. Effect: new effect runs`}</pre>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <h4>🧹 Cleanup Functions</h4>
                                        <p>Cleanup functions run before the next effect or on unmount:</p>
                                        <div className="lesson-points">
                                            <div className="lesson-points__item"><span><strong>When:</strong> Before next effect with same deps, or on unmount</span></div>
                                            <div className="lesson-points__item"><span><strong>Purpose:</strong> Cancel timers, subscriptions, listeners</span></div>
                                            <div className="lesson-points__item"><span><strong>Order:</strong> Cleanup runs before new effect setup</span></div>
                                            <div className="lesson-points__item"><span><strong>Example:</strong> clearInterval, unsubscribe, removeListener</span></div>
                                        </div>
                                        <p><strong>Example:</strong></p>
                                        <pre className="lesson-code">{`useEffect(() => {
  const id = setInterval(() => {
    // Do something
  }, 1000)

  // Cleanup before next effect / unmount
  return () => clearInterval(id)
}, [deps])`}</pre>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <h4>🔒 Stale Closures</h4>
                                        <p>Stale closures occur when effects capture old state/props values:</p>
                                        <div className="lesson-points">
                                            <div className="lesson-points__item"><span><strong>Cause:</strong> Missing or incomplete dependency array</span></div>
                                            <div className="lesson-points__item"><span><strong>Symptom:</strong> Effect uses old values instead of current ones</span></div>
                                            <div className="lesson-points__item"><span><strong>Fix 1:</strong> Add missing dependencies</span></div>
                                            <div className="lesson-points__item"><span><strong>Fix 2:</strong> Updater functions (setState(c =&gt; c + 1))</span></div>
                                            <div className="lesson-points__item"><span><strong>Fix 3:</strong> Use refs to access latest values</span></div>
                                        </div>
                                        <p><strong>Example:</strong></p>
                                        <pre className="lesson-code">{`// ❌ Stale: count is always 0
useEffect(() => {
  const id = setInterval(() => {
    // Uses stale count from mount
    setCount(count + 1)
  }, 1000)
  return () => clearInterval(id)
}, []) // missing count

// ✅ Fix: updater function
useEffect(() => {
  const id = setInterval(() => {
    // Always uses latest count
    setCount(c => c + 1)
  }, 1000)
  return () => clearInterval(id)
}, [])`}</pre>
                                    </div>

                                    <div>
                                        <h4>📋 Dependency Array Rules</h4>
                                        <p>Dependency array determines when effect runs:</p>
                                        <div className="lesson-points">
                                            <div className="lesson-points__item"><span><strong>Empty []:</strong> Once on mount, cleanup on unmount</span></div>
                                            <div className="lesson-points__item"><span><strong>With deps:</strong> Runs when dependencies change</span></div>
                                            <div className="lesson-points__item"><span><strong>No array:</strong> Runs every render (usually wrong)</span></div>
                                            <div className="lesson-points__item"><span><strong>Rule:</strong> Include every value from scope used in the effect</span></div>
                                        </div>
                                        <p><strong>ESLint Rule:</strong> Use exhaustive-deps to catch missing dependencies</p>
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
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
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
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
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
