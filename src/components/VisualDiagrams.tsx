/**
 * Visual Diagrams Component
 * Interactive diagrams for Fiber tree and Virtual DOM diffing
 */

import { useState, type JSX } from 'react'

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
      <div style={{ 
        padding: '20px', 
        background: 'var(--bg-card)', 
        borderRadius: '8px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>🌳 Fiber Tree Structure</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
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

        <div style={{
          padding: '20px',
          background: 'var(--bg-secondary)',
          borderRadius: '6px',
          fontFamily: 'monospace',
          fontSize: '13px',
          lineHeight: '1.8',
          color: 'var(--text-primary)',
          whiteSpace: 'pre',
          overflowX: 'auto',
          border: '1px solid var(--border-color)'
        }}>
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
          <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
            <li>Each component/element has a corresponding Fiber node</li>
            <li>Fiber nodes are linked via child, sibling, and return pointers</li>
            <li>The alternate property points to the previous tree (for diffing)</li>
            <li>This structure enables React's reconciliation algorithm</li>
          </ul>
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
      <div style={{ 
        padding: '20px', 
        background: 'var(--bg-card)', 
        borderRadius: '8px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>🔄 Reconciliation Process</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
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

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '20px',
          marginBottom: '16px'
        }}>
          <div>
            <h4 style={{ marginBottom: '8px', fontSize: '14px' }}>Before</h4>
            <div style={{ 
              padding: '12px', 
              background: 'var(--bg-section)', 
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
              whiteSpace: 'pre',
              border: '1px solid var(--border-color)'
            }}>
              {currentStep.before}
            </div>
          </div>
          <div>
            <h4 style={{ marginBottom: '8px', fontSize: '14px' }}>After</h4>
            <div style={{ 
              padding: '12px', 
              background: 'var(--bg-section)', 
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
              whiteSpace: 'pre',
              border: '1px solid var(--border-color)'
            }}>
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
          <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
            <li>React compares element types first</li>
            <li>Keys help identify which items are the same</li>
            <li>When type/key match, React updates props</li>
            <li>When type/key differ, React unmounts and mounts</li>
          </ul>
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
        diagram: `// ❌ Without memoization
const value = { user, setUser }
// New object every render → all consumers re-render

// ✅ With memoization
const value = useMemo(() => ({ user, setUser }), [user])
// Same reference when user unchanged → no re-renders`
      }
    ]

    const currentStep = contextSteps[step % contextSteps.length]

    return (
      <div style={{ 
        padding: '20px', 
        background: 'var(--bg-card)', 
        borderRadius: '8px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>🌐 Context Re-render Propagation</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
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
              onClick={() => setStep(s => (s + 1) % contextSteps.length)}
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

        <div style={{
          padding: '20px',
          background: 'var(--bg-secondary)',
          borderRadius: '6px',
          fontFamily: 'monospace',
          fontSize: '13px',
          lineHeight: '1.8',
          color: 'var(--text-primary)',
          whiteSpace: 'pre',
          overflowX: 'auto',
          border: '1px solid var(--border-color)',
          marginBottom: '16px'
        }}>
          {currentStep.diagram}
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
          <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
            <li>All Context consumers re-render when value changes</li>
            <li>Split contexts by concern to reduce blast radius</li>
            <li>Memoize provider values to prevent unnecessary re-renders</li>
            <li>Use React.memo on expensive consumer components</li>
          </ul>
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
    <div style={{ 
      padding: '20px', 
      background: 'var(--bg-card)', 
      borderRadius: '8px',
      border: '1px solid var(--border-color)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>🔄 Virtual DOM Diffing</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
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

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px',
        marginBottom: '16px'
      }}>
        <div>
          <h4 style={{ marginBottom: '8px', fontSize: '14px' }}>Before</h4>
          <div style={{ 
            padding: '12px', 
            background: 'var(--bg-section)', 
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
            whiteSpace: 'pre',
            border: '1px solid var(--border-color)'
          }}>
            {currentDiff.before}
          </div>
        </div>
        <div>
          <h4 style={{ marginBottom: '8px', fontSize: '14px' }}>After</h4>
          <div style={{ 
            padding: '12px', 
            background: 'var(--bg-section)', 
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
            whiteSpace: 'pre',
            border: '1px solid var(--border-color)'
          }}>
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
        <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
          <li>React compares the new Virtual DOM with the previous one</li>
          <li>Only the differences are applied to the real DOM</li>
          <li>This minimizes expensive DOM operations</li>
          <li>Keys help React identify which items changed</li>
        </ul>
      </div>
    </div>
  )
}

export default VisualDiagrams
