/**
 * Service for managing personal notes and annotations
 */

export interface Note {
    id: string
    day: number
    exerciseId?: string // Optional: specific exercise
    content: string
    highlights?: string[] // Highlighted text snippets
    createdAt: string // ISO date string
    updatedAt: string // ISO date string
    tags?: string[]
}

export interface Annotation {
    id: string
    noteId: string
    text: string // The text being annotated
    comment: string
    position?: { start: number; end: number } // Character positions
}

const STORAGE_KEY = 'react-mastery-notes'
const ANNOTATIONS_KEY = 'react-mastery-annotations'

class NotesStorage {
    /**
     * Get all notes
     */
    getNotes(): Note[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                return JSON.parse(stored) as Note[]
            }
        } catch (error) {
            console.warn('Failed to load notes from localStorage:', error)
        }
        return []
    }

    /**
     * Get notes for a specific day
     */
    getNotesForDay(day: number): Note[] {
        return this.getNotes().filter(note => note.day === day)
    }

    /**
     * Get notes for a specific exercise
     */
    getNotesForExercise(day: number, exerciseId: string): Note[] {
        return this.getNotes().filter(
            note => note.day === day && note.exerciseId === exerciseId
        )
    }

    /**
     * Search notes
     */
    searchNotes(query: string): Note[] {
        const lowerQuery = query.toLowerCase()
        return this.getNotes().filter(note =>
            note.content.toLowerCase().includes(lowerQuery) ||
            note.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
        )
    }

    /**
     * Save a note
     */
    saveNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): string {
        const notes = this.getNotes()
        const newNote: Note = {
            ...note,
            id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
        notes.push(newNote)
        this.saveNotes(notes)
        return newNote.id
    }

    /**
     * Update a note
     */
    updateNote(id: string, updates: Partial<Note>): boolean {
        const notes = this.getNotes()
        const index = notes.findIndex(note => note.id === id)
        if (index === -1) return false

        notes[index] = {
            ...notes[index],
            ...updates,
            updatedAt: new Date().toISOString()
        }
        this.saveNotes(notes)
        return true
    }

    /**
     * Delete a note
     */
    deleteNote(id: string): boolean {
        const notes = this.getNotes().filter(note => note.id !== id)
        this.saveNotes(notes)
        return true
    }

    /**
     * Save notes to localStorage
     */
    private saveNotes(notes: Note[]): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
        } catch (error) {
            console.warn('Failed to save notes to localStorage:', error)
        }
    }

    /**
     * Get annotations for a note
     */
    getAnnotations(noteId: string): Annotation[] {
        try {
            const stored = localStorage.getItem(ANNOTATIONS_KEY)
            if (stored) {
                const all = JSON.parse(stored) as Annotation[]
                return all.filter(ann => ann.noteId === noteId)
            }
        } catch (error) {
            console.warn('Failed to load annotations:', error)
        }
        return []
    }

    /**
     * Save an annotation
     */
    saveAnnotation(annotation: Omit<Annotation, 'id'>): string {
        try {
            const stored = localStorage.getItem(ANNOTATIONS_KEY)
            const all: Annotation[] = stored ? JSON.parse(stored) : []
            
            const newAnnotation: Annotation = {
                ...annotation,
                id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            }
            all.push(newAnnotation)
            localStorage.setItem(ANNOTATIONS_KEY, JSON.stringify(all))
            return newAnnotation.id
        } catch (error) {
            console.warn('Failed to save annotation:', error)
            return ''
        }
    }

    /**
     * Export notes as JSON
     */
    exportNotes(): string {
        return JSON.stringify({
            notes: this.getNotes(),
            exportedAt: new Date().toISOString()
        }, null, 2)
    }

    /**
     * Clear all notes
     */
    clearAll(): void {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(ANNOTATIONS_KEY)
    }
}

export const notesStorage = new NotesStorage()
