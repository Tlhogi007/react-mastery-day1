/**
 * Tools Page - Access to all learning tools
 */

import { type JSX } from 'react'
import QuickReference from '../components/QuickReference'
import FlashcardSystem from '../components/FlashcardSystem'
import CodeSnippetsLibrary from '../components/CodeSnippetsLibrary'
import ConceptMap from '../components/ConceptMap'
import LearningPathRecommendations from '../components/LearningPathRecommendations'
import InterviewPrepMode from '../components/InterviewPrepMode'
import CodeReviewLibrary from '../components/CodeReviewLibrary'
import Tabs from '../components/Tabs'
import { day01Quiz } from '../exercises/week1/day01-rendering-pipeline/challenges'
import { day02Quiz } from '../exercises/week1/day02-reconciliation/challenges'
import { day03Quiz } from '../exercises/week1/day03-fiber/challenges'
import { day04Quiz } from '../exercises/week1/day04-memoization/challenges'
import { day05Quiz } from '../exercises/week1/day05-effects/challenges'
import { day06Quiz } from '../exercises/week1/day06-context/challenges'
import { day07Quiz } from '../exercises/week1/day07-reflection/challenges'

interface ToolsProps {
    onBack?: () => void
}

function Tools({ onBack }: ToolsProps): JSX.Element {
    // Combine all quiz questions for interview prep
    const allQuizQuestions = [
        ...day01Quiz,
        ...day02Quiz,
        ...day03Quiz,
        ...day04Quiz,
        ...day05Quiz,
        ...day06Quiz,
        ...day07Quiz
    ]

    return (
        <div style={{ color: 'var(--text-primary)', minHeight: '100vh', padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                {onBack && (
                    <button
                        onClick={onBack}
                        style={{
                            marginBottom: '20px',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-primary)',
                            background: 'var(--bg-section)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        ← Back to Exercises
                    </button>
                )}
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ marginBottom: '10px' }}>🛠️ Learning Tools</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Access all learning tools and resources in one place
                    </p>
                </div>
            </div>

            <Tabs
                tabs={[
                    {
                        id: 'quick-reference',
                        label: 'Quick Reference',
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
                        label: 'Code Snippets',
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
                        label: 'Learning Path',
                        icon: '🧭',
                        content: <LearningPathRecommendations />
                    },
                    {
                        id: 'interview',
                        label: 'Interview Prep',
                        icon: '🎤',
                        content: <InterviewPrepMode questions={allQuizQuestions} duration={30} />
                    },
                    {
                        id: 'code-review',
                        label: 'Code Review',
                        icon: '🔍',
                        content: <CodeReviewLibrary />
                    }
                ]}
            />
        </div>
    )
}

export default Tools
