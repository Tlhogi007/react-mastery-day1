/**
 * AI Generation Prompt Component
 * Single Responsibility: Allow user to select number of AI questions to generate
 */

import { useState, type JSX } from 'react'
import SlideUp from '../animations/SlideUp'

interface AIGenerationPromptProps {
    localScore: number
    localQuestionsCount: number
    onGenerate: (count: number) => void
    generating: boolean
    errorMessage: string | null
}

function AIGenerationPrompt({
    localScore,
    localQuestionsCount,
    onGenerate,
    generating,
    errorMessage
}: AIGenerationPromptProps): JSX.Element {
    const [selectedCount, setSelectedCount] = useState<number>(5)

    const options = [0, 5, 10, 15]

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
                <h2 style={{ marginBottom: '10px' }}>🎉 Local Questions Complete!</h2>
                <div style={{
                    fontSize: '24px',
                    marginBottom: '20px',
                    color: 'var(--text-primary)'
                }}>
                    Score: {localScore} / {localQuestionsCount}
                </div>
                <div style={{
                    fontSize: '18px',
                    marginBottom: '10px',
                    color: 'var(--text-secondary)'
                }}>
                    Would you like to add AI-generated questions to test your knowledge further?
                </div>
                <div style={{
                    fontSize: '14px',
                    marginBottom: '30px',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic'
                }}>
                    💡 AI questions are generated from free APIs and local templates. They may include general programming questions related to this topic.
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                    marginBottom: '30px'
                }}>
                    {options.map((count) => (
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
                            {count === 0 ? 'Skip' : `${count} Questions`}
                        </button>
                    ))}
                </div>

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

                <button
                    onClick={() => onGenerate(selectedCount)}
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
                    {generating ? '🔄 Generating Questions...' : selectedCount === 0 ? 'Finish Quiz' : 'Generate & Continue'}
                </button>

                {generating && (
                    <div style={{
                        marginTop: '20px',
                        fontSize: '14px',
                        color: 'var(--text-secondary)'
                    }}>
                        Please wait while we generate {selectedCount} AI questions for you...
                    </div>
                )}
            </div>
        </SlideUp>
    )
}

export default AIGenerationPrompt
