---
title: "Example: Understanding Stale Closures"
author: "Example Contributor"
github: "example-user"
topic: "Effects"
difficulty: "intermediate"
date: "2026-02-28"
tags: ["useEffect", "closures", "debugging"]
estimatedTime: "8 min read"
---

# Understanding Stale Closures in useEffect

## Introduction

One of the most common bugs in React is the "stale closure" problem. This happens when your effect captures an old value and doesn't update when that value changes.

## The Problem

```typescript
function Counter() {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      console.log(count) // ❌ Always logs 0!
    }, 1000)
    
    return () => clearInterval(interval)
  }, []) // Empty dependency array
  
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  )
}
```

**Why it happens:**
- The effect runs once (empty deps)
- The interval captures `count` from that first render
- `count` is always 0 inside the interval
- Even though the component re-renders with new count values

## The Solution

### Option 1: Add to Dependencies

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    console.log(count) // ✅ Now logs current count!
  }, 1000)
  
  return () => clearInterval(interval)
}, [count]) // Include count
```

**Trade-off:** Effect re-runs every time count changes (creates new interval)

### Option 2: Functional Updates

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    setCount(c => {
      console.log(c) // ✅ Current count!
      return c
    })
  }, 1000)
  
  return () => clearInterval(interval)
}, []) // Empty deps OK now
```

**Why it works:** Functional updates always get the latest state

### Option 3: useRef

```typescript
function Counter() {
  const [count, setCount] = useState(0)
  const countRef = useRef(count)
  
  // Keep ref in sync
  useEffect(() => {
    countRef.current = count
  }, [count])
  
  useEffect(() => {
    const interval = setInterval(() => {
      console.log(countRef.current) // ✅ Always current!
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  )
}
```

**Why it works:** Refs are mutable and don't trigger re-renders

## Key Takeaways

- Closures capture values at the time they're created
- Empty dependency arrays freeze those values
- Always include dependencies or use functional updates
- useRef can hold mutable values that don't cause re-renders

## When to Use Each Solution

| Solution | Use When |
|----------|----------|
| Dependencies | Re-running effect is acceptable |
| Functional Updates | Only need state, not props |
| useRef | Need latest value without re-renders |

## Further Reading

- [React Docs: useEffect](https://react.dev/reference/react/useEffect)
- [Dan Abramov: A Complete Guide to useEffect](https://overreacted.io/a-complete-guide-to-useeffect/)
