# Day 2: Reconciliation Deep Dive

## Learning Objectives
- Master Type Comparison Rule
- Understand Keys and Identity
- Learn List Diffing Complexity
- Build a list with index keys, reorder items, observe state bugs, and explain why

## Exercise
Build a list with index keys. Reorder items. Observe state bugs. Explain why.

## Key Concepts

### Type Comparison Rule
React compares element types during reconciliation:
- **Same type** → React updates the existing element with new props
- **Different type** → React unmounts the old element and mounts a new one

```typescript
// Same type - React updates
<div className="old"> → <div className="new"> ✅ Updates

// Different type - React replaces
<div> → <span> ❌ Unmounts div, mounts span
```

### Keys and Identity
Keys help React identify which items changed, were added, or removed:

- **Without keys**: React uses position (index) to match elements
- **With keys**: React uses identity to match elements
- **Index keys**: Cause bugs when reordering because the key changes with position

**Good keys:**
- Stable (don't change between renders)
- Unique (no duplicates)
- Predictable (not random)

**Bad keys:**
- Index (changes when items move)
- Random values (new key every render)
- Non-unique values

### List Diffing Complexity
React's reconciliation algorithm for lists:

- **O(n) complexity** with proper keys
- **O(n²) complexity** without keys (worst case)
- Keys allow React to efficiently determine what changed

## The Index Key Bug

### What Happens with Index Keys

```typescript
// Initial render
[
  { key: 0, text: "Item A", checked: true },
  { key: 1, text: "Item B", checked: false },
  { key: 2, text: "Item C", checked: false }
]

// After moving Item A down (index 0 → index 1)
[
  { key: 0, text: "Item B", checked: false },  // ❌ React thinks this is Item A!
  { key: 1, text: "Item A", checked: true },   // ❌ React thinks this is Item B!
  { key: 2, text: "Item C", checked: false }
]
```

React matches by key:
- Key 0: "This must be the same item" → Updates props, keeps checked state
- Key 1: "This must be the same item" → Updates props, keeps checked state
- Result: Checked state moves with the position, not the item!

### What Happens with Proper Keys

```typescript
// Initial render
[
  { key: "a", text: "Item A", checked: true },
  { key: "b", text: "Item B", checked: false },
  { key: "c", text: "Item C", checked: false }
]

// After moving Item A down
[
  { key: "b", text: "Item B", checked: false },  // ✅ React knows this is Item B
  { key: "a", text: "Item A", checked: true },  // ✅ React knows this is Item A
  { key: "c", text: "Item C", checked: false }
]
```

React matches by key:
- Key "a": "This is Item A" → Moves to new position, keeps checked state
- Key "b": "This is Item B" → Moves to new position, keeps checked state
- Result: Checked state stays with the correct item!

## Reconciliation Algorithm

React's reconciliation process:

1. **Compare types**: Same type? Update. Different type? Replace.
2. **Compare keys**: Same key? Same element. Different key? Different element.
3. **Update efficiently**: Only update what changed.

### Without Keys
React can't tell which items are which, so it:
- May unmount and remount unnecessarily
- May lose component state
- May lose focus/selection state

### With Keys
React can efficiently:
- Match old and new elements
- Preserve component state
- Preserve DOM state (focus, selection)
- Minimize DOM operations

## Practice Questions

1. Why do index keys cause state bugs when reordering?
2. What makes a good key? What makes a bad key?
3. How does React use keys during reconciliation?
4. What happens if you use random keys?
5. Why is reconciliation O(n) with keys but O(n²) without?

## Common Mistakes

1. **Using index as key when items can be reordered**
   ```typescript
   // ❌ BAD
   {items.map((item, index) => <Item key={index} />)}
   ```

2. **Using index as key when items can be added/removed**
   ```typescript
   // ❌ BAD
   {items.map((item, index) => <Item key={index} />)}
   ```

3. **Using random values as keys**
   ```typescript
   // ❌ BAD
   {items.map((item) => <Item key={Math.random()} />)}
   ```

4. **Using non-unique values as keys**
   ```typescript
   // ❌ BAD (if names can be duplicated)
   {items.map((item) => <Item key={item.name} />)}
   ```

## Notes
See `notes.md` for personal observations and learnings.
