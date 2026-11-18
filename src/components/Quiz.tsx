/**
 * Quiz Container Component
 * Orchestrates quiz functionality using composition
 * Follows SOLID principles:
 * - Single Responsibility: Orchestration only
 * - Open/Closed: Extensible via props and hooks
 * - Dependency Inversion: Depends on abstractions (hooks, components)
 */

import { type JSX, useEffect, useState } from 'react'
import { useQuiz } from '../hooks/useQuiz'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { formatTime } from '../utils/timeFormatter'
import { tracking } from '../lib/googleAnalytics'
import QuizHeader from './quiz/QuizHeader'
import QuizQuestionDisplay from './quiz/QuizQuestion'
import QuizResults from './quiz/QuizResults'
import QuizMessages from './quiz/QuizMessages'
import AIGenerationPrompt from './quiz/AIGenerationPrompt'
import QuestionPrompt from './quiz/QuestionPrompt'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import type { QuizQuestion } from '../types/challenges'

interface QuizProps {
    questions: QuizQuestion[]
    title?: string
    day?: number
    enableAI?: boolean
}

function Quiz({ questions, title = 'Self-Assessment Quiz', day, enableAI = false }: QuizProps): JSX.Element {
    const {
        allQuestions,
        currentQuestion,
        currentQuestionIndex,
        selectedAnswer,
        score,
        completed,
        localQuestionsCompleted,
        aiQuestionCount,
        generatingAI,
        aiEnabled,
        loadingAI,
        aiQuestionsLoaded,
        errorMessage,
        percentage,
        showQuestionPrompt,
        questionPromptType,
        incorrectAnswers,
        incorrectAnswersWithSelection,
        quizStartTime,
        totalTimeSpent,
        skippedQuestions,
        handleAnswerSelect,
        handleNext,
        handleSkip,
        handleAIGenerationRequest,
        handleLoadMoreLocalQuestions,
        reset,
        resetWithIncorrectOnly,
        toggleAI,
        handleSelectPromptType,
        handleCancelPrompt
    } = useQuiz({ questions, day })

    const localQuestionsCount = questions.length
    const isAISection = currentQuestionIndex >= localQuestionsCount
    const [currentTime, setCurrentTime] = useState<number>(0)

    // Update current time during quiz
    useEffect(() => {
        if (completed || !quizStartTime) return

        const interval = setInterval(() => {
            setCurrentTime(Math.floor((Date.now() - quizStartTime) / 1000))
        }, 1000)

        return () => clearInterval(interval)
    }, [completed, quizStartTime])

    // Keyboard shortcuts for quiz
    useKeyboardShortcuts({
        onNext: handleNext,
        onSkip: handleSkip,
        onSelect: (index: number) => {
            if (!completed && currentQuestion && index >= 0 && index < currentQuestion.options.length) {
                handleAnswerSelect(index)
            }
        },
        enabled: !completed && !generatingAI && !showQuestionPrompt
    })

    const containerStyle: React.CSSProperties = {
        border: '2px solid var(--border-primary)',
        borderRadius: '8px',
        padding: '20px',
        background: 'var(--bg-card)',
        marginTop: '20px'
    }

    // Show final results
    if (completed) {
        // Track quiz completion
        if (day) {
            tracking.quizCompleted(day, percentage)
        }
        
        return (
            <div style={containerStyle}>
                <h3>{title}</h3>
                <QuizResults
                    score={score}
                    totalQuestions={allQuestions.length}
                    percentage={percentage}
                    localQuestionsCount={localQuestionsCount}
                    aiQuestionsLoaded={aiQuestionsLoaded}
                    incorrectAnswers={incorrectAnswers}
                    incorrectAnswersWithSelection={incorrectAnswersWithSelection}
                    totalTimeSpent={totalTimeSpent}
                    skippedCount={skippedQuestions.size}
                    onRetake={reset}
                    onRetakeIncorrectOnly={resetWithIncorrectOnly}
                />
            </div>
        )
    }

    // Show question prompt after 3 questions
    if (showQuestionPrompt && !completed && !generatingAI) {
        return (
            <div style={containerStyle}>
                <h3>{title}</h3>
                <QuestionPrompt
                    onSelectType={handleSelectPromptType}
                    onCancel={handleCancelPrompt}
                    selectedType={questionPromptType}
                    onSelectCount={(type, count) => {
                        if (type === 'local') {
                            handleLoadMoreLocalQuestions(count)
                        } else {
                            handleAIGenerationRequest(count)
                        }
                    }}
                    generating={generatingAI}
                    errorMessage={errorMessage}
                />
            </div>
        )
    }

    // Show AI generation prompt after local questions are done (legacy flow)
    if (localQuestionsCompleted && !aiQuestionsLoaded && !generatingAI && !showQuestionPrompt) {
        return (
            <div style={containerStyle}>
                <h3>{title}</h3>
                <AIGenerationPrompt
                    localScore={score}
                    localQuestionsCount={localQuestionsCount}
                    onGenerate={handleAIGenerationRequest}
                    generating={generatingAI}
                    errorMessage={errorMessage}
                />
            </div>
        )
    }

    // Show loading while generating AI questions
    if (generatingAI) {
        return (
            <div style={containerStyle}>
                <h3>{title}</h3>
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    background: 'var(--bg-card)',
                    borderRadius: '12px'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔄</div>
                    <h3>Generating AI Questions...</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
                        Please wait while we create {aiQuestionCount} additional questions for you.
                    </p>
                    <div style={{ marginTop: '20px' }}>
                        <LoadingSkeleton width="100%" height="60px" borderRadius="8px" />
                        <div style={{ marginTop: '12px' }}>
                            <LoadingSkeleton width="100%" height="50px" borderRadius="6px" />
                        </div>
                        <div style={{ marginTop: '12px' }}>
                            <LoadingSkeleton width="100%" height="50px" borderRadius="6px" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!currentQuestion) {
        return (
            <div style={containerStyle}>
                <h3>{title}</h3>
                <p>Loading questions...</p>
            </div>
        )
    }

    return (
        <div style={containerStyle}>
            <QuizHeader
                title={title}
                currentQuestionIndex={currentQuestionIndex}
                totalQuestions={allQuestions.length}
                localQuestionsCount={localQuestionsCount}
                enableAI={enableAI}
                day={day}
                aiEnabled={aiEnabled}
                loadingAI={loadingAI}
                aiQuestionsLoaded={aiQuestionsLoaded}
                onToggleAI={toggleAI}
            />

            <QuizMessages
                aiQuestionsLoaded={aiQuestionsLoaded}
                totalQuestions={allQuestions.length}
                localQuestionsCount={localQuestionsCount}
                errorMessage={errorMessage}
            />

            {/* Time indicator and AI section indicator */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
                gap: '10px',
                flexWrap: 'wrap'
            }}>
                {quizStartTime && !completed && (
                    <div style={{
                        padding: '8px 12px',
                        background: 'var(--bg-section)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)'
                    }}>
                        ⏱️ {formatTime(currentTime)}
                    </div>
                )}
                {isAISection && (
                    <div style={{
                        padding: '8px 12px',
                        background: 'var(--bg-info)',
                        color: 'var(--text-on-info)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        textAlign: 'center',
                        border: '1px solid var(--border-primary)',
                        marginLeft: 'auto'
                    }}>
                        ✨ AI Question {currentQuestionIndex - localQuestionsCount + 1} of {allQuestions.length - localQuestionsCount}
                    </div>
                )}
                {!isAISection && !completed && (
                    <div style={{
                        padding: '6px 10px',
                        background: 'var(--bg-section)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                        marginLeft: 'auto'
                    }}>
                        💡 Press 1-4 to select, Space/Enter for next
                    </div>
                )}
            </div>

            <QuizQuestionDisplay
                question={currentQuestion}
                selectedAnswer={selectedAnswer}
                completed={completed}
                onAnswerSelect={handleAnswerSelect}
                onNext={handleNext}
                onSkip={handleSkip}
                isLastQuestion={currentQuestionIndex === allQuestions.length - 1}
                isAISection={isAISection}
            />
        </div>
    )
}

export default Quiz
