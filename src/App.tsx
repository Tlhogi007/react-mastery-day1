import { useState, useMemo, useEffect, useRef, useCallback, type JSX } from 'react'
import './App.css'
import type { ExerciseKey, ExercisesRegistry } from './types/exercises'
import Landing from './pages/Landing'
import CommunityPage from './pages/CommunityPage'
import Tools from './pages/Tools'
import SearchBar from './components/SearchBar'
import { initGA, trackPageView, tracking } from './lib/googleAnalytics'
import { MemoizedSidebar, MemoizedProgressDashboard, MemoizedBreadcrumbs } from './components/memoized/MemoizedComponents'
import FloatingActions from './components/FloatingActions'
import SettingsModal from './components/SettingsModal'
import AnalyticsPanel from './components/AnalyticsPanel'
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp'
import ThemeToggle from './components/ThemeToggle'
import StudyMode from './components/StudyMode'
import ToastContainer from './components/ui/ToastContainer'
import Confetti from './components/ui/Confetti'
import PageTransition from './components/animations/PageTransition'
import GuidedTutorial, { onboardingTutorial } from './components/GuidedTutorial'
import { settingsStorage } from './services/settingsStorage'
import { analytics } from './services/analytics'
import { progressStorage } from './services/progressStorage'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { BREAKPOINTS, TIMEOUT } from './constants'

import Day01RenderingPipeline from './exercises/week1/day01-rendering-pipeline/App'
import Day02Reconciliation from './exercises/week1/day02-reconciliation/App'
import Day03Fiber from './exercises/week1/day03-fiber/App'
import Day04Memoization from './exercises/week1/day04-memoization/App'
import Day05Effects from './exercises/week1/day05-effects/App'
import Day06Context from './exercises/week1/day06-context/App'
import Day07Reflection from './exercises/week1/day07-reflection/App'

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

  // Listen for confetti events
  useEffect(() => {
    const handleConfetti = (): void => {
      setShowConfetti(true)
    }
    window.addEventListener('showConfetti', handleConfetti as EventListener)
    return () => window.removeEventListener('showConfetti', handleConfetti as EventListener)
  }, [])

  // Refs for DOM elements (replacing direct queries)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const progressDashboardRef = useRef<HTMLDivElement>(null)

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

  const handleRandomExercise = useCallback((): void => {
    const randomKey = exerciseKeys[Math.floor(Math.random() * exerciseKeys.length)]
    handleExerciseSelect(randomKey)
    analytics.trackFeatureUsage('random_exercise')
  }, [exerciseKeys, handleExerciseSelect])

  const handleContinueLearning = useCallback((): void => {
    // Find first incomplete exercise
    const incomplete = exerciseKeys.find(key => {
      const day = exercises[key].day
      return !progressStorage.isDayCompleted(day)
    })
    if (incomplete) {
      handleExerciseSelect(incomplete)
      analytics.trackFeatureUsage('continue_learning')
    }
  }, [exerciseKeys, exercises, handleExerciseSelect])

  const handleMarkComplete = useCallback((): void => {
    const day = exercises[currentExercise].day
    progressStorage.markDayCompleted(day)
    analytics.trackFeatureUsage('mark_complete', { day })
    // Show toast notification
    const event = new CustomEvent('showToast', {
      detail: {
        message: `Day ${day} marked as complete! 🎉`,
        type: 'success'
      }
    })
    window.dispatchEvent(event)
  }, [currentExercise, exercises])

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
    background: 'var(--bg-primary)',
    width: '100%',
    margin: 0,
    padding: 0
  }

  const mainContentStyle: React.CSSProperties = {
    flex: 1,
    padding: isMobile ? '20px' : '40px',
    width: '100%',
    margin: 0,
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
    overflowX: 'hidden'
  }

  const headerStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: isMobile ? '16px' : '20px 24px',
    marginBottom: '30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: isMobile ? '12px' : '20px',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: 'var(--shadow-sm)'
  }

  return (
    <>
      {showLanding ? (
        <Landing onGetStarted={() => setShowLanding(false)} />
      ) : (
        <div style={appContainerStyle}>
          {/* Sidebar */}
          {showSidebar || isMobile ? (
            <div style={{
              position: isMobile ? 'fixed' : 'relative',
              zIndex: 1000,
              height: isMobile ? '100vh' : 'auto',
              transition: isMobile ? 'transform 0.3s ease' : 'none',
              transform: isMobile && !showSidebar ? 'translateX(-100%)' : 'translateX(0)',
              width: isMobile ? '280px' : (showSidebar ? '280px' : '80px'),
              overflow: isMobile ? 'visible' : 'hidden',
              ...(isMobile && {
                left: 0,
                top: 0
              })
            }}>
              {isMobile && showSidebar && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 999,
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowSidebar(false)}
                />
              )}
              <MemoizedSidebar
                exercises={exercises}
                currentExercise={currentExercise}
                onExerciseSelect={handleExerciseSelect}
                onToolsClick={() => {
                  setShowTools(true)
                  setCurrentExercise('day01-rendering-pipeline')
                }}
                onCommunityClick={() => setCurrentView('community')}
                onToggleCollapse={() => setShowSidebar(!showSidebar)}
                isCollapsed={!showSidebar && !isMobile}
              />
            </div>
          ) : null}

          {/* Main Content */}
          <div style={mainContentStyle}>
            <main style={{ width: '100%' }}>
              {/* Header */}
              <header style={headerStyle}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '12px' : '20px',
                  flex: isMobile ? '1 1 100%' : '1 1 auto',
                  minWidth: 0,
                  flexWrap: isMobile ? 'wrap' : 'nowrap'
                }}>
                  <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    style={{
                      padding: '8px 12px',
                      background: 'var(--bg-section)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.2s ease'
                    }}
                    aria-label={showSidebar ? 'Collapse sidebar' : 'Expand sidebar'}
                    title={showSidebar ? 'Collapse sidebar' : 'Expand sidebar'}
                  >
                    {showSidebar ? '◀' : '▶'} Menu
                  </button>
                  <div style={{ minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}>
                    <h1 style={{
                      margin: 0,
                      fontSize: isMobile ? '18px' : '26px',
                      fontWeight: 'bold',
                      lineHeight: '1.3',
                      color: 'var(--text-primary)'
                    }}>
                      30-Day Senior React Mastery
                    </h1>
                    <p style={{
                      margin: '6px 0 0',
                      fontSize: isMobile ? '12px' : '14px',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.4'
                    }}>
                      Master React like a systems engineer
                    </p>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '8px' : '10px',
                  flex: isMobile ? '1 1 100%' : '0 0 auto',
                  minWidth: isMobile ? '100%' : 'auto',
                  maxWidth: isMobile ? '100%' : 'none',
                  flexWrap: 'wrap',
                  justifyContent: isMobile ? 'flex-start' : 'flex-end',
                  marginLeft: isMobile ? 0 : 'auto'
                }}>
                  {!isMobile && (
                    <>
                      <button
                        onClick={handleContinueLearning}
                        style={{
                          padding: '8px 12px',
                          background: 'var(--bg-section)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          flexShrink: 0
                        }}
                        title="Continue Learning (c)"
                      >
                        ▶️ Continue
                      </button>
                      <button
                        onClick={handleRandomExercise}
                        style={{
                          padding: '8px 12px',
                          background: 'var(--bg-section)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          flexShrink: 0
                        }}
                        title="Random Exercise (r)"
                      >
                        🎲 Random
                      </button>
                      <button
                        onClick={handleMarkComplete}
                        disabled={progressStorage.isDayCompleted(exercises[currentExercise].day)}
                        style={{
                          padding: '8px 12px',
                          background: progressStorage.isDayCompleted(exercises[currentExercise].day) ? 'var(--bg-success)' : 'var(--bg-section)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          cursor: progressStorage.isDayCompleted(exercises[currentExercise].day) ? 'default' : 'pointer',
                          fontSize: '13px',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          opacity: progressStorage.isDayCompleted(exercises[currentExercise].day) ? 0.7 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          flexShrink: 0
                        }}
                        title="Mark as Complete"
                      >
                        {progressStorage.isDayCompleted(exercises[currentExercise].day) ? '✅ Complete' : '✓ Mark Complete'}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowShortcutsHelp(true)}
                    style={{
                      padding: '8px 12px',
                      background: 'var(--bg-section)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      flexShrink: 0
                    }}
                    title="Keyboard Shortcuts (?)"
                  >
                    ⌨️ Help
                  </button>
                  <div style={{ flexShrink: 0 }}>
                    <ThemeToggle />
                  </div>
                  <button
                    onClick={() => {
                      const newStudyMode = !studyMode
                      setStudyMode(newStudyMode)
                      analytics.trackFeatureUsage('study_mode', { enabled: newStudyMode })
                      tracking.studyModeToggled(newStudyMode)
                    }}
                    style={{
                      padding: '8px 12px',
                      background: studyMode ? 'var(--bg-success)' : 'var(--bg-section)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      fontWeight: studyMode ? 'bold' : 'normal',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      flexShrink: 0
                    }}
                    title="Toggle Study Mode"
                  >
                    {studyMode ? '🎯 Study Mode' : '📚 Study'}
                  </button>
                  <div style={{
                    flex: isMobile ? '1 1 100%' : '1 1 auto',
                    minWidth: isMobile ? '100%' : '200px',
                    maxWidth: isMobile ? '100%' : '400px'
                  }}>
                    <SearchBar
                      ref={searchInputRef}
                      onSearch={handleSearch}
                      results={searchResults}
                      onResultClick={(day) => {
                        // Find exercise by day number
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
                </div>
              </header>

              {/* Progress Dashboard */}
              <div ref={progressDashboardRef}>
                <MemoizedProgressDashboard exercises={exercises} />
              </div>

              {/* Breadcrumbs */}
              {!showTools && currentExerciseData && (
                <MemoizedBreadcrumbs exercise={currentExerciseData} />
              )}

              {/* Exercise Content, Tools, or Community */}
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
            </main>
          </div>

          {/* Floating Action Buttons */}
          <FloatingActions
            onSearch={() => {
              if (searchInputRef.current) {
                searchInputRef.current.focus()
                // Scroll to search bar smoothly
                setTimeout(() => {
                  searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }, TIMEOUT.SCROLL_DELAY)
              }
            }}
            onProgress={() => {
              if (progressDashboardRef.current) {
                progressDashboardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }
            }}
            onSettings={() => {
              setShowSettings(true)
            }}
            onAnalytics={() => {
              setShowAnalytics(true)
            }}
            onTools={() => {
              setShowTools(true)
            }}
          />

          {/* Settings Modal */}
          <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

          {/* Analytics Panel */}
          {showAnalytics && <AnalyticsPanel onClose={() => setShowAnalytics(false)} />}

          {/* Keyboard Shortcuts Help */}
          <KeyboardShortcutsHelp isOpen={showShortcutsHelp} onClose={() => setShowShortcutsHelp(false)} />

          {/* Guided Tutorial */}
          {showTutorial && (
            <GuidedTutorial
              tutorialId="onboarding"
              title="Welcome Tutorial"
              steps={onboardingTutorial}
              onComplete={() => setShowTutorial(false)}
              onSkip={() => setShowTutorial(false)}
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