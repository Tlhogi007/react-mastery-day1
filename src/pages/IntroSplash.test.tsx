import { cleanup, render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import IntroSplash from './IntroSplash'

vi.mock('@clerk/react', () => ({
  useUser: () => ({ user: null, isLoaded: true }),
}))

afterEach(() => cleanup())

describe('IntroSplash', () => {
  it('stays until Continue is clicked (no auto-advance)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const onContinue = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<IntroSplash onContinue={onContinue} />)

    expect(screen.getByRole('dialog', { name: /Welcome/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Continue$/i })).toBeEnabled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6_000)
    })
    expect(onContinue).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /^Continue$/i }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(onContinue).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})
