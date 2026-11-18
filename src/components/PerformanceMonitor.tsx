import { useState, useEffect, useRef, type JSX } from 'react'

interface PerformanceMetrics {
    renderCount: number
    renderTimes: number[]
    averageRenderTime: number
    lastRenderTime: number
}

interface PerformanceMonitorProps {
    componentName: string
}

function PerformanceMonitor({ componentName }: PerformanceMonitorProps): JSX.Element {
    const [metrics, setMetrics] = useState<PerformanceMetrics>({
        renderCount: 0,
        renderTimes: [],
        averageRenderTime: 0,
        lastRenderTime: 0
    })
    const renderStartTime = useRef<number>(0)

    useEffect(() => {
        renderStartTime.current = performance.now()

        return () => {
            const renderTime = performance.now() - renderStartTime.current
            setMetrics(prev => {
                const newRenderTimes = [...prev.renderTimes, renderTime].slice(-10) // Keep last 10
                return {
                    renderCount: prev.renderCount + 1,
                    renderTimes: newRenderTimes,
                    averageRenderTime: newRenderTimes.reduce((a, b) => a + b, 0) / newRenderTimes.length,
                    lastRenderTime: renderTime
                }
            })
        }
    })

    const containerStyle: React.CSSProperties = {
        border: '2px solid var(--border-primary)',
        borderRadius: '8px',
        padding: '15px',
        background: 'var(--bg-card)',
        marginTop: '20px',
        fontFamily: 'monospace',
        fontSize: '13px'
    }

    const getPerformanceColor = (time: number): string => {
        if (time < 5) return 'var(--bg-success)'
        if (time < 16) return 'var(--bg-warning)'
        return 'var(--bg-warning)'
    }

    return (
        <div style={containerStyle}>
            <h4 style={{ marginTop: 0 }}>📊 Performance Monitor: {componentName}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '15px' }}>
                <div style={{ padding: '10px', background: 'var(--bg-section)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Render Count</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{metrics.renderCount}</div>
                </div>
                <div style={{ padding: '10px', background: 'var(--bg-section)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Last Render</div>
                    <div style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: getPerformanceColor(metrics.lastRenderTime)
                    }}>
                        {metrics.lastRenderTime.toFixed(2)}ms
                    </div>
                </div>
                <div style={{ padding: '10px', background: 'var(--bg-section)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Avg Render</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                        {metrics.averageRenderTime.toFixed(2)}ms
                    </div>
                </div>
                <div style={{ padding: '10px', background: 'var(--bg-section)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Status</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
                        {metrics.averageRenderTime < 16 ? '✅ Good' : '⚠️ Slow'}
                    </div>
                </div>
            </div>
            <div style={{
                marginTop: '15px',
                padding: '10px',
                background: 'var(--bg-info)',
                color: 'var(--text-on-info)',
                borderRadius: '4px',
                fontSize: '11px'
            }}>
                💡 Target: &lt;16ms per render (60fps). Use React DevTools Profiler for detailed analysis.
            </div>
        </div>
    )
}

export default PerformanceMonitor
