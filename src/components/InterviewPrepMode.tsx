/**
 * Interview Prep Mode Component
 * Simulated technical interviews with React-specific questions
 */

import { useState, useEffect, type JSX } from 'react'
import Card from './Card'
import type { QuizQuestion } from '../types/challenges'
import { shuffleArray } from '../utils/array'

interface InterviewSession {
    id: string
    startTime: string
    endTime?: string
    questions: Array<{
        question: QuizQuestion
        answer?: string
        timeSpent: number
        rating?: number
    }>
    totalTime: number
}

interface InterviewPrepModeProps {
    questions: QuizQuestion[]
    duration?: number // Minutes
}

function InterviewPrepMode({ questions, duration = 30 }: InterviewPrepModeProps): JSX.Element {
    const [isActive, setIsActive] = useState<boolean>(false)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)
    const [session, setSession] = useState<InterviewSession | null>(null)
    const [timeRemaining, setTimeRemaining] = useState<number>(duration * 60) // seconds
    const [answers, setAnswers] = useState<Record<number, number>>({})
    const [showResults, setShowResults] = useState<boolean>(false)

    useEffect(() => {
        if (isActive && timeRemaining > 0) {
            const timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        handleFinish()
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
            return () => clearInterval(timer)
        }
    }, [isActive, timeRemaining])

    const handleStart = (): void => {
        const shuffled = shuffleArray([...questions]).slice(0, 10)
        const newSession: InterviewSession = {
            id: `interview-${Date.now()}`,
            startTime: new Date().toISOString(),
            questions: shuffled.map(q => ({
                question: q,
                timeSpent: 0
            })),
            totalTime: 0
        }
        setSession(newSession)
        setIsActive(true)
        setCurrentQuestionIndex(0)
        setTimeRemaining(duration * 60)
        setAnswers({})
        setShowResults(false)
    }

    const handleFinish = (): void => {
        if (!session) return
        setIsActive(false)
        const updatedSession: InterviewSession = {
            ...session,
            endTime: new Date().toISOString(),
            totalTime: duration * 60 - timeRemaining
        }
        setSession(updatedSession)
        setShowResults(true)
    }

    const handleAnswer = (answerIndex: number): void => {
        setAnswers(prev => ({ ...prev, [currentQuestionIndex]: answerIndex }))
    }

    const handleNext = (): void => {
        if (currentQuestionIndex < (session?.questions.length || 0) - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
        } else {
            handleFinish()
        }
    }

    const handlePrevious = (): void => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1)
        }
    }

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const currentQuestion = session?.questions[currentQuestionIndex]?.question
    const selectedAnswer = answers[currentQuestionIndex]

    const score = session ? {
        total: session.questions.length,
        correct: session.questions.filter((q, i) =>
            answers[i] === q.question.correctAnswer
        ).length,
        percentage: Math.round(
            (session.questions.filter((q, i) =>
                answers[i] === q.question.correctAnswer
            ).length / session.questions.length) * 100
        )
    } : null

    const containerStyle: React.CSSProperties = {
        color: 'var(--text-primary)',
        width: '100%',
        minWidth: 0,
        padding: 0,
    }

    return (
        <div className="tool-panel" style={containerStyle}>
            <Card
                title="Interview Prep"
                icon="🎤"
                style={{ marginBottom: '24px' }}
            >
                {!isActive && !showResults && (
                    <div style={{ textAlign: 'center', padding: 'clamp(1rem, 4vw, 2.5rem)' }}>
                        <h3 style={{ marginBottom: '16px' }}>Mock Technical Interview</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            Practice React interview questions under time pressure.
                            <br />
                            {duration} min · 10 questions
                        </p>
                        <button
                            onClick={handleStart}
                            style={{
                                padding: '12px 24px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'var(--button-primary)',
                                color: 'var(--button-text)',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}
                        >
                            Start Interview
                        </button>
                    </div>
                )}

                {isActive && session && currentQuestion && (
                    <div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px',
                            padding: '12px',
                            background: 'var(--bg-section)',
                            borderRadius: '8px'
                        }}>
                            <div>
                                <strong>Question {currentQuestionIndex + 1} / {session.questions.length}</strong>
                            </div>
                            <div style={{
                                fontSize: '18px',
                                fontWeight: 'bold',
                                color: timeRemaining < 60 ? 'var(--text-on-error)' : 'var(--text-primary)'
                            }}>
                                ⏱️ {formatTime(timeRemaining)}
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ marginBottom: '16px' }}>{currentQuestion.question}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {currentQuestion.options.map((option, index) => {
                                    const isSelected = selectedAnswer === index
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleAnswer(index)}
                                            style={{
                                                padding: '12px 16px',
                                                borderRadius: '6px',
                                                border: `2px solid ${isSelected ? 'var(--button-primary)' : 'var(--border-primary)'}`,
                                                background: isSelected ? 'var(--bg-info)' : 'var(--bg-section)',
                                                color: isSelected ? 'var(--text-on-info)' : 'var(--text-primary)',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                fontSize: '14px',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {String.fromCharCode(65 + index)}. {option}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="tool-nav-row">
                            <button
                                type="button"
                                onClick={handlePrevious}
                                disabled={currentQuestionIndex === 0}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: currentQuestionIndex === 0 ? 'var(--bg-section)' : 'var(--button-primary)',
                                    color: currentQuestionIndex === 0 ? 'var(--text-secondary)' : 'var(--button-text)',
                                    cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                ← Previous
                            </button>
                            <button
                                type="button"
                                onClick={handleNext}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: 'var(--button-primary)',
                                    color: 'var(--button-text)',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}
                            >
                                {currentQuestionIndex === session.questions.length - 1 ? 'Finish' : 'Next →'}
                            </button>
                        </div>
                    </div>
                )}

                {showResults && session && score && (
                    <div>
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            background: 'var(--bg-section)',
                            borderRadius: '8px',
                            marginBottom: '24px'
                        }}>
                            <h2 style={{ marginBottom: '16px' }}>Interview Complete!</h2>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                                {score.percentage >= 80 ? '🎉' : score.percentage >= 60 ? '👍' : '📚'}
                            </div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
                                {score.percentage}%
                            </div>
                            <div style={{ color: 'var(--text-secondary)' }}>
                                {score.correct} out of {score.total} questions correct
                            </div>
                        </div>

                        <div>
                            <h3 style={{ marginBottom: '16px' }}>Review Answers</h3>
                            {session.questions.map((q, index) => {
                                const selected = answers[index]
                                const isCorrect = selected === q.question.correctAnswer
                                return (
                                    <div
                                        key={index}
                                        style={{
                                            padding: '16px',
                                            background: 'var(--bg-section)',
                                            borderRadius: '8px',
                                            marginBottom: '12px',
                                            border: `2px solid ${isCorrect ? 'var(--bg-success)' : 'var(--bg-error)'}`
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                            <strong>Question {index + 1}</strong>
                                            <span style={{
                                                fontSize: '20px'
                                            }}>
                                                {isCorrect ? '✅' : '❌'}
                                            </span>
                                        </div>
                                        <p style={{ marginBottom: '12px' }}>{q.question.question}</p>
                                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                            <div>Your answer: {selected !== undefined ? String.fromCharCode(65 + selected) : 'Not answered'}</div>
                                            <div>Correct answer: {String.fromCharCode(65 + q.question.correctAnswer)}</div>
                                        </div>
                                        {q.question.explanation && (
                                            <div style={{
                                                marginTop: '12px',
                                                padding: '12px',
                                                background: 'var(--bg-info)',
                                                color: 'var(--text-on-info)',
                                                borderRadius: '6px',
                                                fontSize: '14px'
                                            }}>
                                                <strong style={{ color: 'var(--text-on-info)' }}>Explanation:</strong> <span style={{ color: 'var(--text-on-info)' }}>{q.question.explanation}</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        <div style={{ marginTop: '24px', textAlign: 'center' }}>
                            <button
                                onClick={handleStart}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'var(--button-primary)',
                                    color: 'var(--button-text)',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold'
                                }}
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    )
}

export default InterviewPrepMode
