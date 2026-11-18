/**
 * Question Prompt Component
 * Shows after 3 questions to let user choose between local or AI questions
 */

import { useState, type JSX } from 'react'
import SlideUp from '../animations/SlideUp'

interface QuestionPromptProps {
    onSelectType: (type: 'local' | 'ai' | null) => void
    onCancel: () => void
    selectedType: 'local' | 'ai' | null
    onSelectCount: (type: 'local' | 'ai', count: number) => void
    generating: boolean
    errorMessage: string | null
}

function QuestionPrompt({
    onSelectType,
    onCancel,
    selectedType,
    onSelectCount,
    generating,
    errorMessage
}: QuestionPromptProps): JSX.Element {
    const [selectedCount, setSelectedCount] = useState<number>(5)
    const counts = [5, 10, 15, 20]

    // Show type selection
    if (!selectedType) {
        return (
            <SlideUp>
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    background: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: '2px solid var(--border-primary)',
                    marginTop: '20px'
                }}>
                    <h2 style={{ marginBottom: '20px' }}>📚 Want More Questions?</h2>
                    <p style={{ marginBottom: '30px', color: 'var(--text-secondary)' }}>
                        You've completed 3 questions. Would you like to continue with more questions?
                    </p>

                    <div style={{
                        display: 'flex',
                        gap: '20px',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={() => onSelectType('local')}
                            disabled={generating}
                            style={{
                                padding: '20px 40px',
                                background: 'var(--button-primary)',
                                color: 'var(--button-text)',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: generating ? 'not-allowed' : 'pointer',
                                fontSize: '18px',
                                fontWeight: '600',
                                transition: 'all 0.2s',
                                opacity: generating ? 0.6 : 1,
                                minWidth: '200px'
                            }}
                        >
                            📖 More Local Questions
                        </button>

                        <button
                            onClick={() => onSelectType('ai')}
                            disabled={generating}
                            style={{
                                padding: '20px 40px',
                                background: 'var(--button-secondary)',
                                color: 'var(--button-text)',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: generating ? 'not-allowed' : 'pointer',
                                fontSize: '18px',
                                fontWeight: '600',
                                transition: 'all 0.2s',
                                opacity: generating ? 0.6 : 1,
                                minWidth: '200px'
                            }}
                        >
                            🤖 AI-Generated Questions
                        </button>
                    </div>

                    <button
                        onClick={onCancel}
                        disabled={generating}
                        style={{
                            marginTop: '20px',
                            padding: '10px 20px',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            cursor: generating ? 'not-allowed' : 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Continue with remaining questions
                    </button>
                </div>
            </SlideUp>
        )
    }

    // Show count selection
    return (
        <SlideUp>
            <div style={{
                textAlign: 'center',
                padding: '40px',
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '2px solid var(--border-primary)',
                marginTop: '20px'
            }}>
                <h2 style={{ marginBottom: '10px' }}>
                    {selectedType === 'local' ? '📖 Local Questions' : '🤖 AI Questions'}
                </h2>
                <p style={{ marginBottom: '30px', color: 'var(--text-secondary)' }}>
                    How many {selectedType === 'local' ? 'local' : 'AI-generated'} questions would you like?
                </p>

                {errorMessage && (
                    <div style={{
                        padding: '12px',
                        background: 'var(--bg-warning)',
                        color: 'var(--text-on-warning)',
                        borderRadius: '6px',
                        marginBottom: '20px',
                        fontSize: '14px'
                    }}>
                        ⚠️ {errorMessage}
                    </div>
                )}

                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                    marginBottom: '30px'
                }}>
                    {counts.map((count) => (
                        <button
                            key={count}
                            onClick={() => setSelectedCount(count)}
                            disabled={generating}
                            style={{
                                padding: '12px 24px',
                                background: selectedCount === count ? 'var(--button-primary)' : 'var(--bg-section)',
                                color: selectedCount === count ? 'var(--button-text)' : 'var(--text-primary)',
                                border: `2px solid ${selectedCount === count ? 'var(--button-primary)' : 'var(--border-color)'}`,
                                borderRadius: '8px',
                                cursor: generating ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                fontWeight: '500',
                                transition: 'all 0.2s',
                                opacity: generating ? 0.6 : 1
                            }}
                        >
                            {count} Questions
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button
                        onClick={() => onSelectCount(selectedType, selectedCount)}
                        disabled={generating}
                        style={{
                            padding: '12px 32px',
                            background: generating ? 'var(--bg-section)' : 'var(--button-primary)',
                            color: 'var(--button-text)',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: generating ? 'not-allowed' : 'pointer',
                            fontSize: '18px',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            opacity: generating ? 0.6 : 1
                        }}
                    >
                        {generating ? '🔄 Loading...' : 'Continue'}
                    </button>

                    <button
                        onClick={() => onSelectType(null)}
                        disabled={generating}
                        style={{
                            padding: '12px 24px',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            cursor: generating ? 'not-allowed' : 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Back
                    </button>
                </div>
            </div>
        </SlideUp>
    )
}

export default QuestionPrompt
