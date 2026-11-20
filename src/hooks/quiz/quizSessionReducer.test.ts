import { describe, expect, it } from 'vitest'
import type { QuizQuestion } from '../../types/challenges'
import { QuestionPromptKind, QuizSessionActionType } from './quizSessionEnums'
import { createInitialQuizSessionState } from './quizSessionState'
import { applyNext, quizSessionReducer } from './quizSessionReducer'

function q(id: string, correct = 0): QuizQuestion {
  return {
    id,
    question: `Q ${id}`,
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: correct,
    explanation: 'because',
    source: 'local',
  }
}

const bank = [q('a'), q('b'), q('c'), q('d')]

describe('quizSessionReducer', () => {
  it('creates boot state from snapshot', () => {
    const state = createInitialQuizSessionState(bank, {
      day: 1,
      currentQuestionIndex: 2,
      selectedAnswer: 1,
      score: 2,
      completed: false,
      localQuestionsCompleted: false,
      aiEnabled: false,
      aiQuestionsLoaded: false,
      allQuestions: bank,
      usedLocalQuestionIds: ['a'],
      incorrectAnswerIds: ['a'],
      totalTimeSpent: 9,
      at: Date.now(),
    })
    expect(state.currentQuestionIndex).toBe(2)
    expect(state.score).toBe(2)
    expect(state.incorrectAnswers.map((x) => x.id)).toEqual(['a'])
  })

  it('scores correct and incorrect answers', () => {
    let state = createInitialQuizSessionState(bank, null)
    state = quizSessionReducer(state, {
      type: QuizSessionActionType.SelectAnswer,
      index: 0,
      timeSpentSec: 2,
    })
    expect(state.score).toBe(1)
    expect(state.selectedAnswer).toBe(0)

    state = quizSessionReducer(state, {
      type: QuizSessionActionType.SetCurrentIndex,
      value: 1,
    })
    state = quizSessionReducer(state, {
      type: QuizSessionActionType.SelectAnswer,
      index: 1,
      timeSpentSec: 1,
    })
    expect(state.score).toBe(1)
    expect(state.incorrectAnswers).toHaveLength(1)
  })

  it('shows mid-quiz prompt at index 2', () => {
    let state = createInitialQuizSessionState(bank, null)
    state = { ...state, currentQuestionIndex: 2 }
    state = applyNext(state, false, Date.now(), (id) => id)
    expect(state.showQuestionPrompt).toBe(true)
    expect(state.midQuizPromptShown).toBe(true)
    expect(state.currentQuestionIndex).toBe(2)
  })

  it('marks local section complete when no more locals', () => {
    let state = createInitialQuizSessionState([q('only')], null)
    state = applyNext(state, false, Date.now(), (id) => id)
    expect(state.localQuestionsCompleted).toBe(true)
    expect(state.completed).toBe(false)
  })

  it('finishes on last question when AI already loaded', () => {
    let state = createInitialQuizSessionState([q('only')], null)
    state = applyNext(state, true, Date.now(), (id) => id)
    expect(state.completed).toBe(true)
  })

  it('advances after cancel prompt when more questions remain', () => {
    let state = createInitialQuizSessionState(bank, null)
    state = {
      ...state,
      currentQuestionIndex: 2,
      showQuestionPrompt: true,
      questionPromptType: QuestionPromptKind.Local,
    }
    state = quizSessionReducer(state, {
      type: QuizSessionActionType.CancelPrompt,
      now: Date.now(),
    })
    expect(state.showQuestionPrompt).toBe(false)
    expect(state.currentQuestionIndex).toBe(3)
    expect(state.completed).toBe(false)
  })

  it('completes after cancel prompt when no questions remain', () => {
    const short = [q('a'), q('b'), q('c')]
    let state = createInitialQuizSessionState(short, null)
    state = {
      ...state,
      currentQuestionIndex: 2,
      showQuestionPrompt: true,
      questionPromptType: QuestionPromptKind.Ai,
    }
    state = quizSessionReducer(state, {
      type: QuizSessionActionType.CancelPrompt,
      now: Date.now(),
    })
    expect(state.showQuestionPrompt).toBe(false)
    expect(state.completed).toBe(true)
    expect(state.currentQuestionIndex).toBe(2)
  })

  it('reset clears progress and reseeds bank', () => {
    let state = createInitialQuizSessionState(bank, null)
    state = quizSessionReducer(state, {
      type: QuizSessionActionType.SelectAnswer,
      index: 0,
      timeSpentSec: 1,
    })
    state = quizSessionReducer(state, {
      type: QuizSessionActionType.Reset,
      bank,
      picked: bank,
      now: 100,
    })
    expect(state.score).toBe(0)
    expect(state.completed).toBe(false)
    expect(state.quizStartTime).toBe(100)
    expect(state.allQuestions).toHaveLength(4)
  })

  it('reset with incorrect keeps only misses', () => {
    let state = createInitialQuizSessionState(bank, null)
    state = quizSessionReducer(state, {
      type: QuizSessionActionType.SelectAnswer,
      index: 1,
      timeSpentSec: 1,
    })
    expect(state.incorrectAnswers).toHaveLength(1)
    state = quizSessionReducer(state, {
      type: QuizSessionActionType.ResetIncorrect,
      now: 50,
    })
    expect(state.allQuestions).toHaveLength(1)
    expect(state.score).toBe(0)
  })

  it('load more ok splices questions', () => {
    let state = createInitialQuizSessionState([q('a'), q('b')], null)
    const extra = [q('x'), q('y')]
    state = quizSessionReducer(state, {
      type: QuizSessionActionType.LoadMoreOk,
      updatedQuestions: [q('a'), ...extra, q('b')],
      usedIds: ['x', 'y'],
      warning: null,
      now: Date.now(),
    })
    expect(state.allQuestions.map((x) => x.id)).toEqual(['a', 'x', 'y', 'b'])
    expect(state.currentQuestionIndex).toBe(1)
  })

  it('covers load-more failure modes and prompts', () => {
    let state = createInitialQuizSessionState(bank, null)
    state = quizSessionReducer(state, { type: QuizSessionActionType.LoadMoreEmptyBank })
    expect(state.errorMessage).toMatch(/No local questions available/i)

    state = quizSessionReducer(state, { type: QuizSessionActionType.LoadMoreNoUnseen })
    expect(state.showQuestionPrompt).toBe(false)
    expect(state.questionPromptType).toBeNull()
    expect(state.errorMessage).toMatch(/No new local questions left/i)
    expect(state.localBankGateDismissed).toBe(false)

    state = quizSessionReducer(state, {
      type: QuizSessionActionType.LoadMoreFail,
      message: 'boom',
    })
    expect(state.errorMessage).toBe('boom')

    state = quizSessionReducer(state, { type: QuizSessionActionType.LoadMoreNoDay })
    expect(state.completed).toBe(true)

    state = createInitialQuizSessionState(bank, null)
    state = quizSessionReducer(state, {
      type: QuizSessionActionType.SelectPromptType,
      promptType: QuestionPromptKind.Local,
    })
    expect(state.questionPromptType).toBe(QuestionPromptKind.Local)

    state = quizSessionReducer(state, { type: QuizSessionActionType.Finish })
    expect(state.completed).toBe(true)
  })

  it('skip mark then next advances', () => {
    let state = createInitialQuizSessionState(bank, null)
    state = quizSessionReducer(state, {
      type: QuizSessionActionType.SkipMark,
      timeSpentSec: 3,
    })
    expect(state.skippedQuestionIds).toContain('a')
    expect(state.incorrectAnswersWithSelection[0]?.selectedIndex).toBe(-1)
    state = quizSessionReducer(state, {
      type: QuizSessionActionType.Next,
      aiQuestionsLoaded: true,
      now: Date.now(),
      canonicalId: (id) => id,
    })
    expect(state.currentQuestionIndex).toBe(1)
  })

  it('seed unseen clears attempt fields', () => {
    let state = createInitialQuizSessionState(bank, null)
    state = quizSessionReducer(state, {
      type: QuizSessionActionType.SelectAnswer,
      index: 1,
      timeSpentSec: 1,
    })
    state = quizSessionReducer(state, {
      type: QuizSessionActionType.SeedUnseen,
      questions: [q('z')],
      exhaustedMessage: 'done',
      now: 42,
    })
    expect(state.allQuestions).toHaveLength(1)
    expect(state.errorMessage).toBe('done')
    expect(state.totalTimeSpent).toBe(0)
    expect(state.incorrectAnswers).toHaveLength(0)
  })
})
