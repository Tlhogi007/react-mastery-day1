import { Component, type ReactNode, type ErrorInfo } from 'react'
import { captureException } from '../lib/sentry'

const CHUNK_RELOAD_KEY = 'rm-chunk-reload'

function isChunkLoadError(error: Error | null): boolean {
    if (!error) return false
    const msg = `${error.name}: ${error.message}`
    return (
        error.name === 'ChunkLoadError' ||
        /Failed to fetch dynamically imported module/i.test(msg) ||
        /Loading chunk [\d]+ failed/i.test(msg) ||
        /Importing a module script failed/i.test(msg)
    )
}

/** One automatic reload after a deploy invalidated hashed chunks. */
function reloadOnceForStaleChunks(): boolean {
    try {
        if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') {
            sessionStorage.removeItem(CHUNK_RELOAD_KEY)
            return false
        }
        sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
    } catch {
        /* ignore quota / private mode */
    }
    window.location.reload()
    return true
}

interface ErrorBoundaryProps {
    children: ReactNode
    fallback?: ReactNode
    onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
    chunkLoad: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            chunkLoad: false,
        }
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error, chunkLoad: isChunkLoadError(error) }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({
            error,
            errorInfo,
            chunkLoad: isChunkLoadError(error),
        })

        // Call optional error handler
        this.props.onError?.(error, errorInfo)

        if (isChunkLoadError(error)) {
            // Stale Vite assets after deploy — hard reload once; don't spam Sentry.
            if (reloadOnceForStaleChunks()) return
        } else {
            captureException(error, {
                componentStack: errorInfo.componentStack,
            })
        }

        // Log to console in development
        if (import.meta.env.DEV) {
            console.error('ErrorBoundary caught an error:', error, errorInfo)
        }
    }

    handleReset = (): void => {
        if (this.state.chunkLoad || isChunkLoadError(this.state.error)) {
            try {
                sessionStorage.removeItem(CHUNK_RELOAD_KEY)
            } catch {
                /* ignore */
            }
            window.location.reload()
            return
        }
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            chunkLoad: false,
        })
    }

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div
                    style={{
                        minHeight: 'min(70vh, 640px)',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 'clamp(16px, 4vw, 40px)',
                        boxSizing: 'border-box',
                    }}
                >
                    <div
                        style={{
                            padding: 'clamp(20px, 4vw, 40px)',
                            textAlign: 'center',
                            background: 'var(--bg-card)',
                            border: '2px solid var(--border-warning)',
                            borderRadius: '12px',
                            margin: '0 auto',
                            width: '100%',
                            maxWidth: '560px',
                            color: 'var(--text-primary)',
                            boxSizing: 'border-box',
                        }}
                    >
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
                        <h2 style={{ margin: '0 0 16px', fontSize: '24px', fontWeight: 'bold' }}>
                            Something went wrong
                        </h2>
                        <p
                            style={{
                                margin: '0 0 24px',
                                fontSize: '16px',
                                color: 'var(--text-secondary)',
                                lineHeight: '1.6',
                            }}
                        >
                            {this.state.chunkLoad
                                ? 'This tab is running an older build. Reload to pick up the latest assets.'
                                : 'An error occurred while rendering this component. This has been logged and we\u2019ll look into it.'}
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <details
                                style={{
                                    marginBottom: '24px',
                                    padding: '16px',
                                    background: 'var(--bg-section)',
                                    borderRadius: '8px',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                }}
                            >
                                <summary
                                    style={{
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        marginBottom: '8px',
                                    }}
                                >
                                    Error Details (Development Only)
                                </summary>
                                <pre
                                    style={{
                                        marginTop: '12px',
                                        padding: '12px',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: '4px',
                                        overflow: 'auto',
                                        fontSize: '12px',
                                        fontFamily: 'monospace',
                                        color: 'var(--text-primary)',
                                        whiteSpace: 'pre-wrap',
                                        overflowWrap: 'break-word',
                                    }}
                                >
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack && (
                                        <>
                                            {'\n\nComponent Stack:'}
                                            {this.state.errorInfo.componentStack}
                                        </>
                                    )}
                                </pre>
                            </details>
                        )}

                        <button
                            type="button"
                            onClick={this.handleReset}
                            style={{
                                padding: '12px 24px',
                                background: 'var(--button-primary)',
                                color: 'var(--button-text)',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                                width: '100%',
                                maxWidth: 280,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--button-primary-hover)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--button-primary)'
                            }}
                        >
                            {this.state.chunkLoad ? 'Reload' : 'Try Again'}
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
