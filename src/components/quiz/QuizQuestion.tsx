/**
 * Quiz Question Component
 * Single Responsibility: Display question and options
 */

import { type JSX } from 'react'
import type { QuizQuestion as QuizQuestionType } from '../../types/challenges'
import QuizOption from './QuizOption'

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
            <div style={{
                padding: '20px',
                background: 'var(--bg-section)',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '18px',
                fontWeight: '500'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ flex: 1 }}>{question.question}</span>
                    {question.difficulty && (
                        <span style={{
                            padding: '4px 8px',
                            background: question.difficulty === 'easy' ? 'var(--bg-success)' : question.difficulty === 'medium' ? 'var(--bg-warning)' : 'var(--bg-error)',
                            color: question.difficulty === 'easy' ? 'var(--text-on-success)' : question.difficulty === 'medium' ? 'var(--text-on-warning)' : 'var(--text-on-error)',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap'
                        }}>
                            {question.difficulty}
                        </span>
                    )}
                </div>
            </div>

            <div role="radiogroup" aria-labelledby="quiz-question">
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
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    background: 'var(--bg-info)',
                    color: 'var(--text-on-info)',
                    borderRadius: '8px'
                }}>
                    <strong style={{ color: 'var(--text-on-info)' }}>Explanation:</strong>
                    <p style={{ marginTop: '10px', color: 'var(--text-on-info)' }}>{question.explanation}</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                        <button
                            onClick={onNext}
                            style={{
                                padding: '10px 20px',
                                background: 'var(--button-primary)',
                                color: 'var(--button-text)',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
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
                                onClick={onSkip}
                                style={{
                                    padding: '10px 20px',
                                    background: 'transparent',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '16px'
                                }}
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
