/**
 * Tools Page - Access to all learning tools
 */

import { useEffect, useState, type JSX } from 'react'
import QuickReference from '../components/QuickReference'
import FlashcardSystem from '../components/FlashcardSystem'
import CodeSnippetsLibrary from '../components/CodeSnippetsLibrary'
import ConceptMap from '../components/ConceptMap'
import LearningPathRecommendations from '../components/LearningPathRecommendations'
import InterviewPrepMode from '../components/InterviewPrepMode'
import CodeReviewLibrary from '../components/CodeReviewLibrary'
import Tabs from '../components/Tabs'
import type { QuizQuestion } from '../types/challenges'
import './Tools.css'

interface ToolsProps {
    onBack?: () => void
    onNavigateToDay?: (day: number) => void
}

function Tools({ onBack, onNavigateToDay }: ToolsProps): JSX.Element {
    const [allQuizQuestions, setAllQuizQuestions] = useState<QuizQuestion[]>([])

    useEffect(() => {
        let cancelled = false
        void (async () => {
            const [
                { day01Quiz },
                { day02Quiz },
                { day03Quiz },
                { day04Quiz },
                { day05Quiz },
                { day06Quiz },
                { day07Quiz },
            ] = await Promise.all([
                import('../exercises/week1/day01-rendering-pipeline/challenges'),
                import('../exercises/week1/day02-reconciliation/challenges'),
                import('../exercises/week1/day03-fiber/challenges'),
                import('../exercises/week1/day04-memoization/challenges'),
                import('../exercises/week1/day05-effects/challenges'),
                import('../exercises/week1/day06-context/challenges'),
                import('../exercises/week1/day07-reflection/challenges'),
            ])
            if (!cancelled) {
                setAllQuizQuestions([
                    ...day01Quiz,
                    ...day02Quiz,
                    ...day03Quiz,
                    ...day04Quiz,
                    ...day05Quiz,
                    ...day06Quiz,
                    ...day07Quiz,
                ])
            }
        })()
        return () => {
            cancelled = true
        }
    }, [])

    return (
        <div className="tools-page" style={{ color: 'var(--text-primary)', minHeight: '100%', padding: '0 0 24px' }}>
            <div className="tools-page__intro">
                {onBack && (
                    <button
                        type="button"
                        className="tools-page__back"
                        onClick={onBack}
                    >
                        <span className="tools-page__back-label-full">← Back to Exercises</span>
                        <span className="tools-page__back-label-short">← Back</span>
                    </button>
                )}
                <h1>Learning Tools</h1>
                <p>
                    Quick reference, flashcards, snippets, maps, and interview drills.
                </p>
            </div>

            <Tabs
                tabs={[
                    {
                        id: 'quick-reference',
                        label: 'Reference',
                        icon: '📚',
                        content: <QuickReference />
                    },
                    {
                        id: 'flashcards',
                        label: 'Flashcards',
                        icon: '🎴',
                        content: <FlashcardSystem />
                    },
                    {
                        id: 'snippets',
                        label: 'Snippets',
                        icon: '💻',
                        content: <CodeSnippetsLibrary />
                    },
                    {
                        id: 'concept-map',
                        label: 'Concept Map',
                        icon: '🗺️',
                        content: <ConceptMap />
                    },
                    {
                        id: 'learning-path',
                        label: 'Path',
                        icon: '🧭',
                        content: <LearningPathRecommendations onNavigateToDay={onNavigateToDay} />
                    },
                    {
                        id: 'interview',
                        label: 'Interview',
                        icon: '🎤',
                        content: <InterviewPrepMode questions={allQuizQuestions} duration={30} />
                    },
                    {
                        id: 'code-review',
                        label: 'Review',
                        icon: '🔍',
                        content: <CodeReviewLibrary />
                    }
                ]}
            />
        </div>
    )
}

export default Tools
