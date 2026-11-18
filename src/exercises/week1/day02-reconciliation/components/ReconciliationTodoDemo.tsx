/**
 * Reconciliation Todo Demo Component
 * Single Responsibility: Demonstrate the index key bug with interactive todo list
 */

import { type JSX } from 'react'

interface TodoItem {
    id: string
    text: string
    completed: boolean
    notes: string
}

interface ReconciliationTodoDemoProps {
    todos: TodoItem[]
    useIndexKeys: boolean
    onToggleTodo: (id: string) => void
    onMoveUp: (index: number) => void
    onMoveDown: (index: number) => void
    onNotesChange: (id: string, notes: string) => void
}

function ReconciliationTodoDemo({
    todos,
    useIndexKeys,
    onToggleTodo,
    onMoveUp,
    onMoveDown,
    onNotesChange
}: ReconciliationTodoDemoProps): JSX.Element {
    const todoItemStyle = (completed: boolean): React.CSSProperties => ({
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        background: completed ? 'var(--bg-success)' : 'var(--bg-section)',
        border: `2px solid ${completed ? 'var(--bg-success)' : 'var(--border-color)'}`,
        borderRadius: '6px',
        marginBottom: '10px',
        transition: 'all 0.2s'
    })

    const todoTextStyle = (completed: boolean): React.CSSProperties => ({
        flex: 1,
        textDecoration: completed ? 'line-through' : 'none',
        color: completed ? 'var(--text-secondary)' : 'var(--text-primary)',
        fontSize: '16px'
    })

    const getButtonStyle = (disabled: boolean): React.CSSProperties => ({
        padding: '6px 12px',
        background: disabled ? 'var(--bg-tertiary)' : 'var(--button-primary)',
        color: disabled ? 'var(--text-muted)' : 'var(--button-text)',
        border: 'none',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        opacity: disabled ? 0.5 : 1
    })

    return (
        <div>
            <h3 style={{ marginTop: 0 }}>Todo List {useIndexKeys ? '(With Index Keys - BUGGY)' : '(With Proper Keys - FIXED)'}</h3>
            <div style={{
                background: 'var(--bg-info)',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px'
            }}>
                <h4 style={{ marginTop: 0 }}>Try This:</h4>
                <ul>
                    <li>Check/uncheck some todos</li>
                    <li>Add notes to some todos (type in the notes field)</li>
                    <li>Move todos up/down using ↑ ↓ buttons</li>
                    <li><strong>Observe:</strong> With index keys, notes and state "stick" to positions, not items!</li>
                </ul>
            </div>

            <div>
                {todos.map((todo, index) => (
                    <div
                        key={useIndexKeys ? index : todo.id}
                        style={todoItemStyle(todo.completed)}
                    >
                        <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => onToggleTodo(todo.id)}
                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                        />
                        <span style={todoTextStyle(todo.completed)}>
                            {todo.text}
                        </span>
                        <input
                            type="text"
                            placeholder="Add notes..."
                            value={todo.notes}
                            onChange={(e) => onNotesChange(todo.id, e.target.value)}
                            style={{
                                padding: '6px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                background: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                fontSize: '14px',
                                minWidth: '150px'
                            }}
                        />
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '100px' }}>
                            Key: <code>{useIndexKeys ? `index:${index}` : `id:${todo.id}`}</code>
                        </div>
                        <button
                            onClick={() => onMoveUp(index)}
                            disabled={index === 0}
                            style={getButtonStyle(index === 0)}
                        >
                            ↑
                        </button>
                        <button
                            onClick={() => onMoveDown(index)}
                            disabled={index === todos.length - 1}
                            style={getButtonStyle(index === todos.length - 1)}
                        >
                            ↓
                        </button>
                    </div>
                ))}
            </div>

            <div style={{
                background: 'var(--bg-info)',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                marginTop: '20px'
            }}>
                <h3 style={{ marginTop: 0 }}>What to Observe:</h3>
                <ul>
                    <li><strong>With Index Keys:</strong> When you reorder, component state (like the notes field value) "sticks" to positions, not items. React matches components by key (index), so the component at index 0 is treated as the same component even when different data is at that position.</li>
                    <li><strong>With Proper Keys:</strong> When you reorder, all state (checked, notes, focus) stays with the correct items because React correctly matches components by their stable identity (id).</li>
                    <li><strong>Why?</strong> React uses keys to match old and new elements. Index keys change when position changes, so React thinks components at the same index are the same component! With proper keys, React knows which item moved where.</li>
                    <li><strong>Note:</strong> Both the checkbox and notes field are controlled (they use <code>value</code> or <code>checked</code> props), but the bug still manifests because React is matching the wrong component instances when using index keys.</li>
                </ul>
            </div>
        </div>
    )
}

export default ReconciliationTodoDemo
