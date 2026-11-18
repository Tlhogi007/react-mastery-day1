import { useEffect, useMemo, useState, type CSSProperties, type JSX } from 'react'
import type { ExerciseKey, Exercise, ExercisesRegistry } from '../types/exercises'
import FadeIn from './animations/FadeIn'
import { authorStamp, buildInfo, formatBuildStamp } from '../lib/buildInfo'

interface SidebarProps {
  exercises: ExercisesRegistry
  currentExercise: ExerciseKey
  onExerciseSelect: (key: ExerciseKey) => void
  onToolsClick?: () => void
  onCommunityClick?: () => void
  onSettingsClick?: () => void
  onAnalyticsClick?: () => void
  onShortcutsClick?: () => void
  onToggleCollapse?: () => void
  isCollapsed?: boolean
}

function Sidebar({
  exercises,
  currentExercise,
  onExerciseSelect,
  onToolsClick,
  onCommunityClick,
  onSettingsClick,
  onAnalyticsClick,
  onShortcutsClick,
  onToggleCollapse,
  isCollapsed = false,
}: SidebarProps): JSX.Element {
  const exercisesByWeek = useMemo(() => {
    const acc: Record<number, Array<{ key: ExerciseKey; exercise: Exercise }>> = {}
    for (const [key, exercise] of Object.entries(exercises)) {
      const week = exercise.week
      if (!acc[week]) acc[week] = []
      acc[week].push({ key: key as ExerciseKey, exercise })
    }
    for (const week of Object.keys(acc)) {
      acc[Number(week)].sort((a, b) => a.exercise.day - b.exercise.day)
    }
    return acc
  }, [exercises])

  const weekNumbers = useMemo(
    () => Object.keys(exercisesByWeek).map(Number).sort((a, b) => a - b),
    [exercisesByWeek]
  )

  const currentWeek = exercises[currentExercise]?.week ?? weekNumbers[0] ?? 1

  const [openWeeks, setOpenWeeks] = useState<Set<number>>(() => new Set([currentWeek]))

  useEffect(() => {
    setOpenWeeks((prev) => {
      if (prev.has(currentWeek)) return prev
      const next = new Set(prev)
      next.add(currentWeek)
      return next
    })
  }, [currentWeek])

  const toggleWeek = (week: number): void => {
    setOpenWeeks((prev) => {
      const next = new Set(prev)
      if (next.has(week)) next.delete(week)
      else next.add(week)
      return next
    })
  }

  const linkBtnStyle: CSSProperties = {
    textAlign: 'left',
    width: '100%',
    padding: '8px 10px',
    border: 'none',
    borderRadius: 4,
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  }

  return (
    <aside
      role="navigation"
      aria-label="Study outline"
      data-tutorial="sidebar"
      style={{
        width: isCollapsed ? 64 : '100%',
        maxWidth: isCollapsed ? 64 : 300,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border-color)',
        padding: isCollapsed ? '12px 8px' : '16px 14px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))',
        position: 'sticky',
        top: 0,
        height: '100%',
        minHeight: '100dvh',
        overflowY: 'auto',
        overflowX: 'hidden',
        flexShrink: 0,
        transition: 'width 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <FadeIn>
        <div
          style={{
            marginBottom: 20,
            display: 'flex',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          {!isCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                aria-label="React Mastery"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  fontWeight: 600,
                  marginBottom: 2,
                  letterSpacing: '-0.02em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  lineHeight: 1.15,
                  color: 'var(--text-primary)',
                }}
              >
                <svg
                  aria-hidden="true"
                  viewBox="8.5 7.5 14.7 17"
                  width="0.78em"
                  height="0.9em"
                  style={{
                    display: 'block',
                    flexShrink: 0,
                    marginRight: '0.04em',
                    translate: '0 0.02em',
                  }}
                >
                  <path
                    d="M8.5 7.5h7.6c3.55 0 5.9 1.95 5.9 5 0 2.15-1.15 3.75-3.1 4.4L23.2 24.5h-3.75l-3.55-6H12V24.5H8.5V7.5Zm3.5 2.7v4.85h3.9c1.95 0 3.1-.95 3.1-2.45s-1.15-2.4-3.1-2.4H12Z"
                    fill="#e23d2b"
                  />
                </svg>
                <span>eact Mastery</span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Internals lab · Week {currentWeek}
              </p>
            </div>
          )}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand outline' : 'Collapse outline'}
              style={{
                padding: '4px 8px',
                borderRadius: 4,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-section)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 11,
                minWidth: isCollapsed ? '100%' : undefined,
              }}
            >
              {isCollapsed ? '»' : '«'}
            </button>
          )}
        </div>
      </FadeIn>

      {!isCollapsed && (onToolsClick || onCommunityClick) && (
        <nav
          data-tutorial="tools-community"
          style={{
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          {onToolsClick && (
            <button type="button" onClick={onToolsClick} style={linkBtnStyle}>
              Tools
            </button>
          )}
          {onToolsClick && onCommunityClick && (
            <div
              aria-hidden
              style={{
                height: 1,
                margin: '4px 10px',
                background: 'var(--border-color)',
              }}
            />
          )}
          {onCommunityClick && (
            <button type="button" onClick={onCommunityClick} style={linkBtnStyle}>
              Community
            </button>
          )}
        </nav>
      )}

      <div data-tutorial="sidebar-days">
        {weekNumbers.map((week) => {
          const items = exercisesByWeek[week] ?? []
          const isOpen = isCollapsed || openWeeks.has(week)
          const panelId = `sidebar-week-${week}`

          return (
            <div key={week} style={{ marginBottom: isCollapsed ? 4 : 10 }}>
              {!isCollapsed && (
                <button
                  type="button"
                  onClick={() => toggleWeek(week)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  title={isOpen ? 'Collapse week' : 'Expand week'}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '8px 10px',
                    border: 'none',
                    borderRadius: 4,
                    background: isOpen ? 'var(--bg-section)' : 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    textAlign: 'left',
                  }}
                >
                  <span>Week {week}</span>
                  <span aria-hidden style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {isOpen ? '▾' : '▸'}
                  </span>
                </button>
              )}

              {isOpen && (
                <div
                  id={panelId}
                  role="region"
                  aria-label={`Week ${week} lessons`}
                  style={{ marginTop: isCollapsed ? 0 : 4 }}
                >
                  {items.map(({ key, exercise }) => {
                    const isActive = key === currentExercise
                    const title = exercise.title.replace(/^Day \d+:\s*/i, '')
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onExerciseSelect(key)}
                        title={`Day ${exercise.day}: ${title}`}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          padding: isCollapsed ? '10px 6px' : '8px 10px',
                          marginBottom: 2,
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          textAlign: 'left',
                          background: isActive ? 'var(--bg-info)' : 'transparent',
                          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                          justifyContent: isCollapsed ? 'center' : 'flex-start',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                            fontWeight: 500,
                            color: isActive ? 'var(--button-primary)' : 'var(--text-muted)',
                            minWidth: 18,
                            paddingTop: 1,
                          }}
                        >
                          {String(exercise.day).padStart(2, '0')}
                        </span>
                        {!isCollapsed && (
                          <span
                            style={{
                              flex: 1,
                              minWidth: 0,
                              display: 'block',
                              fontSize: 13,
                              fontWeight: isActive ? 600 : 500,
                              lineHeight: 1.35,
                              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                            }}
                          >
                            {title}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!isCollapsed && (
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 16,
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {(onAnalyticsClick || onSettingsClick || onShortcutsClick) && (
            <div
              data-tutorial="help-links"
              style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}
            >
              {[
                { label: 'Analytics', onClick: onAnalyticsClick },
                { label: 'Settings', onClick: onSettingsClick },
                { label: 'Keys', onClick: onShortcutsClick },
              ]
                .filter((item) => item.onClick)
                .map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 4,
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      fontSize: 11,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
            </div>
          )}
          <div className="build-stamp" title={formatBuildStamp()}>
            <div>v{buildInfo.version}</div>
            <div>built by {authorStamp()}</div>
          </div>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
