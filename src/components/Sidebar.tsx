import { type JSX } from 'react'
import type { ExerciseKey, Exercise, ExercisesRegistry } from '../types/exercises'
import FadeIn from './animations/FadeIn'

interface SidebarProps {
    exercises: ExercisesRegistry
    currentExercise: ExerciseKey
    onExerciseSelect: (key: ExerciseKey) => void
    onToolsClick?: () => void
    onCommunityClick?: () => void
    onToggleCollapse?: () => void
    isCollapsed?: boolean
}

function Sidebar({ exercises, currentExercise, onExerciseSelect, onToolsClick, onCommunityClick, onToggleCollapse, isCollapsed = false }: SidebarProps): JSX.Element {
    // onToolsClick is used in the button onClick handler below
    // Group exercises by week
    const exercisesByWeek = Object.entries(exercises).reduce((acc, [key, exercise]) => {
        if (!acc[exercise.week]) {
            acc[exercise.week] = []
        }
        acc[exercise.week].push({ key, exercise })
        return acc
    }, {} as Record<number, Array<{ key: ExerciseKey; exercise: Exercise }>>)

    const sidebarStyle: React.CSSProperties = {
        width: isCollapsed ? '80px' : '280px',
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border-color)',
        padding: isCollapsed ? '12px 8px' : '20px',
        position: isCollapsed ? 'relative' : 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        flexShrink: 0,
        transition: 'width 0.3s ease, padding 0.3s ease',
        boxShadow: isCollapsed ? 'none' : 'var(--shadow-sm)'
    }

    const weekStyle: React.CSSProperties = {
        marginBottom: '30px'
    }

    const weekTitleStyle: React.CSSProperties = {
        fontSize: isCollapsed ? '10px' : '14px',
        fontWeight: 'bold',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: isCollapsed ? 'none' : '1px solid var(--border-color)',
        textAlign: isCollapsed ? 'center' : 'left',
        display: isCollapsed ? 'none' : 'block'
    }

    const dayItemStyle = (isActive: boolean): React.CSSProperties => ({
        padding: isCollapsed ? '12px' : '12px 16px',
        marginBottom: '6px',
        borderRadius: '8px',
        cursor: 'pointer',
        background: isActive ? 'var(--bg-section)' : 'transparent',
        border: isActive ? '2px solid var(--border-primary)' : '2px solid transparent',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        gap: isCollapsed ? '0' : '12px',
        flexDirection: isCollapsed ? 'column' : 'row',
        position: 'relative'
    })

    const dayNumberStyle: React.CSSProperties = {
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        background: 'var(--button-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        color: 'var(--button-text)',
        flexShrink: 0
    }

    const dayInfoStyle: React.CSSProperties = {
        flex: isCollapsed ? '0' : 1,
        minWidth: 0,
        display: isCollapsed ? 'none' : 'block',
        textAlign: 'left'
    }

    const dayTitleStyle: React.CSSProperties = {
        fontSize: '14px',
        fontWeight: '500',
        color: 'var(--text-primary)',
        marginBottom: '4px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    }

    const dayDescStyle: React.CSSProperties = {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    }

    return (
        <aside style={sidebarStyle} role="navigation" aria-label="Main navigation">
            <FadeIn>
                <div style={{
                    marginBottom: isCollapsed ? '20px' : '30px',
                    display: 'flex',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    alignItems: 'start',
                    flexDirection: isCollapsed ? 'column' : 'row',
                    gap: isCollapsed ? '8px' : '0'
                }}>
                    {!isCollapsed && (
                        <div style={{ flex: 1 }}>
                            <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 'bold' }}>
                                30-Day React Mastery
                            </h2>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                                Master React like a systems engineer
                            </p>
                        </div>
                    )}
                    {isCollapsed && (
                        <div style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            marginBottom: '8px'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                background: 'var(--button-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                color: 'var(--button-text)'
                            }}>
                                R
                            </div>
                        </div>
                    )}
                    {onToggleCollapse && (
                        <button
                            onClick={onToggleCollapse}
                            style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-section)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: isCollapsed ? '100%' : '28px',
                                height: '28px',
                                alignSelf: isCollapsed ? 'stretch' : 'auto'
                            }}
                            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            {isCollapsed ? '▶' : '◀'}
                        </button>
                    )}
                </div>
            </FadeIn>

            {onToolsClick && (
                <div style={{ marginBottom: '24px' }}>
                    <button
                        onClick={onToolsClick}
                        style={{
                            width: '100%',
                            padding: isCollapsed ? '12px' : '12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'var(--button-primary)',
                            color: 'var(--button-text)',
                            cursor: 'pointer',
                            fontSize: isCollapsed ? '20px' : '14px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: isCollapsed ? '0' : '8px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.02)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)'
                            e.currentTarget.style.boxShadow = 'none'
                        }}
                        title={isCollapsed ? 'Learning Tools' : undefined}
                    >
                        {isCollapsed ? '🛠️' : '🛠️ Learning Tools'}
                    </button>
                </div>
            )}

            {onCommunityClick && (
                <div style={{ marginBottom: '24px' }}>
                    <button
                        onClick={onCommunityClick}
                        style={{
                            width: '100%',
                            padding: isCollapsed ? '12px' : '12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'var(--button-primary)',
                            color: 'var(--button-text)',
                            cursor: 'pointer',
                            fontSize: isCollapsed ? '20px' : '14px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: isCollapsed ? '0' : '8px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.02)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)'
                            e.currentTarget.style.boxShadow = 'none'
                        }}
                        title={isCollapsed ? 'Community' : undefined}
                    >
                        {isCollapsed ? '👥' : '👥 Community'}
                    </button>
                </div>
            )}

            {Object.entries(exercisesByWeek)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([week, items]) => (
                    <div key={week} style={weekStyle}>
                        <div style={weekTitleStyle}>
                            Week {week} — {week === '1' ? 'Internals' : week === '2' ? 'Performance' : week === '3' ? 'Architecture' : 'Interview'}
                        </div>
                        {items
                            .sort((a, b) => a.exercise.day - b.exercise.day)
                            .map(({ key, exercise }) => {
                                const isActive = key === currentExercise
                                return (
                                    <div
                                        key={key}
                                        onClick={() => onExerciseSelect(key)}
                                        style={dayItemStyle(isActive)}
                                        onMouseEnter={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.background = 'var(--bg-section)'
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.background = 'transparent'
                                            }
                                        }}
                                        title={isCollapsed ? `Day ${exercise.day}: ${exercise.title}` : undefined}
                                    >
                                        <div style={dayNumberStyle}>
                                            {exercise.day}
                                        </div>
                                        {!isCollapsed && (
                                            <>
                                                <div style={dayInfoStyle}>
                                                    <div style={dayTitleStyle}>{exercise.title}</div>
                                                    <div style={dayDescStyle}>{exercise.description}</div>
                                                </div>
                                                {isActive && (
                                                    <div style={{ fontSize: '12px', color: 'var(--button-primary)' }}>→</div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )
                            })}
                    </div>
                ))}
        </aside>
    )
}

export default Sidebar
