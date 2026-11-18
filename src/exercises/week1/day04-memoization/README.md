# Day 4: Bailouts & Memoization

## Learning Objectives
- Understand when and why React re-renders
- Master `React.memo` for component bailouts
- Use `useMemo` for expensive calculations
- Use `useCallback` for stable function references
- Understand referential equality

## Exercise
Use React DevTools Profiler to spot wasted renders, then fix them with memo / useMemo / useCallback.

## Key Concepts

### React.memo
Wraps a component so it skips re-render when props are shallowly equal.

```tsx
const Child = memo(function Child({ label }: { label: string }) {
  return <span>{label}</span>
})
```

**When it fails:** new object/array/function props every render defeat memo.

### useMemo
Caches a **value** between renders.

```tsx
const filtered = useMemo(() => items.filter(expensive), [items])
```

### useCallback
Caches a **function** reference (same idea as `useMemo(() => fn, deps)`).

```tsx
const onSave = useCallback(() => save(id), [id])
```

### Referential Equality
`===` for objects/functions is identity, not deep equality. Inline `{ theme }` and `() => {}` are new every render.

## Optimization Hierarchy (remember this)
1. Colocate state (smaller blast radius)
2. Memoize Context provider values
3. `React.memo` on hot leaf components
4. `useMemo` / `useCallback` only when measured

## Interview Check
- When does `React.memo` not help?
- Difference between `useMemo` and `useCallback`?
- Why is premature memoization a smell?

## In the Lab
Learn → Practice (MemoizationDemo + Profiler) → Challenges → Quiz → Reflect
