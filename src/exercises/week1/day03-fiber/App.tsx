import { useState, useRef, type JSX } from 'react'
import '../../exerciseLayout.css'
import Quiz from '../../../components/Quiz'
import DebuggingScenario from '../../../components/DebuggingScenario'
import RealWorldScenarios from '../../../components/RealWorldScenarios'
import VisualDiagram from '../../../components/VisualDiagram'
import CrossDayConnections from '../../../components/CrossDayConnections'
import HeroSection from '../../../components/HeroSection'
import Tabs from '../../../components/Tabs'
import Card from '../../../components/Card'
import VisualDiagrams from '../../../components/VisualDiagrams'
import { dayPresets } from '../../../components/CodePlaygroundPresets'
import PersonalNotes from '../../../components/PersonalNotes'
import DailyReflection from '../../../components/DailyReflection'
import { Accordion, CollapsibleSection } from '../../../components/ui/CollapsibleSection'
import { PracticeExtras } from '../../../components/PracticeExtras'
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
                                    <div className="lesson-points">
                                        <div className="lesson-points__item"><span>Understand Fiber Node Structure</span></div>
                                        <div className="lesson-points__item"><span>Learn about current vs workInProgress tree</span></div>
                                        <div className="lesson-points__item"><span>Master the Unit of Work model</span></div>
                                        <div className="lesson-points__item"><span>Answer: Why was Fiber introduced?</span></div>
                                    </div>
                                </Card>

                                <Card
                                    title="Interactive Exercise: Watch Fiber Process Components"
                                    icon="🎯"
                                    style={{ marginBottom: '24px' }}
                                >
                                    <div className="lesson-prose">
                                      <p><strong>Instructions:</strong></p>
                                      <div className="lesson-points lesson-points--numbered">
                                          <div className="lesson-points__item"><span>1. Click &quot;Start Processing&quot; to see Fiber process each component one by one</span></div>
                                          <div className="lesson-points__item"><span>2. Watch the ⚡ indicator move through the component tree</span></div>
                                          <div className="lesson-points__item"><span>3. Try clicking &quot;Interrupt!&quot; while processing — see how Fiber can pause!</span></div>
                                          <div className="lesson-points__item"><span>4. Notice how Fiber processes:{' '}
                                            <span style={{ overflowWrap: 'anywhere' }}>
                                              App → Header → Logo → Content → Footer
                                            </span></span></div>
                                      </div>
                                    </div>
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
                                <p
                                    style={{
                                        margin: '0 0 16px',
                                        fontSize: 13,
                                        color: 'var(--text-secondary)',
                                        lineHeight: 1.45,
                                    }}
                                >
                                    Learn tab has the live demo — open sections below for the deep dive. Live status updates as you process fibers.
                                </p>

                                <Accordion style={{ marginBottom: 20 }}>
                                    <CollapsibleSection title="Fiber node structure" defaultOpen>
                                        <div className="lesson-prose">
                                            <p>Each Fiber node represents a component or DOM element and contains:</p>
                                            <pre className="lesson-code">{`interface FiberNode {
  type: string | Function
  props: object
  stateNode: unknown
  child: FiberNode | null   // first child
  sibling: FiberNode | null // next sibling
  return: FiberNode | null  // parent
  alternate: FiberNode | null
  effectTag: string
  lanes: number
}`}</pre>
                                            <p><strong>Tree Structure:</strong> Fiber uses a linked list instead of a tree, so traversal can pause between nodes.</p>
                                        </div>
                                    </CollapsibleSection>

                                    <CollapsibleSection title="Current vs WorkInProgress tree">
                                        <div className="lesson-prose">
                                            <p>React maintains <strong>two trees</strong> during rendering:</p>
                                            <div className="lesson-points">
                                                <div className="lesson-points__item"><span><strong>Current Tree:</strong> committed to the DOM (what users see)</span></div>
                                                <div className="lesson-points__item"><span><strong>WorkInProgress Tree:</strong> built during render (not committed yet)</span></div>
                                            </div>
                                            <p><strong>How they work together:</strong></p>
                                            <div className="lesson-points">
                                                <div className="lesson-points__item"><span>Render phase builds the WorkInProgress tree</span></div>
                                                <div className="lesson-points__item"><span>Each WIP node has an <code>alternate</code> pointer to Current</span></div>
                                                <div className="lesson-points__item"><span>Commit swaps trees (WIP becomes Current)</span></div>
                                                <div className="lesson-points__item"><span>Next render reuses old Current as the new WIP base</span></div>
                                            </div>
                                        </div>
                                    </CollapsibleSection>

                                    <CollapsibleSection title="Unit of work model">
                                        <div className="lesson-prose">
                                            <p>Fiber breaks rendering into small, interruptible units:</p>
                                            <div className="lesson-points">
                                                <div className="lesson-points__item"><span><strong>One Fiber = One Unit of Work</strong></span></div>
                                                <div className="lesson-points__item"><span>React processes one Fiber node at a time</span></div>
                                                <div className="lesson-points__item"><span>After each unit: should I yield to the browser?</span></div>
                                                <div className="lesson-points__item"><span>Urgent work → pause; otherwise continue</span></div>
                                                <div className="lesson-points__item"><span>Resume exactly where it left off</span></div>
                                            </div>
                                            <p><strong>Work Loop:</strong></p>
                                            <pre className="lesson-code">
                                                {`function workLoop() {
  while (fiber && !shouldYield()) {
    fiber = performUnitOfWork(fiber)
  }
  if (fiber) scheduleCallback(workLoop)
  else commitRoot()
}`}
                                            </pre>
                                        </div>
                                    </CollapsibleSection>

                                    <CollapsibleSection title="Why Fiber was introduced">
                                        <div className="lesson-prose">
                                            <p><strong>Problems with the old Stack Reconciler:</strong></p>
                                            <div className="lesson-points">
                                                <div className="lesson-points__item"><span>❌ <strong>Synchronous:</strong> Had to render entire tree in one go</span></div>
                                                <div className="lesson-points__item"><span>❌ <strong>Uninterruptible:</strong> Couldn&apos;t pause for urgent user input</span></div>
                                                <div className="lesson-points__item"><span>❌ <strong>Blocking:</strong> Long renders blocked the browser</span></div>
                                                <div className="lesson-points__item"><span>❌ <strong>No Priority:</strong> All updates treated equally</span></div>
                                                <div className="lesson-points__item"><span>❌ <strong>Poor UX:</strong> UI felt laggy during heavy rendering</span></div>
                                            </div>
                                            <p><strong>Solutions Fiber Provides:</strong></p>
                                            <div className="lesson-points">
                                                <div className="lesson-points__item"><span>✅ <strong>Interruptible:</strong> Can pause and resume rendering</span></div>
                                                <div className="lesson-points__item"><span>✅ <strong>Prioritized:</strong> Urgent updates (clicks, typing) processed first</span></div>
                                                <div className="lesson-points__item"><span>✅ <strong>Time Slicing:</strong> Yields to browser every 5ms</span></div>
                                                <div className="lesson-points__item"><span>✅ <strong>Concurrent:</strong> Multiple work trees can exist</span></div>
                                                <div className="lesson-points__item"><span>✅ <strong>Better UX:</strong> UI stays responsive during heavy work</span></div>
                                            </div>
                                        </div>
                                    </CollapsibleSection>

                                    <CollapsibleSection title="Fiber vs Stack reconciler">
                                        <div style={{
                                            background: 'var(--bg-info)',
                                            padding: '15px',
                                            borderRadius: '8px'
                                        }}>
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
                                    </CollapsibleSection>

                                    <CollapsibleSection title="Behind the scenes (live)">
                                        <div
                                          className="lesson-prose"
                                          style={{
                                            padding: 'clamp(12px, 3vw, 16px)',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-primary)',
                                            background: 'var(--bg-section)',
                                            fontSize: '14px',
                                            minWidth: 0,
                                            boxSizing: 'border-box',
                                          }}
                                        >
                                            {currentFiber ? (
                                                <div>
                                                    <p style={{ marginBottom: 8 }}>
                                                      Currently processing:{' '}
                                                      <strong style={{ color: 'var(--button-primary)' }}>{currentFiber}</strong>
                                                    </p>
                                                    <div className="lesson-points">
                                                        <div className="lesson-points__item"><span>Creating/updating the Fiber node</span></div>
                                                        <div className="lesson-points__item"><span>Calling the component function</span></div>
                                                        <div className="lesson-points__item"><span>Building the WorkInProgress tree</span></div>
                                                        <div className="lesson-points__item"><span>Marking effects for commit phase</span></div>
                                                    </div>
                                                    <p style={{ marginBottom: 0 }}>
                                                      <strong>Next:</strong>{' '}
                                                      {fiberOrder[fiberOrder.indexOf(currentFiber) + 1] || 'Commit Phase'}
                                                    </p>
                                                </div>
                                            ) : isProcessing ? (
                                                <div>
                                                    <p style={{ marginBottom: 0 }}>
                                                      All Fiber nodes processed. Ready for commit phase.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p style={{ marginBottom: 8 }}><strong>Fiber Work Loop</strong></p>
                                                    <pre className="lesson-code">{`while (fiber && !shouldYield()) {
  fiber = performUnitOfWork(fiber)
  // pause if urgent work / timeslice
}`}</pre>
                                                    <div className="lesson-points" style={{ marginTop: 10 }}>
                                                      <div className="lesson-points__item"><span>Urgent work? → pause</span></div>
                                                      <div className="lesson-points__item"><span>Time slice up? → yield</span></div>
                                                      <div className="lesson-points__item"><span>Otherwise → continue</span></div>
                                                    </div>
                                                    <p style={{ marginBottom: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                                                      Use <strong>Start Processing</strong> on the Learn tab to watch this run.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CollapsibleSection>

                                    <CollapsibleSection title="Fiber tree structure diagram">
                                      <VisualDiagram
                                        title="Fiber Tree Structure"
                                        steps={[
                                            {
                                                title: 'Component Tree',
                                                content: 'Your React components form a tree structure',
                                                visual: `App
  Header
    Logo
  Content
  Footer`
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
                                                visual: `App → Header → Logo → Content → Footer\n\nEach → can interrupt`
                                            }
                                        ]}
                                      />
                                    </CollapsibleSection>
                                </Accordion>

                                <Card
                                    title="Key Takeaways"
                                    icon="📚"
                                    style={{ marginBottom: '24px' }}
                                >
                                    <div className="lesson-points">
                                        <div className="lesson-points__item"><span><strong>Fiber = Unit of Work:</strong> Each Fiber node is a small, interruptible piece of rendering</span></div>
                                        <div className="lesson-points__item"><span><strong>Two Trees:</strong> Current (committed) and WorkInProgress (being built)</span></div>
                                        <div className="lesson-points__item"><span><strong>Linked List Structure:</strong> Makes traversal and interruption easy</span></div>
                                        <div className="lesson-points__item"><span><strong>Why Fiber:</strong> Enables concurrent rendering, priority updates, and responsive UI</span></div>
                                        <div className="lesson-points__item"><span><strong>Interruptible:</strong> Can pause after each unit to handle urgent work</span></div>
                                    </div>
                                </Card>
                            </div>
                        )
                    },
                    {
                        id: 'practice',
                        label: 'Practice',
                        icon: '💻',
                        content: (
                            <PracticeExtras
                                lead={
                                    <CollapsibleSection title="Fiber tree visualization" style={{ marginBottom: 12 }}>
                                        <VisualDiagrams type="fiber-tree" />
                                    </CollapsibleSection>
                                }
                                challenges={day03Challenges}
                                presets={dayPresets[3] || []}
                                day={3}
                                focusAreas={[
                                    'Use Profiler to see Fiber work units',
                                    'Observe interruptible rendering in action',
                                    'Measure time slicing and concurrent rendering',
                                ]}
                            />
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
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
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
