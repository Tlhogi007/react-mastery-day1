/**
 * Personal Notes and Annotations Component
 */

import { useState, useEffect, type JSX } from 'react'
import { notesStorage, type Note } from '../services/notesStorage'
import Card from './Card'

interface PersonalNotesProps {
    day: number
    exerciseId?: string
}

function PersonalNotes({ day, exerciseId }: PersonalNotesProps): JSX.Element {
    const [notes, setNotes] = useState<Note[]>([])
    const [newNoteContent, setNewNoteContent] = useState<string>('')
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
    const [editContent, setEditContent] = useState<string>('')
    const [searchQuery, setSearchQuery] = useState<string>('')

    useEffect(() => {
        loadNotes()
    }, [day, exerciseId])

    const loadNotes = (): void => {
        const loadedNotes = exerciseId
            ? notesStorage.getNotesForExercise(day, exerciseId)
            : notesStorage.getNotesForDay(day)
        setNotes(loadedNotes)
    }

    const handleSaveNote = (): void => {
        if (!newNoteContent.trim()) return

        notesStorage.saveNote({
            day,
            exerciseId,
            content: newNoteContent,
            tags: []
        })
        setNewNoteContent('')
        loadNotes()
    }

    const handleUpdateNote = (id: string): void => {
        if (!editContent.trim()) return

        notesStorage.updateNote(id, { content: editContent })
        setEditingNoteId(null)
        setEditContent('')
        loadNotes()
    }

    const handleDeleteNote = (id: string): void => {
        if (confirm('Delete this note?')) {
            notesStorage.deleteNote(id)
            loadNotes()
        }
    }

    const handleExport = (): void => {
        const data = notesStorage.exportNotes()
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `react-mastery-notes-day${day}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    const filteredNotes = searchQuery
        ? notes.filter(note =>
            note.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : notes

    const containerStyle: React.CSSProperties = {
        color: 'var(--text-primary)'
    }

    const textareaStyle: React.CSSProperties = {
        width: '100%',
        minHeight: '100px',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid var(--border-primary)',
        background: 'var(--bg-section)',
        color: 'var(--text-primary)',
        fontSize: '14px',
        fontFamily: 'inherit',
        resize: 'vertical',
        marginBottom: '12px'
    }

    const buttonStyle: React.CSSProperties = {
        padding: '8px 16px',
        borderRadius: '6px',
        border: 'none',
        background: 'var(--button-primary)',
        color: 'var(--button-text)',
        cursor: 'pointer',
        fontSize: '14px',
        marginRight: '8px'
    }

    return (
        <div style={containerStyle}>
            <Card
                title="Personal Notes"
                icon="📝"
                style={{ marginBottom: '24px' }}
            >
                <div style={{ marginBottom: '20px' }}>
                    <input
                        type="text"
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-primary)',
                            background: 'var(--bg-section)',
                            color: 'var(--text-primary)',
                            marginBottom: '12px'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ marginBottom: '8px' }}>Add New Note</h4>
                    <textarea
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        placeholder="Write your notes here..."
                        style={textareaStyle}
                    />
                    <div>
                        <button onClick={handleSaveNote} style={buttonStyle}>
                            Save Note
                        </button>
                        <button
                            onClick={handleExport}
                            style={{
                                ...buttonStyle,
                                background: 'var(--bg-section)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-primary)'
                            }}
                        >
                            Export Notes
                        </button>
                    </div>
                </div>

                <div>
                    <h4 style={{ marginBottom: '12px' }}>
                        Your Notes ({filteredNotes.length})
                    </h4>
                    {filteredNotes.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            No notes yet. Add your first note above!
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {filteredNotes.map((note) => (
                                <div
                                    key={note.id}
                                    style={{
                                        padding: '16px',
                                        background: 'var(--bg-section)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-primary)'
                                    }}
                                >
                                    {editingNoteId === note.id ? (
                                        <div>
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                style={textareaStyle}
                                            />
                                            <div>
                                                <button
                                                    onClick={() => handleUpdateNote(note.id)}
                                                    style={buttonStyle}
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingNoteId(null)
                                                        setEditContent('')
                                                    }}
                                                    style={{
                                                        ...buttonStyle,
                                                        background: 'var(--bg-section)',
                                                        color: 'var(--text-primary)',
                                                        border: '1px solid var(--border-primary)'
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div
                                                style={{
                                                    whiteSpace: 'pre-wrap',
                                                    marginBottom: '12px',
                                                    lineHeight: '1.6'
                                                }}
                                            >
                                                {note.content}
                                            </div>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    fontSize: '12px',
                                                    color: 'var(--text-secondary)'
                                                }}
                                            >
                                                <span>
                                                    {new Date(note.updatedAt).toLocaleDateString()}
                                                </span>
                                                <div>
                                                    <button
                                                        onClick={() => {
                                                            setEditingNoteId(note.id)
                                                            setEditContent(note.content)
                                                        }}
                                                        style={{
                                                            ...buttonStyle,
                                                            padding: '4px 8px',
                                                            fontSize: '12px',
                                                            background: 'var(--bg-section)',
                                                            color: 'var(--text-primary)',
                                                            border: '1px solid var(--border-primary)',
                                                            marginRight: '4px'
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteNote(note.id)}
                                                        style={{
                                                            ...buttonStyle,
                                                            padding: '4px 8px',
                                                            fontSize: '12px',
                                                            background: 'var(--bg-error)',
                                                            color: 'var(--text-on-error)'
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}

export default PersonalNotes
