/**
 * Mid-quiz “want more?” choice.
 * Public APIs accept the string values; prefer the enum at call sites when practical.
 */
export enum QuestionPromptKind {
  Local = 'local',
  Ai = 'ai',
}

/** Compatible with UI string literals and QuestionPromptKind members. */
export type QuestionPromptType = `${QuestionPromptKind}` | null

export enum LoadMoreLocalsReason {
  EmptyBank = 'empty_bank',
  NoUnseen = 'no_unseen',
  Error = 'error',
}

export enum QuizSessionActionType {
  Replace = 'REPLACE',
  SeedUnseen = 'SEED_UNSEEN',
  SelectAnswer = 'SELECT_ANSWER',
  Next = 'NEXT',
  SkipMark = 'SKIP_MARK',
  Finish = 'FINISH',
  SetAllQuestions = 'SET_ALL_QUESTIONS',
  SetCurrentIndex = 'SET_CURRENT_INDEX',
  SetSelectedAnswer = 'SET_SELECTED_ANSWER',
  SetCompleted = 'SET_COMPLETED',
  SetError = 'SET_ERROR',
  SetShowPrompt = 'SET_SHOW_PROMPT',
  SetPromptType = 'SET_PROMPT_TYPE',
  SelectPromptType = 'SELECT_PROMPT_TYPE',
  CancelPrompt = 'CANCEL_PROMPT',
  LoadMoreOk = 'LOAD_MORE_OK',
  LoadMoreEmptyBank = 'LOAD_MORE_EMPTY_BANK',
  LoadMoreNoUnseen = 'LOAD_MORE_NO_UNSEEN',
  LoadMoreFail = 'LOAD_MORE_FAIL',
  LoadMoreNoDay = 'LOAD_MORE_NO_DAY',
  Reset = 'RESET',
  ResetIncorrect = 'RESET_INCORRECT',
}
