import { useState, useMemo, useEffect, useRef, useCallback, lazy, Suspense, type JSX } from 'react'
import './App.css'
import type { ExerciseKey, ExercisesRegistry } from './types/exercises'
import Landing from './pages/Landing'
import SearchBar from './components/SearchBar'
import { initGA, trackPageView, tracking } from './lib/googleAnalytics'
import { MemoizedSidebar, MemoizedProgressDashboard, MemoizedBreadcrumbs } from './components/memoized/MemoizedComponents'
import SettingsModal from './components/SettingsModal'
import AnalyticsPanel from './components/AnalyticsPanel'
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp'
import ThemeToggle from './components/ThemeToggle'
import StudyMode from './components/StudyMode'
import ToastContainer from './components/ui/ToastContainer'
import Confetti from './components/ui/Confetti'
import PageTransition from './components/animations/PageTransition'
import GuidedTutorial, { onboardingTutorial } from './components/GuidedTutorial'
import { CardSkeleton } from './components/ui/LoadingSkeleton'
import { settingsStorage } from './services/settingsStorage'
import { analytics } from './services/analytics'
import { progressStorage } from './services/progressStorage'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { BREAKPOINTS } from './constants'

const CommunityPage = lazy(() => import('./pages/CommunityPage'))
const Tools = lazy(() => import('./pages/Tools'))

const Day01RenderingPipeline = lazy(() => import('./exercises/week1/day01-rendering-pipeline/App'))
const Day02Reconciliation = lazy(() => import('./exercises/week1/day02-reconciliation/App'))
const Day03Fiber = lazy(() => import('./exercises/week1/day03-fiber/App'))
const Day04Memoization = lazy(() => import('./exercises/week1/day04-memoization/App'))
const Day05Effects = lazy(() => import('./exercises/week1/day05-effects/App'))
const Day06Context = lazy(() => import('./exercises/week1/day06-context/App'))
const Day07Reflection = lazy(() => import('./exercises/week1/day07-reflection/App'))

const exercises: ExercisesRegistry = {
  'day01-rendering-pipeline': {
    title: 'Day 1: Rendering Pipeline',
    component: Day01RenderingPipeline,
    week: 1,
    day: 1,
    description: 'Understand Render Phase vs Commit Phase, Virtual DOM, and Diffing basics'
  },
  'day02-reconciliation': {
    title: 'Day 2: Reconciliation Deep Dive',
    component: Day02Reconciliation,
    week: 1,
    day: 2,
    description: 'Master Type Comparison Rule, Keys and Identity, and List Diffing Complexity'
  },
  'day03-fiber': {
    title: 'Day 3: Fiber Architecture',
    component: Day03Fiber,
    week: 1,
    day: 3,
    description: 'Understand Fiber Node Structure, Current vs WorkInProgress tree, and Unit of Work model'
  },
  'day04-memoization': {
    title: 'Day 4: Bailouts & Memoization',
    component: Day04Memoization,
    week: 1,
    day: 4,
    description: 'Master React.memo, useMemo, useCallback, and referential equality'
  },
  'day05-effects': {
    title: 'Day 5: Effects & Closures',
    component: Day05Effects,
    week: 1,
    day: 5,
    description: 'Master useEffect timing, cleanup, stale closures, and dependency array traps'
  },
  'day06-context': {
    title: 'Day 6: Context & Re-render Propagation',
    component: Day06Context,
    week: 1,
    day: 6,
    description: 'Understand why all consumers re-render, splitting contexts, and memoizing provider values'
  },
  'day07-reflection': {
    title: 'Day 7: Weekly Deep Reflection',
    component: Day07Reflection,
    week: 1,
    day: 7,
    description: 'Test your understanding of Week 1 concepts - be able to explain without notes'
  }
}

interface SearchResult {
  day: number
  title: string
  section: string
  content: string
}

function App(): JSX.Element {
  const [showLanding, setShowLanding] = useState<boolean>(true)
  const [currentView, setCurrentView] = useState<'exercises' | 'community'>('exercises')
  const [currentExercise, setCurrentExercise] = useState<ExerciseKey>('day01-rendering-pipeline')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showSidebar, setShowSidebar] = useState<boolean>(true)
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < BREAKPOINTS.MOBILE)
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState<boolean>(false)
  const [studyMode, setStudyMode] = useState<boolean>(false)
  const [showConfetti, setShowConfetti] = useState<boolean>(false)
  const [showTools, setShowTools] = useState<boolean>(false)
  const [showTutorial, setShowTutorial] = useState<boolean>(false)
  const [dayCompleteTick, setDayCompleteTick] = useState(0)

  // Initialize Google Analytics
  useEffect(() => {
    initGA()
  }, [])

  // Track page views
  useEffect(() => {
    if (!showLanding) {
      trackPageView(`/exercise/${currentExercise}`)
    }
  }, [currentExercise, showLanding])

  // Reset scroll when leaving landing or switching exercises
  useEffect(() => {
    if (showLanding) return
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [showLanding, currentExercise, currentView])

  // Listen for confetti events
  useEffect(() => {
    const handleConfetti = (): void => {
      setShowConfetti(true)
    }
    window.addEventListener('showConfetti', handleConfetti as EventListener)
    return () => window.removeEventListener('showConfetti', handleConfetti as EventListener)
  }, [])

  const searchInputRef = useRef<HTMLInputElement>(null)

  const ExerciseComponent = exercises[currentExercise]?.component
  const currentExerciseData = exercises[currentExercise]

  // Load theme preference on mount - handled by ThemeToggle component
  // This effect is kept for initial colorScheme setting
  useEffect(() => {
    const savedTheme = settingsStorage.getTheme()
    const root = document.documentElement
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (savedTheme === 'light') {
      root.style.colorScheme = 'light'
      root.classList.add('light-theme')
      root.classList.remove('dark-theme')
    } else if (savedTheme === 'dark') {
      root.style.colorScheme = 'dark'
      root.classList.add('dark-theme')
      root.classList.remove('light-theme')
    } else {
      // Auto mode - follow system preference
      root.style.colorScheme = 'light dark'
      if (prefersDark) {
        root.classList.add('dark-theme')
        root.classList.remove('light-theme')
      } else {
        root.classList.add('light-theme')
        root.classList.remove('dark-theme')
      }
    }
  }, [])

  useEffect(() => {
    const handleResize = (): void => {
      setIsMobile(window.innerWidth < BREAKPOINTS.MOBILE)
      setShowSidebar(window.innerWidth >= BREAKPOINTS.MOBILE)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleExerciseSelect = (key: ExerciseKey): void => {
    setCurrentExercise(key)
    setCurrentView('exercises')
    if (isMobile) {
      setShowSidebar(false)
    }
    analytics.trackExerciseComplete(exercises[key].day, exercises[key].week)
  }

  // Get exercise keys in order
  const exerciseKeys = useMemo(() => Object.keys(exercises) as ExerciseKey[], [exercises])
  const currentIndex = useMemo(() => exerciseKeys.indexOf(currentExercise), [exerciseKeys, currentExercise])

  // Navigation functions
  const handleNextExercise = useCallback((): void => {
    if (currentIndex < exerciseKeys.length - 1) {
      handleExerciseSelect(exerciseKeys[currentIndex + 1])
    }
  }, [currentIndex, exerciseKeys, handleExerciseSelect])

  const handlePreviousExercise = useCallback((): void => {
    if (currentIndex > 0) {
      handleExerciseSelect(exerciseKeys[currentIndex - 1])
    }
  }, [currentIndex, exerciseKeys, handleExerciseSelect])

  const handleMarkComplete = useCallback((): void => {
    const day = exercises[currentExercise].day
    if (progressStorage.isDayCompleted(day)) return
    progressStorage.markDayCompleted(day)
    setDayCompleteTick((n) => n + 1)
    analytics.trackFeatureUsage('mark_complete', { day })
    window.dispatchEvent(
      new CustomEvent('showToast', {
        detail: { message: `Day ${day} marked complete`, type: 'success' },
      })
    )
  }, [currentExercise, exercises])

  void dayCompleteTick
  const isCurrentDayCompleted = progressStorage.isDayCompleted(
    exercises[currentExercise].day
  )

  // Keyboard shortcuts for navigation
  useKeyboardShortcuts({
    onNext: handleNextExercise,
    onPrevious: handlePreviousExercise,
    enabled: !showSettings && !studyMode
  })

  const searchResults = useMemo<SearchResult[]>(() => {
    if (searchQuery.length === 0) return []

    const query = searchQuery.toLowerCase()
    const results: SearchResult[] = []

    Object.entries(exercises).forEach(([, exercise]) => {
      if (exercise.title.toLowerCase().includes(query) ||
        exercise.description?.toLowerCase().includes(query)) {
        results.push({
          day: exercise.day,
          title: exercise.title,
          section: 'Exercise',
          content: exercise.description || ''
        })
      }
    })

    // Add concept matches
    const conceptMap: Record<string, { day: number, concepts: string[] }> = {
      'render phase': { day: 1, concepts: ['Render Phase', 'Rendering Pipeline'] },
      'commit phase': { day: 1, concepts: ['Commit Phase', 'DOM Updates'] },
      'virtual dom': { day: 1, concepts: ['Virtual DOM', 'Diffing'] },
      'reconciliation': { day: 2, concepts: ['Reconciliation', 'Keys'] },
      'keys': { day: 2, concepts: ['Keys', 'Identity'] },
      'fiber': { day: 3, concepts: ['Fiber', 'Architecture'] },
      'memo': { day: 4, concepts: ['Memoization', 'React.memo'] },
      'usememo': { day: 4, concepts: ['useMemo', 'Memoization'] },
      'usecallback': { day: 4, concepts: ['useCallback', 'Memoization'] }
    }

    Object.entries(conceptMap).forEach(([term, data]) => {
      if (query.includes(term)) {
        data.concepts.forEach(concept => {
          results.push({
            day: data.day,
            title: exercises[`day0${data.day}-${data.day === 1 ? 'rendering-pipeline' : data.day === 2 ? 'reconciliation' : 'fiber'}` as ExerciseKey]?.title || '',
            section: concept,
            content: `Learn about ${concept} in Day ${data.day}`
          })
        })
      }
    })

    return results.slice(0, 10) // Limit results
  }, [searchQuery])

  const handleSearch = (query: string): void => {
    setSearchQuery(query)
    if (query.length > 0) {
      analytics.trackSearch(query, searchResults.length)
      // Auto-navigate to relevant exercise if found
      const lowerQuery = query.toLowerCase()
      if (lowerQuery.includes('render') || lowerQuery.includes('pipeline') || lowerQuery.includes('commit')) {
        setCurrentExercise('day01-rendering-pipeline')
      } else if (lowerQuery.includes('reconciliat') || lowerQuery.includes('key') || lowerQuery.includes('diff')) {
        setCurrentExercise('day02-reconciliation')
      } else if (lowerQuery.includes('fiber') || lowerQuery.includes('work') || lowerQuery.includes('concurrent')) {
        setCurrentExercise('day03-fiber')
      } else if (lowerQuery.includes('memo') || lowerQuery.includes('bailout')) {
        setCurrentExercise('day04-memoization')
      } else if (lowerQuery.includes('effect') || lowerQuery.includes('closure')) {
        setCurrentExercise('day05-effects')
      } else if (lowerQuery.includes('context') || lowerQuery.includes('re-render')) {
        setCurrentExercise('day06-context')
      } else if (lowerQuery.includes('reflection') || lowerQuery.includes('review')) {
        setCurrentExercise('day07-reflection')
      }
    }
  }


  const appContainerStyle: React.CSSProperties = {
    display: 'flex',
    minHeight: '100vh',
    background: 'transparent',
    width: '100%',
    margin: 0,
    padding: 0
  }

  const sidebarExpanded = showSidebar && !isMobile
  const layoutEase = '0.4s cubic-bezier(0.22, 1, 0.36, 1)'
  const mainContentStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    padding: isMobile
      ? '16px 16px 48px'
      : sidebarExpanded
        ? '24px 28px 56px'
        : '24px 40px 56px',
    width: '100%',
    margin: 0,
    boxSizing: 'border-box',
    transition: `padding ${layoutEase}`,
    overflowX: 'hidden',
  }

  const headerStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: isMobile ? '12px 14px' : '14px 16px',
    marginBottom: isMobile ? '16px' : '20px',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: isMobile ? '10px' : '12px',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: 'none',
  }

  const headerBtnStyle: React.CSSProperties = {
    padding: '8px 14px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    height: 38,
    color: 'var(--text-primary)',
    boxShadow: 'var(--shadow-sm)',
  }

  const lessonTitle = currentExerciseData
    ? currentExerciseData.title.replace(/^Day \d+:\s*/i, '')
    : "Today's lesson"

  return (
    <>
      {showLanding ? (
        <Landing
          onGetStarted={() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
            document.documentElement.scrollTop = 0
            document.body.scrollTop = 0
            setShowLanding(false)
            setShowTools(false)
            setCurrentView('exercises')
            setShowSidebar(true)
            if (!settingsStorage.hasCompletedOnboarding()) {
              // Let the lab shell mount before highlighting targets
              window.setTimeout(() => setShowTutorial(true), 450)
            }
          }}
        />
      ) : (
        <div style={appContainerStyle}>
          {/* Sidebar — stays mounted so width can animate instead of hard-cut */}
          <div
            style={{
              position: isMobile ? 'fixed' : 'relative',
              zIndex: 1000,
              height: isMobile ? '100vh' : '100vh',
              flexShrink: 0,
              overflow: 'hidden',
              ...(isMobile
                ? {
                    width: 280,
                    left: 0,
                    top: 0,
                    transform: showSidebar ? 'translateX(0)' : 'translateX(-100%)',
                    transition: `transform ${layoutEase}`,
                    pointerEvents: showSidebar ? 'auto' : 'none',
                  }
                : {
                    width: showSidebar ? 260 : 0,
                    transition: `width ${layoutEase}`,
                  }),
            }}
          >
            {isMobile && showSidebar && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.35)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  zIndex: 999,
                  cursor: 'pointer',
                }}
                onClick={() => setShowSidebar(false)}
              />
            )}
            <div style={{ width: isMobile ? 280 : 260, height: '100%' }}>
              <MemoizedSidebar
                exercises={exercises}
                currentExercise={currentExercise}
                onExerciseSelect={handleExerciseSelect}
                onToolsClick={() => {
                  setShowTools(true)
                  setCurrentView('exercises')
                }}
                onCommunityClick={() => {
                  setShowTools(false)
                  setCurrentView('community')
                }}
                onSettingsClick={() => setShowSettings(true)}
                onAnalyticsClick={() => setShowAnalytics(true)}
                onShortcutsClick={() => setShowShortcutsHelp(true)}
                onToggleCollapse={() => setShowSidebar(!showSidebar)}
                isCollapsed={false}
              />
            </div>
          </div>

          {/* Main Content */}
          <div style={mainContentStyle}>
            <main
              style={{
                width: '100%',
                // Both values in px so the browser can interpolate smoothly
                maxWidth: sidebarExpanded ? 960 : 2400,
                marginLeft: 'auto',
                marginRight: 'auto',
                transition: `max-width ${layoutEase}`,
              }}
            >
              {/* Header */}
              <header style={headerStyle}>
                <button
                  type="button"
                  onClick={() => setShowSidebar(!showSidebar)}
                  style={headerBtnStyle}
                  aria-label={showSidebar ? 'Collapse sidebar' : 'Expand sidebar'}
                  title={showSidebar ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                  {showSidebar ? '◀' : '▶'} Menu
                </button>

                <div style={{ minWidth: 0, flex: '1 1 160px' }}>
                  <h1 style={{
                    margin: 0,
                    fontFamily: 'var(--font-display)',
                    fontSize: isMobile ? 16 : 18,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {lessonTitle}
                  </h1>
                  <p style={{
                    margin: '3px 0 0',
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    lineHeight: 1.4,
                  }}>
                    {currentExerciseData
                      ? `Week ${currentExerciseData.week} · Day ${String(currentExerciseData.day).padStart(2, '0')}`
                      : 'Internals lab'}
                  </p>
                </div>

                <div style={{
                  flex: isMobile ? '1 1 100%' : '1 1 200px',
                  minWidth: isMobile ? '100%' : 180,
                  maxWidth: isMobile ? '100%' : 280,
                }}>
                  <SearchBar
                    ref={searchInputRef}
                    onSearch={handleSearch}
                    results={searchResults}
                    onResultClick={(day) => {
                      const exerciseKey = Object.entries(exercises).find(
                        ([, exercise]) => exercise.day === day
                      )?.[0] as ExerciseKey | undefined
                      if (exerciseKey) {
                        setCurrentExercise(exerciseKey)
                        if (isMobile) {
                          setShowSidebar(false)
                        }
                      }
                    }}
                  />
                </div>

                <div style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
                  <ThemeToggle />
                </div>

                <button
                  type="button"
                  data-tutorial="focus"
                  onClick={() => {
                    const newStudyMode = !studyMode
                    setStudyMode(newStudyMode)
                    analytics.trackFeatureUsage('study_mode', { enabled: newStudyMode })
                    tracking.studyModeToggled(newStudyMode)
                  }}
                  title="Toggle focus mode"
                  style={{
                    ...headerBtnStyle,
                    borderColor: studyMode ? 'var(--button-primary)' : 'var(--border-color)',
                    background: studyMode ? 'var(--button-primary)' : 'var(--bg-card)',
                    color: studyMode ? 'var(--button-text)' : 'var(--text-primary)',
                    fontWeight: 600,
                  }}
                >
                  {studyMode ? 'Exit focus' : 'Focus'}
                </button>
              </header>

              <MemoizedProgressDashboard
                key={dayCompleteTick}
                exercises={exercises}
              />

              {!showTools && currentView === 'exercises' && currentExerciseData && (
                <MemoizedBreadcrumbs
                  exercise={currentExerciseData}
                  isDayCompleted={isCurrentDayCompleted}
                  onMarkComplete={handleMarkComplete}
                />
              )}

              {/* Exercise Content, Tools, or Community */}
              <Suspense fallback={<CardSkeleton />}>
                {showTools ? (
                  <Tools onBack={() => setShowTools(false)} />
                ) : currentView === 'community' ? (
                  <CommunityPage />
                ) : ExerciseComponent ? (
                  <StudyMode isActive={studyMode} onToggle={() => setStudyMode(!studyMode)}>
                    <PageTransition transitionKey={currentExercise}>
                      <ExerciseComponent />
                    </PageTransition>
                  </StudyMode>
                ) : (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    background: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>
                      Exercise not found
                    </p>
                  </div>
                )}
              </Suspense>
            </main>
          </div>

          {/* Settings Modal */}
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            onReplayTour={() => {
              settingsStorage.setOnboardingComplete(false)
              setShowTools(false)
              setCurrentView('exercises')
              setShowSidebar(true)
              setShowLanding(false)
              window.setTimeout(() => setShowTutorial(true), 200)
            }}
          />

          {/* Analytics Panel */}
          {showAnalytics && <AnalyticsPanel onClose={() => setShowAnalytics(false)} />}

          {/* Keyboard Shortcuts Help */}
          <KeyboardShortcutsHelp isOpen={showShortcutsHelp} onClose={() => setShowShortcutsHelp(false)} />

          {/* Guided Tutorial */}
          {showTutorial && (
            <GuidedTutorial
              tutorialId="onboarding"
              title="How this lab works"
              steps={onboardingTutorial}
              onComplete={() => {
                settingsStorage.setOnboardingComplete(true)
                setShowTutorial(false)
              }}
              onSkip={() => {
                settingsStorage.setOnboardingComplete(true)
                setShowTutorial(false)
              }}
            />
          )}

          {/* Toast Container */}
          <ToastContainer />

          {/* Confetti for achievements */}
          <Confetti
            trigger={showConfetti}
            onComplete={() => setShowConfetti(false)}
          />
        </div>
      )}
    </>
  )
}

export default App