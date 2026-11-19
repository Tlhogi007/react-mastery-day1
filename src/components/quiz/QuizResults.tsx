/**
 * Quiz Results Component
 * Single Responsibility: Display quiz completion results
 */

import { type JSX, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { QUIZ_THRESHOLDS } from '../../constants'
import { formatTime } from '../../utils/timeFormatter'
import type { QuizQuestion } from '../../types/challenges'
import '../../exercises/exerciseLayout.css'

interface QuizResultsProps {
    score: number
    totalQuestions: number
    percentage: number
    localQuestionsCount: number
    aiQuestionsLoaded: boolean
    incorrectAnswers: QuizQuestion[]
    incorrectAnswersWithSelection: Array<{ question: QuizQuestion; selectedIndex: number }>
    /** Honest miss count: total − score (includes skips). */
    missedCount: number
    totalTimeSpent: number
    skippedCount: number
    onRetake: () => void
    onRetakeIncorrectOnly?: () => void
}

type SheetView = 'score' | 'review'

const MOBILE_MQ = '(max-width: 768px)'

function QuizResults({
    score,
    totalQuestions,
    percentage,
    localQuestionsCount,
    aiQuestionsLoaded,
    incorrectAnswers,
    incorrectAnswersWithSelection,
    missedCount,
    totalTimeSpent,
    skippedCount,
    onRetake,
    onRetakeIncorrectOnly
}: QuizResultsProps): JSX.Element {
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia(MOBILE_MQ).matches : false,
    )
    const [mobileSheetOpen, setMobileSheetOpen] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia(MOBILE_MQ).matches : false,
    )
    const [sheetMounted, setSheetMounted] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia(MOBILE_MQ).matches : false,
    )
    const [sheetEntered, setSheetEntered] = useState(false)
    const [sheetView, setSheetView] = useState<SheetView>('score')
    const [showDesktopReview, setShowDesktopReview] = useState(false)
    const [reviewIndex, setReviewIndex] = useState(0)

    const carouselRef = useRef<HTMLDivElement>(null)
    const sheetFocusRef = useRef<HTMLButtonElement>(null)
    const reopenBtnRef = useRef<HTMLButtonElement>(null)
    const titleId = useId()
    const sheetExitMs = 280

    const passed = percentage >= QUIZ_THRESHOLDS.PASSING_SCORE
    const reviewCount = Math.max(missedCount, incorrectAnswers.length)
    const aiCount = Math.max(0, totalQuestions - localQuestionsCount)
    const reviewTotal = incorrectAnswers.length
    const isLastStep = reviewIndex >= reviewTotal - 1
    const progressPct = reviewTotal > 0 ? ((reviewIndex + 1) / reviewTotal) * 100 : 0

    const dismissSheet = () => {
        setMobileSheetOpen(false)
        setSheetView('score')
        setReviewIndex(0)
    }

    const backToScore = () => {
        setSheetView('score')
        setReviewIndex(0)
    }

    const openReview = () => {
        setReviewIndex(0)
        setSheetView('review')
        if (isMobile) setMobileSheetOpen(true)
        else setShowDesktopReview(true)
    }

    useEffect(() => {
        const mq = window.matchMedia(MOBILE_MQ)
        const sync = () => {
            const mobile = mq.matches
            setIsMobile(mobile)
            if (mobile) {
                setMobileSheetOpen(true)
                setShowDesktopReview(false)
            } else {
                setMobileSheetOpen(false)
                setSheetView('score')
            }
        }
        sync()
        mq.addEventListener('change', sync)
        return () => mq.removeEventListener('change', sync)
    }, [])

    useEffect(() => {
        if (passed) {
            window.dispatchEvent(new CustomEvent('showConfetti'))
        }
    }, [passed])

    useEffect(() => {
        if (!isMobile) {
            setSheetMounted(false)
            setSheetEntered(false)
            return
        }
        if (mobileSheetOpen) {
            setSheetMounted(true)
            const enter = window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => setSheetEntered(true))
            })
            return () => window.cancelAnimationFrame(enter)
        }
        setSheetEntered(false)
        const exit = window.setTimeout(() => setSheetMounted(false), sheetExitMs)
        return () => window.clearTimeout(exit)
    }, [isMobile, mobileSheetOpen])

    useEffect(() => {
        if (!isMobile || !sheetMounted) {
            document.body.classList.remove('quiz-sheet-open')
            return
        }

        document.body.classList.add('quiz-sheet-open')
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const previouslyFocused = document.activeElement as HTMLElement | null
        const focusTimer = window.setTimeout(() => sheetFocusRef.current?.focus(), 40)

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return
            e.preventDefault()
            if (sheetView === 'review') backToScore()
            else dismissSheet()
        }
        window.addEventListener('keydown', onKeyDown)

        return () => {
            window.clearTimeout(focusTimer)
            document.body.style.overflow = prevOverflow
            document.body.classList.remove('quiz-sheet-open')
            window.removeEventListener('keydown', onKeyDown)
            if (!mobileSheetOpen) {
                if (previouslyFocused?.isConnected) previouslyFocused.focus()
                else reopenBtnRef.current?.focus()
            }
        }
    }, [isMobile, sheetMounted, mobileSheetOpen, sheetView])

    useEffect(() => {
        if (sheetView !== 'review' || !carouselRef.current) return
        carouselRef.current.scrollTo({ left: 0, behavior: 'auto' })
    }, [sheetView])

    const scrollReviewTo = (index: number) => {
        const el = carouselRef.current
        if (!el || reviewTotal === 0) return
        const clamped = Math.max(0, Math.min(reviewTotal - 1, index))
        setReviewIndex(clamped)
        const slideWidth = el.clientWidth || 1
        el.scrollTo({ left: slideWidth * clamped, behavior: 'smooth' })
    }

    const onCarouselScroll = () => {
        const el = carouselRef.current
        if (!el || el.children.length === 0) return
        const slideWidth = el.clientWidth || 1
        const next = Math.max(
            0,
            Math.min(reviewTotal - 1, Math.round(el.scrollLeft / slideWidth)),
        )
        if (next !== reviewIndex) setReviewIndex(next)
    }

    const goNext = () => {
        if (isLastStep) {
            if (isMobile) backToScore()
            else {
                setShowDesktopReview(false)
                setReviewIndex(0)
            }
            return
        }
        scrollReviewTo(reviewIndex + 1)
    }

    const goBack = () => {
        if (reviewIndex <= 0) return
        scrollReviewTo(reviewIndex - 1)
    }

    const missedLine = ((): JSX.Element | null => {
        if (reviewCount <= 0) return null
        let text: string
        if (skippedCount > 0 && skippedCount >= reviewCount) {
            text = `You skipped ${skippedCount} question${skippedCount !== 1 ? 's' : ''}.`
        } else if (skippedCount > 0) {
            text = `You missed ${reviewCount} (${skippedCount} skipped).`
        } else {
            text = `You missed ${reviewCount} question${reviewCount !== 1 ? 's' : ''}.`
        }
        return <p className="quiz-review-summary__text">{text}</p>
    })()

    const scoreHero = (
        <div className={`quiz-results-hero${passed ? ' quiz-results-hero--pass' : ' quiz-results-hero--fail'}`}>
            <h2 className="quiz-results__heading" id={titleId}>
                Quiz Complete
            </h2>
            <p className="quiz-results__score">
                {score}/{totalQuestions} correct
            </p>
            <p
                className={`quiz-results__pct${passed ? ' quiz-results__pct--pass' : ' quiz-results__pct--fail'}`}
            >
                {percentage}% score
                {totalTimeSpent > 0 && (
                    <>
                        {' '}
                        · {formatTime(totalTimeSpent)} total
                        {totalQuestions > 0 &&
                            ` · ${formatTime(Math.floor(totalTimeSpent / totalQuestions))} avg`}
                    </>
                )}
            </p>
            {aiQuestionsLoaded && aiCount > 0 && (
                <div className="quiz-results__ai-badge">
                    {aiCount} AI-generated · {localQuestionsCount} local
                </div>
            )}
            {reviewCount > 0 && (
                <div className="quiz-review-summary">
                    {missedLine}
                    {incorrectAnswers.length > 0 && (
                        <button
                            type="button"
                            className="quiz-btn quiz-btn--primary"
                            onClick={() => {
                                if (!isMobile && showDesktopReview) {
                                    setShowDesktopReview(false)
                                    setReviewIndex(0)
                                    return
                                }
                                openReview()
                            }}
                            aria-expanded={!isMobile ? showDesktopReview : sheetView === 'review'}
                        >
                            {!isMobile && showDesktopReview
                                ? 'Hide review'
                                : `Review missed (${incorrectAnswers.length})`}
                        </button>
                    )}
                </div>
            )}
            <div className="quiz-actions">
                <button
                    type="button"
                    className="quiz-btn quiz-btn--ghost"
                    onClick={onRetake}
                    aria-label="Retake quiz"
                >
                    Retake quiz
                </button>
                {onRetakeIncorrectOnly && incorrectAnswers.length > 0 && (
                    <button
                        type="button"
                        className="quiz-btn quiz-btn--ghost"
                        onClick={onRetakeIncorrectOnly}
                        aria-label="Retake incorrect questions only"
                    >
                        Retake missed only ({incorrectAnswers.length})
                    </button>
                )}
            </div>
        </div>
    )

    const renderSlide = (q: QuizQuestion, idx: number) => {
        const withSelection = incorrectAnswersWithSelection.find(
            (item) => item.question.id === q.id,
        )
        const selectedIndex = withSelection?.selectedIndex ?? null
        const wasSkipped = selectedIndex === -1
        const statusLabel = wasSkipped ? 'Skipped' : 'Wrong'

        return (
            <article
                key={q.id}
                className="quiz-review__slide"
                aria-label={`Review ${idx + 1} of ${reviewTotal}`}
            >
                <span
                    className={`quiz-review__chip quiz-review__chip--${wasSkipped ? 'skipped' : 'wrong'}`}
                >
                    {statusLabel}
                </span>
                <div className="quiz-review__question">
                    {idx + 1}. {q.question}
                </div>
                <div className="quiz-review__options">
                    {q.options.map((option, optIdx) => {
                        const isCorrect = optIdx === q.correctAnswer
                        const isSelected = selectedIndex === optIdx
                        const isWrong = isSelected && !isCorrect
                        return (
                            <div
                                key={optIdx}
                                className={`quiz-review__option${isCorrect ? ' quiz-review__option--correct' : ''}${isWrong ? ' quiz-review__option--wrong' : ''}`}
                            >
                                <span className="quiz-review__option-letter">
                                    {String.fromCharCode(65 + optIdx)})
                                </span>
                                <span className="quiz-review__option-text">{option}</span>
                                {isCorrect && (
                                    <span className="quiz-review__option-tag">
                                        <span aria-hidden>✅ </span>(Correct)
                                    </span>
                                )}
                                {isWrong && (
                                    <span className="quiz-review__option-tag">
                                        <span aria-hidden>❌ </span>(Your Answer)
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>
                <div className="quiz-review__explanation">
                    <strong>Explanation:</strong> {q.explanation}
                </div>
            </article>
        )
    }

    const reviewStepper = reviewTotal > 0 && (
        <div className="quiz-review quiz-review--stepper">
            <div className="quiz-review__sheet-head">
                <button
                    ref={sheetFocusRef}
                    type="button"
                    className="quiz-review__close"
                    onClick={() => (isMobile ? backToScore() : setShowDesktopReview(false))}
                    aria-label={isMobile ? 'Back to score summary' : 'Hide review'}
                >
                    {isMobile ? 'Summary' : 'Close'}
                </button>
                <div className="quiz-review__sheet-titles">
                    <h4 className="quiz-review__title">Review</h4>
                    <span className="quiz-review__counter" aria-live="polite">
                        {reviewIndex + 1} of {reviewTotal}
                    </span>
                </div>
                <div
                    className="quiz-review__progress"
                    role="progressbar"
                    aria-valuemin={1}
                    aria-valuemax={reviewTotal}
                    aria-valuenow={reviewIndex + 1}
                    aria-label="Review progress"
                >
                    <div
                        className="quiz-review__progress-fill"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
            </div>

            <div className="quiz-review__desktop-head">
                <h4 className="quiz-review__title">Questions to Review</h4>
            </div>

            <div className="quiz-review__body">
                <div className="quiz-review__viewport">
                    <div
                        ref={carouselRef}
                        className="quiz-review__carousel"
                        onScroll={onCarouselScroll}
                    >
                        {incorrectAnswers.map((q, idx) => renderSlide(q, idx))}
                    </div>
                </div>
            </div>

            <div className="quiz-actions quiz-review__footer">
                <button
                    type="button"
                    className="quiz-btn quiz-btn--primary"
                    onClick={goNext}
                >
                    {isLastStep ? 'Done' : 'Next'}
                </button>
                <button
                    type="button"
                    className="quiz-btn quiz-btn--ghost"
                    onClick={goBack}
                    disabled={reviewIndex <= 0}
                >
                    Back
                </button>
            </div>
        </div>
    )

    const mobileSheet =
        isMobile && sheetMounted
            ? createPortal(
                <div
                    className={`quiz-results-sheet${sheetEntered ? ' quiz-results-sheet--open' : ''}`}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                >
                    <button
                        type="button"
                        className="quiz-results-sheet__backdrop"
                        aria-label="Dismiss results"
                        onClick={dismissSheet}
                    />
                    <div className="quiz-results-sheet__panel">
                        <div className="quiz-results-sheet__chrome">
                            {sheetView === 'score' ? (
                                <button
                                    ref={sheetFocusRef}
                                    type="button"
                                    className="quiz-results-sheet__dismiss"
                                    onClick={dismissSheet}
                                >
                                    Close
                                </button>
                            ) : (
                                <span className="quiz-results-sheet__chrome-spacer" aria-hidden />
                            )}
                        </div>
                        <div className="quiz-results-sheet__content">
                            {sheetView === 'score' ? scoreHero : reviewStepper}
                        </div>
                    </div>
                </div>,
                document.body,
            )
            : null

    // Desktop inline results
    if (!isMobile) {
        return (
            <div className={`quiz-results${passed ? ' quiz-results--pass' : ''}`}>
                {scoreHero}
                {showDesktopReview && reviewStepper}
            </div>
        )
    }

    // Mobile: compact placeholder in tab + portaled sheet
    return (
        <>
            <div
                className={`quiz-results quiz-results--mobile-placeholder${passed ? ' quiz-results--pass' : ''}`}
            >
                <p className="quiz-results__placeholder-label">
                    {passed ? 'Passed' : 'Not passed yet'}
                </p>
                <p className="quiz-results__placeholder-score">
                    {score}/{totalQuestions} correct
                </p>
                <p className="quiz-results__placeholder-pct">{percentage}% score</p>
                {reviewCount > 0 && !mobileSheetOpen && missedLine}
                {!mobileSheetOpen ? (
                    <button
                        ref={reopenBtnRef}
                        type="button"
                        className="quiz-btn quiz-btn--ghost quiz-results__reopen"
                        onClick={() => {
                            setSheetView('score')
                            setMobileSheetOpen(true)
                        }}
                    >
                        Show results
                    </button>
                ) : (
                    <p className="quiz-results__sheet-hint">Results open</p>
                )}
            </div>
            {mobileSheet}
        </>
    )
}

export default QuizResults
