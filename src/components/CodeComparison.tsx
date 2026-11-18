/**
 * Code Comparison Tool Component
 * Side-by-side before/after code comparison with diff highlighting
 */

import { useState, type JSX } from 'react'
import Card from './Card'
import CodePlayground from './CodePlayground'

interface CodeComparisonProps {
    beforeCode: string
    afterCode: string
    title?: string
    explanation?: string
    showPerformance?: boolean
    performanceMetrics?: {
        before: { renders: number; time: number }
        after: { renders: number; time: number }
    }
}

function CodeComparison({
    beforeCode,
    afterCode,
    title = 'Code Comparison',
    explanation,
    showPerformance = false,
    performanceMetrics
}: CodeComparisonProps): JSX.Element {
    const [viewMode, setViewMode] = useState<'split' | 'before' | 'after'>('split')
    const [showDiff, setShowDiff] = useState<boolean>(true)

    // Simple diff algorithm - highlight changed lines
    const getDiffLines = (before: string, after: string): Array<{ line: string; type: 'same' | 'removed' | 'added' }> => {
        const beforeLines = before.split('\n')
        const afterLines = after.split('\n')
        const diff: Array<{ line: string; type: 'same' | 'removed' | 'added' }> = []

        // Simple line-by-line comparison
        const maxLines = Math.max(beforeLines.length, afterLines.length)
        for (let i = 0; i < maxLines; i++) {
            const beforeLine = beforeLines[i] || ''
            const afterLine = afterLines[i] || ''

            if (beforeLine === afterLine) {
                diff.push({ line: afterLine, type: 'same' })
            } else {
                if (beforeLine) {
                    diff.push({ line: beforeLine, type: 'removed' })
                }
                if (afterLine) {
                    diff.push({ line: afterLine, type: 'added' })
                }
            }
        }

        return diff
    }

    const diffLines = showDiff ? getDiffLines(beforeCode, afterCode) : []

    const containerStyle: React.CSSProperties = {
        color: 'var(--text-primary)'
    }

    const codeContainerStyle: React.CSSProperties = {
        display: 'flex',
        gap: '16px',
        marginBottom: '20px'
    }

    const codeBlockStyle: React.CSSProperties = {
        flex: 1,
        border: '1px solid var(--border-primary)',
        borderRadius: '8px',
        overflow: 'hidden'
    }

    const headerStyle: React.CSSProperties = {
        padding: '12px',
        background: 'var(--bg-section)',
        borderBottom: '1px solid var(--border-primary)',
        fontWeight: 'bold',
        fontSize: '14px'
    }

    const diffLineStyle = (type: 'same' | 'removed' | 'added'): React.CSSProperties => {
        const baseStyle: React.CSSProperties = {
            padding: '4px 12px',
            fontFamily: 'monospace',
            fontSize: '13px',
            lineHeight: '1.6'
        }

        switch (type) {
            case 'removed':
                return {
                    ...baseStyle,
                    background: 'var(--bg-error)',
                    color: 'var(--text-on-error)',
                    textDecoration: 'line-through'
                }
            case 'added':
                return {
                    ...baseStyle,
                    background: 'var(--bg-success)',
                    color: 'var(--text-on-success)'
                }
            default:
                return baseStyle
        }
    }

    return (
        <div style={containerStyle}>
            <Card
                title={title}
                icon="⚖️"
                style={{ marginBottom: '24px' }}
            >
                {explanation && (
                    <div style={{
                        padding: '16px',
                        background: 'var(--bg-info)',
                        color: 'var(--text-on-info)',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        lineHeight: '1.6'
                    }}>
                        {explanation}
                    </div>
                )}

                <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setViewMode('split')}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: viewMode === 'split' ? 'var(--button-primary)' : 'var(--bg-section)',
                            color: viewMode === 'split' ? 'var(--button-text)' : 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        Split View
                    </button>
                    <button
                        onClick={() => setViewMode('before')}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: viewMode === 'before' ? 'var(--button-primary)' : 'var(--bg-section)',
                            color: viewMode === 'before' ? 'var(--button-text)' : 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        Before Only
                    </button>
                    <button
                        onClick={() => setViewMode('after')}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: viewMode === 'after' ? 'var(--button-primary)' : 'var(--bg-section)',
                            color: viewMode === 'after' ? 'var(--button-text)' : 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        After Only
                    </button>
                    {viewMode === 'split' && (
                        <button
                            onClick={() => setShowDiff(!showDiff)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: showDiff ? 'var(--button-primary)' : 'var(--bg-section)',
                                color: showDiff ? 'var(--button-text)' : 'var(--text-primary)',
                                cursor: 'pointer',
                                fontSize: '12px',
                                marginLeft: 'auto'
                            }}
                        >
                            {showDiff ? 'Hide Diff' : 'Show Diff'}
                        </button>
                    )}
                </div>

                {showPerformance && performanceMetrics && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '16px',
                        marginBottom: '20px'
                    }}>
                        <div style={{
                            padding: '16px',
                            background: 'var(--bg-section)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-primary)'
                        }}>
                            <h4 style={{ marginTop: 0, marginBottom: '12px' }}>❌ Before</h4>
                            <div style={{ fontSize: '14px' }}>
                                <div>Renders: {performanceMetrics.before.renders}</div>
                                <div>Time: {performanceMetrics.before.time}ms</div>
                            </div>
                        </div>
                        <div style={{
                            padding: '16px',
                            background: 'var(--bg-section)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-primary)'
                        }}>
                            <h4 style={{ marginTop: 0, marginBottom: '12px' }}>✅ After</h4>
                            <div style={{ fontSize: '14px' }}>
                                <div>Renders: {performanceMetrics.after.renders}</div>
                                <div>Time: {performanceMetrics.after.time}ms</div>
                            </div>
                            <div style={{
                                marginTop: '8px',
                                padding: '8px',
                                background: 'var(--bg-success)',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}>
                                {performanceMetrics.before.renders > performanceMetrics.after.renders && (
                                    <div>🎉 {performanceMetrics.before.renders - performanceMetrics.after.renders} fewer renders!</div>
                                )}
                                {performanceMetrics.before.time > performanceMetrics.after.time && (
                                    <div>⚡ {((performanceMetrics.before.time - performanceMetrics.after.time) / performanceMetrics.before.time * 100).toFixed(1)}% faster!</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'split' && !showDiff && (
                    <div style={codeContainerStyle}>
                        <div style={codeBlockStyle}>
                            <div style={{ ...headerStyle, background: 'var(--bg-error)', color: 'var(--text-on-error)' }}>
                                ❌ Before
                            </div>
                        <CodePlayground
                            initialCode={beforeCode}
                            readOnly={true}
                        />
                        </div>
                        <div style={codeBlockStyle}>
                            <div style={{ ...headerStyle, background: 'var(--bg-success)', color: 'var(--text-on-success)' }}>
                                ✅ After
                            </div>
                        <CodePlayground
                            initialCode={afterCode}
                            readOnly={true}
                        />
                        </div>
                    </div>
                )}

                {viewMode === 'split' && showDiff && (
                    <div style={{
                        border: '1px solid var(--border-primary)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: 'var(--bg-section)'
                    }}>
                        <div style={{ ...headerStyle, textAlign: 'center' }}>
                            Diff View
                        </div>
                        <div style={{ maxHeight: '500px', overflow: 'auto' }}>
                            {diffLines.map((diff, index) => (
                                <div key={index} style={diffLineStyle(diff.type)}>
                                    {diff.type === 'removed' && '-'}
                                    {diff.type === 'added' && '+'}
                                    {' '}
                                    {diff.line || '\u00A0'}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {(viewMode === 'before' || viewMode === 'after') && (
                    <div style={codeBlockStyle}>
                        <div style={headerStyle}>
                            {viewMode === 'before' ? '❌ Before' : '✅ After'}
                        </div>
                        <CodePlayground
                            initialCode={viewMode === 'before' ? beforeCode : afterCode}
                            readOnly={true}
                        />
                    </div>
                )}
            </Card>
        </div>
    )
}

export default CodeComparison
