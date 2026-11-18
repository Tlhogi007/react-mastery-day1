# Day 1: Rendering Pipeline

## Learning Objectives
- Understand Render Phase vs Commit Phase
- Learn about Virtual DOM
- Understand Diffing basics
- Be able to explain: What happens from setState to DOM mutation?

## Exercise
Draw the full lifecycle from state update → fiber → commit.

## Key Concepts

### Render Phase
- React calls component functions
- Creates Virtual DOM tree
- Diffs old vs new tree
- **Interruptible** (React 18+)

### Commit Phase
- Updates real DOM
- Runs useEffect callbacks
- Runs cleanup functions
- **Synchronous** (cannot be interrupted)

### Virtual DOM
JavaScript representation of the DOM used for efficient diffing.

## Flow Diagram

```
User Action (Click)
    ↓
State Update Scheduled (setCount)
    ↓
┌─────────────────────────────┐
│   RENDER PHASE              │
│   (Interruptible)           │
│   - Call component function │
│   - Create Virtual DOM      │
│   - Diff old vs new         │
│   - Mark what needs update  │
└─────────────┬───────────────┘
    ↓
┌─────────────────────────────┐
│   COMMIT PHASE             │
│   (Synchronous)            │
│   - Update real DOM        │
│   - Run useEffect          │
│   - Run cleanup functions  │
└─────────────┬───────────────┘
    ↓
Browser Paints
```

## What Happens from setState to DOM Mutation?

1. **State Update**: `setCount` schedules a state update
2. **Render Phase**: React calls your component function, creates new Virtual DOM tree, diffs it with previous tree
3. **Commit Phase**: React updates the real DOM nodes that changed, runs effects
4. **Browser Paint**: Browser renders the visual changes

## Practice Questions

1. Why is the render phase interruptible but the commit phase is not?
2. What would happen if React updated the DOM during the render phase?
3. How does the Virtual DOM help performance?

## Notes
See `notes.md` for personal observations and learnings.