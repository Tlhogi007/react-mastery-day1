# Day 5: Effects & Closures

## Learning Objectives
- Know when `useEffect` runs (after paint / commit)
- Master cleanup timing
- Spot and fix stale closures
- Avoid dependency-array traps

## Exercise
Intentionally create a stale-closure bug (interval or subscription). Fix it three ways (deps, functional updates, refs).

## Key Concepts

### Timing
1. Render (calculate UI)
2. Commit (DOM)
3. **Effects** run after commit
4. Cleanup runs before the next effect and on unmount

### Stale Closures
An effect (or callback) closes over an old render’s values when deps are wrong.

```tsx
// ❌ count is stale inside the interval
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000)
  return () => clearInterval(id)
}, []) // missing count
```

### Three Fix Approaches
1. **Correct deps** — include `count` (re-subscribe each change)
2. **Functional updates** — `setCount(c => c + 1)` when next state depends on prev
3. **Refs** — `countRef.current = count` for “always latest” without re-subscribing

### Dependency Traps
- Omitting deps → stale data / Strict Mode surprises
- Unstable deps (new object every render) → effect thrash
- Syncing props → state in effects when you can derive during render

## Interview Check
- When does cleanup run?
- Why does Strict Mode double-invoke effects in dev?
- Three ways to fix a stale closure?

## In the Lab
Learn (timing demo) → Practice → Challenges → Quiz → Reflect
