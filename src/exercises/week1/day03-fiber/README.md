# Day 3: Fiber Architecture

## Learning Objectives
- Understand Fiber Node Structure
- Learn about current vs workInProgress tree
- Master the Unit of Work model
- Be able to answer: Why was Fiber introduced?

## Exercise
Understand how Fiber works and why it was introduced.

## Key Concepts

### Fiber Node Structure
Each Fiber node represents a component or DOM element:

```typescript
interface FiberNode {
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
}
```

**Key Points:**
- Uses linked list structure (not tree) for easier traversal
- Each node points to child, sibling, and parent
- `alternate` pointer connects Current and WorkInProgress trees

### Current vs WorkInProgress Tree

React maintains **two trees** during rendering:

1. **Current Tree:**
   - The tree currently committed to the DOM
   - What users see right now
   - Stable and immutable during render phase

2. **WorkInProgress Tree:**
   - The tree being built during render phase
   - Not yet committed to DOM
   - Can be interrupted, aborted, or modified

**How they work together:**
- Each WorkInProgress node has `alternate` pointing to Current node
- Render phase builds WorkInProgress tree
- Commit phase swaps trees (WorkInProgress becomes Current)
- Next render uses old Current as base for new WorkInProgress

**Visual:**
```
Render 1:
Current: [App, Header, Content]
WorkInProgress: [App', Header', Content'] ← being built

After Commit:
Current: [App', Header', Content'] ← swapped
WorkInProgress: null

Render 2:
Current: [App', Header', Content'] ← becomes base
WorkInProgress: [App'', Header'', Content''] ← new tree
```

### Unit of Work Model

Fiber breaks rendering into small, interruptible units:

- **One Fiber = One Unit of Work**
- React processes one Fiber node at a time
- After each unit, React checks: "Should I yield?"
- Can pause for urgent work, then resume

**Work Loop:**
```javascript
function workLoop() {
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
}
```

**Traversal Order:**
1. Process current Fiber
2. If has child → process child
3. If no child → process sibling
4. If no sibling → return to parent, process its sibling
5. Continue until all Fibers processed

### Why was Fiber Introduced?

**Problems with Stack Reconciler (pre-Fiber):**

1. **Synchronous:** Had to render entire tree in one go
2. **Uninterruptible:** Couldn't pause for urgent user input
3. **Blocking:** Long renders blocked the browser
4. **No Priority:** All updates treated equally
5. **Poor UX:** UI felt laggy during heavy rendering

**Solutions Fiber Provides:**

1. **Interruptible:** Can pause and resume rendering
2. **Prioritized:** Urgent updates (clicks, typing) processed first
3. **Time Slicing:** Yields to browser every ~5ms
4. **Concurrent:** Multiple work trees can exist
5. **Better UX:** UI stays responsive during heavy work

**Example:**
```
Stack Reconciler:
User types → [Blocked 200ms] → UI updates
Result: Laggy, unresponsive

Fiber:
User types → [Immediate response] → Background rendering continues
Result: Smooth, responsive
```

## Fiber Traversal Algorithm

Fiber uses a depth-first traversal with linked list structure:

```
1. Start at root
2. Process current Fiber
3. If has child → go to child (depth-first)
4. If no child → go to sibling (breadth-first)
5. If no sibling → return to parent, go to its sibling
6. Repeat until all processed
```

**Example:**
```
App
├── Header
│   └── Logo
├── Content
│   ├── Article
│   └── Sidebar
└── Footer

Traversal: App → Header → Logo → Content → Article → Sidebar → Footer
```

## Key Differences: Stack vs Fiber

| Aspect | Stack Reconciler | Fiber |
|--------|-----------------|-------|
| Structure | Tree | Linked List |
| Interruptible | No | Yes |
| Priority | None | Yes (lanes) |
| Time Slicing | No | Yes |
| Concurrent | No | Yes |
| Pause/Resume | No | Yes |

## Practice Questions

1. Why does Fiber use a linked list instead of a tree?
2. What is the purpose of the `alternate` pointer?
3. How does Fiber enable concurrent rendering?
4. What happens during the commit phase tree swap?
5. Why can't the commit phase be interrupted?

## Notes
See `notes.md` for personal observations and learnings.
