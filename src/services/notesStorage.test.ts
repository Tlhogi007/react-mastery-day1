import { beforeEach, describe, expect, it, vi } from 'vitest'
import { notesStorage } from './notesStorage'

const NOTES = 'react-mastery-notes'
const ANN = 'react-mastery-annotations'

beforeEach(() => {
  notesStorage.clearAll()
})

describe('notes CRUD', () => {
  it('starts empty', () => {
    expect(notesStorage.getNotes()).toEqual([])
  })

  it('saves notes with generated id and timestamps', () => {
    const id = notesStorage.saveNote({ day: 1, content: 'Render phase is pure', tags: ['render'] })
    expect(id).toMatch(/^note-/)
    const [note] = notesStorage.getNotes()
    expect(note).toMatchObject({ id, day: 1, content: 'Render phase is pure' })
    expect(note.createdAt).toBe(note.updatedAt)
  })

  it('filters by day and exercise', () => {
    notesStorage.saveNote({ day: 1, content: 'a', exerciseId: 'e1' })
    notesStorage.saveNote({ day: 1, content: 'b', exerciseId: 'e2' })
    notesStorage.saveNote({ day: 2, content: 'c', exerciseId: 'e1' })
    expect(notesStorage.getNotesForDay(1)).toHaveLength(2)
    expect(notesStorage.getNotesForExercise(1, 'e1')).toHaveLength(1)
    expect(notesStorage.getNotesForExercise(2, 'nope')).toEqual([])
  })

  it('searches content and tags case-insensitively', () => {
    notesStorage.saveNote({ day: 1, content: 'Fiber Architecture', tags: [] })
    notesStorage.saveNote({ day: 2, content: 'misc', tags: ['Hooks'] })
    notesStorage.saveNote({ day: 3, content: 'other' })
    expect(notesStorage.searchNotes('fiber')).toHaveLength(1)
    expect(notesStorage.searchNotes('HOOKS')).toHaveLength(1)
    expect(notesStorage.searchNotes('zzz')).toEqual([])
  })

  it('updates existing notes and reports missing ones', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const id = notesStorage.saveNote({ day: 1, content: 'old' })
    vi.setSystemTime(new Date('2026-01-02T00:00:00Z'))
    expect(notesStorage.updateNote(id, { content: 'new' })).toBe(true)
    const note = notesStorage.getNotes()[0]
    expect(note.content).toBe('new')
    expect(note.updatedAt).toBe('2026-01-02T00:00:00.000Z')
    expect(note.createdAt).toBe('2026-01-01T00:00:00.000Z')
    expect(notesStorage.updateNote('missing', { content: 'x' })).toBe(false)
    vi.useRealTimers()
  })

  it('deletes notes', () => {
    const id = notesStorage.saveNote({ day: 1, content: 'x' })
    expect(notesStorage.deleteNote(id)).toBe(true)
    expect(notesStorage.getNotes()).toEqual([])
  })

  it('exportNotes returns JSON with notes and timestamp', () => {
    notesStorage.saveNote({ day: 1, content: 'x' })
    const out = JSON.parse(notesStorage.exportNotes())
    expect(out.notes).toHaveLength(1)
    expect(typeof out.exportedAt).toBe('string')
  })

  it('warns on corrupt storage / failed writes', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem(NOTES, '{bad')
    expect(notesStorage.getNotes()).toEqual([])
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    notesStorage.saveNote({ day: 1, content: 'x' })
    expect(warn.mock.calls.length).toBeGreaterThanOrEqual(2)
  })
})

describe('annotations', () => {
  it('saves and filters by note id', () => {
    const a = notesStorage.saveAnnotation({ noteId: 'n1', text: 't', comment: 'c' })
    notesStorage.saveAnnotation({ noteId: 'n2', text: 't', comment: 'c' })
    expect(a).toMatch(/^ann-/)
    expect(notesStorage.getAnnotations('n1')).toHaveLength(1)
    expect(notesStorage.getAnnotations('none')).toEqual([])
  })

  it('handles errors gracefully', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem(ANN, '{bad')
    expect(notesStorage.getAnnotations('n1')).toEqual([])
    expect(notesStorage.saveAnnotation({ noteId: 'n1', text: 't', comment: 'c' })).toBe('')
    expect(warn).toHaveBeenCalledTimes(2)
  })

  it('clearAll removes notes and annotations', () => {
    notesStorage.saveNote({ day: 1, content: 'x' })
    notesStorage.saveAnnotation({ noteId: 'n1', text: 't', comment: 'c' })
    notesStorage.clearAll()
    expect(localStorage.getItem(NOTES)).toBeNull()
    expect(localStorage.getItem(ANN)).toBeNull()
  })
})
