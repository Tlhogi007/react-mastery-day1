import { useState, useEffect, type JSX } from 'react'
import Challenge from '../../../components/Challenge'
import Quiz from '../../../components/Quiz'
import DebuggingScenario from '../../../components/DebuggingScenario'
import RealWorldScenarios from '../../../components/RealWorldScenarios'
import ReactDevToolsGuide from '../../../components/ReactDevToolsGuide'
import VisualDiagram from '../../../components/VisualDiagram'
import CrossDayConnections from '../../../components/CrossDayConnections'
import PerformanceMonitor from '../../../components/PerformanceMonitor'
import HeroSection from '../../../components/HeroSection'
import Tabs from '../../../components/Tabs'
import Card from '../../../components/Card'
import CodePlaygroundPresets, { dayPresets } from '../../../components/CodePlaygroundPresets'
import VisualDiagrams from '../../../components/VisualDiagrams'
import PersonalNotes from '../../../components/PersonalNotes'
import DailyReflection from '../../../components/DailyReflection'
import { day01Challenges, day01Quiz, day01Debugging, day01RealWorld } from './challenges'
import '../../exerciseLayout.css'

function Day01RenderingPipeline(): JSX.Element {
    const [count, setCount] = useState<number>(0)
    const [pipelineStep, setPipelineStep] = useState<string | null>(null)
    const isCoarsePointer =
        typeof window !== 'undefined' &&
        window.matchMedia('(hover: none), (pointer: coarse)').matches
    // Opt-in: logging during render is noisy (and floods DevTools if anything re-renders a lot)
    const [showConsoleLogs, setShowConsoleLogs] = useState<boolean>(false)

    // This runs during COMMIT phase
    useEffect(() => {
        if (showConsoleLogs) {
            console.log('🟢 COMMIT PHASE: DOM updated, count is now:', count)
            console.log('🟢 COMMIT PHASE: useEffect cleanup would run here on unmount')
        }

        return () => {
            if (showConsoleLogs) {
                console.log('🧹 CLEANUP: Previous effect cleanup')
            }
        }
    }, [count, showConsoleLogs])

    // This runs during RENDER phase
    if (showConsoleLogs) {
        console.log('🔵 RENDER PHASE: App() function executing, count:', count)
        console.log('🔵 RENDER PHASE: Creating Virtual DOM tree')
    }

    const handleClick = (): void => {
        if (showConsoleLogs) {
            console.log('👆 USER ACTION: Button clicked')
        }
        setPipelineStep('user-action')

        setTimeout(() => {
            if (showConsoleLogs) {
                console.log('📝 STATE UPDATE: setCount scheduled')
            }
            setPipelineStep('state-update')
        }, 100)

        setTimeout(() => {
            setPipelineStep('render-phase')
        }, 200)

        setTimeout(() => {
            setPipelineStep('commit-phase')
        }, 400)

        setTimeout(() => {
            setPipelineStep(null)
        }, 1000)

        setCount((prevCount: number) => {
            const newCount = prevCount + 1
            if (showConsoleLogs) {
                console.log('📝 STATE UPDATE: Computing new state:', prevCount, '→', newCount)
            }
            return newCount
        })
    }

    const containerStyle: React.CSSProperties = {
        color: 'var(--text-primary)'
    }

    const buttonStyle: React.CSSProperties = {
        padding: '12px 24px',
        fontSize: '18px',
        backgroundColor: 'var(--button-primary)',
        color: 'var(--button-text)',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    }

    return (
        <div style={containerStyle}>
            <HeroSection
                day={1}
                title="Rendering Pipeline"
                description="Understand Render Phase vs Commit Phase, Virtual DOM, and Diffing basics."
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
                                    className="exercise-objectives"
                                    style={{ marginBottom: '24px' }}
                                >
                                    <ul>
                                        <li>Understand Render Phase vs Commit Phase</li>
                                        <li>Learn about Virtual DOM</li>
                                        <li>Understand Diffing basics</li>
                                        <li>Trace the lifecycle from setState to DOM mutation</li>
                                    </ul>
                                </Card>

                                <Card
                                    title="Interactive Exercise"
                                    icon="💡"
                                    style={{ marginBottom: '24px' }}
                                >
                                    <div className="exercise-callout">
                                        <div className="exercise-callout-head">
                                            <p>
                                                <strong>Exercise:</strong> Tap the button and watch the
                                                pipeline steps (and console, if available).
                                            </p>
                                            <button
                                                type="button"
                                                className="exercise-callout-toggle"
                                                onClick={() => setShowConsoleLogs(!showConsoleLogs)}
                                                style={{
                                                    background: showConsoleLogs ? 'var(--button-primary)' : 'var(--bg-section)',
                                                    color: showConsoleLogs ? 'var(--button-text)' : 'var(--text-primary)',
                                                }}
                                            >
                                                {showConsoleLogs ? 'Console Logs ON' : 'Console Logs OFF'}
                                            </button>
                                        </div>
                                        <p className="exercise-callout-hint">
                                            {isCoarsePointer
                                                ? 'On phones, use the live pipeline below — console tools are usually on desktop.'
                                                : 'Open the browser console (F12 or Cmd+Option+I) to see phase logs.'}
                                        </p>
                                    </div>

                                    <div className="exercise-action-stage">
                                        <button
                                            type="button"
                                            onClick={handleClick}
                                            style={buttonStyle}
                                        >
                                            count is {count}
                                        </button>
                                    </div>

                                    <div className="exercise-pipeline">
                                        <h3>Live Pipeline Visualization</h3>
                                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                                            Click the button above to see the pipeline steps in real-time
                                        </p>
                                        <div className="exercise-pipeline-steps">
                                            {['user-action', 'state-update', 'render-phase', 'commit-phase'].map((step) => {
                                                const isActive = pipelineStep === step
                                                const stepNames: Record<string, string> = {
                                                    'user-action': 'User Action',
                                                    'state-update': 'State Update',
                                                    'render-phase': 'Render Phase',
                                                    'commit-phase': 'Commit Phase'
                                                }
                                                return (
                                                    <div
                                                        key={step}
                                                        className="exercise-pipeline-step"
                                                        style={{
                                                            background: isActive ? 'var(--bg-warning)' : 'var(--bg-tertiary)',
                                                            border: isActive ? '3px solid var(--border-warning)' : '1px solid var(--border-color)',
                                                            transform: isActive ? 'scale(1.02)' : 'scale(1)',
                                                            fontWeight: isActive ? 'bold' : 'normal'
                                                        }}
                                                    >
                                                        <div style={{ fontSize: '14px' }}>{stepNames[step]}</div>
                                                        {isActive && (
                                                            <div style={{
                                                                marginTop: '8px',
                                                                fontSize: '12px',
                                                                color: 'var(--text-primary)'
                                                            }}>
                                                                Active
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div style={{
                                        padding: '15px',
                                        background: 'var(--bg-observation)',
                                        borderRadius: '8px'
                                    }}>
                                        <h3 style={{ marginTop: 0 }}>What to Observe:</h3>
                                        <ol>
                                            <li><strong>👆 USER ACTION:</strong> When you click the button</li>
                                            <li><strong>📝 STATE UPDATE:</strong> React schedules the state update</li>
                                            <li><strong>🔵 RENDER PHASE:</strong> React calls your component function</li>
                                            <li><strong>🟢 COMMIT PHASE:</strong> React updates the DOM and runs effects</li>
                                        </ol>
                                    </div>
                                </Card>

                                <Card
                                    title="Key Concepts Explained"
                                    icon="🔑"
                                    style={{ marginBottom: '24px' }}
                                >
                                    <div style={{ marginBottom: '20px' }}>
                                        <h4>🔵 Render Phase (Interruptible)</h4>
                                        <p>The render phase is where React determines what needs to change:</p>
                                        <ul>
                                            <li><strong>Component Execution:</strong> React calls your component functions</li>
                                            <li><strong>Virtual DOM Creation:</strong> React creates a JavaScript object tree representing the UI structure</li>
                                            <li><strong>Diffing:</strong> React compares the new Virtual DOM with the previous one to find differences</li>
                                            <li><strong>Work Scheduling:</strong> React marks which parts need updates, but doesn't apply them yet</li>
                                        </ul>
                                        <p><strong>Why Interruptible?</strong> In React 18+, React can pause rendering to handle urgent user input (like typing or clicking). This keeps the UI responsive even during heavy rendering work.</p>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <h4>🟢 Commit Phase (Synchronous)</h4>
                                        <p>The commit phase is where React actually applies changes:</p>
                                        <ul>
                                            <li><strong>DOM Updates:</strong> React updates the real browser DOM with the changes identified in render phase</li>
                                            <li><strong>Effect Execution:</strong> React runs useEffect callbacks after DOM updates</li>
                                            <li><strong>Cleanup:</strong> React runs cleanup functions from previous effects</li>
                                            <li><strong>Ref Updates:</strong> React updates refs to point to new DOM nodes</li>
                                        </ul>
                                        <p><strong>Why Synchronous?</strong> DOM updates must be atomic. If interrupted, you'd see partial updates causing visual glitches. Effects must run in order (cleanup before setup).</p>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <h4>🌳 Virtual DOM</h4>
                                        <p>The Virtual DOM is a JavaScript representation of the real DOM:</p>
                                        <ul>
                                            <li><strong>Structure:</strong> A tree of JavaScript objects representing elements, props, and children</li>
                                            <li><strong>Efficiency:</strong> Comparing JavaScript objects is faster than comparing real DOM nodes</li>
                                            <li><strong>Batching:</strong> React can batch multiple updates and apply them together</li>
                                            <li><strong>Optimization:</strong> React only updates the parts that actually changed</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4>🔍 Diffing Basics</h4>
                                        <p>Diffing is the process of comparing two Virtual DOM trees:</p>
                                        <ul>
                                            <li><strong>Element Type:</strong> If element type changes (div → span), React unmounts old and mounts new</li>
                                            <li><strong>Props:</strong> If only props change, React updates the props on the existing element</li>
                                            <li><strong>Children:</strong> React recursively diffs children, using keys to identify which items are the same</li>
                                            <li><strong>Minimal Updates:</strong> React only updates what changed, not the entire tree</li>
                                        </ul>
                                    </div>
                                </Card>

                                <VisualDiagram
                                    title="Rendering Pipeline Flow"
                                    steps={[
                                        {
                                            title: 'User Interaction',
                                            content: 'User clicks button, triggering event handler',
                                            visual: `User clicks button\n    ↓\nonClick handler fires`
                                        },
                                        {
                                            title: 'State Update',
                                            content: 'setState schedules a state update in React\'s queue',
                                            visual: `setState() called\n    ↓\nReact schedules update\n    ↓\nUpdate added to queue`
                                        },
                                        {
                                            title: 'Render Phase',
                                            content: 'React calls component functions and creates Virtual DOM',
                                            visual: `┌─────────────────────────┐\n│   RENDER PHASE          │\n│   (Interruptible)       │\n│   - Call component      │\n│   - Create Virtual DOM  │\n│   - Diff changes        │\n└─────────────────────────┘`
                                        },
                                        {
                                            title: 'Commit Phase',
                                            content: 'React updates DOM and runs effects',
                                            visual: `┌─────────────────────────┐\n│   COMMIT PHASE         │\n│   (Synchronous)        │\n│   - Update DOM         │\n│   - Run effects        │\n│   - Browser paints     │\n└─────────────────────────┘`
                                        }
                                    ]}
                                />

                                <Card
                                    title="Complete Flow Explanation"
                                    icon="📚"
                                    style={{ marginBottom: '24px' }}
                                >
                                    <p><strong>What happens from setState to DOM mutation:</strong></p>
                                    <ol>
                                        <li><strong>User Action:</strong> You click the button, triggering onClick handler</li>
                                        <li><strong>State Update:</strong> setCount schedules a state update in React's queue</li>
                                        <li><strong>Render Phase Starts:</strong> React begins the render phase</li>
                                        <li><strong>Component Re-execution:</strong> React calls your App() function again with new state</li>
                                        <li><strong>Virtual DOM Creation:</strong> React creates a new Virtual DOM tree from your JSX</li>
                                        <li><strong>Diffing:</strong> React compares new Virtual DOM with previous one</li>
                                        <li><strong>Change Detection:</strong> React identifies: "button text changed"</li>
                                        <li><strong>Commit Phase Starts:</strong> React begins applying changes</li>
                                        <li><strong>DOM Update:</strong> React updates button.textContent in the real DOM</li>
                                        <li><strong>Effect Execution:</strong> React runs your useEffect callback</li>
                                        <li><strong>Browser Paint:</strong> Browser renders the visual change</li>
                                    </ol>
                                </Card>

                                <Card
                                    title="Why This Matters"
                                    icon="💡"
                                >
                                    <p>Understanding the rendering pipeline helps you:</p>
                                    <ul>
                                        <li><strong>Debug Performance Issues:</strong> Know when expensive operations run (render vs commit)</li>
                                        <li><strong>Optimize Components:</strong> Understand when React re-renders and why</li>
                                        <li><strong>Fix Timing Bugs:</strong> Know when effects run relative to DOM updates</li>
                                        <li><strong>Write Better Code:</strong> Structure components to minimize unnecessary renders</li>
                                    </ul>
                                </Card>
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
                                    <h2 style={{ marginBottom: '20px' }}>Visual Diagrams</h2>
                                    <VisualDiagrams type="virtual-dom-diff" />
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <h2 style={{ marginBottom: '20px' }}>Try Code Examples</h2>
                                    <CodePlaygroundPresets presets={dayPresets[1] || []} />
                                </div>

                                {day01Challenges.length > 0 && (
                                    <div style={{ marginBottom: '24px' }}>
                                        <h2 style={{ marginBottom: '20px' }}>Practice Challenges</h2>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                                            gap: '20px'
                                        }}>
                                            {day01Challenges.map((challenge) => (
                                                <Challenge key={challenge.id} challenge={challenge} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <PerformanceMonitor componentName="Day01RenderingPipeline" />
                                <ReactDevToolsGuide
                                    day={1}
                                    focusAreas={[
                                        'Observe render vs commit phases in Profiler',
                                        'See component re-render on state updates',
                                        'Measure render times for the counter component'
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
                                {day01Quiz.length > 0 && (
                                    <Quiz
                                        questions={day01Quiz}
                                        title="Day 1: Self-Assessment Quiz"
                                        day={1}
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
                                {day01Debugging.length > 0 && (
                                    <div>
                                        <h2 style={{ marginBottom: '20px' }}>Debugging Scenarios</h2>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                                            gap: '20px'
                                        }}>
                                            {day01Debugging.map((scenario) => (
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
                                {day01RealWorld.length > 0 && (
                                    <RealWorldScenarios scenarios={day01RealWorld} currentDay={1} />
                                )}
                                <CrossDayConnections
                                    currentDay={1}
                                    connections={[
                                        {
                                            fromDay: 1,
                                            toDay: 2,
                                            connection: 'Rendering Pipeline → Reconciliation',
                                            explanation: 'The render phase you learned about in Day 1 uses the reconciliation algorithm from Day 2 to determine what changed.'
                                        },
                                        {
                                            fromDay: 1,
                                            toDay: 3,
                                            connection: 'Rendering Pipeline → Fiber',
                                            explanation: 'Fiber (Day 3) is what makes the render phase interruptible. It breaks rendering into units of work.'
                                        },
                                        {
                                            fromDay: 1,
                                            toDay: 4,
                                            connection: 'Rendering Pipeline → Memoization',
                                            explanation: 'Understanding when renders happen (Day 1) helps you know when to use memoization (Day 4) to prevent unnecessary renders.'
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
                                <PersonalNotes day={1} />
                            </div>
                        )
                    },
                    {
                        id: 'reflection',
                        label: 'Reflection',
                        icon: '🤔',
                        content: (
                            <div>
                                <DailyReflection day={1} />
                            </div>
                        )
                    }
                ]}
            />
        </div>
    )
}

export default Day01RenderingPipeline
