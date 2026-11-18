import type { Challenge, QuizQuestion, DebuggingScenario, RealWorldScenario } from '../../../types/challenges'

export const day03Challenges: Challenge[] = [
  {
    id: 'day03-challenge-1',
    title: 'Understand Fiber Traversal',
    description: 'Given a component tree, identify the order Fiber will process each component.',
    difficulty: 'medium',
    starterCode: `// Component Tree:
<App>
  <Header>
    <Logo />
    <Nav />
  </Header>
  <Content>
    <Article />
    <Sidebar />
  </Content>
  <Footer />
</App>

// Question: What order will Fiber process these?
// Answer: ?`,
    solution: `// Fiber Traversal Order (depth-first):
// 1. App
// 2. Header (child of App)
// 3. Logo (child of Header)
// 4. Nav (sibling of Logo)
// 5. Content (sibling of Header)
// 6. Article (child of Content)
// 7. Sidebar (sibling of Article)
// 8. Footer (sibling of Content)

// Pattern: Process current → child → sibling → return to parent`,
    hints: [
      'Fiber uses depth-first traversal',
      'Process current, then child, then sibling',
      'When no more children or siblings, return to parent',
      'Think: App → Header → Logo → Nav → Content → Article → Sidebar → Footer'
    ],
    explanation: 'Fiber processes components in depth-first order: process current, then go to child, then sibling, then return to parent and continue.'
  }
]

export const day03Quiz: QuizQuestion[] = [
  {
    id: 'day03-q1',
    question: 'What is the main purpose of Fiber?',
    options: [
      'To make React faster',
      'To enable interruptible rendering and concurrent features',
      'To simplify component structure',
      'To reduce bundle size'
    ],
    correctAnswer: 1,
    explanation: 'Fiber\'s main purpose is to enable interruptible rendering, allowing React to pause work for urgent updates and enable concurrent features like time slicing.',
    difficulty: 'easy'
  },
  {
    id: 'day03-q2',
    question: 'What are the two trees React maintains during rendering?',
    options: [
      'Virtual DOM and Real DOM',
      'Current and WorkInProgress',
      'Old and New',
      'Parent and Child'
    ],
    correctAnswer: 1,
    explanation: 'React maintains Current (committed to DOM) and WorkInProgress (being built) trees. They swap after commit phase.',
    difficulty: 'medium'
  },
  {
    id: 'day03-q3',
    question: 'Why does Fiber use a linked list instead of a tree?',
    options: [
      'Trees are slower',
      'Linked lists make it easier to traverse and interrupt work',
      'Linked lists use less memory',
      'Trees are deprecated'
    ],
    correctAnswer: 1,
    explanation: 'Linked list structure (child, sibling, return pointers) makes it easy to traverse and interrupt work at any point, unlike recursive tree traversal.',
    difficulty: 'medium'
  },
  {
    id: 'day03-q4',
    question: 'What is a Fiber node?',
    options: [
      'A React component',
      'A unit of work representing a component instance',
      'A DOM element',
      'A state update'
    ],
    correctAnswer: 1,
    explanation: 'A Fiber node is a unit of work that represents a component instance. It contains information about the component, its props, state, and relationships to other nodes.',
    difficulty: 'medium'
  },
  {
    id: 'day03-q5',
    question: 'How does Fiber enable concurrent rendering?',
    options: [
      'By rendering faster',
      'By allowing React to interrupt and resume work, prioritizing urgent updates',
      'By using multiple threads',
      'By caching renders'
    ],
    correctAnswer: 1,
    explanation: 'Fiber enables concurrent rendering by allowing React to interrupt low-priority work, handle urgent updates (like user input), and then resume the interrupted work.',
    difficulty: 'hard'
  },
  {
    id: 'day03-q6',
    question: 'What happens to the Current and WorkInProgress trees after commit?',
    options: [
      'They are deleted',
      'They swap - WorkInProgress becomes Current',
      'They merge',
      'Nothing happens'
    ],
    correctAnswer: 1,
    explanation: 'After the commit phase, the WorkInProgress tree becomes the new Current tree, and the old Current tree is discarded. This allows React to build the next update in the new WorkInProgress tree.',
    difficulty: 'medium'
  }
]

export const day03Debugging: DebuggingScenario[] = [
  {
    id: 'day03-debug-1',
    title: 'UI Freezes During Heavy Rendering',
    description: 'A component tree with 1000 items causes the UI to freeze for 2 seconds when rendering.',
    buggyCode: `function HeavyList({ items }) {
  return (
    <div>
      {items.map(item => (
        <ExpensiveItem key={item.id} data={item} />
      ))}
    </div>
  )
}

// Problem: All 1000 items render synchronously, blocking UI`,
    fixedCode: `import { startTransition } from 'react'

function HeavyList({ items }) {
  const [isPending, startTransition] = useTransition()
  
  const [filteredItems, setFilteredItems] = useState(items)
  
  const handleFilter = (filter) => {
    startTransition(() => {
      // This update is marked as non-urgent
      setFilteredItems(items.filter(item => item.matches(filter)))
    })
  }
  
  return (
    <div>
      {isPending && <Spinner />}
      {filteredItems.map(item => (
        <ExpensiveItem key={item.id} data={item} />
      ))}
    </div>
  )
}`,
    bugExplanation: 'Without Fiber/concurrent features, all items render synchronously, blocking the UI. With startTransition, React can interrupt the rendering to handle urgent updates, keeping the UI responsive.',
    hints: [
      'The rendering is blocking the main thread',
      'Fiber allows interruption, but you need to mark updates as transitions',
      'Use startTransition for non-urgent updates'
    ]
  }
]

export const day03RealWorld: RealWorldScenario[] = [
  {
    id: 'day03-real-1',
    title: 'Search Results Blocking Input',
    description: 'A search input becomes unresponsive while filtering large results. Users can\'t type smoothly.',
    problem: 'Filtering 10,000 items takes 200ms. During this time, the input is blocked, making typing feel laggy.',
    solution: 'Use startTransition to mark filtering as non-urgent. React will interrupt filtering to handle keystrokes, keeping input responsive.',
    codeExample: `// Before: Blocking
const filtered = items.filter(item => 
  item.name.includes(search)
)

// After: Non-blocking with transitions
const [isPending, startTransition] = useTransition()

const handleSearch = (value) => {
  setSearch(value) // Urgent - updates input immediately
  
  startTransition(() => {
    setFiltered(items.filter(item => 
      item.name.includes(value)
    )) // Non-urgent - can be interrupted
  })
}`,
    relatedDays: [3, 8]
  },
  {
    id: 'day03-real-2',
    title: 'Large Data Table Freezing UI',
    description: 'A data table with 1000+ rows causes the entire UI to freeze when rendering or updating.',
    problem: 'Rendering 1000 rows synchronously takes 500ms. During this time, the entire UI is blocked - buttons don\'t respond, animations freeze, and the page feels unresponsive.',
    solution: 'Fiber enables interruptible rendering. Use React 18 concurrent features like virtual scrolling or startTransition to break work into smaller chunks. React can interrupt rendering to handle user interactions, keeping the UI responsive.',
    codeExample: `// Understanding Fiber's role:
// Without Fiber: All 1000 rows render synchronously, blocking UI
// With Fiber: Rendering can be interrupted for urgent updates

// Solution 1: Virtual scrolling (only render visible rows)
import { useVirtualizer } from '@tanstack/react-virtual'

function DataTable({ rows }) {
  const parentRef = useRef()
  
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  })
  
  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      {virtualizer.getVirtualItems().map(virtualRow => (
        <div key={virtualRow.key} style={{ height: virtualRow.size }}>
          {rows[virtualRow.index].name}
        </div>
      ))}
    </div>
  )
}

// Solution 2: Use transitions for non-urgent updates
const [isPending, startTransition] = useTransition()

const handleFilter = (filter) => {
  startTransition(() => {
    setFilteredRows(rows.filter(row => row.matches(filter)))
  })
}`,
    relatedDays: [3, 8]
  }
]
