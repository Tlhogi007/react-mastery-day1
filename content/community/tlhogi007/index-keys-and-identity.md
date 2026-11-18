---
title: "Index Keys Break Identity (Not Just Style)"
author: "Letlhogonolo Sekwati"
github: "tlhogi007"
topic: "Reconciliation"
difficulty: "intermediate"
date: "2026-11-18"
tags: ["keys", "reconciliation", "identity", "lists"]
estimatedTime: "6 min read"
---

# Index Keys Break Identity (Not Just Style)

## The trap

Using `key={index}` looks fine until you **reorder, filter, or insert** items. React matches children by key. If the key is the array position, React thinks “row 0 is still row 0” even when the *data* at that position changed.

## What actually breaks

Controlled props (`value`, `checked`) often update from parent state, so the bug looks subtle. What sticks to the wrong row is **component identity**: local state, focus, DOM state, and anything stored inside the child.

```tsx
// ❌ Position identity
{todos.map((todo, index) => (
  <TodoRow key={index} todo={todo} />
))}

// ✅ Stable identity
{todos.map((todo) => (
  <TodoRow key={todo.id} todo={todo} />
))}
```

## How to prove it in 30 seconds

1. Star item A (local state inside the row).
2. Move A down with index keys.
3. The star stays on the *position*, not on A.

That is reconciliation identity, not a CSS issue.

## Takeaway

Keys answer: “Is this the same component instance as last render?” Use a stable id from your data. Index keys are only safe for static lists that never reorder, filter, or grow in the middle.
