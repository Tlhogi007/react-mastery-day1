/** Shared quiz status copy — keep UI + reducer/tests in sync. */

export const LOCAL_BANK_EXHAUSTED =
  'No new local questions left. Practice again replays this day’s bank.'

export const LOCAL_BANK_EMPTY =
  'No local questions available for this topic. Try AI questions, or finish the quiz.'

export const LOCAL_BANK_NO_UNSEEN =
  'No new local questions left. Practice again replays this day’s bank.'

export function isLocalBankExhaustedMessage(message: string | null | undefined): boolean {
  if (!message) return false
  return (
    message === LOCAL_BANK_EXHAUSTED ||
    message === LOCAL_BANK_EMPTY ||
    message === LOCAL_BANK_NO_UNSEEN ||
    /already completed|no new local|no local questions available/i.test(message)
  )
}
