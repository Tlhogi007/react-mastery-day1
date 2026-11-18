import { useState, useEffect, useRef, forwardRef, type JSX } from 'react'
import { Z_INDEX } from '../constants'
import { tracking } from '../lib/googleAnalytics'

interface SearchResult {
    day: number
    title: string
    section: string
    content: string
}

interface SearchBarProps {
    onSearch: (query: string) => void
    results?: SearchResult[]
    onResultClick?: (day: number) => void
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
    ({ onSearch, results = [], onResultClick }, ref): JSX.Element => {
        const [query, setQuery] = useState<string>('')
        const [showResults, setShowResults] = useState<boolean>(false)
        const searchRef = useRef<HTMLDivElement>(null)

        const handleSearch = (value: string): void => {
            setQuery(value)
            setShowResults(value.length > 0)
            onSearch(value)
            
            // Track search queries
            if (value.length > 2) {
                tracking.searchPerformed(value)
            }
        }

        // Close results when clicking outside
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent): void => {
                if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                    setShowResults(false)
                }
            }

            if (showResults) {
                document.addEventListener('mousedown', handleClickOutside)
            }

            return () => {
                document.removeEventListener('mousedown', handleClickOutside)
            }
        }, [showResults])

        const containerStyle: React.CSSProperties = {
            position: 'relative' as const,
            marginBottom: '20px'
        }

        const inputStyle: React.CSSProperties = {
            width: '100%',
            padding: '12px 40px 12px 15px',
            fontSize: '14px',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: `1px solid var(--border-color)`,
            borderRadius: '8px',
            outline: 'none',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box' as const
        }

        const resultsStyle: React.CSSProperties = {
            position: 'absolute' as const,
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--bg-card)',
            border: `1px solid var(--border-color)`,
            borderRadius: '8px',
            marginTop: '8px',
            maxHeight: '400px',
            overflowY: 'auto' as const,
            zIndex: Z_INDEX.DROPDOWN,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            borderTop: 'none',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0
        }

        return (
            <div ref={searchRef} style={containerStyle}>
                <div style={{ position: 'relative' }}>
                    <input
                        ref={ref}
                        type="text"
                        placeholder="Search concepts, exercises, or topics..."
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        onFocus={() => query.length > 0 && setShowResults(true)}
                        aria-label="Search exercises and concepts"
                        aria-expanded={showResults}
                        aria-controls="search-results"
                        style={{
                            ...inputStyle,
                            borderColor: showResults ? 'var(--border-primary)' : 'var(--border-color)'
                        }}
                    />
                    <span style={{
                        position: 'absolute' as const,
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '16px',
                        color: 'var(--text-secondary)',
                        pointerEvents: 'none'
                    }}>
                        🔍
                    </span>
                    {query && (
                        <button
                            onClick={() => {
                                setQuery('')
                                setShowResults(false)
                                onSearch('')
                            }}
                            style={{
                                position: 'absolute' as const,
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '20px'
                            }}
                        >
                            ×
                        </button>
                    )}
                </div>

                {showResults && results.length > 0 && (
                    <div id="search-results" role="listbox" aria-label="Search results" style={resultsStyle}>
                        {results.map((result, idx) => (
                            <div
                                key={idx}
                                role="option"
                                aria-label={`Day ${result.day}: ${result.title}`}
                                tabIndex={0}
                                style={{
                                    padding: '12px 16px',
                                    borderBottom: idx < results.length - 1 ? '1px solid var(--border-color)' : 'none',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    background: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--bg-section)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent'
                                }}
                                onClick={() => {
                                    setQuery('')
                                    setShowResults(false)
                                    onSearch('')
                                    onResultClick?.(result.day)
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault()
                                        setQuery('')
                                        setShowResults(false)
                                        onSearch('')
                                        onResultClick?.(result.day)
                                    }
                                }}
                            >
                                <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>
                                    Day {result.day}: {result.title}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    {result.section}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showResults && results.length === 0 && query && (
                    <div style={{
                        ...resultsStyle,
                        padding: '20px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)'
                    }}>
                        No results found for "{query}"
                    </div>
                )}
            </div>
        )
    }
)

SearchBar.displayName = 'SearchBar'

export default SearchBar
