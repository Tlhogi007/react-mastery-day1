import { useState, useRef, type JSX } from 'react'
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
import VisualDiagrams from '../../../components/VisualDiagrams'
import CodePlaygroundPresets, { dayPresets } from '../../../components/CodePlaygroundPresets'
import PersonalNotes from '../../../components/PersonalNotes'
import DailyReflection from '../../../components/DailyReflection'
import FiberDemoApp from './components/FiberDemoApp'
import FiberControls from './components/FiberControls'
import FiberTraversalPath from './components/FiberTraversalPath'
import { day03Challenges, day03Quiz, day03Debugging, day03RealWorld } from './challenges'

function Day03Fiber(): JSX.Element {
    const [currentFiber, setCurrentFiber] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState<boolean>(false)
    const [wasInterrupted, setWasInterrupted] = useState<boolean>(false)
    const [processedFibers, setProcessedFibers] = useState<string[]>([])
    const interruptRef = useRef<boolean>(false)

    const fiberOrder: string[] = ['App', 'Header', 'Logo', 'Content', 'Footer']

    const containerStyle: React.CSSProperties = {
        color: 'var(--text-primary)'
    }

    const processFiberTree = async (): Promise<void> => {
        setIsProcessing(true)
        setProcessedFibers([])
        setWasInterrupted(false)
        interruptRef.current = false

        for (let i = 0; i < fiberOrder.length; i++) {
            // Check interrupt before processing each fiber
            if (interruptRef.current) {
                setWasInterrupted(true)
                setCurrentFiber(null)
                setIsProcessing(false)
                return
            }

            const fiber = fiberOrder[i]
            setCurrentFiber(fiber)
            setProcessedFibers(prev => [...prev, fiber])

            // Simulate work being done (each Fiber takes time)
            // Check for interrupt during the work
            await new Promise<void>((resolve) => {
                const startTime = Date.now()
                const checkInterval = setInterval(() => {
                    if (interruptRef.current) {
                        clearInterval(checkInterval)
                        resolve()
                    } else if (Date.now() - startTime >= 800) {
                        clearInterval(checkInterval)
                        resolve()
                    }
                }, 50) // Check every 50ms for interrupt
            })

            // Check if interrupted after work
            if (interruptRef.current) {
                setWasInterrupted(true)
                setCurrentFiber(null)
                setIsProcessing(false)
                return
            }
        }

        // All done
        setCurrentFiber(null)
        setIsProcessing(false)
    }

    const handleInterrupt = (): void => {
        if (isProcessing) {
            interruptRef.current = true
            setWasInterrupted(true)
            setIsProcessing(false)
            setCurrentFiber(null)
        }
    }

    const reset = (): void => {
        setCurrentFiber(null)
        setIsProcessing(false)
        setWasInterrupted(false)
        setProcessedFibers([])
    }

    return (
        <div style={containerStyle}>
            <HeroSection
                day={3}
                title="Fiber Architecture"
                description="Understand Fiber Node Structure, Current vs WorkInProgress tree, and Unit of Work model."
            />

            <Tabs
                tabs={[
                    {
                        id: 'learn',
                        label: 'Learn',
                        icon: '📚',
                        content: (
                            <>
                                <Card
                                    title="Learning Objectives"
                                    icon="🎯"
                                    style={{ marginBottom: '24px' }}
                                >
                                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                        <li>Understand Fiber Node Structure</li>
                                        <li>Learn about current vs workInProgress tree</li>
                                        <li>Master the Unit of Work model</li>
                                        <li>Answer: Why was Fiber introduced?</li>
                                    </ul>
                                </Card>

                                <Card
                                    title="Interactive Exercise: Watch Fiber Process Components"
                                    icon="🎯"
                                    style={{ marginBottom: '24px' }}
                                >
                                    <p><strong>Instructions:</strong></p>
                                    <ol>
                                        <li>Click "Start Processing" to see Fiber process each component one by one</li>
                                        <li>Watch the ⚡ indicator move through the component tree</li>
                                        <li>Try clicking "Interrupt!" while processing - see how Fiber can pause!</li>
                                        <li>Notice how Fiber processes: App → Header → Logo → Content → Footer</li>
                                    </ol>
                                    <FiberControls
                                        isProcessing={isProcessing}
                                        wasInterrupted={wasInterrupted}
                                        processedFibers={processedFibers}
                                        fiberOrder={fiberOrder}
                                        onStart={processFiberTree}
                                        onReset={reset}
                                    />
                                </Card>

                                <FiberDemoApp currentFiber={currentFiber} onInterrupt={handleInterrupt} />

                                <Card
                                    title="Fiber Traversal Path"
                                    icon="📍"
                                    style={{ marginTop: '24px', marginBottom: '24px' }}
                                >
                                    <FiberTraversalPath
                                        processedFibers={processedFibers}
                                        currentFiber={currentFiber}
                                        isProcessing={isProcessing}
                                        fiberOrder={fiberOrder}
                                    />
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px' }}>
                                        This shows the exact order Fiber processes components (depth-first traversal)
                                    </p>
                                </Card>
                            </>
                        )
                    },
                    {
                        id: 'concepts',
                        label: 'Concepts',
                        icon: '🔑',
                        content: (
                            <div>
                                <Card
                                    title="Key Concepts Explained"
                                    icon="🔑"
                                    style={{ marginBottom: '24px' }}
                                >

                                    <div style={{ marginBottom: '20px' }}>
                                        <h4>🌳 Fiber Node Structure</h4>
                                        <p>Each Fiber node represents a component or DOM element and contains:</p>
                                        <pre style={{ background: 'var(--bg-section)', padding: '10px', borderRadius: '4px', overflow: 'auto', color: 'var(--text-primary)' }}>
                                            {`interface FiberNode {
  // Component info
  type: string | Function
  props: object
  stateNode: HTMLElement | ComponentInstance
  
  // Tree structure (linked list)
  child: FiberNode | null      // First child
  sibling: FiberNode | null    // Next sibling
  return: FiberNode | null     // Parent
  
  // Work tracking
  alternate: FiberNode | null  // Points to other tree
  effectTag: string            // What to do in commit
  lanes: number                // Priority lanes
}`}
                                        </pre>
                                        <p><strong>Tree Structure:</strong> Fiber uses a linked list structure instead of a tree, making it easier to traverse and interrupt.</p>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <h4>🔄 Current vs WorkInProgress Tree</h4>
                                        <p>React maintains <strong>two trees</strong> during rendering:</p>
                                        <ul>
                                            <li><strong>Current Tree:</strong> The tree that's currently committed to the DOM (what users see)</li>
                                            <li><strong>WorkInProgress Tree:</strong> The tree being built during render phase (not yet committed)</li>
                                        </ul>
                                        <p><strong>How they work together:</strong></p>
                                        <ol>
                                            <li>Render phase builds the WorkInProgress tree</li>
                                            <li>Each node in WorkInProgress has an <code>alternate</code> pointer to Current</li>
                                            <li>Commit phase swaps the trees (WorkInProgress becomes Current)</li>
                                            <li>Next render uses the old Current as the new WorkInProgress base</li>
                                        </ol>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <h4>⚙️ Unit of Work Model</h4>
                                        <p>Fiber breaks rendering into small, interruptible units:</p>
                                        <ul>
                                            <li><strong>One Fiber = One Unit of Work</strong></li>
                                            <li>React processes one Fiber node at a time</li>
                                            <li>After each unit, React checks: "Should I yield to the browser?"</li>
                                            <li>If urgent work exists, React pauses and handles it</li>
                                            <li>React resumes exactly where it left off</li>
                                        </ul>
                                        <p><strong>Work Loop:</strong></p>
                                        <pre style={{ background: 'var(--bg-section)', padding: '10px', borderRadius: '4px', overflow: 'auto', color: 'var(--text-primary)' }}>
                                            {`function workLoop() {
  while (workInProgress !== null && !shouldYield()) {
    workInProgress = performUnitOfWork(workInProgress)
  }
  
  if (workInProgress !== null) {
    // More work, but yielding to browser
    scheduleCallback(workLoop)
  } else {
    // All work complete, commit
    commitRoot()
  }
}`}
                                        </pre>
                                    </div>

                                    <div>
                                        <h4>❓ Why was Fiber Introduced?</h4>
                                        <p><strong>Problems with the old Stack Reconciler:</strong></p>
                                        <ul>
                                            <li>❌ <strong>Synchronous:</strong> Had to render entire tree in one go</li>
                                            <li>❌ <strong>Uninterruptible:</strong> Couldn't pause for urgent user input</li>
                                            <li>❌ <strong>Blocking:</strong> Long renders blocked the browser</li>
                                            <li>❌ <strong>No Priority:</strong> All updates treated equally</li>
                                            <li>❌ <strong>Poor UX:</strong> UI felt laggy during heavy rendering</li>
                                        </ul>
                                        <p><strong>Solutions Fiber Provides:</strong></p>
                                        <ul>
                                            <li>✅ <strong>Interruptible:</strong> Can pause and resume rendering</li>
                                            <li>✅ <strong>Prioritized:</strong> Urgent updates (clicks, typing) processed first</li>
                                            <li>✅ <strong>Time Slicing:</strong> Yields to browser every 5ms</li>
                                            <li>✅ <strong>Concurrent:</strong> Multiple work trees can exist</li>
                                            <li>✅ <strong>Better UX:</strong> UI stays responsive during heavy work</li>
                                        </ul>
                                    </div>

                                    <div style={{
                                        marginTop: '20px',
                                        background: 'var(--bg-info)',
                                        padding: '15px',
                                        borderRadius: '8px'
                                    }}>
                                        <h4>⚖️ Fiber vs Stack Reconciler Comparison</h4>
                                        <div style={{ overflowX: 'auto', marginTop: '10px' }}>
                                            <table style={{
                                                width: '100%',
                                                borderCollapse: 'collapse',
                                                fontSize: '14px'
                                            }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                                        <th style={{ padding: '10px', textAlign: 'left' }}>Aspect</th>
                                                        <th style={{ padding: '10px', textAlign: 'left', color: 'var(--text-secondary)' }}>Stack Reconciler</th>
                                                        <th style={{ padding: '10px', textAlign: 'left', color: 'var(--button-primary)' }}>Fiber</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                        <td style={{ padding: '10px' }}><strong>Structure</strong></td>
                                                        <td style={{ padding: '10px' }}>Tree (recursive)</td>
                                                        <td style={{ padding: '10px' }}>Linked List</td>
                                                    </tr>
                                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                        <td style={{ padding: '10px' }}><strong>Interruptible</strong></td>
                                                        <td style={{ padding: '10px' }}>❌ No</td>
                                                        <td style={{ padding: '10px' }}>✅ Yes</td>
                                                    </tr>
                                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                        <td style={{ padding: '10px' }}><strong>Priority</strong></td>
                                                        <td style={{ padding: '10px' }}>❌ None</td>
                                                        <td style={{ padding: '10px' }}>✅ Yes (lanes)</td>
                                                    </tr>
                                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                        <td style={{ padding: '10px' }}><strong>Time Slicing</strong></td>
                                                        <td style={{ padding: '10px' }}>❌ No</td>
                                                        <td style={{ padding: '10px' }}>✅ Yes (~5ms)</td>
                                                    </tr>
                                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                        <td style={{ padding: '10px' }}><strong>Concurrent</strong></td>
                                                        <td style={{ padding: '10px' }}>❌ No</td>
                                                        <td style={{ padding: '10px' }}>✅ Yes</td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{ padding: '10px' }}><strong>UX</strong></td>
                                                        <td style={{ padding: '10px' }}>❌ Can block UI</td>
                                                        <td style={{ padding: '10px' }}>✅ Responsive</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div style={{
                                        marginTop: '20px',
                                        background: 'var(--bg-card)',
                                        border: '2px solid var(--border-primary)',
                                        padding: '20px',
                                        borderRadius: '8px',
                                        fontFamily: 'monospace',
                                        fontSize: '14px'
                                    }}>
                                        <h4>📊 What's Happening Behind the Scenes</h4>
                                        <div style={{
                                            background: 'var(--bg-section)',
                                            padding: '15px',
                                            borderRadius: '4px',
                                            marginTop: '10px'
                                        }}>
                                            {currentFiber ? (
                                                <div>
                                                    <h5>Currently Processing: <strong style={{ color: 'var(--button-primary)' }}>{currentFiber}</strong></h5>
                                                    <p>Fiber is processing this component:</p>
                                                    <ul>
                                                        <li>Creating/updating the Fiber node</li>
                                                        <li>Calling the component function</li>
                                                        <li>Building the WorkInProgress tree</li>
                                                        <li>Marking effects for commit phase</li>
                                                    </ul>
                                                    <p><strong>Next:</strong> {fiberOrder[fiberOrder.indexOf(currentFiber) + 1] || 'Commit Phase'}</p>
                                                </div>
                                            ) : isProcessing ? (
                                                <div>
                                                    <h5>Processing Complete!</h5>
                                                    <p>All Fiber nodes processed. Ready for commit phase.</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <h5>Fiber Work Loop:</h5>
                                                    <pre style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>{`function workLoop() {
  while (workInProgress !== null && !shouldYield()) {
    // Process one Fiber node
    workInProgress = performUnitOfWork(workInProgress)
    
    // After each unit, check:
    // - Is there urgent work? → Pause
    // - Time slice expired? → Yield
    // - Otherwise → Continue
  }
}`}</pre>
                                                    <p><strong>Click "Start Processing" above to see this in action!</strong></p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>

                                <Card
                                    title="Key Takeaways"
                                    icon="📚"
                                    style={{ marginBottom: '24px' }}
                                >
                                    <ul>
                                        <li><strong>Fiber = Unit of Work:</strong> Each Fiber node is a small, interruptible piece of rendering</li>
                                        <li><strong>Two Trees:</strong> Current (committed) and WorkInProgress (being built)</li>
                                        <li><strong>Linked List Structure:</strong> Makes traversal and interruption easy</li>
                                        <li><strong>Why Fiber:</strong> Enables concurrent rendering, priority updates, and responsive UI</li>
                                        <li><strong>Interruptible:</strong> Can pause after each unit to handle urgent work</li>
                                    </ul>
                                </Card>

                                <VisualDiagram
                                    title="Fiber Tree Structure"
                                    steps={[
                                        {
                                            title: 'Component Tree',
                                            content: 'Your React components form a tree structure',
                                            visual: `App\n├── Header\n│   └── Logo\n├── Content\n└── Footer`
                                        },
                                        {
                                            title: 'Fiber Linked List',
                                            content: 'Fiber converts tree to linked list for easier traversal',
                                            visual: `App (root)\n  ↓ child\nHeader\n  ↓ child\nLogo\n  ↓ sibling (no more children, go to sibling)\nContent\n  ↓ sibling\nFooter`
                                        },
                                        {
                                            title: 'Traversal Order',
                                            content: 'Fiber processes: current → child → sibling → return',
                                            visual: `Processing Order:\n1. App\n2. Header (child of App)\n3. Logo (child of Header)\n4. Content (sibling of Header)\n5. Footer (sibling of Content)\n\nPattern: Depth-first traversal`
                                        },
                                        {
                                            title: 'Interruption Points',
                                            content: 'After each Fiber, React can pause',
                                            visual: `App → [can interrupt] →\nHeader → [can interrupt] →\nLogo → [can interrupt] →\nContent → [can interrupt] →\nFooter\n\nEach → is an interruption point`
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
                                    <h2 style={{ marginBottom: '20px' }}>Fiber Tree Visualization</h2>
                                    <VisualDiagrams type="fiber-tree" />
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <h2 style={{ marginBottom: '20px' }}>Try Code Examples</h2>
                                    <CodePlaygroundPresets presets={dayPresets[3] || []} />
                                </div>

                                {day03Challenges.length > 0 && (
                                    <div style={{ marginBottom: '24px' }}>
                                        <h2 style={{ marginBottom: '20px' }}>Practice Challenges</h2>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                                            gap: '20px'
                                        }}>
                                            {day03Challenges.map((challenge) => (
                                                <Challenge key={challenge.id} challenge={challenge} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <ReactDevToolsGuide
                                    day={3}
                                    focusAreas={[
                                        'Use Profiler to see Fiber work units',
                                        'Observe interruptible rendering in action',
                                        'Measure time slicing and concurrent rendering'
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
                                {day03Quiz.length > 0 && (
                                    <Quiz
                                        questions={day03Quiz}
                                        title="Day 3: Self-Assessment Quiz"
                                        day={3}
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
                                {day03Debugging.length > 0 && (
                                    <div>
                                        <h2 style={{ marginBottom: '20px' }}>Debugging Scenarios</h2>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                                            gap: '20px'
                                        }}>
                                            {day03Debugging.map((scenario) => (
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
                                {day03RealWorld.length > 0 && (
                                    <RealWorldScenarios scenarios={day03RealWorld} currentDay={3} />
                                )}
                                <CrossDayConnections
                                    currentDay={3}
                                    connections={[
                                        {
                                            fromDay: 3,
                                            toDay: 1,
                                            connection: 'Fiber → Rendering Pipeline',
                                            explanation: 'Fiber is the architecture that makes the render phase (Day 1) interruptible. It breaks rendering into units of work.'
                                        },
                                        {
                                            fromDay: 3,
                                            toDay: 2,
                                            connection: 'Fiber → Reconciliation',
                                            explanation: 'Fiber performs reconciliation (Day 2). Each Fiber node represents a component being reconciled.'
                                        },
                                        {
                                            fromDay: 3,
                                            toDay: 8,
                                            connection: 'Fiber → Concurrent Rendering',
                                            explanation: 'Fiber enables concurrent rendering features like startTransition (Day 8) by allowing work to be interrupted.'
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
                                <PersonalNotes day={3} />
                            </div>
                        )
                    },
                    {
                        id: 'reflection',
                        label: 'Reflection',
                        icon: '🤔',
                        content: (
                            <div>
                                <DailyReflection day={3} />
                            </div>
                        )
                    }
                ]}
            />
        </div>
    )
}

export default Day03Fiber
