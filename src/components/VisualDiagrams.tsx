/**
 * Visual Diagrams Component
 * Interactive diagrams for Fiber tree and Virtual DOM diffing
 */

import { useState, type JSX } from 'react'
import '../exercises/exerciseLayout.css'

interface VisualDiagramsProps {
  type: 'fiber-tree' | 'virtual-dom-diff' | 'reconciliation' | 'context-propagation'
}

function VisualDiagrams({ type }: VisualDiagramsProps): JSX.Element {
  const [step, setStep] = useState(0)

  if (type === 'fiber-tree') {
    const steps = [
      {
        title: 'Fiber Tree Structure',
        description: 'Fiber nodes form a tree structure with child and sibling pointers',
        tree: `App (Fiber Node)
├─ child: Header
│  ├─ child: Logo
│  └─ sibling: Nav
│     └─ child: NavItem (×3)
├─ sibling: Content
│  ├─ child: Article
│  │  ├─ child: Title
│  │  └─ sibling: Paragraph (×2)
│  └─ sibling: Sidebar
│     └─ child: Widget (×2)
└─ sibling: Footer
   └─ child: Copyright`
      },
      {
        title: 'Fiber Node Properties',
        description: 'Each Fiber node contains type, props, state, and pointers',
        tree: `Fiber Node {
  type: 'div' | Component | 'text',
  props: { ... },
  stateNode: DOM element,
  child: Fiber | null,
  sibling: Fiber | null,
  return: Fiber | null,
  alternate: Fiber | null,
  effectTag: 'UPDATE' | 'PLACEMENT' | 'DELETION',
  ...more
}`
      }
    ]

    const currentStep = steps[step % steps.length]

    return (
      <div className="diagram-card">
        <div className="diagram-header">
          <h3>Fiber Tree Structure</h3>
          <div className="diagram-nav">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              style={{
                padding: '6px 12px',
                background: step === 0 ? 'var(--bg-section)' : 'var(--button-primary)',
                color: step === 0 ? 'var(--text-secondary)' : 'var(--button-text)',
                border: 'none',
                borderRadius: '4px',
                cursor: step === 0 ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                opacity: step === 0 ? 0.5 : 1
              }}
            >
              ← Prev
            </button>
            <button
              onClick={() => setStep(s => s + 1)}
              style={{
                padding: '6px 12px',
                background: 'var(--button-primary)',
                color: 'var(--button-text)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Next →
            </button>
          </div>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          {currentStep.description}
        </p>

        <div className="diagram-code" style={{ lineHeight: 1.8 }}>
          {currentStep.tree}
        </div>

        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          background: 'var(--bg-info)', 
          color: 'var(--text-on-info)',
          borderRadius: '6px',
          fontSize: '13px'
        }}>
          <strong>💡 Key Points:</strong>
          <div className="lesson-points">
            <div className="lesson-points__item"><span>Each component/element has a corresponding Fiber node</span></div>
            <div className="lesson-points__item"><span>Fiber nodes are linked via child, sibling, and return pointers</span></div>
            <div className="lesson-points__item"><span>The alternate property points to the previous tree (for diffing)</span></div>
            <div className="lesson-points__item"><span>This structure enables React's reconciliation algorithm</span></div>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'reconciliation') {
    const reconciliationSteps = [
      {
        title: 'Type Comparison',
        description: 'React compares element types to decide if reconciliation is needed',
        before: `<div>
  <h1>Title</h1>
  <p>Content</p>
</div>`,
        after: `<span>
  <h1>Title</h1>
  <p>Content</p>
</span>`,
        result: 'Type changed: div → span. React unmounts old, mounts new.'
      },
      {
        title: 'Key Comparison',
        description: 'Keys help React identify which items are the same',
        before: `List with index keys:
[0] Item A
[1] Item B
[2] Item C`,
        after: `After removing Item A:
[0] Item B (was [1])
[1] Item C (was [2])`,
        result: 'Index keys cause React to match wrong items. Use stable IDs!'
      },
      {
        title: 'Props Update',
        description: 'When type and key match, React updates props',
        before: `<Button className="primary">
  Click me
</Button>`,
        after: `<Button className="secondary">
  Click me
</Button>`,
        result: 'Same type, same key. React updates className prop only.'
      }
    ]

    const currentStep = reconciliationSteps[step % reconciliationSteps.length]

    return (
      <div className="diagram-card">
        <div className="diagram-header">
          <h3>Reconciliation Process</h3>
          <div className="diagram-nav">
            <button
              type="button"
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              style={{
                padding: '6px 12px',
                background: step === 0 ? 'var(--bg-section)' : 'var(--button-primary)',
                color: step === 0 ? 'var(--text-secondary)' : 'var(--button-text)',
                border: 'none',
                borderRadius: '4px',
                cursor: step === 0 ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                opacity: step === 0 ? 0.5 : 1
              }}
            >
              ← Prev
            </button>
            <button
              onClick={() => setStep(s => (s + 1) % reconciliationSteps.length)}
              style={{
                padding: '6px 12px',
                background: 'var(--button-primary)',
                color: 'var(--button-text)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Next →
            </button>
          </div>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Step {step + 1}: {currentStep.title} - {currentStep.description}
        </p>

        <div className="diagram-compare">
          <div style={{ minWidth: 0 }}>
            <h4 style={{ marginBottom: '8px', fontSize: '14px' }}>Before</h4>
            <div className="diagram-code">
              {currentStep.before}
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <h4 style={{ marginBottom: '8px', fontSize: '14px' }}>After</h4>
            <div className="diagram-code">
              {currentStep.after}
            </div>
          </div>
        </div>

        <div style={{ 
          padding: '12px', 
          background: 'var(--bg-info)', 
          borderRadius: '6px',
          fontSize: '13px',
          border: '1px solid var(--border-color)'
        }}>
          💡 {currentStep.result}
        </div>

        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          background: 'var(--bg-info)', 
          color: 'var(--text-on-info)',
          borderRadius: '6px',
          fontSize: '13px'
        }}>
          <strong>💡 Key Points:</strong>
          <div className="lesson-points">
            <div className="lesson-points__item"><span>React compares element types first</span></div>
            <div className="lesson-points__item"><span>Keys help identify which items are the same</span></div>
            <div className="lesson-points__item"><span>When type/key match, React updates props</span></div>
            <div className="lesson-points__item"><span>When type/key differ, React unmounts and mounts</span></div>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'context-propagation') {
    const contextSteps = [
      {
        title: 'Context Provider Update',
        description: 'When Context value changes, all consumers re-render',
        diagram: `ThemeProvider (value changes)
    ↓
All Consumers Re-render:
  ├─ Header
  ├─ Sidebar
  └─ Footer

Even if they only use theme!`
      },
      {
        title: 'Context Splitting',
        description: 'Split contexts to reduce re-render scope',
        diagram: `ThemeProvider (theme changes)
    ↓
Only Theme Consumers Re-render:
  └─ ThemedButton

UserProvider (user changes)
    ↓
Only User Consumers Re-render:
  └─ UserProfile

✅ Reduced blast radius!`
      },
      {
        title: 'Memoized Provider Value',
        description: 'Memoize provider value to prevent unnecessary re-renders',
        diagram: `// ❌ New object every render
const value = { user, setUser }
// → all consumers re-render

// ✅ Memoized reference
const value = useMemo(
  () => ({ user, setUser }),
  [user]
)
// → stable when user unchanged`
      }
    ]

    const currentStep = contextSteps[step % contextSteps.length]

    return (
      <div className="diagram-card">
        <div className="diagram-header">
          <h3>Context Re-render Propagation</h3>
          <div className="diagram-nav">
            <button
              type="button"
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              style={{
                padding: '6px 12px',
                background: step === 0 ? 'var(--bg-section)' : 'var(--button-primary)',
                color: step === 0 ? 'var(--text-secondary)' : 'var(--button-text)',
                border: 'none',
                borderRadius: '4px',
                cursor: step === 0 ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                opacity: step === 0 ? 0.5 : 1,
              }}
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => setStep(s => (s + 1) % contextSteps.length)}
              style={{
                padding: '6px 12px',
                background: 'var(--button-primary)',
                color: 'var(--button-text)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Next →
            </button>
          </div>
        </div>

        <p className="diagram-step-copy">
          <strong>Step {step + 1}: {currentStep.title}</strong>
          {' — '}
          {currentStep.description}
        </p>

        <div className="diagram-code" style={{ lineHeight: 1.8, marginBottom: 16 }}>
          {currentStep.diagram}
        </div>

        <div
          style={{
            padding: '12px',
            background: 'var(--bg-info)',
            color: 'var(--text-on-info)',
            borderRadius: '6px',
            fontSize: '13px',
          }}
        >
          <strong>Key Points:</strong>
          <div className="lesson-points">
            <div className="lesson-points__item"><span>All Context consumers re-render when value changes</span></div>
            <div className="lesson-points__item"><span>Split contexts by concern to reduce blast radius</span></div>
            <div className="lesson-points__item"><span>Memoize provider values to prevent unnecessary re-renders</span></div>
            <div className="lesson-points__item"><span>Use React.memo on expensive consumer components</span></div>
          </div>
        </div>
      </div>
    )
  }

  // Virtual DOM Diffing
  const diffSteps = [
    {
      title: 'Before Update',
      before: `<div>
  <h1>Count: 0</h1>
  <button>Increment</button>
</div>`,
      after: `<div>
  <h1>Count: 0</h1>
  <button>Increment</button>
</div>`,
      diff: 'No changes'
    },
    {
      title: 'After State Update',
      before: `<div>
  <h1>Count: 0</h1>
  <button>Increment</button>
</div>`,
      after: `<div>
  <h1>Count: 1</h1>
  <button>Increment</button>
</div>`,
      diff: 'Only text content changed'
    },
    {
      title: 'DOM Update',
      before: `<div>
  <h1>Count: 0</h1>
  <button>Increment</button>
</div>`,
      after: `<div>
  <h1>Count: 1</h1>
  <button>Increment</button>
</div>`,
      diff: 'React updates only the changed text node'
    }
  ]

  const currentDiff = diffSteps[step % diffSteps.length]

  return (
    <div className="diagram-card">
      <div className="diagram-header">
        <h3>Virtual DOM Diffing</h3>
        <div className="diagram-nav">
          <button
            type="button"
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            style={{
              padding: '6px 12px',
              background: step === 0 ? 'var(--bg-section)' : 'var(--button-primary)',
              color: step === 0 ? 'var(--text-secondary)' : 'var(--button-text)',
              border: 'none',
              borderRadius: '4px',
              cursor: step === 0 ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              opacity: step === 0 ? 0.5 : 1
            }}
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={() => setStep(s => (s + 1) % diffSteps.length)}
            style={{
              padding: '6px 12px',
              background: 'var(--button-primary)',
              color: 'var(--button-text)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Next →
          </button>
        </div>
      </div>

      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
        Step {step + 1}: {currentDiff.title}
      </p>

      <div className="diagram-compare">
        <div style={{ minWidth: 0 }}>
          <h4 style={{ marginBottom: '8px', fontSize: '14px' }}>Before</h4>
          <div className="diagram-code">
            {currentDiff.before}
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <h4 style={{ marginBottom: '8px', fontSize: '14px' }}>After</h4>
          <div className="diagram-code">
            {currentDiff.after}
          </div>
        </div>
      </div>

      <div style={{ 
        padding: '12px', 
        background: currentDiff.diff.includes('No changes') 
          ? 'var(--bg-section)' 
          : 'var(--bg-success)', 
        borderRadius: '6px',
        fontSize: '13px',
        border: `1px solid ${currentDiff.diff.includes('No changes') ? 'var(--border-color)' : 'var(--bg-success)'}`
      }}>
        ✅ {currentDiff.diff}
      </div>

      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        background: 'var(--bg-info)', 
        borderRadius: '6px',
        fontSize: '13px'
      }}>
        <strong>💡 Key Points:</strong>
        <div className="lesson-points">
            <div className="lesson-points__item"><span>React compares the new Virtual DOM with the previous one</span></div>
            <div className="lesson-points__item"><span>Only the differences are applied to the real DOM</span></div>
            <div className="lesson-points__item"><span>This minimizes expensive DOM operations</span></div>
            <div className="lesson-points__item"><span>Keys help React identify which items changed</span></div>
          </div>
      </div>
    </div>
  )
}

export default VisualDiagrams
