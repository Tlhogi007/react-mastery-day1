/**
 * Custom hook for keyboard shortcuts
 */

import { useEffect, useCallback } from 'react'

interface KeyboardShortcuts {
  onNext?: () => void
  onPrevious?: () => void
  onSkip?: () => void
  onSelect?: (index: number) => void
  onEscape?: () => void
  enabled?: boolean
}

export function useKeyboardShortcuts({
  onNext,
  onPrevious,
  onSkip,
  onSelect,
  onEscape,
  enabled = true
}: KeyboardShortcuts): void {
  const handleKeyDown = useCallback((event: KeyboardEvent): void => {
    if (!enabled) return

    // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return
    }

    // Space or Enter: Next
    if ((event.key === ' ' || event.key === 'Enter') && onNext && !event.shiftKey) {
      event.preventDefault()
      onNext()
      return
    }

    // j or ArrowRight: Next
    if ((event.key === 'j' || event.key === 'ArrowRight') && onNext) {
      event.preventDefault()
      onNext()
      return
    }

    // k or ArrowLeft: Previous
    if ((event.key === 'k' || event.key === 'ArrowLeft') && onPrevious) {
      event.preventDefault()
      onPrevious()
      return
    }

    // s: Skip
    if (event.key === 's' && onSkip) {
      event.preventDefault()
      onSkip()
      return
    }

    // A–D (matches on-screen letters) or 1–4 (num-row alias)
    if (onSelect) {
      const letter = event.key.toLowerCase()
      const letterIdx = ['a', 'b', 'c', 'd'].indexOf(letter)
      const digitIdx = ['1', '2', '3', '4'].indexOf(event.key)
      const index = letterIdx >= 0 ? letterIdx : digitIdx
      if (index >= 0) {
        event.preventDefault()
        onSelect(index)
        return
      }
    }

    // Escape: Close/Cancel
    if (event.key === 'Escape' && onEscape) {
      event.preventDefault()
      onEscape()
      return
    }
  }, [enabled, onNext, onPrevious, onSkip, onSelect, onEscape])

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [enabled, handleKeyDown])
}
