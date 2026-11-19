import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const useUser = vi.fn()

vi.mock('@clerk/react', () => ({
  useUser: () => useUser(),
}))

import {
  CommunityAttribution,
  CommunitySignedNote,
  useIsSignedAttribution,
} from './CommunityAttribution'
import { renderHook } from '@testing-library/react'

afterEach(() => {
  cleanup()
  useUser.mockReset()
})

describe('CommunityAttribution', () => {
  it('renders author, handle, and GitHub icon without a GitHub text chip', () => {
    useUser.mockReturnValue({ isSignedIn: false, user: null })
    const { container } = render(
      <CommunityAttribution author="Ada Lovelace" github="ada" compact />,
    )

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /@ada/i })).toHaveAttribute(
      'href',
      'https://github.com/ada',
    )
    expect(container.querySelector('.community-attribution__gh-icon')).toBeTruthy()
    expect(screen.queryByText(/^GitHub$/i)).toBeNull()
    expect(screen.queryByText(/You · signed/i)).toBeNull()
  })
})

describe('CommunitySignedNote / useIsSignedAttribution', () => {
  it('is false for guests and mismatched GitHub', () => {
    useUser.mockReturnValue({ isSignedIn: false, user: null })
    expect(renderHook(() => useIsSignedAttribution('ada')).result.current).toBe(false)

    useUser.mockReturnValue({
      isSignedIn: true,
      user: {
        externalAccounts: [{ provider: 'github', username: 'other' }],
      },
    })
    expect(renderHook(() => useIsSignedAttribution('ada')).result.current).toBe(false)
  })

  it('shows article note only when viewer GitHub matches', () => {
    useUser.mockReturnValue({
      isSignedIn: true,
      user: {
        externalAccounts: [{ provider: 'github', username: 'tlhogi007' }],
      },
    })

    const { rerender } = render(<CommunitySignedNote github="tlhogi007" />)
    expect(screen.getByRole('status')).toHaveTextContent(/your signed contribution/i)

    rerender(<CommunitySignedNote github="someone-else" />)
    expect(screen.queryByRole('status')).toBeNull()
  })
})
