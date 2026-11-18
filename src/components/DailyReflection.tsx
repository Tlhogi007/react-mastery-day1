/**
 * Daily Reflection Prompts Component
 */

import { useState, useEffect, type JSX } from 'react'
import { reflectionStorage, type Reflection, type ReflectionPrompt } from '../services/reflectionStorage'
import Card from './Card'
import '../exercises/exerciseLayout.css'

interface DailyReflectionProps {
    day: number
}

function DailyReflection({ day }: DailyReflectionProps): JSX.Element {
    const [prompts, setPrompts] = useState<ReflectionPrompt[]>([])
    const [reflections, setReflections] = useState<Reflection[]>([])
    const [responses, setResponses] = useState<Record<string, string>>({})
    const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null)

    useEffect(() => {
        loadData()
    }, [day])

    const loadData = (): void => {
        const dayPrompts = reflectionStorage.getPromptsForDay(day)
        const dayReflections = reflectionStorage.getReflectionsForDay(day)
        
        setPrompts(dayPrompts)
        setReflections(dayReflections)
        
        // Load existing responses
        const existingResponses: Record<string, string> = {}
        dayReflections.forEach(ref => {
            existingResponses[ref.prompt] = ref.response
        })
        setResponses(existingResponses)
    }

    const handleResponseChange = (prompt: string, response: string): void => {
        setResponses(prev => ({ ...prev, [prompt]: response }))
        
        // Auto-save after 1 second of no typing
        const existingReflection = reflections.find(ref => ref.prompt === prompt)
        if (existingReflection) {
            reflectionStorage.updateReflection(existingReflection.id, response)
        } else {
            reflectionStorage.saveReflection(prompt, response, day)
        }
        
        // Reload to get updated reflections
        setTimeout(() => {
            loadData()
        }, 1000)
    }

    const handleExport = (): void => {
        const data = reflectionStorage.exportReflections()
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `react-mastery-reflections-day${day}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    const groupedPrompts = prompts.reduce((acc, prompt) => {
        if (!acc[prompt.category]) {
            acc[prompt.category] = []
        }
        acc[prompt.category].push(prompt)
        return acc
    }, {} as Record<string, ReflectionPrompt[]>)

    const categoryLabels: Record<string, string> = {
        learning: '📚 What I Learned',
        understanding: '💡 Understanding',
        application: '🚀 Application',
        challenges: '🎯 Challenges'
    }

    const containerStyle: React.CSSProperties = {
        color: 'var(--text-primary)'
    }

    const textareaStyle: React.CSSProperties = {
        width: '100%',
        minHeight: '120px',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid var(--border-primary)',
        background: 'var(--bg-section)',
        color: 'var(--text-primary)',
        fontSize: '14px',
        fontFamily: 'inherit',
        resize: 'vertical'
    }

    return (
        <div style={containerStyle}>
            <Card
                title="Daily Reflection"
                icon="🤔"
                style={{ marginBottom: '24px' }}
            >
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.45 }}>
                    Take a moment to reflect on what you learned today. Your responses are saved automatically.
                </p>

                <div className="lesson-action-stack reflection-export-row" style={{ marginBottom: '20px' }}>
                    <button
                        type="button"
                        className="lesson-full-btn"
                        onClick={handleExport}
                        style={{
                            border: '1px solid var(--border-primary)',
                            background: 'var(--bg-section)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '14px',
                        }}
                    >
                        Export Reflections
                    </button>
                </div>

                {Object.entries(groupedPrompts).map(([category, categoryPrompts]) => (
                    <div key={category} style={{ marginBottom: '20px' }}>
                        <h3 style={{
                          margin: '0 0 10px',
                          color: 'var(--text-primary)',
                          fontSize: 'clamp(0.95rem, 3vw, 1.1rem)',
                        }}>
                            {categoryLabels[category] || category}
                        </h3>
                        {categoryPrompts.map((prompt) => {
                            const isExpanded = expandedPrompt === prompt.id
                            const response = responses[prompt.prompt] || ''

                            return (
                                <div
                                    key={prompt.id}
                                    className="reflection-prompt-card"
                                    style={{
                                        marginBottom: '10px',
                                        padding: 'clamp(10px, 2.5vw, 14px)',
                                        background: 'var(--bg-section)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        minWidth: 0,
                                        boxSizing: 'border-box',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            gap: 10,
                                            marginBottom: isExpanded ? 12 : 0,
                                            cursor: 'pointer',
                                            minWidth: 0,
                                        }}
                                        onClick={() => setExpandedPrompt(isExpanded ? null : prompt.id)}
                                    >
                                        <h4 style={{
                                          margin: 0,
                                          flex: '1 1 auto',
                                          minWidth: 0,
                                          fontSize: 'clamp(0.9rem, 2.8vw, 1rem)',
                                          fontWeight: 550,
                                          lineHeight: 1.4,
                                          overflowWrap: 'anywhere',
                                        }}>
                                            {prompt.prompt}
                                        </h4>
                                        <span style={{ fontSize: '16px', flexShrink: 0, lineHeight: 1.2 }} aria-hidden>
                                            {isExpanded ? '▼' : '▶'}
                                        </span>
                                    </div>

                                    {isExpanded && (
                                        <div>
                                            <textarea
                                                value={response}
                                                onChange={(e) =>
                                                    handleResponseChange(prompt.prompt, e.target.value)
                                                }
                                                placeholder="Write your reflection here..."
                                                style={textareaStyle}
                                            />
                                            {response && (
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: 'var(--text-secondary)',
                                                    marginTop: '8px',
                                                    fontStyle: 'italic'
                                                }}>
                                                    💾 Auto-saved
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ))}

                {prompts.length === 0 && (
                    <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '40px' }}>
                        No reflection prompts available for Day {day}
                    </p>
                )}
            </Card>
        </div>
    )
}

export default DailyReflection
