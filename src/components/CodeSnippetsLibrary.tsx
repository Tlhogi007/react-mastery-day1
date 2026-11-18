/**
 * Code Snippets Library Component
 * Searchable collection of React patterns
 */

import { useState, useEffect, type JSX } from 'react'
import { codeSnippetsService, type CodeSnippet } from '../services/codeSnippets'
import Card from './Card'
import CodePlayground from './CodePlayground'

function CodeSnippetsLibrary(): JSX.Element {
    const [snippets, setSnippets] = useState<CodeSnippet[]>([])
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
    const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null)
    const [categories, setCategories] = useState<string[]>([])

    useEffect(() => {
        loadSnippets()
        setCategories(codeSnippetsService.getCategories())
    }, [])

    useEffect(() => {
        filterSnippets()
    }, [searchQuery, selectedCategory, selectedDifficulty])

    const loadSnippets = (): void => {
        setSnippets(codeSnippetsService.getSnippets())
    }

    const filterSnippets = (): void => {
        const results = codeSnippetsService.searchSnippets(searchQuery, {
            category: selectedCategory !== 'all' ? selectedCategory : undefined,
            difficulty: selectedDifficulty !== 'all' ? selectedDifficulty as 'easy' | 'medium' | 'hard' : undefined
        })
        setSnippets(results)
    }

    const handleCopyCode = (code: string): void => {
        navigator.clipboard.writeText(code)
        // Could show toast notification here
    }

    const containerStyle: React.CSSProperties = {
        color: 'var(--text-primary)',
        padding: '20px'
    }

    const snippetCardStyle: React.CSSProperties = {
        padding: '16px',
        background: 'var(--bg-section)',
        borderRadius: '8px',
        border: '1px solid var(--border-primary)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        marginBottom: '12px'
    }

    return (
        <div style={containerStyle}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ marginBottom: '10px' }}>📚 Code Snippets Library</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Searchable collection of React patterns. Copy-paste ready examples.
                </p>
            </div>

            <Card
                title="Search & Filter"
                icon="🔍"
                style={{ marginBottom: '24px' }}
            >
                <div style={{ marginBottom: '16px' }}>
                    <input
                        type="text"
                        placeholder="Search snippets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-primary)',
                            background: 'var(--bg-section)',
                            color: 'var(--text-primary)',
                            fontSize: '16px'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Category</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-primary)',
                                background: 'var(--bg-section)',
                                color: 'var(--text-primary)'
                            }}
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Difficulty</label>
                        <select
                            value={selectedDifficulty}
                            onChange={(e) => setSelectedDifficulty(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-primary)',
                                background: 'var(--bg-section)',
                                color: 'var(--text-primary)'
                            }}
                        >
                            <option value="all">All Difficulties</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>
                </div>

                <div style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Found {snippets.length} snippet{snippets.length !== 1 ? 's' : ''}
                </div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: selectedSnippet ? '1fr 1fr' : '1fr', gap: '20px' }}>
                <div>
                    <h3 style={{ marginBottom: '16px' }}>Snippets</h3>
                    {snippets.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '40px' }}>
                            No snippets found. Try adjusting your filters.
                        </p>
                    ) : (
                        <div>
                            {snippets.map(snippet => (
                                <div
                                    key={snippet.id}
                                    onClick={() => setSelectedSnippet(snippet)}
                                    style={{
                                        ...snippetCardStyle,
                                        background: selectedSnippet?.id === snippet.id ? 'var(--bg-info)' : 'var(--bg-section)',
                                        color: selectedSnippet?.id === snippet.id ? 'var(--text-on-info)' : 'var(--text-primary)',
                                        borderColor: selectedSnippet?.id === snippet.id ? 'var(--button-primary)' : 'var(--border-primary)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                        <h4 style={{ margin: 0, fontSize: '16px' }}>{snippet.title}</h4>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            background: snippet.difficulty === 'easy' ? 'var(--bg-success)' :
                                                snippet.difficulty === 'medium' ? 'var(--bg-warning)' : 'var(--bg-error)',
                                            color: snippet.difficulty === 'easy' ? 'var(--text-on-success)' :
                                                snippet.difficulty === 'medium' ? 'var(--text-on-warning)' : 'var(--text-on-error)',
                                            fontSize: '11px',
                                            fontWeight: 'bold'
                                        }}>
                                            {snippet.difficulty}
                                        </span>
                                    </div>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                        {snippet.description}
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            background: 'var(--bg-card)',
                                            fontSize: '11px'
                                        }}>
                                            {snippet.category}
                                        </span>
                                        {snippet.tags.slice(0, 3).map(tag => (
                                            <span
                                                key={tag}
                                                style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    background: 'var(--bg-card)',
                                                    fontSize: '11px',
                                                    color: 'var(--text-secondary)'
                                                }}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {selectedSnippet && (
                    <div>
                        <Card
                            title={selectedSnippet.title}
                            icon="💻"
                            style={{ marginBottom: '24px', position: 'sticky', top: '20px' }}
                        >
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                {selectedSnippet.description}
                            </p>

                            <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => handleCopyCode(selectedSnippet.code)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: 'var(--button-primary)',
                                        color: 'var(--button-text)',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    📋 Copy Code
                                </button>
                            </div>

                            <CodePlayground
                                initialCode={selectedSnippet.code}
                                readOnly={true}
                                height={600}
                            />

                            <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                <div>Category: {selectedSnippet.category}</div>
                                <div>Difficulty: {selectedSnippet.difficulty}</div>
                                <div>Related Days: {selectedSnippet.relatedDays.join(', ')}</div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CodeSnippetsLibrary
