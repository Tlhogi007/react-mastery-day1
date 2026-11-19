/**
 * Quiz Question Component
 * Single Responsibility: Display question and options
 */

import { useState, type JSX } from 'react'
import type { QuizQuestion as QuizQuestionType } from '../../types/challenges'
import QuizOption from './QuizOption'
import { flashcardStorage } from '../../services/flashcardStorage'
import '../../exercises/exerciseLayout.css'

interface QuizQuestionProps {
    question: QuizQuestionType
    selectedAnswer: number | null
    completed: boolean
    onAnswerSelect: (index: number) => void
    onNext: () => void
    onSkip?: () => void
    isLastQuestion: boolean
    isAISection: boolean
    day?: number
    topic?: string
}

function QuizQuestion({
    question,
    selectedAnswer,
    completed,
    onAnswerSelect,
    onNext,
    onSkip,
    isLastQuestion,
    isAISection,
    day = 1,
    topic = 'React',
}: QuizQuestionProps): JSX.Element {
    const [savedCard, setSavedCard] = useState(false)
    const isWrong =
        selectedAnswer !== null && selectedAnswer !== question.correctAnswer
    const correctLabel =
        question.options[question.correctAnswer] ?? `Option ${question.correctAnswer + 1}`

    return (
        <>
            <div className="quiz-question-card">
                <div className="quiz-question-card__row">
                    <span className="quiz-question-card__text">{question.question}</span>
                    {question.difficulty && (
                        <span className={`quiz-difficulty quiz-difficulty--${question.difficulty}`}>
                            {question.difficulty}
                        </span>
                    )}
                </div>
            </div>

            <div className="quiz-options" role="radiogroup" aria-labelledby="quiz-question">
                <h4 id="quiz-question" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
                    {question.question}
                </h4>
                {question.options.map((option, index) => (
                    <QuizOption
                        key={index}
                        option={option}
                        index={index}
                        question={question}
                        selectedAnswer={selectedAnswer}
                        completed={completed}
                        onSelect={onAnswerSelect}
                    />
                ))}
            </div>

            {selectedAnswer === null && onSkip && (
                <div className="quiz-actions">
                    <button
                        type="button"
                        className="quiz-btn quiz-btn--ghost quiz-skip-btn"
                        onClick={onSkip}
                        aria-label="Skip question"
                    >
                        Skip
                    </button>
                </div>
            )}

            {selectedAnswer !== null && (
                <div className="quiz-explanation">
                    {isWrong ? (
                        <>
                            <strong>Not quite — here&apos;s why</strong>
                            <p style={{ marginBottom: 8 }}>
                                Correct answer: <strong>{correctLabel}</strong>
                            </p>
                            <p>{question.explanation}</p>
                        </>
                    ) : (
                        <>
                            <strong>Correct — why it works</strong>
                            <p>{question.explanation}</p>
                        </>
                    )}
                    <div className="quiz-actions">
                        <button
                            type="button"
                            className="quiz-btn quiz-btn--primary"
                            onClick={onNext}
                            aria-label={
                                !isLastQuestion
                                    ? 'Next question'
                                    : isAISection
                                        ? 'Finish quiz'
                                        : 'Complete local questions'
                            }
                        >
                            {!isLastQuestion
                                ? 'Next question'
                                : isAISection
                                    ? 'Finish quiz'
                                    : 'Complete local questions'}
                        </button>
                        {isWrong && (
                            <button
                                type="button"
                                className="quiz-btn quiz-btn--ghost"
                                disabled={savedCard}
                                onClick={() => {
                                    flashcardStorage.createFromQuizQuestion(
                                        question.id,
                                        question.question,
                                        `${correctLabel}\n\n${question.explanation}`,
                                        day,
                                        topic,
                                        question.difficulty === 'easy' ||
                                            question.difficulty === 'hard'
                                            ? question.difficulty
                                            : 'medium',
                                    )
                                    setSavedCard(true)
                                }}
                            >
                                {savedCard ? 'Saved to flashcards' : 'Save as flashcard'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

export default QuizQuestion
