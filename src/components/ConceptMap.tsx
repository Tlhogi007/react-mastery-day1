/**
 * Concept Map / Knowledge Graph Component
 * Interactive visualization of React concepts and their relationships
 */

import { useState, type JSX } from 'react'
import Card from './Card'

interface Concept {
    id: string
    label: string
    day: number
    category: string
    x: number // Position for visualization
    y: number
    connections: string[] // IDs of connected concepts
    description: string
}

interface ConceptMapProps {
    onConceptClick?: (concept: Concept) => void
}

// Define React concepts and their relationships
const concepts: Concept[] = [
    {
        id: 'rendering-pipeline',
        label: 'Rendering Pipeline',
        day: 1,
        category: 'core',
        x: 50,
        y: 50,
        connections: ['reconciliation', 'fiber', 'virtual-dom'],
        description: 'Render phase (interruptible) and Commit phase (synchronous)'
    },
    {
        id: 'virtual-dom',
        label: 'Virtual DOM',
        day: 1,
        category: 'core',
        x: 20,
        y: 30,
        connections: ['rendering-pipeline', 'reconciliation'],
        description: 'JavaScript representation of the DOM for efficient diffing'
    },
    {
        id: 'reconciliation',
        label: 'Reconciliation',
        day: 2,
        category: 'core',
        x: 80,
        y: 50,
        connections: ['rendering-pipeline', 'fiber', 'keys'],
        description: 'Algorithm for determining what changed in the component tree'
    },
    {
        id: 'keys',
        label: 'Keys & Identity',
        day: 2,
        category: 'core',
        x: 90,
        y: 70,
        connections: ['reconciliation', 'memoization'],
        description: 'Stable identifiers for list items to enable efficient reconciliation'
    },
    {
        id: 'fiber',
        label: 'Fiber Architecture',
        day: 3,
        category: 'architecture',
        x: 50,
        y: 80,
        connections: ['rendering-pipeline', 'reconciliation', 'concurrent'],
        description: 'Unit of work model enabling interruptible rendering'
    },
    {
        id: 'memoization',
        label: 'Memoization',
        day: 4,
        category: 'optimization',
        x: 30,
        y: 70,
        connections: ['keys', 'context', 'effects'],
        description: 'React.memo, useMemo, useCallback to prevent unnecessary work'
    },
    {
        id: 'effects',
        label: 'Effects & Closures',
        day: 5,
        category: 'core',
        x: 20,
        y: 90,
        connections: ['rendering-pipeline', 'memoization', 'context'],
        description: 'useEffect timing, cleanup, and stale closure patterns'
    },
    {
        id: 'context',
        label: 'Context',
        day: 6,
        category: 'state',
        x: 70,
        y: 90,
        connections: ['memoization', 'effects', 'reconciliation'],
        description: 'Context API for prop drilling, re-render propagation, and optimization'
    },
    {
        id: 'concurrent',
        label: 'Concurrent Rendering',
        day: 8,
        category: 'advanced',
        x: 50,
        y: 100,
        connections: ['fiber', 'rendering-pipeline'],
        description: 'React 18 concurrent features enabled by Fiber'
    }
]

function ConceptMap({ onConceptClick }: ConceptMapProps): JSX.Element {
    const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null)
    const [hoveredConcept, setHoveredConcept] = useState<string | null>(null)
    const [filterCategory, setFilterCategory] = useState<string>('all')

    const categories = Array.from(new Set(concepts.map(c => c.category)))

    const handleConceptClick = (concept: Concept): void => {
        setSelectedConcept(concept)
        onConceptClick?.(concept)
    }

    const filteredConcepts = filterCategory === 'all'
        ? concepts
        : concepts.filter(c => c.category === filterCategory)

    const getConnectedConcepts = (conceptId: string): Concept[] => {
        const concept = concepts.find(c => c.id === conceptId)
        if (!concept) return []
        return concepts.filter(c => concept.connections.includes(c.id))
    }

    const containerStyle: React.CSSProperties = {
        color: 'var(--text-primary)',
        padding: '20px'
    }

    const svgStyle: React.CSSProperties = {
        width: '100%',
        height: '600px',
        border: '1px solid var(--border-primary)',
        borderRadius: '8px',
        background: 'var(--bg-section)'
    }

    const getCategoryColor = (category: string): string => {
        const colors: Record<string, string> = {
            core: 'var(--button-primary)',
            architecture: 'var(--bg-concepts)',
            optimization: 'var(--bg-success)',
            state: 'var(--bg-warning)',
            advanced: 'var(--bg-error)'
        }
        return colors[category] || 'var(--text-muted)'
    }

    return (
        <div style={containerStyle}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ marginBottom: '10px' }}>🗺️ Concept Map</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Interactive visualization of React concepts and their relationships. Click concepts to explore.
                </p>
            </div>

            <Card
                title="Knowledge Graph"
                icon="🌐"
                style={{ marginBottom: '24px' }}
            >
                <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setFilterCategory('all')}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: filterCategory === 'all' ? 'var(--button-primary)' : 'var(--bg-section)',
                            color: filterCategory === 'all' ? 'var(--button-text)' : 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: filterCategory === cat ? 'var(--button-primary)' : 'var(--bg-section)',
                                color: filterCategory === cat ? 'var(--button-text)' : 'var(--text-primary)',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <svg style={svgStyle} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                    {/* Draw connections */}
                    {filteredConcepts.map(concept => {
                        const connected = getConnectedConcepts(concept.id)
                        return connected
                            .filter(c => filteredConcepts.includes(c))
                            .map(connectedConcept => {
                                const isHighlighted = hoveredConcept === concept.id || hoveredConcept === connectedConcept.id
                                return (
                                    <line
                                        key={`${concept.id}-${connectedConcept.id}`}
                                        x1={concept.x}
                                        y1={concept.y}
                                        x2={connectedConcept.x}
                                        y2={connectedConcept.y}
                                        stroke={isHighlighted ? getCategoryColor(concept.category) : 'var(--border-primary)'}
                                        strokeWidth={isHighlighted ? '0.3' : '0.1'}
                                        opacity={isHighlighted ? 0.8 : 0.3}
                                    />
                                )
                            })
                    })}

                    {/* Draw concept nodes */}
                    {filteredConcepts.map(concept => {
                        const isSelected = selectedConcept?.id === concept.id
                        const isHovered = hoveredConcept === concept.id
                        const color = getCategoryColor(concept.category)

                        return (
                            <g key={concept.id}>
                                <circle
                                    cx={concept.x}
                                    cy={concept.y}
                                    r={isSelected ? '4' : isHovered ? '3.5' : '3'}
                                    fill={color}
                                    stroke={isSelected ? '#fff' : 'transparent'}
                                    strokeWidth="0.5"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleConceptClick(concept)}
                                    onMouseEnter={() => setHoveredConcept(concept.id)}
                                    onMouseLeave={() => setHoveredConcept(null)}
                                />
                                <text
                                    x={concept.x}
                                    y={concept.y - 5}
                                    textAnchor="middle"
                                    fontSize="2"
                                    fill="var(--text-primary)"
                                    style={{ cursor: 'pointer', pointerEvents: 'none' }}
                                >
                                    {concept.label}
                                </text>
                            </g>
                        )
                    })}
                </svg>

                <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {categories.map(cat => (
                            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <div style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    background: getCategoryColor(cat)
                                }} />
                                <span>{cat}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {selectedConcept && (
                <Card
                    title={selectedConcept.label}
                    icon="📚"
                    style={{ marginBottom: '24px' }}
                >
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '14px' }}>
                            <span style={{ padding: '4px 8px', background: 'var(--bg-section)', borderRadius: '4px' }}>
                                Day {selectedConcept.day}
                            </span>
                            <span style={{ padding: '4px 8px', background: 'var(--bg-section)', borderRadius: '4px' }}>
                                {selectedConcept.category}
                            </span>
                        </div>
                        <p style={{ lineHeight: '1.6' }}>{selectedConcept.description}</p>
                    </div>

                    {getConnectedConcepts(selectedConcept.id).length > 0 && (
                        <div>
                            <h4 style={{ marginBottom: '12px' }}>Related Concepts</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {getConnectedConcepts(selectedConcept.id).map(connected => (
                                    <div
                                        key={connected.id}
                                        onClick={() => handleConceptClick(connected)}
                                        style={{
                                            padding: '12px',
                                            background: 'var(--bg-section)',
                                            borderRadius: '6px',
                                            border: '1px solid var(--border-primary)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'var(--bg-info)'
                                            e.currentTarget.style.color = 'var(--text-on-info)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'var(--bg-section)'
                                            e.currentTarget.style.color = 'var(--text-primary)'
                                        }}
                                    >
                                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                            {connected.label}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            Day {connected.day} • {connected.category}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            )}
        </div>
    )
}

export default ConceptMap
