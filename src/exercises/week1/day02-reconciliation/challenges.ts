import type { Challenge, QuizQuestion, DebuggingScenario, RealWorldScenario } from '../../../types/challenges'

export const day02Challenges: Challenge[] = [
  {
    id: 'day02-challenge-1',
    title: 'Fix List with Index Keys',
    description: 'Convert a list using index keys to use proper keys. Ensure state is preserved when items are reordered.',
    difficulty: 'easy',
    starterCode: `function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo, index) => (
        <TodoItem 
          key={index}  // ❌ BUG: Using index
          todo={todo}
        />
      ))}
    </ul>
  )
}`,
    solution: `function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo) => (
        <TodoItem 
          key={todo.id}  // ✅ FIX: Using stable id
          todo={todo}
        />
      ))}
    </ul>
  )
}`,
    hints: [
      'Index keys change when items are reordered',
      'Use a stable, unique identifier from your data',
      'Each todo item should have an id property'
    ],
    explanation: 'Index keys cause React to match components by position, not identity. When items move, React thinks the component at that position is the same, causing state bugs.'
  }
]

export const day02Quiz: QuizQuestion[] = [
  {
    id: 'day02-q1',
    question: 'What happens when you use index as a key in a reorderable list?',
    options: [
      'Nothing, it works fine',
      'Component state moves with position, not the item',
      'Performance improves',
      'Keys become optional'
    ],
    correctAnswer: 1,
    explanation: 'Index keys cause React to match components by position. When items reorder, React thinks the component at index 0 is the same component, so state "moves" with the position.',
    difficulty: 'easy'
  },
  {
    id: 'day02-q2',
    question: 'What makes a good key?',
    options: [
      'Index, random values, or duplicates',
      'Stable, unique, and predictable values from data',
      'Any value that changes frequently',
      'The component name'
    ],
    correctAnswer: 1,
    explanation: 'Good keys are stable (don\'t change), unique (no duplicates), and predictable (not random). They should come from your data (id, uuid, etc.).',
    difficulty: 'easy'
  },
  {
    id: 'day02-q3',
    question: 'What is the time complexity of React\'s reconciliation with proper keys?',
    options: [
      'O(n²)',
      'O(n log n)',
      'O(n)',
      'O(1)'
    ],
    correctAnswer: 2,
    explanation: 'With proper keys, React can create a map and match items in O(n) time. Without keys, it may need O(n²) comparisons in the worst case.',
    difficulty: 'medium'
  },
  {
    id: 'day02-q4',
    question: 'What is the Type Comparison Rule in React reconciliation?',
    options: [
      'React compares component names',
      'React compares element types - same type updates, different type replaces',
      'React always replaces components',
      'React never compares types'
    ],
    correctAnswer: 1,
    explanation: 'React compares element types during reconciliation. Same type means React updates the existing element with new props. Different type means React unmounts the old and mounts a new one.',
    difficulty: 'medium'
  },
  {
    id: 'day02-q5',
    question: 'Why do index keys cause bugs in reorderable lists?',
    options: [
      'They are too slow',
      'The key changes with position, so React matches the wrong component',
      'They use too much memory',
      'They are not supported by React'
    ],
    correctAnswer: 1,
    explanation: 'Index keys change when items move. React uses keys to match components, so when an item moves from index 0 to index 1, React thinks the component at index 0 is still the same component, causing state bugs.',
    difficulty: 'medium'
  }
]

export const day02Debugging: DebuggingScenario[] = [
  {
    id: 'day02-debug-1',
    title: 'Checkbox State Moves When Sorting',
    description: 'Users check items in a sortable list, but when they sort, the checked state appears on different items.',
    buggyCode: `function SortableList({ items }) {
  const [sortedItems, setSortedItems] = useState(items)
  
  const sort = () => {
    setSortedItems([...items].sort((a, b) => a.name.localeCompare(b.name)))
  }
  
  return (
    <div>
      <button onClick={sort}>Sort</button>
      {sortedItems.map((item, index) => (
        <ListItem 
          key={index}  // ❌ BUG
          item={item}
        />
      ))}
    </div>
  )
}`,
    fixedCode: `function SortableList({ items }) {
  const [sortedItems, setSortedItems] = useState(items)
  
  const sort = () => {
    setSortedItems([...items].sort((a, b) => a.name.localeCompare(b.name)))
  }
  
  return (
    <div>
      <button onClick={sort}>Sort</button>
      {sortedItems.map((item) => (
        <ListItem 
          key={item.id}  // ✅ FIX: Use stable id
          item={item}
        />
      ))}
    </div>
  )
}`,
    bugExplanation: 'Index keys cause React to match ListItem components by position. When sorted, the item at index 0 changes, but React thinks it\'s the same component, so checkbox state stays at index 0 instead of moving with the item.',
    hints: [
      'The key is based on index, which changes when sorted',
      'React matches components by key, not by data',
      'Use item.id as the key instead'
    ]
  }
]

export const day02RealWorld: RealWorldScenario[] = [
  {
    id: 'day02-real-1',
    title: 'E-commerce Cart Bug',
    description: 'Users add items to cart, then filter by category. When they remove the filter, items appear but quantities are wrong.',
    problem: 'The cart uses index keys. When filtering, items are re-indexed. When filter is removed, React matches components by index, causing quantity state to appear on wrong items.',
    solution: 'Use item.id as key. This ensures React correctly matches cart items even after filtering/reordering.',
    codeExample: `// Before: Index keys
{cartItems.map((item, index) => (
  <CartItem key={index} item={item} />
))}

// After: Stable keys
{cartItems.map((item) => (
  <CartItem key={item.id} item={item} />
))}`,
    relatedDays: [2, 4]
  },
  {
    id: 'day02-real-2',
    title: 'Drag-and-Drop List State Corruption',
    description: 'A sortable list with checkboxes loses checked state when items are reordered via drag-and-drop.',
    problem: 'The list uses index keys. When items are dragged to new positions, React matches components by index. Checkbox state (checked/unchecked) stays with the position, not the item, causing checked items to appear unchecked and vice versa.',
    solution: 'Use stable IDs as keys. When items move, React correctly matches each item to its component instance, preserving checkbox state.',
    codeExample: `// Before: Index keys cause state bugs
function SortableList({ items }) {
  return (
    <DndContext>
      {items.map((item, index) => (
        <SortableItem 
          key={index}  // ❌ Bug: key changes with position
          item={item}
        />
      ))}
    </DndContext>
  )
}

// After: Stable keys preserve state
function SortableList({ items }) {
  return (
    <DndContext>
      {items.map((item) => (
        <SortableItem 
          key={item.id}  // ✅ Fix: stable key
          item={item}
        />
      ))}
    </DndContext>
  )
}`,
    relatedDays: [2]
  }
]
