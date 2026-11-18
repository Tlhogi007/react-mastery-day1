/**
 * Quiz Question Component
 * Single Responsibility: Display question and options
 */

import { type JSX } from 'react'
import type { QuizQuestion as QuizQuestionType } from '../../types/challenges'
import QuizOption from './QuizOption'
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
}

function QuizQuestion({
    question,
    selectedAnswer,
    completed,
    onAnswerSelect,
    onNext,
    onSkip,
    isLastQuestion,
    isAISection
}: QuizQuestionProps): JSX.Element {
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

            {selectedAnswer !== null && (
                <div className="quiz-explanation">
                    <strong>Explanation:</strong>
                    <p>{question.explanation}</p>
                    <div className="quiz-explanation__actions">
                        <button
                            type="button"
                            className="lesson-full-btn quiz-next-btn"
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
                                ? 'Next Question →'
                                : isAISection
                                    ? 'Finish Quiz'
                                    : 'Complete Local Questions'}
                        </button>
                        {onSkip && selectedAnswer === null && (
                            <button
                                type="button"
                                className="lesson-full-btn quiz-skip-btn"
                                onClick={onSkip}
                                aria-label="Skip question"
                            >
                                ⏭️ Skip
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

export default QuizQuestion
