import { cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'

afterEach(() => cleanup())

function press(key: string, opts: KeyboardEventInit = {}, target: EventTarget = window) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts })
  target.dispatchEvent(event)
  return event
}

describe('useKeyboardShortcuts', () => {
  it('maps Space/Enter/j/ArrowRight to next', () => {
    const onNext = vi.fn()
    renderHook(() => useKeyboardShortcuts({ onNext }))
    for (const key of [' ', 'Enter', 'j', 'ArrowRight']) {
      const e = press(key, {}, document.body)
      expect(e.defaultPrevented).toBe(true)
    }
    expect(onNext).toHaveBeenCalledTimes(4)
  })

  it('Shift+Enter does not trigger next via Space/Enter rule', () => {
    const onNext = vi.fn()
    renderHook(() => useKeyboardShortcuts({ onNext }))
    press('Enter', { shiftKey: true }, document.body)
    expect(onNext).not.toHaveBeenCalled()
  })

  it('maps k/ArrowLeft to previous', () => {
    const onPrevious = vi.fn()
    renderHook(() => useKeyboardShortcuts({ onPrevious }))
    press('k', {}, document.body)
    press('ArrowLeft', {}, document.body)
    expect(onPrevious).toHaveBeenCalledTimes(2)
  })

  it('maps s to skip, A–D / 1–4 to select index, Escape to escape', () => {
    const onSkip = vi.fn()
    const onSelect = vi.fn()
    const onEscape = vi.fn()
    renderHook(() => useKeyboardShortcuts({ onSkip, onSelect, onEscape }))
    press('s', {}, document.body)
    press('a', {}, document.body)
    press('D', {}, document.body)
    press('1', {}, document.body)
    press('4', {}, document.body)
    press('5', {}, document.body)
    press('e', {}, document.body)
    press('Escape', {}, document.body)
    expect(onSkip).toHaveBeenCalledTimes(1)
    expect(onSelect.mock.calls).toEqual([[0], [3], [0], [3]])
    expect(onEscape).toHaveBeenCalledTimes(1)
  })

  it('ignores keys without matching handlers', () => {
    const onNext = vi.fn()
    renderHook(() => useKeyboardShortcuts({ onNext }))
    const e = press('k', {}, document.body)
    expect(e.defaultPrevented).toBe(false)
    press('s', {}, document.body)
    press('1', {}, document.body)
    press('Escape', {}, document.body)
    press('x', {}, document.body)
    expect(onNext).not.toHaveBeenCalled()
  })

  it('ignores events from inputs, textareas and contenteditable', () => {
    const onNext = vi.fn()
    renderHook(() => useKeyboardShortcuts({ onNext }))
    const input = document.createElement('input')
    const textarea = document.createElement('textarea')
    const editable = document.createElement('div')
    Object.defineProperty(editable, 'isContentEditable', { value: true })
    for (const el of [input, textarea, editable]) {
      document.body.appendChild(el)
      press('j', {}, el)
      el.remove()
    }
    expect(onNext).not.toHaveBeenCalled()
  })

  it('does nothing when disabled and does not attach a listener', () => {
    const onNext = vi.fn()
    const add = vi.spyOn(window, 'addEventListener')
    renderHook(() => useKeyboardShortcuts({ onNext, enabled: false }))
    press('j', {}, document.body)
    expect(onNext).not.toHaveBeenCalled()
    expect(add.mock.calls.some(([type]) => type === 'keydown')).toBe(false)
  })

  it('removes listener on unmount and when disabled via rerender', () => {
    const onNext = vi.fn()
    const { rerender, unmount } = renderHook(
      ({ enabled }) => useKeyboardShortcuts({ onNext, enabled }),
      { initialProps: { enabled: true } },
    )
    press('j', {}, document.body)
    expect(onNext).toHaveBeenCalledTimes(1)
    rerender({ enabled: false })
    press('j', {}, document.body)
    expect(onNext).toHaveBeenCalledTimes(1)
    rerender({ enabled: true })
    press('j', {}, document.body)
    expect(onNext).toHaveBeenCalledTimes(2)
    unmount()
    press('j', {}, document.body)
    expect(onNext).toHaveBeenCalledTimes(2)
  })
})
