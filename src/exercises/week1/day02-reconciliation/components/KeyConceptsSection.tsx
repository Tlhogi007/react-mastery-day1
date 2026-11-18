/**
 * Key Concepts Section Component
 * Single Responsibility: Display educational content about reconciliation concepts
 */

import { type JSX } from 'react'

function KeyConceptsSection(): JSX.Element {
    return (
        <div className="lesson-prose">
            <div style={{ marginBottom: '20px' }}>
                <h4>🔍 Type Comparison Rule</h4>
                <p>React's reconciliation algorithm first checks if element types match:</p>
                <ul>
                    <li><strong>Same Type:</strong> React updates the existing element with new props</li>
                    <li><strong>Different Type:</strong> React unmounts the old element completely and mounts a new one</li>
                </ul>
                <p><strong>Example:</strong></p>
                <pre className="lesson-code">
                    {`// Same type - React updates props
<div className="old"> → <div className="new"> ✅ Updates

// Different type - React replaces
<div> → <span> ❌ Unmounts div, mounts span`}
                </pre>
                <p><strong>Why it matters:</strong> When types differ, React destroys the old component (losing state) and creates a new one. This is why you should avoid changing component types dynamically.</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h4>🔑 Keys and Identity</h4>
                <p>Keys help React identify which items are the same across renders:</p>
                <ul>
                    <li><strong>Purpose:</strong> Keys provide a stable identity for list items</li>
                    <li><strong>Matching:</strong> React uses keys to match old and new elements</li>
                    <li><strong>State Preservation:</strong> Same key = same component instance = state preserved</li>
                    <li><strong>Different Key:</strong> Different key = different component = state lost</li>
                </ul>
                <p><strong>Good Keys:</strong></p>
                <ul>
                    <li>✅ Stable (don't change between renders)</li>
                    <li>✅ Unique (no duplicates in the list)</li>
                    <li>✅ Predictable (not random values)</li>
                    <li>✅ From data (item.id, item.uuid, etc.)</li>
                </ul>
                <p><strong>Bad Keys:</strong></p>
                <ul>
                    <li>❌ Index (changes when items move)</li>
                    <li>❌ Random values (new key every render)</li>
                    <li>❌ Non-unique values (duplicates)</li>
                </ul>
                <p><strong>In this exercise:</strong> When using index keys, moving an item changes its key, so React thinks it's a different item and loses its state (like the checked status).</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h4>📊 List Diffing Complexity</h4>
                <p>React's algorithm for efficiently updating lists:</p>
                <ul>
                    <li><strong>With Keys:</strong> O(n) complexity - React can quickly match items by key</li>
                    <li><strong>Without Keys:</strong> O(n²) complexity in worst case - React must compare every item with every other item</li>
                    <li><strong>Efficiency:</strong> Keys allow React to skip items that haven't moved</li>
                </ul>
                <p><strong>How it works:</strong></p>
                <ol>
                    <li>React creates a map of old items by key</li>
                    <li>React iterates through new items</li>
                    <li>For each new item, React looks up the old item by key</li>
                    <li>If found: update the existing item</li>
                    <li>If not found: mount a new item</li>
                    <li>Items not in new list: unmount</li>
                </ol>
                <p><strong>Performance Impact:</strong> With 1000 items, proper keys make updates ~1000x faster than without keys!</p>
            </div>
        </div>
    )
}

export default KeyConceptsSection
