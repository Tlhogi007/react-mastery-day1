# Day 6: Context & Re-render Propagation

## Learning Objectives
- Why **all** consumers re-render when a Context value changes
- Split contexts by concern
- Memoize provider values
- Think in blast radius

## Exercise
Build (or use the lab demo) Auth/theme Context **with** and **without** optimization. Measure re-renders.

## Key Concepts

### The Default Behavior
Any `Provider` value change re-renders every consumer of that Context — even if they only read an unused field.

```tsx
// ❌ New object every render → all consumers re-render every time
<AuthContext.Provider value={{ user, login }}>
```

### Memoize the Value
```tsx
const value = useMemo(() => ({ user, login }), [user, login])
<AuthContext.Provider value={value}>
```

### Split Contexts
Separate high-frequency state from stable actions:

```tsx
<UserContext.Provider value={user}>
  <UserActionsContext.Provider value={actions}>
```

Consumers of actions alone won’t re-render when `user` changes (if actions are stable).

### Blast Radius
How many components re-render when one piece of state changes? Colocate state first; Context only for truly shared data.

## Interview Check
- Why do unused Context fields still re-render consumers?
- Split vs memoize — when each?
- When is Context the wrong tool?

## In the Lab
Learn (blast-radius demo) → Practice → Challenges → Quiz → Reflect
