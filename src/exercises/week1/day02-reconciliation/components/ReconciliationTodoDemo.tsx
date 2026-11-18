/**
 * Demonstrates the index-key bug using per-row local state (the classic case).
 * Controlled-by-id parent state alone would hide the bug after reorder.
 */

import { useState, type JSX } from 'react'
import '../../../exerciseLayout.css'

interface TodoItem {
  id: string
  text: string
  completed: boolean
}

interface ReconciliationTodoDemoProps {
  todos: TodoItem[]
  useIndexKeys: boolean
  onToggleTodo: (id: string) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
}

function TodoRow({
  todo,
  keyLabel,
  onToggleTodo,
  onMoveUp,
  onMoveDown,
  canUp,
  canDown,
}: {
  todo: TodoItem
  keyLabel: string
  onToggleTodo: (id: string) => void
  onMoveUp: () => void
  onMoveDown: () => void
  canUp: boolean
  canDown: boolean
}): JSX.Element {
  // Local state lives on the fiber instance React matched by `key`.
  // Index keys → fiber stays at a position → this state "sticks" to the slot.
  // Stable id keys → fiber moves with the item → state stays with the item.
  const [draftNote, setDraftNote] = useState('')
  const [starred, setStarred] = useState(false)

  const btn = (disabled: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    background: disabled ? 'var(--bg-tertiary)' : 'var(--button-primary)',
    color: disabled ? 'var(--text-muted)' : 'var(--button-text)',
    border: 'none',
    borderRadius: 4,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 14,
    opacity: disabled ? 0.5 : 1,
    minHeight: 40,
  })

  return (
    <div
      className="todo-demo-row"
      style={{
        background: todo.completed ? 'var(--bg-success)' : 'var(--bg-section)',
        border: `2px solid ${todo.completed ? 'var(--progress-success)' : 'var(--border-color)'}`,
      }}
    >
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggleTodo(todo.id)}
        style={{ width: 20, height: 20, cursor: 'pointer', flexShrink: 0 }}
        aria-label={`Complete ${todo.text}`}
      />
      <span
        className="todo-demo-row__title"
        style={{
          textDecoration: todo.completed ? 'line-through' : 'none',
          color: todo.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
        }}
      >
        {todo.text}
      </span>
      <button
        type="button"
        onClick={() => setStarred((s) => !s)}
        style={{
          ...btn(false),
          background: starred ? 'var(--bg-warning)' : 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          flexShrink: 0,
        }}
        title="Local row state (not in parent)"
      >
        {starred ? '★ starred' : '☆ star'}
      </button>
      <input
        className="todo-demo-row__note"
        type="text"
        placeholder="Local note (row state)…"
        value={draftNote}
        onChange={(e) => setDraftNote(e.target.value)}
      />
      <div className="todo-demo-row__meta">
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Key: <code>{keyLabel}</code>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onMoveUp} disabled={!canUp} style={btn(!canUp)}>
            ↑
          </button>
          <button type="button" onClick={onMoveDown} disabled={!canDown} style={btn(!canDown)}>
            ↓
          </button>
        </div>
      </div>
    </div>
  )
}

function ReconciliationTodoDemo({
  todos,
  useIndexKeys,
  onToggleTodo,
  onMoveUp,
  onMoveDown,
}: ReconciliationTodoDemoProps): JSX.Element {
  return (
    <div style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
      <h3 style={{ marginTop: 0 }}>
        Todo list {useIndexKeys ? '(index keys — buggy)' : '(stable id keys — correct)'}
      </h3>
      <div
        style={{
          background: 'var(--bg-info)',
          padding: 'clamp(12px, 3vw, 15px)',
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <h4 style={{ marginTop: 0 }}>Try this</h4>
        <ol style={{ marginBottom: 0 }}>
          <li>Star a row and type a local note on “Learn React”.</li>
          <li>Move that row down with ↓.</li>
          <li>
            <strong>Index keys:</strong> star/note stay in the <em>old slot</em>; the label moves.
          </li>
          <li>
            <strong>Id keys:</strong> star/note travel with the item.
          </li>
        </ol>
      </div>

      <div>
        {todos.map((todo, index) => (
          <TodoRow
            key={useIndexKeys ? index : todo.id}
            todo={todo}
            keyLabel={useIndexKeys ? `index:${index}` : `id:${todo.id}`}
            onToggleTodo={onToggleTodo}
            onMoveUp={() => onMoveUp(index)}
            onMoveDown={() => onMoveDown(index)}
            canUp={index > 0}
            canDown={index < todos.length - 1}
          />
        ))}
      </div>

      <div
        style={{
          background: 'var(--bg-info)',
          padding: 'clamp(12px, 3vw, 15px)',
          borderRadius: 8,
          marginTop: 20,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Why</h3>
        <ul style={{ marginBottom: 0 }}>
          <li>
            Star + note are <strong>local state on the row fiber</strong>. React matches fibers by{' '}
            <code>key</code>.
          </li>
          <li>
            Index keys change when the list reorders, so React reuses the fiber at that index and keeps
            its local state — while <code>todo</code> props swap underneath.
          </li>
          <li>
            Stable <code>id</code> keys let React move the same fiber with the item, so local state
            stays correct.
          </li>
          <li>
            Parent <code>completed</code> is keyed by id in data, so it still looks fine — the bug is
            easiest to see on <em>local</em> row state (and focus).
          </li>
        </ul>
      </div>
    </div>
  )
}

export default ReconciliationTodoDemo
