import {
  useState,
  useEffect,
  useId,
  useRef,
  forwardRef,
  type JSX,
  type KeyboardEvent,
} from 'react'
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

function resultKey(result: SearchResult): string {
  return `day-${result.day}-${result.section}-${result.title}`
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ onSearch, results = [], onResultClick }, ref): JSX.Element => {
    const [query, setQuery] = useState<string>('')
    const [showResults, setShowResults] = useState<boolean>(false)
    const [activeIndex, setActiveIndex] = useState<number>(-1)
    const searchRef = useRef<HTMLDivElement>(null)
    const listboxId = useId()
    const optionId = (index: number) => `${listboxId}-option-${index}`

    const handleSearch = (value: string): void => {
      setQuery(value)
      setShowResults(value.length > 0)
      setActiveIndex(-1)
      onSearch(value)

      if (value.length > 2) {
        tracking.searchPerformed(value)
      }
    }

    const selectResult = (result: SearchResult): void => {
      setQuery('')
      setShowResults(false)
      setActiveIndex(-1)
      onSearch('')
      onResultClick?.(result.day)
    }

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent): void => {
        if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
          setShowResults(false)
          setActiveIndex(-1)
        }
      }

      if (showResults) {
        document.addEventListener('mousedown', handleClickOutside)
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [showResults])

    useEffect(() => {
      if (activeIndex >= results.length) {
        setActiveIndex(results.length > 0 ? results.length - 1 : -1)
      }
    }, [results.length, activeIndex])

    const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
      if (!showResults && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && results.length > 0) {
        setShowResults(true)
      }

      if (e.key === 'ArrowDown') {
        if (results.length === 0) return
        e.preventDefault()
        setShowResults(true)
        setActiveIndex((prev) => (prev + 1) % results.length)
        return
      }

      if (e.key === 'ArrowUp') {
        if (results.length === 0) return
        e.preventDefault()
        setShowResults(true)
        setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1))
        return
      }

      if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault()
        selectResult(results[activeIndex])
        return
      }

      if (e.key === 'Escape') {
        setShowResults(false)
        setActiveIndex(-1)
      }
    }

    const containerStyle: React.CSSProperties = {
      position: 'relative' as const,
      marginBottom: 0,
      width: '100%',
    }

    const inputStyle: React.CSSProperties = {
      width: '100%',
      padding: '8px 32px 8px 12px',
      fontSize: '13px',
      fontFamily: 'inherit',
      background: 'var(--bg-section)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-color)',
      borderRadius: 10,
      outline: 'none',
      transition: 'border-color 0.15s ease',
      boxSizing: 'border-box' as const,
      height: 38,
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
      borderTopRightRadius: 0,
    }

    const activeDescendant =
      showResults && activeIndex >= 0 && results[activeIndex] ? optionId(activeIndex) : undefined

    return (
      <div ref={searchRef} data-tutorial="search" style={containerStyle}>
        <div style={{ position: 'relative' }}>
          <input
            ref={ref}
            type="text"
            role="combobox"
            placeholder="Find a topic…"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query.length > 0 && setShowResults(true)}
            onKeyDown={onInputKeyDown}
            aria-label="Search exercises and concepts"
            aria-expanded={showResults}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeDescendant}
            style={{
              ...inputStyle,
              borderColor: showResults ? 'var(--button-primary)' : 'var(--border-color)',
            }}
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery('')
                setShowResults(false)
                setActiveIndex(-1)
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
                fontSize: '20px',
              }}
            >
              ×
            </button>
          )}
        </div>

        {showResults && results.length > 0 && (
          <div
            id={listboxId}
            role="listbox"
            aria-label="Search results"
            style={resultsStyle}
          >
            {results.map((result, idx) => {
              const active = idx === activeIndex
              return (
                <div
                  key={resultKey(result)}
                  id={optionId(idx)}
                  role="option"
                  aria-selected={active}
                  aria-label={`Day ${result.day}: ${result.title}`}
                  style={{
                    padding: '12px 16px',
                    borderBottom:
                      idx < results.length - 1 ? '1px solid var(--border-color)' : 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    background: active ? 'var(--bg-section)' : 'transparent',
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => selectResult(result)}
                >
                  <div
                    style={{
                      fontWeight: '600',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Day {result.day}: {result.title}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      marginTop: '4px',
                    }}
                  >
                    {result.section}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {showResults && results.length === 0 && query && (
          <div
            id={listboxId}
            role="listbox"
            aria-label="Search results"
            style={{
              ...resultsStyle,
              padding: '20px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            No results found for "{query}"
          </div>
        )}
      </div>
    )
  },
)

SearchBar.displayName = 'SearchBar'

export default SearchBar
