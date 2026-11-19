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
import { progressStorage } from '../services/progressStorage'
import QuizHeader from './quiz/QuizHeader'
import QuizAiControls from './quiz/QuizAiControls'
import QuizQuestionDisplay from './quiz/QuizQuestion'
import QuizResults from './quiz/QuizResults'
import QuizMessages from './quiz/QuizMessages'
import AIGenerationPrompt from './quiz/AIGenerationPrompt'
import QuestionPrompt from './quiz/QuestionPrompt'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import type { QuizQuestion } from '../types/challenges'
import '../exercises/exerciseLayout.css'

interface QuizProps {
    questions: QuizQuestion[]
    title?: string
    day?: number
    topic?: string
    enableAI?: boolean
}

function Quiz({
    questions,
    title = 'Self-Assessment Quiz',
    day,
    topic = 'React',
    enableAI = false,
}: QuizProps): JSX.Element {
    const {
        allQuestions,
        currentQuestion,
        currentQuestionIndex,
        selectedAnswer,
        score,
        completed,
        localQuestionsCompleted,
        localQuestionsCount,
        isAISection,
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
        missedCount,
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

    const aiTotal = allQuestions.length - localQuestionsCount
    const aiOrdinal = allQuestions
        .slice(0, currentQuestionIndex + 1)
        .filter((q) => q.source === 'ai').length

    const [currentTime, setCurrentTime] = useState<number>(0)

    // Update current time during quiz
    useEffect(() => {
        if (completed || !quizStartTime) return

        const interval = setInterval(() => {
            setCurrentTime(Math.floor((Date.now() - quizStartTime) / 1000))
        }, 1000)

        return () => clearInterval(interval)
    }, [completed, quizStartTime])

    // Drive day / overall progress bars while the quiz is in progress
    useEffect(() => {
        if (!day || allQuestions.length === 0) return
        if (completed) {
            progressStorage.setLiveDayProgress(day, null)
            return
        }
        const answeredBias = selectedAnswer != null ? 1 : 0
        const pct = Math.round(
            ((currentQuestionIndex + answeredBias) / allQuestions.length) * 80,
        )
        progressStorage.setLiveDayProgress(day, Math.min(80, Math.max(1, pct)))
    }, [day, completed, currentQuestionIndex, selectedAnswer, allQuestions.length])

    // Keep live % when switching Learn/Practice/Quiz so the day bar stays true.
    // Cleared only when the quiz completes (above).

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

    const shell = (body: JSX.Element): JSX.Element => (
        <div className="quiz-shell">
            {body}
        </div>
    )

    // Show final results
    if (completed) {
        // Track quiz completion
        if (day) {
            tracking.quizCompleted(day, percentage)
        }

        return shell(
            <>
                <h3 className="quiz-shell__title">{title}</h3>
                <QuizResults
                    score={score}
                    totalQuestions={allQuestions.length}
                    percentage={percentage}
                    localQuestionsCount={localQuestionsCount}
                    aiQuestionsLoaded={aiQuestionsLoaded}
                    incorrectAnswers={incorrectAnswers}
                    incorrectAnswersWithSelection={incorrectAnswersWithSelection}
                    missedCount={missedCount}
                    totalTimeSpent={totalTimeSpent}
                    skippedCount={skippedQuestions.size}
                    onRetake={reset}
                    onRetakeIncorrectOnly={resetWithIncorrectOnly}
                />
            </>,
        )
    }

    // Show question prompt after 3 questions
    if (showQuestionPrompt && !completed && !generatingAI) {
        return shell(
            <>
                <h3 className="quiz-shell__title">{title}</h3>
                <QuestionPrompt
                    onSelectType={handleSelectPromptType}
                    onCancel={handleCancelPrompt}
                    onFinishQuiz={() => {
                        void handleAIGenerationRequest(0)
                    }}
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
            </>,
        )
    }

    // Show AI generation prompt after local questions are done (legacy flow)
    if (localQuestionsCompleted && !aiQuestionsLoaded && !generatingAI && !showQuestionPrompt) {
        return shell(
            <>
                <h3 className="quiz-shell__title">{title}</h3>
                <AIGenerationPrompt
                    localScore={score}
                    localQuestionsCount={localQuestionsCount}
                    onGenerate={handleAIGenerationRequest}
                    generating={generatingAI}
                    errorMessage={errorMessage}
                />
            </>,
        )
    }

    // Show loading while generating AI questions
    if (generatingAI) {
        return shell(
            <>
                <h3 className="quiz-shell__title">{title}</h3>
                <div className="quiz-panel quiz-loading">
                    <p className="quiz-loading__title">Generating AI questions…</p>
                    <p className="quiz-loading__lead">
                        Creating {aiQuestionCount} additional questions. This usually takes a few seconds.
                    </p>
                    <LoadingSkeleton width="100%" height="60px" borderRadius="8px" />
                    <div style={{ marginTop: 12 }}>
                        <LoadingSkeleton width="100%" height="50px" borderRadius="8px" />
                    </div>
                    <div style={{ marginTop: 12 }}>
                        <LoadingSkeleton width="100%" height="50px" borderRadius="8px" />
                    </div>
                </div>
            </>,
        )
    }

    if (!currentQuestion) {
        return shell(
            <>
                <h3 className="quiz-shell__title">{title}</h3>
                <div className="quiz-panel" role="status">
                    <p className="quiz-panel__title">No question to show</p>
                    <p className="quiz-panel__lead">
                        The quiz ran past the last question. Finish or retake to continue.
                    </p>
                    <div className="quiz-actions">
                        <button
                            type="button"
                            className="quiz-btn quiz-btn--primary"
                            onClick={reset}
                        >
                            Retake quiz
                        </button>
                    </div>
                </div>
            </>,
        )
    }

    return shell(
        <>
            <QuizHeader title={title} />

            <QuizMessages
                aiQuestionsLoaded={aiQuestionsLoaded}
                totalQuestions={allQuestions.length}
                localQuestionsCount={localQuestionsCount}
                errorMessage={errorMessage}
            />

            {/*
              Mobile:  Question ········ timer
                       [badge] ········ ☐ Add AI
              Desktop: [Question · timer] ····· [badge] [☐ Add AI]
                       Press A–D… (quiet line)
            */}
            <div className="quiz-toolbar">
                <div className="quiz-toolbar__left">
                    <div className="quiz-toolbar__progress">
                        Question {currentQuestionIndex + 1}/{allQuestions.length}
                        {aiQuestionsLoaded && (
                            <span className="quiz-header__progress-detail">
                                ({localQuestionsCount} local + {allQuestions.length - localQuestionsCount} AI)
                            </span>
                        )}
                    </div>
                    {quizStartTime && !completed && (
                        <div className="quiz-status-chip">
                            ⏱️ {formatTime(currentTime)}
                        </div>
                    )}
                    {isAISection && aiTotal > 0 && (
                        <div className="quiz-status-chip quiz-status-chip--info">
                            AI {aiOrdinal}/{aiTotal}
                        </div>
                    )}
                </div>
                <div className="quiz-toolbar__ai">
                    <QuizAiControls
                        enableAI={enableAI}
                        day={day}
                        aiEnabled={aiEnabled}
                        loadingAI={loadingAI}
                        onToggleAI={toggleAI}
                    />
                </div>
                {!isAISection && !completed && (
                    <div className="quiz-input-hint">
                        <span className="quiz-input-hint__desktop">Press A–D to select, Space/Enter for next</span>
                        <span className="quiz-input-hint__touch">Tap an answer, then Next</span>
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
                day={day}
                topic={topic}
            />
        </>,
    )
}

export default Quiz
