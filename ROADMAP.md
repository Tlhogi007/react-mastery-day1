# 30-Day Senior React Mastery Roadmap

A comprehensive roadmap to master React internals, performance optimization, architecture patterns, and system design thinking at a Senior/Staff level.

## Structure
- **Week 1** → Mental Models & Internals
- **Week 2** → Performance & Concurrency  
- **Week 3** → Architecture & Scaling
- **Week 4** → System Design & Interview Simulation

Each day ≈ 60–90 min deep work.

---

## 🧠 WEEK 1 — React Internals Mastery
**Goal:** Understand how React actually works.

### Day 1 — Rendering Pipeline
**Study:**
- Render phase vs Commit phase
- Virtual DOM
- Diffing basics

**Be able to explain:**
- What happens from setState to DOM mutation?

**Exercise:**
- Draw the full lifecycle from state update → fiber → commit.

### Day 2 — Reconciliation Deep Dive
**Master:**
- Type comparison rule
- Keys and identity
- List diffing complexity

**Exercise:**
- Build a list with index keys.
- Reorder items.
- Observe state bugs.
- Explain why.

### Day 3 — Fiber Architecture
**Understand:**
- Fiber node structure
- current vs workInProgress tree
- Unit of work model

**Be able to answer:**
- Why was Fiber introduced?

### Day 4 — Bailouts & Memoization
**Deep dive:**
- React.memo
- useMemo
- useCallback
- Referential equality

**Exercise:**
- Use Profiler to detect wasted renders.
- Fix them.

### Day 5 — Effects & Closures
**Master:**
- useEffect timing
- Cleanup timing
- Stale closures
- Dependency array traps

**Exercise:**
- Intentionally create stale closure bug.
- Fix with 3 approaches.

### Day 6 — Context & Re-render Propagation
**Understand:**
- Why all consumers re-render
- Splitting contexts
- Memoizing provider value

**Build:**
- AuthContext with and without optimization.
- Measure difference.

### Day 7 — Weekly Deep Reflection
**Be able to explain without notes:**
- Reconciliation
- Fiber
- Effect timing
- Bailouts

**If you can teach it, you own it.**

---

## ⚡ WEEK 2 — Performance & Concurrency
**Goal:** Think like React 18.

### Day 8 — Concurrent Rendering
**Understand:**
- Interruptible work
- Priority lanes
- Urgent vs non-urgent updates

**Explain:**
- Why concurrent rendering improves UX.

### Day 9 — startTransition
**Build:**
- Large searchable list.

**Add:**
- startTransition.

**Observe:**
- Input responsiveness difference.

### Day 10 — Automatic Batching
**Test:**
- setTimeout
- Promise
- Native event listener

**Compare:**
- React 17 vs 18 behavior (theory if needed).

### Day 11 — Suspense
**Study:**
- Promise throwing model
- Fallback boundaries
- Nested boundaries

**Design:**
- A page with 3 granular Suspense boundaries.

**Explain:**
- Why not wrap entire page.

### Day 12 — SSR & Hydration
**Master:**
- Hydration process
- Mismatch causes
- Deterministic rendering

**Explain:**
- Why hydration errors happen in production.

### Day 13 — Code Splitting Strategy
**Practice:**
- React.lazy
- Route-based splitting
- Chunk strategy thinking

**Explain:**
- When NOT to code split.

### Day 14 — Performance Audit Day
**Use:**
- React DevTools Profiler

**Analyze:**
- Render waterfall
- Commit durations
- Wasted renders

**Document:**
- Findings like you're reporting to a tech lead.

---

## 🏗 WEEK 3 — Architecture & Scaling
**Goal:** Think beyond components.

### Day 15 — State Strategy Design
**Design:**
- Small app with:
  - Local state
  - Context
  - useReducer
  - External store

**Explain:**
- Why each exists.

### Day 16 — State Colocation vs Lifting
**Create:**
- Parent controlling too much state.

**Refactor:**
- Colocate state.

**Measure:**
- Re-render difference.

**Explain:**
- Blast radius concept.

### Day 17 — Optimistic UI
**Build:**
- Like button with optimistic update.

**Handle:**
- Failure rollback
- Double click race
- Slow network simulation

### Day 18 — Micro-Frontend Thinking
**Design:**
- Shared UI package.

**Think about:**
- Versioning
- Context isolation
- Avoiding global singletons

### Day 19 — Error Boundaries Strategy
**Design:**
- Feature-level error boundaries.

**Explain:**
- Why not single global boundary?

### Day 20 — Server Components
**Study:**
- What runs on server
- What runs on client
- Bundle size impact

**Explain:**
- When Server Components are worth it.

### Day 21 — Architecture Review Simulation
**Answer:**
- Design a scalable video streaming frontend.

**Structure your answer:**
- Rendering
- State
- Performance
- Error handling
- Observability

**Record yourself explaining.**

---

## 🎯 WEEK 4 — Interview Domination Mode
**Goal:** Articulate like a Senior/Staff engineer.

### Day 22 — Core Concepts Rapid Recall
**Without notes explain:**
- Reconciliation
- Fiber
- Concurrent rendering
- Suspense
- startTransition

**If you hesitate → review.**

### Day 23 — Debugging Round
**Practice answering:**
- Why is this component re-rendering?
- Why is effect running twice?
- Why is hydration failing?
- Why is input lagging?

### Day 24 — Trade-Off Drills
**For each topic answer:**
- Pros
- Cons
- When to use
- When not to use

**Topics:**
- Context
- Memoization
- SSR
- Optimistic UI
- useReducer

### Day 25 — Whiteboard Architecture
**Design:**
- Large CMS-driven platform.

**Include:**
- Code splitting
- Suspense
- Error boundaries
- State strategy
- Observability

**Speak in trade-offs.**

### Day 26 — Performance Deep Dive
**Explain:**
- Microtask vs macrotask
- Event loop relation to React
- Why batching works
- Why layout shift matters

### Day 27 — Behavioral + Technical Blend
**Practice:**
- Tell me about a performance issue you solved.

**Structure:**
- Problem
- Diagnosis
- Tooling used
- Trade-offs
- Outcome

### Day 28 — Mock Senior Interview
**Includes:**
- Debug scenario
- Architecture question
- Concurrency question
- Performance optimization

### Day 29 — Staff-Level Thinking
**Shift mindset:**
- Not "how do I fix this component?"
- But:
  - How do we prevent this class of bugs?
  - How do we scale this pattern?
  - How do we enforce standards?

### Day 30 — Final Synthesis
**Write:**
- Your personal React philosophy:
  - Rendering strategy
  - State strategy
  - Performance strategy
  - Scaling philosophy

**If you can articulate this clearly → you're operating at Senior+.**

---

## 🏆 What You'll Gain After 30 Days

You will be able to:
- ✅ Explain React internals confidently
- ✅ Diagnose re-render issues instantly
- ✅ Design scalable architectures
- ✅ Speak in trade-offs naturally
- ✅ Handle system design interviews
- ✅ Think beyond component-level problems

---

## 📚 Core Topics Covered

### React Internals
- Reconciliation algorithm
- Virtual DOM diffing algo
- Fiber architecture
- Concurrent rendering
- Automatic batching (React 18)
- Transitions (startTransition)
- Suspense boundaries
- Error boundaries
- Synthetic event system
- Keys and list re-render behavior

### Performance & Optimization
- Memoization (React.memo, useMemo, useCallback)
- Bailout conditions in rendering
- React DevTools Profiler
- Code splitting with React.lazy
- Tree shaking
- State colocation strategy
- Lifting state up trade-offs

### State Management
- Immutability and structural sharing
- Reducer patterns (useReducer)
- Optimistic UI updates
- Context API re-render optimization
- Prop drilling vs composition

### Effects & Lifecycle
- Stale closures problem
- Dependency array pitfalls
- Cleanup function timing in useEffect
- Layout shift vs useLayoutEffect
- AbortController
- Microtask vs macrotask

### Advanced Patterns
- Custom hooks design patterns
- Render props pattern
- Higher Order Components (HOC)
- Forward refs
- useImperativeHandle
- StrictMode

### Rendering Strategies
- Hydration in SSR
- CSR vs SSR vs SSG
- Server Components
- Code splitting strategy

### Architecture & Scaling
- Micro-frontend thinking
- Error boundaries strategy
- State strategy design
- Architecture review simulation

### Interview Preparation
- Core concepts rapid recall
- Debugging scenarios
- Trade-off drills
- Whiteboard architecture
- Performance deep dive
- Behavioral + technical blend
- Mock senior interview
- Staff-level thinking

---

**Built to help developers master React like a systems engineer.**
