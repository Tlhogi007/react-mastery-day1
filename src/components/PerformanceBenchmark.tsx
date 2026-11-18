/**
 * Performance Benchmarking Playground Component
 * Compare multiple approaches side-by-side with real-time metrics
 */

import { useState, useEffect, useRef, type JSX } from 'react'
import Card from './Card'
import CodePlayground from './CodePlayground'

interface BenchmarkApproach {
    id: string
    name: string
    code: string
    description: string
}

interface BenchmarkMetrics {
    renderCount: number
    averageRenderTime: number
    totalTime: number
    lastRenderTime: number
}

interface PerformanceBenchmarkProps {
    approaches: BenchmarkApproach[]
    title?: string
}

function PerformanceBenchmark({ approaches, title = 'Performance Benchmark' }: PerformanceBenchmarkProps): JSX.Element {
    const [selectedApproach, setSelectedApproach] = useState<string>(approaches[0]?.id || '')
    const [metrics, setMetrics] = useState<Record<string, BenchmarkMetrics>>({})
    const [isRunning, setIsRunning] = useState<boolean>(false)
    const renderCountRefs = useRef<Record<string, number>>({})
    const renderTimeRefs = useRef<Record<string, number[]>>({})

    useEffect(() => {
        // Initialize metrics
        const initialMetrics: Record<string, BenchmarkMetrics> = {}
        approaches.forEach(approach => {
            renderCountRefs.current[approach.id] = 0
            renderTimeRefs.current[approach.id] = []
            initialMetrics[approach.id] = {
                renderCount: 0,
                averageRenderTime: 0,
                totalTime: 0,
                lastRenderTime: 0
            }
        })
        setMetrics(initialMetrics)
    }, [approaches])

    const measureRender = (approachId: string): void => {
        const startTime = performance.now()

        requestAnimationFrame(() => {
            const endTime = performance.now()
            const renderTime = endTime - startTime

            renderCountRefs.current[approachId] = (renderCountRefs.current[approachId] || 0) + 1
            const times = renderTimeRefs.current[approachId] || []
            times.push(renderTime)
            if (times.length > 100) times.shift() // Keep last 100
            renderTimeRefs.current[approachId] = times

            setMetrics(prev => ({
                ...prev,
                [approachId]: {
                    renderCount: renderCountRefs.current[approachId],
                    averageRenderTime: times.reduce((a, b) => a + b, 0) / times.length,
                    totalTime: times.reduce((a, b) => a + b, 0),
                    lastRenderTime: renderTime
                }
            }))
        })
    }

    const handleRunBenchmark = (): void => {
        setIsRunning(true)
        // Simulate multiple renders
        let iterations = 0
        const maxIterations = 10

        const interval = setInterval(() => {
            approaches.forEach(approach => {
                measureRender(approach.id)
            })
            iterations++
            if (iterations >= maxIterations) {
                clearInterval(interval)
                setIsRunning(false)
            }
        }, 100)
    }

    const handleReset = (): void => {
        approaches.forEach(approach => {
            renderCountRefs.current[approach.id] = 0
            renderTimeRefs.current[approach.id] = []
        })
        const resetMetrics: Record<string, BenchmarkMetrics> = {}
        approaches.forEach(approach => {
            resetMetrics[approach.id] = {
                renderCount: 0,
                averageRenderTime: 0,
                totalTime: 0,
                lastRenderTime: 0
            }
        })
        setMetrics(resetMetrics)
    }

    const currentApproach = approaches.find(a => a.id === selectedApproach)
    const currentMetrics = metrics[selectedApproach] || {
        renderCount: 0,
        averageRenderTime: 0,
        totalTime: 0,
        lastRenderTime: 0
    }

    const containerStyle: React.CSSProperties = {
        color: 'var(--text-primary)'
    }

    const metricCardStyle: React.CSSProperties = {
        padding: '16px',
        background: 'var(--bg-section)',
        borderRadius: '8px',
        border: '1px solid var(--border-primary)',
        textAlign: 'center'
    }

    return (
        <div style={containerStyle}>
            <Card
                title={title}
                icon="⚡"
                style={{ marginBottom: '24px' }}
            >
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        {approaches.map(approach => (
                            <button
                                key={approach.id}
                                onClick={() => setSelectedApproach(approach.id)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: selectedApproach === approach.id ? 'var(--button-primary)' : 'var(--bg-section)',
                                    color: selectedApproach === approach.id ? 'var(--button-text)' : 'var(--text-primary)',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                {approach.name}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <button
                            onClick={handleRunBenchmark}
                            disabled={isRunning}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '6px',
                                border: 'none',
                                background: isRunning ? 'var(--bg-section)' : 'var(--button-primary)',
                                color: isRunning ? 'var(--text-secondary)' : 'var(--button-text)',
                                cursor: isRunning ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}
                        >
                            {isRunning ? 'Running...' : 'Run Benchmark'}
                        </button>
                        <button
                            onClick={handleReset}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-primary)',
                                background: 'var(--bg-section)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {currentApproach && (
                    <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ marginBottom: '8px' }}>{currentApproach.name}</h4>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
                            {currentApproach.description}
                        </p>
                        <CodePlayground
                            initialCode={currentApproach.code}
                            readOnly={true}
                        />
                    </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ marginBottom: '12px' }}>Performance Metrics</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        <div style={metricCardStyle}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                Render Count
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                {currentMetrics.renderCount}
                            </div>
                        </div>
                        <div style={metricCardStyle}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                Avg Render Time
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                {currentMetrics.averageRenderTime.toFixed(2)}ms
                            </div>
                        </div>
                        <div style={metricCardStyle}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                Last Render
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                {currentMetrics.lastRenderTime.toFixed(2)}ms
                            </div>
                        </div>
                        <div style={metricCardStyle}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                Total Time
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                {currentMetrics.totalTime.toFixed(2)}ms
                            </div>
                        </div>
                    </div>
                </div>

                {approaches.length > 1 && (
                    <div>
                        <h4 style={{ marginBottom: '12px' }}>Comparison</h4>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-primary)' }}>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Approach</th>
                                        <th style={{ padding: '12px', textAlign: 'right' }}>Renders</th>
                                        <th style={{ padding: '12px', textAlign: 'right' }}>Avg Time</th>
                                        <th style={{ padding: '12px', textAlign: 'right' }}>Total Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {approaches.map(approach => {
                                        const approachMetrics = metrics[approach.id] || {
                                            renderCount: 0,
                                            averageRenderTime: 0,
                                            totalTime: 0,
                                            lastRenderTime: 0
                                        }
                                        const isBest = approaches.every(other => {
                                            if (other.id === approach.id) return true
                                            const otherMetrics = metrics[other.id] || approachMetrics
                                            return approachMetrics.averageRenderTime <= otherMetrics.averageRenderTime
                                        })

                                        return (
                                            <tr
                                                key={approach.id}
                                                style={{
                                                    borderBottom: '1px solid var(--border-primary)',
                                                    background: selectedApproach === approach.id ? 'var(--bg-info)' : 'transparent',
                                                    color: selectedApproach === approach.id ? 'var(--text-on-info)' : 'var(--text-primary)'
                                                }}
                                            >
                                                <td style={{ padding: '12px' }}>
                                                    {approach.name}
                                                    {isBest && approachMetrics.renderCount > 0 && (
                                                        <span style={{ marginLeft: '8px', color: 'var(--text-on-success)' }}>🏆</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                                    {approachMetrics.renderCount}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                                    {approachMetrics.averageRenderTime.toFixed(2)}ms
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                                    {approachMetrics.totalTime.toFixed(2)}ms
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    )
}

export default PerformanceBenchmark
