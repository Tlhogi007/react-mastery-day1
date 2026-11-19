/**
 * Flashcard System with Spaced Repetition Component
 */

import { useState, useEffect, type JSX } from 'react'
import { flashcardStorage, type Flashcard } from '../services/flashcardStorage'
import Card from './Card'

interface FlashcardSystemProps {
    day?: number
}

function FlashcardSystem({ day }: FlashcardSystemProps): JSX.Element {
    const [currentCard, setCurrentCard] = useState<Flashcard | null>(null)
    const [showAnswer, setShowAnswer] = useState<boolean>(false)
    const [mode, setMode] = useState<'review' | 'browse' | 'create'>('review')
    const [allCards, setAllCards] = useState<Flashcard[]>([])
    const [stats, setStats] = useState(flashcardStorage.getStats())
    const [newCard, setNewCard] = useState<{ front: string; back: string; topic: string; difficulty: 'easy' | 'medium' | 'hard' }>({ front: '', back: '', topic: '', difficulty: 'medium' })

    useEffect(() => {
        loadCards()
        loadNextCard()
    }, [day, mode])

    const loadCards = (): void => {
        const cards = day
            ? flashcardStorage.getFlashcardsForDay(day)
            : flashcardStorage.getFlashcards()
        setAllCards(cards)
        setStats(flashcardStorage.getStats())
    }

    const loadNextCard = (): void => {
        if (mode === 'review') {
            const dueCards = flashcardStorage.getFlashcardsNeedingReview()
            if (dueCards.length > 0) {
                // Random card from due cards
                const randomCard = dueCards[Math.floor(Math.random() * dueCards.length)]
                setCurrentCard(randomCard)
                setShowAnswer(false)
            } else {
                setCurrentCard(null)
            }
        } else if (mode === 'browse' && allCards.length > 0) {
            setCurrentCard(allCards[0])
            setShowAnswer(false)
        }
    }

    const handleReview = (quality: 0 | 1 | 2 | 3 | 4 | 5): void => {
        if (!currentCard) return

        flashcardStorage.reviewFlashcard(currentCard.id, quality)
        loadCards()
        loadNextCard()
    }

    const handleCreateCard = (): void => {
        if (!newCard.front.trim() || !newCard.back.trim()) return

        flashcardStorage.createFlashcard(
            newCard.front,
            newCard.back,
            day || 1,
            newCard.topic || 'general',
            newCard.difficulty
        )
        setNewCard({ front: '', back: '', topic: '', difficulty: 'medium' })
        loadCards()
        if (mode === 'browse') {
            loadNextCard()
        }
    }

    const handleDeleteCard = (id: string): void => {
        if (confirm('Delete this flashcard?')) {
            flashcardStorage.deleteFlashcard(id)
            loadCards()
            if (currentCard?.id === id) {
                loadNextCard()
            }
        }
    }

    const containerStyle: React.CSSProperties = {
        color: 'var(--text-primary)',
        width: '100%',
        minWidth: 0,
        padding: 0,
    }

    const cardStyle: React.CSSProperties = {
        minHeight: '220px',
        padding: 'clamp(1rem, 4vw, 2.5rem)',
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '2px solid var(--border-primary)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        marginBottom: '20px',
        boxShadow: 'var(--shadow-md)',
        transition: 'transform 0.3s ease',
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box',
        textAlign: 'center',
    }

    const qualityButtonStyle: React.CSSProperties = {
        padding: '10px 20px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        margin: '4px'
    }

    return (
        <div className="tool-panel" style={containerStyle}>
            <Card
                title="Flashcards · spaced repetition"
                icon="🎴"
                style={{ marginBottom: '24px' }}
            >
                <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    SM-2 scheduling: cards you miss come back sooner. Save wrong quiz answers from the Quiz tab.
                </p>
                <div className="tool-chip-row" style={{ marginBottom: '16px' }}>
                    <button
                        type="button"
                        onClick={() => {
                            setMode('review')
                            loadNextCard()
                        }}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: mode === 'review' ? 'var(--button-primary)' : 'var(--bg-section)',
                            color: mode === 'review' ? 'var(--button-text)' : 'var(--text-primary)',
                            cursor: 'pointer'
                        }}
                    >
                        Due today ({stats.due})
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setMode('browse')
                            loadNextCard()
                        }}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: mode === 'browse' ? 'var(--button-primary)' : 'var(--bg-section)',
                            color: mode === 'browse' ? 'var(--button-text)' : 'var(--text-primary)',
                            cursor: 'pointer'
                        }}
                    >
                        Browse ({stats.total})
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('create')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: mode === 'create' ? 'var(--button-primary)' : 'var(--bg-section)',
                            color: mode === 'create' ? 'var(--button-text)' : 'var(--text-primary)',
                            cursor: 'pointer'
                        }}
                    >
                        Create
                    </button>
                </div>

                <div className="tool-stats-row" style={{ marginBottom: '16px' }}>
                    <span>Total: {stats.total}</span>
                    <span>Due: {stats.due}</span>
                    <span>Mastered: {stats.mastered}</span>
                    <span>Struggling: {stats.struggling}</span>
                </div>

                {mode === 'create' && (
                    <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ marginBottom: '12px' }}>Create New Flashcard</h4>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Front (Question/Concept)</label>
                            <textarea
                                value={newCard.front}
                                onChange={(e) => setNewCard({ ...newCard, front: e.target.value })}
                                placeholder="Enter the question or concept..."
                                style={{
                                    width: '100%',
                                    minHeight: '80px',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-primary)',
                                    background: 'var(--bg-section)',
                                    color: 'var(--text-primary)',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Back (Answer/Explanation)</label>
                            <textarea
                                value={newCard.back}
                                onChange={(e) => setNewCard({ ...newCard, back: e.target.value })}
                                placeholder="Enter the answer or explanation..."
                                style={{
                                    width: '100%',
                                    minHeight: '80px',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-primary)',
                                    background: 'var(--bg-section)',
                                    color: 'var(--text-primary)',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Topic</label>
                                <input
                                    type="text"
                                    value={newCard.topic}
                                    onChange={(e) => setNewCard({ ...newCard, topic: e.target.value })}
                                    placeholder="e.g., memoization"
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-primary)',
                                        background: 'var(--bg-section)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Difficulty</label>
                                <select
                                    value={newCard.difficulty}
                                    onChange={(e) => setNewCard({ ...newCard, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 2.15rem 8px 8px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-primary)',
                                        backgroundColor: 'var(--bg-section)',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={handleCreateCard}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'var(--button-primary)',
                                color: 'var(--button-text)',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}
                        >
                            Create Flashcard
                        </button>
                    </div>
                )}

                {mode !== 'create' && currentCard && (
                    <div>
                        <div
                            onClick={() => {
                                if (!showAnswer) {
                                    setShowAnswer(true)
                                }
                            }}
                            className="tool-flash-card"
                            style={cardStyle}
                        >
                            <div style={{ fontSize: '24px', marginBottom: '20px' }}>
                                {showAnswer ? '💡 Answer' : '❓ Question'}
                            </div>
                            <div style={{ fontSize: '18px', textAlign: 'center', lineHeight: '1.6' }}>
                                {showAnswer ? currentCard.back : currentCard.front}
                            </div>
                            {!showAnswer && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '16px',
                                    fontSize: '12px',
                                    color: 'var(--text-secondary)'
                                }}>
                                    Click to reveal answer
                                </div>
                            )}
                            {showAnswer && (
                                <div style={{
                                    marginTop: '20px',
                                    fontSize: '12px',
                                    color: 'var(--text-secondary)'
                                }}>
                                    Day {currentCard.day} • {currentCard.topic} • {currentCard.difficulty}
                                </div>
                            )}
                        </div>

                        {showAnswer && mode === 'review' && (
                            <div style={{ marginBottom: '20px' }}>
                                <h4 style={{ marginBottom: '12px' }}>How well did you know this?</h4>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => handleReview(0)}
                                        style={{ 
                                            ...qualityButtonStyle, 
                                            background: 'var(--bg-error)', 
                                            color: 'var(--text-on-error)',
                                            border: '1px solid var(--border-color)'
                                        }}
                                    >
                                        0 - Blackout
                                    </button>
                                    <button
                                        onClick={() => handleReview(1)}
                                        style={{ 
                                            ...qualityButtonStyle, 
                                            background: 'var(--bg-warning)', 
                                            color: 'var(--text-on-warning)',
                                            border: '1px solid var(--border-warning)'
                                        }}
                                    >
                                        1 - Incorrect
                                    </button>
                                    <button
                                        onClick={() => handleReview(2)}
                                        style={{ 
                                            ...qualityButtonStyle, 
                                            background: 'var(--bg-warning)', 
                                            color: 'var(--text-on-warning)',
                                            border: '1px solid var(--border-warning)'
                                        }}
                                    >
                                        2 - Hard
                                    </button>
                                    <button
                                        onClick={() => handleReview(3)}
                                        style={{ 
                                            ...qualityButtonStyle, 
                                            background: 'var(--bg-success)', 
                                            color: 'var(--text-on-success)',
                                            border: '1px solid var(--border-color)'
                                        }}
                                    >
                                        3 - Good
                                    </button>
                                    <button
                                        onClick={() => handleReview(4)}
                                        style={{ 
                                            ...qualityButtonStyle, 
                                            background: 'var(--bg-success)', 
                                            color: 'var(--text-on-success)',
                                            border: '1px solid var(--border-color)'
                                        }}
                                    >
                                        4 - Easy
                                    </button>
                                    <button
                                        onClick={() => handleReview(5)}
                                        style={{ 
                                            ...qualityButtonStyle, 
                                            background: 'var(--bg-success)', 
                                            color: 'var(--text-on-success)',
                                            border: '1px solid var(--border-color)'
                                        }}
                                    >
                                        5 - Perfect
                                    </button>
                                </div>
                            </div>
                        )}

                        {showAnswer && mode === 'browse' && (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button
                                    onClick={() => {
                                        const currentIndex = allCards.findIndex(c => c.id === currentCard.id)
                                        if (currentIndex > 0) {
                                            setCurrentCard(allCards[currentIndex - 1])
                                            setShowAnswer(false)
                                        }
                                    }}
                                    disabled={allCards.findIndex(c => c.id === currentCard.id) === 0}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: 'var(--button-primary)',
                                        color: 'var(--button-text)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ← Previous
                                </button>
                                <button
                                    onClick={() => handleDeleteCard(currentCard.id)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: 'var(--bg-error)',
                                        color: 'var(--text-on-error)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => {
                                        const currentIndex = allCards.findIndex(c => c.id === currentCard.id)
                                        if (currentIndex < allCards.length - 1) {
                                            setCurrentCard(allCards[currentIndex + 1])
                                            setShowAnswer(false)
                                        }
                                    }}
                                    disabled={allCards.findIndex(c => c.id === currentCard.id) === allCards.length - 1}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: 'var(--button-primary)',
                                        color: 'var(--button-text)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {mode !== 'create' && !currentCard && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        <p>No flashcards available.</p>
                        <p>Create some flashcards to get started!</p>
                    </div>
                )}
            </Card>
        </div>
    )
}

export default FlashcardSystem
