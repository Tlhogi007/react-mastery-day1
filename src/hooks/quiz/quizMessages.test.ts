import { describe, expect, it } from 'vitest'
import {
  LOCAL_BANK_EMPTY,
  LOCAL_BANK_EXHAUSTED,
  LOCAL_BANK_NO_UNSEEN,
  isLocalBankExhaustedMessage,
} from './quizMessages'

describe('isLocalBankExhaustedMessage', () => {
  it('recognizes known exhausted copy', () => {
    expect(isLocalBankExhaustedMessage(LOCAL_BANK_EXHAUSTED)).toBe(true)
    expect(isLocalBankExhaustedMessage(LOCAL_BANK_EMPTY)).toBe(true)
    expect(isLocalBankExhaustedMessage(LOCAL_BANK_NO_UNSEEN)).toBe(true)
    expect(LOCAL_BANK_EXHAUSTED).toMatch(/Practice again replays/i)
    expect(LOCAL_BANK_NO_UNSEEN).toMatch(/Practice again replays/i)
  })

  it('rejects unrelated or empty messages', () => {
    expect(isLocalBankExhaustedMessage(null)).toBe(false)
    expect(isLocalBankExhaustedMessage('Network error')).toBe(false)
  })
})
