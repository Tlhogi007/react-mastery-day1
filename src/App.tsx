import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  useDeferredValue,
  lazy,
  Suspense,
  type JSX,
} from 'react'
import './App.css'
import type { ExerciseKey, ExercisesRegistry } from './types/exercises'
import Landing from './pages/Landing'
import SearchBar from './components/SearchBar'
import { initGA, trackPageView, tracking } from './lib/googleAnalytics'
import { setAppContext } from './lib/sentry'
import { MemoizedSidebar, MemoizedProgressDashboard, MemoizedBreadcrumbs } from './components/memoized/MemoizedComponents'
import SettingsModal from './components/SettingsModal'
import { AuthButton } from './components/AuthButton'
import { AiAuthBridge } from './components/AiAuthBridge'
import { AiQuotaModal } from './components/AiQuotaModal'
import { ShareDayButton } from './components/ShareDayButton'
import { ScrollToTopButton } from './components/ScrollToTopButton'
import { Tip } from './components/ui/Tip'
import { SignedInGreeting } from './components/SignedInGreeting'
import { UserCloudSync } from './components/UserCloudSync'
import { Week1Certificate } from './components/Week1Certificate'
import { applyDocumentMeta } from './lib/shareDay'
import { shouldNudgeDaySkip } from './lib/learningPath'
import {
  prepareLandingAfterSignOut,
  getActiveTab,
  readAuthReturnTo,
  setActiveTab,
  writeLabSession,
  type AuthReturnView,
} from './services/authReturnTo'
import { clearQuizProgress } from './services/quizResume'
import { emitAiGateDismissLocal } from './services/aiAuthBridge'
import { SignOutLandingRedirect } from './components/SignOutLandingRedirect'
import AnalyticsPanel from './components/AnalyticsPanel'
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp'
import ThemeToggle from './components/ThemeToggle'
import StudyMode from './components/StudyMode'
import ToastContainer from './components/ui/ToastContainer'
import Confetti from './components/ui/Confetti'
import PageTransition from './components/animations/PageTransition'
import GuidedTutorial, { onboardingTutorial, type TutorialStep } from './components/GuidedTutorial'
import { CardSkeleton } from './components/ui/LoadingSkeleton'
import { settingsStorage } from './services/settingsStorage'
import { analytics } from './services/analytics'
import { progressStorage } from './services/progressStorage'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { BREAKPOINTS } from './constants'

const CommunityPage = lazy(() => import('./pages/CommunityPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
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
  const [savedReturn] = useState(() => readAuthReturnTo(exercises))
  const [showLanding, setShowLanding] = useState<boolean>(() => !savedReturn?.inLab)
  const [currentView, setCurrentView] = useState<AuthReturnView>(
    () => savedReturn?.view ?? 'exercises',
  )
  const [currentExercise, setCurrentExercise] = useState<ExerciseKey>(
    () => (savedReturn?.exercise as ExerciseKey) ?? 'day01-rendering-pipeline',
  )
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isMobile, setIsMobile] = useState<boolean>(() => window.innerWidth < BREAKPOINTS.MOBILE)
  const [showSidebar, setShowSidebar] = useState<boolean>(
    () => window.innerWidth >= BREAKPOINTS.MOBILE,
  )
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState<boolean>(false)
  const [studyMode, setStudyMode] = useState<boolean>(false)
  const [showConfetti, setShowConfetti] = useState<boolean>(false)
  const [showTools, setShowTools] = useState<boolean>(() => savedReturn?.tools ?? false)
  const [showTutorial, setShowTutorial] = useState<boolean>(false)
  const [dayCompleteTick, setDayCompleteTick] = useState(0)
  const [aiGate, setAiGate] = useState<{ mode: 'auth' | 'quota'; message: string } | null>(null)
  const [showCertificate, setShowCertificate] = useState(false)
  const [communitySlug, setCommunitySlug] = useState<string | null>(null)
  const aiSignInRef = useRef<(() => void) | null>(null)
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

  const handleSignedOut = useCallback(() => {
    // Keep FORCE_LANDING / ?rm=landing until remount reads them — clearing early
    // raced Clerk's afterSignOutUrl and restored the lab from sessionStorage.
    prepareLandingAfterSignOut()
    clearQuizProgress()
    setAiGate(null)
    setShowTools(false)
    setShowSettings(false)
    setShowAnalytics(false)
    setShowLanding(true)
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  // Keep lab location across OAuth remounts
  useEffect(() => {
    if (showLanding) return
    writeLabSession({
      exercise: currentExercise,
      view: currentView,
      tools: showTools,
    })
  }, [showLanding, currentExercise, currentView, showTools])

  // Ensure restored tab is available before day Tabs mount
  useEffect(() => {
    if (savedReturn?.tab) setActiveTab(savedReturn.tab)
  }, [savedReturn])

  useEffect(() => {
    // Local progress UI only — cloud pull already merges; don't bump on USER_CLOUD_SYNCED
    // (that was re-triggering uploads in a loop).
    const bump = () => setDayCompleteTick((n) => n + 1)
    window.addEventListener('rm-progress-changed', bump)
    return () => {
      window.removeEventListener('rm-progress-changed', bump)
    }
  }, [])

  useEffect(() => {
    const openSettings = () => setShowSettings(true)
    const openSignIn = () => {
      if (!clerkEnabled) {
        setShowSettings(true)
        return
      }
      tracking.signInOpened('ai_gate')
      setAiGate(null)
      aiSignInRef.current?.()
    }
    window.addEventListener('rm-open-settings', openSettings)
    window.addEventListener('rm-open-ai-sign-in', openSignIn)
    return () => {
      window.removeEventListener('rm-open-settings', openSettings)
      window.removeEventListener('rm-open-ai-sign-in', openSignIn)
    }
  }, [clerkEnabled])

  // Initialize Google Analytics
  useEffect(() => {
    initGA()
  }, [])

  // Document title / OG + funnel: landing view vs day entered
  const funnelExerciseRef = useRef<string | null>(null)
  const landingTrackedRef = useRef(false)
  useEffect(() => {
    if (showLanding) {
      applyDocumentMeta('landing')
      trackPageView('/', 'React Mastery Lab')
      if (!landingTrackedRef.current) {
        landingTrackedRef.current = true
        tracking.landingViewed()
      }
      funnelExerciseRef.current = null
      return
    }
    const data = exercises[currentExercise]
    if (!data || currentView !== 'exercises' || showTools) return
    applyDocumentMeta({
      key: currentExercise,
      day: data.day,
      week: data.week,
      title: data.title.replace(/^Day \d+:\s*/i, ''),
      description: data.description,
    })
    if (funnelExerciseRef.current === currentExercise) return
    funnelExerciseRef.current = currentExercise
    tracking.exerciseStarted(data.day, data.week)
  }, [showLanding, currentExercise, currentView, showTools])

  // Sentry context for alerts (day / view / exercise)
  useEffect(() => {
    if (showLanding) {
      setAppContext({ view: 'landing', day: null, exercise: null, week: null })
      return
    }
    if (showTools) {
      setAppContext({
        view: 'tools',
        day: exercises[currentExercise]?.day ?? null,
        exercise: currentExercise,
        week: exercises[currentExercise]?.week ?? null,
      })
      return
    }
    if (currentView === 'community') {
      setAppContext({ view: 'community', day: null, exercise: null, week: null })
      return
    }
    if (currentView === 'settings') {
      setAppContext({ view: 'settings', day: null, exercise: null, week: null })
      return
    }
    setAppContext({
      view: 'exercises',
      day: exercises[currentExercise]?.day ?? null,
      exercise: currentExercise,
      week: exercises[currentExercise]?.week ?? null,
    })
  }, [showLanding, showTools, currentView, currentExercise, exercises])

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
      const mobile = window.innerWidth < BREAKPOINTS.MOBILE
      setIsMobile(mobile)
      setShowSidebar(!mobile)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!isMobile || !showSidebar) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isMobile, showSidebar])

  const handleExerciseSelect = useCallback((key: ExerciseKey): void => {
    const day = exercises[key]?.day
    if (typeof day === 'number' && shouldNudgeDaySkip(day)) {
      window.dispatchEvent(
        new CustomEvent('showToast', {
          detail: {
            message: `Suggested path: finish Day ${day - 1} first — jumping ahead is fine, just expect more context.`,
            type: 'info',
          },
        }),
      )
    }
    // Don't carry Learn/Quiz/etc. across days — only auth restore should keep a tab.
    setCurrentExercise((prev) => {
      if (key !== prev) setActiveTab('learn')
      return key
    })
    setCurrentView('exercises')
    setShowTools(false)
    if (isMobile) {
      setShowSidebar(false)
    }
    analytics.trackExerciseComplete(exercises[key].day, exercises[key].week)
  }, [exercises, isMobile])

  const handleNavigateToDay = useCallback((day: number): void => {
    const entry = (Object.entries(exercises) as [ExerciseKey, (typeof exercises)[ExerciseKey]][])
      .find(([, exercise]) => exercise.day === day)
    if (!entry) {
      window.dispatchEvent(
        new CustomEvent('showToast', {
          detail: { message: `Day ${day} is not available yet`, type: 'error' },
        })
      )
      return
    }
    handleExerciseSelect(entry[0])
  }, [exercises, handleExerciseSelect])

  const prepareTutorialStep = useCallback(
    (step: TutorialStep) => {
      if (!isMobile) return
      setShowSidebar(Boolean(step.needsSidebar))
    },
    [isMobile],
  )

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

  const isCurrentDayCompleted = useMemo(
    () => progressStorage.isDayCompleted(exercises[currentExercise].day),
    [currentExercise, dayCompleteTick],
  )

  // Keyboard shortcuts for navigation
  useKeyboardShortcuts({
    onNext: handleNextExercise,
    onPrevious: handlePreviousExercise,
    enabled: !showSettings && !studyMode
  })

  const deferredSearchQuery = useDeferredValue(searchQuery)

  const searchResults = useMemo<SearchResult[]>(() => {
    if (deferredSearchQuery.length === 0) return []

    const query = deferredSearchQuery.toLowerCase()
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
  }, [deferredSearchQuery])

  const handleSearch = useCallback((query: string): void => {
    setSearchQuery(query)
    // Navigate only via result click — typing must not remount the day app.
    if (query.length > 2) {
      analytics.trackSearch(query, 0)
    }
  }, [])


  const appContainerStyle: React.CSSProperties = {
    display: 'flex',
    minHeight: '100dvh',
    background: 'transparent',
    width: '100%',
    margin: 0,
    padding: 0,
  }

  const sidebarExpanded = showSidebar && !isMobile
  const layoutEase = '0.4s cubic-bezier(0.22, 1, 0.36, 1)'
  const mainContentStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    padding: isMobile
      ? '12px 12px calc(32px + env(safe-area-inset-bottom, 0px))'
      : sidebarExpanded
        ? '24px 28px 56px'
        : '24px 40px 56px',
    paddingLeft: isMobile
      ? 'max(12px, env(safe-area-inset-left, 0px))'
      : undefined,
    paddingRight: isMobile
      ? 'max(12px, env(safe-area-inset-right, 0px))'
      : undefined,
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
    padding: isMobile ? '12px' : '14px 16px',
    marginBottom: isMobile ? '12px' : '20px',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: isMobile ? 10 : 12,
    rowGap: isMobile ? 10 : 12,
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: 'none',
    position: isMobile ? 'sticky' : 'relative',
    top: isMobile ? 'max(0px, env(safe-area-inset-top, 0px))' : undefined,
    zIndex: isMobile ? 50 : undefined,
  }

  const headerBtnStyle: React.CSSProperties = {
    padding: isMobile ? 0 : '8px 14px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    minHeight: 40,
    minWidth: isMobile ? 40 : undefined,
    width: isMobile ? 40 : undefined,
    height: isMobile ? 40 : 38,
    color: 'var(--text-primary)',
    boxShadow: 'var(--shadow-sm)',
  }

  const lessonTitle = currentExerciseData
    ? currentExerciseData.title.replace(/^Day \d+:\s*/i, '')
    : "Today's lesson"

  const headerTitle = showTools
    ? 'Tools'
    : currentView === 'community'
      ? 'Community'
      : currentView === 'settings'
        ? 'Account'
        : lessonTitle

  const headerSubtitle = showTools
    ? 'Practice utilities'
    : currentView === 'community'
      ? 'Shared learnings'
      : currentView === 'settings'
        ? 'Data & admin'
        : currentExerciseData
          ? `Week ${currentExerciseData.week} · Day ${String(currentExerciseData.day).padStart(2, '0')}`
          : 'Internals lab'

  const showFocusControl =
    !showTools && currentView === 'exercises'

  return (
    <>
      {clerkEnabled && <SignOutLandingRedirect onSignedOut={handleSignedOut} />}
      {clerkEnabled && (
        <AiAuthBridge
          onGate={(event) => setAiGate(event)}
          onSignInReady={(open) => {
            aiSignInRef.current = open
          }}
        />
      )}
      {clerkEnabled && (
        <UserCloudSync
          exercise={currentExercise}
          view={currentView}
          tools={showTools}
          tab={getActiveTab() || undefined}
          progressEpoch={dayCompleteTick}
          onRestoredLab={(lab) => {
            // Apply restored lab location even if still on landing (used when they enter).
            if (lab.exercise in exercises) {
              setCurrentExercise(lab.exercise as ExerciseKey)
            }
            setCurrentView(lab.view)
            setShowTools(lab.tools)
            if (lab.tab) setActiveTab(lab.tab)
            setDayCompleteTick((n) => n + 1)
          }}
        />
      )}
      {showLanding ? (
        <Landing
          exercises={exercises}
          onGetStarted={(opts) => {
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
            document.documentElement.scrollTop = 0
            document.body.scrollTop = 0
            setShowLanding(false)
            setShowTools(false)
            if (opts?.communitySlug) {
              setCommunitySlug(opts.communitySlug)
              setCurrentView('community')
            } else {
              setCurrentView('exercises')
              if (opts?.exercise && opts.exercise in exercises) {
                setCurrentExercise(opts.exercise as ExerciseKey)
              }
            }
            setShowSidebar(window.innerWidth >= BREAKPOINTS.MOBILE)
            if (!opts?.communitySlug && !settingsStorage.hasCompletedOnboarding()) {
              // Let the lab shell mount before highlighting targets
              window.setTimeout(() => setShowTutorial(true), 450)
            }
          }}
        />
      ) : (
        <div style={appContainerStyle} className={isMobile ? 'app-shell-mobile' : undefined}>
          {isMobile && showSidebar && !showTutorial && (
            <button
              type="button"
              aria-label="Close menu"
              className="app-drawer-backdrop"
              onClick={() => setShowSidebar(false)}
            />
          )}
          {/* Sidebar — stays mounted so width can animate instead of hard-cut */}
          <div
            className={isMobile ? 'app-drawer-panel' : undefined}
            style={{
              position: isMobile ? 'fixed' : 'relative',
              zIndex: isMobile ? 1001 : 1000,
              height: isMobile ? '100dvh' : '100dvh',
              flexShrink: 0,
              overflow: 'hidden',
              ...(isMobile
                ? {
                    width: 'min(300px, 86vw)',
                    left: 0,
                    top: 0,
                    transform: showSidebar ? 'translateX(0)' : 'translateX(-105%)',
                    transition: `transform ${layoutEase}`,
                    pointerEvents: showSidebar ? 'auto' : 'none',
                    paddingTop: 'env(safe-area-inset-top, 0px)',
                    boxShadow: showSidebar ? 'var(--shadow-md)' : 'none',
                  }
                : {
                    width: showSidebar ? 260 : 0,
                    transition: `width ${layoutEase}`,
                  }),
            }}
          >
            <div style={{ width: isMobile ? 'min(300px, 86vw)' : 260, height: '100%' }}>
              <MemoizedSidebar
                exercises={exercises}
                currentExercise={currentExercise}
                onExerciseSelect={handleExerciseSelect}
                onToolsClick={() => {
                  setShowTools(true)
                  setCurrentView('exercises')
                  if (isMobile) setShowSidebar(false)
                }}
                onCommunityClick={() => {
                  setShowTools(false)
                  setCurrentView('community')
                  if (isMobile) setShowSidebar(false)
                }}
                onSettingsClick={() => {
                  setShowSettings(true)
                  if (isMobile) setShowSidebar(false)
                }}
                onAnalyticsClick={() => {
                  setShowAnalytics(true)
                  if (isMobile) setShowSidebar(false)
                }}
                onShortcutsClick={() => {
                  setShowShortcutsHelp(true)
                  if (isMobile) setShowSidebar(false)
                }}
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
                  aria-label={showSidebar ? 'Close menu' : 'Open menu'}
                  title={showSidebar ? 'Close menu' : 'Open menu'}
                  aria-expanded={showSidebar}
                >
                  {isMobile ? (
                    showSidebar ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M6 6l12 12M18 6L6 18"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M4 7h16M4 12h16M4 17h16"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                        />
                      </svg>
                    )
                  ) : showSidebar ? (
                    '◀ Menu'
                  ) : (
                    '▶ Menu'
                  )}
                </button>

                {/* Title in hero on mobile; hide on desktop when sidebar already names the day */}
                {!isMobile && !showSidebar && (
                  <div
                    style={{
                      minWidth: 0,
                      flex: '1 1 0',
                    }}
                  >
                    <h1
                      style={{
                        margin: 0,
                        fontFamily: 'var(--font-display)',
                        fontSize: 18,
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        lineHeight: 1.2,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {headerTitle}
                    </h1>
                    <p
                      style={{
                        margin: '3px 0 0',
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {headerSubtitle}
                    </p>
                  </div>
                )}

                {!studyMode && (
                  <div
                    style={{
                      flex: isMobile ? '1 1 100%' : '1 1 200px',
                      minWidth: isMobile ? 0 : 180,
                      maxWidth: isMobile ? '100%' : 280,
                      // Phones: search on its own row under Menu/actions
                      order: isMobile ? 3 : undefined,
                    }}
                  >
                    <SearchBar
                      ref={searchInputRef}
                      onSearch={handleSearch}
                      results={searchResults}
                      onResultClick={(day) => {
                        const exerciseKey = Object.entries(exercises).find(
                          ([, exercise]) => exercise.day === day
                        )?.[0] as ExerciseKey | undefined
                        if (exerciseKey) {
                          handleExerciseSelect(exerciseKey)
                        }
                      }}
                    />
                  </div>
                )}

                <div
                  className="app-header-actions"
                  style={{
                    flex: '0 0 auto',
                    marginLeft: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: isMobile ? 6 : 8,
                    // Keep actions on the first row (right) when search wraps
                    order: isMobile ? 2 : undefined,
                  }}
                >
                  <Tip label="Theme">
                    <span data-tutorial="theme" style={{ display: 'inline-flex' }}>
                      <ThemeToggle compact={isMobile} />
                    </span>
                  </Tip>
                  {showFocusControl && currentExerciseData && (
                    <Tip label="Share day">
                      <span data-tutorial="share" style={{ display: 'inline-flex' }}>
                        <ShareDayButton
                          compact={isMobile}
                          info={{
                            key: currentExercise,
                            day: currentExerciseData.day,
                            week: currentExerciseData.week,
                            title: currentExerciseData.title.replace(/^Day \d+:\s*/i, ''),
                            description: currentExerciseData.description,
                          }}
                        />
                      </span>
                    </Tip>
                  )}
                  {showFocusControl && (
                    <Tip label={studyMode ? 'Exit focus' : 'Focus'}>
                      <button
                        type="button"
                        data-tutorial="focus"
                        onClick={() => {
                          const newStudyMode = !studyMode
                          setStudyMode(newStudyMode)
                          analytics.trackFeatureUsage('study_mode', { enabled: newStudyMode })
                          tracking.studyModeToggled(newStudyMode)
                        }}
                        aria-label={studyMode ? 'Exit focus mode' : 'Enter focus mode'}
                        aria-pressed={studyMode}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          width: isMobile ? 40 : 36,
                          height: isMobile ? 40 : 36,
                          minWidth: isMobile ? 40 : 36,
                          borderRadius: 8,
                          border: studyMode
                            ? '1px solid var(--button-primary)'
                            : '1px solid transparent',
                          background: studyMode ? 'var(--button-primary)' : 'transparent',
                          color: studyMode ? 'var(--button-text)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition:
                            'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (studyMode) return
                          e.currentTarget.style.background = 'var(--bg-section)'
                          e.currentTarget.style.color = 'var(--text-primary)'
                        }}
                        onMouseLeave={(e) => {
                          if (studyMode) return
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = 'var(--text-secondary)'
                        }}
                      >
                        {studyMode ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                              d="M9 4H5v4M15 4h4v4M9 20H5v-4M15 20h4v-4"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                              d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    </Tip>
                  )}
                  {clerkEnabled && (
                    <div
                      className="app-header-auth"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginLeft: isMobile ? 2 : 4,
                      }}
                    >
                      <AuthButton />
                    </div>
                  )}
                </div>
              </header>

              {/* Focus mode strips first-fold chrome so Studying + content own the screen */}
              {!studyMode && clerkEnabled && !showTools && currentView === 'exercises' && (
                <SignedInGreeting />
              )}

              {!studyMode && !showTools && currentView === 'exercises' && (
                <MemoizedProgressDashboard
                  exercises={exercises}
                  onOpenCertificate={() => setShowCertificate(true)}
                  onJumpToDay={handleNavigateToDay}
                />
              )}

              {!studyMode &&
                !showTools &&
                currentView === 'exercises' &&
                currentExerciseData && (
                <MemoizedBreadcrumbs
                  exercise={currentExerciseData}
                  isDayCompleted={isCurrentDayCompleted}
                  onMarkComplete={handleMarkComplete}
                />
              )}

              {/* Exercise Content, Tools, or Community */}
              <Suspense fallback={<CardSkeleton />}>
                {showTools ? (
                  <Tools
                    onBack={() => setShowTools(false)}
                    onNavigateToDay={handleNavigateToDay}
                  />
                ) : currentView === 'community' ? (
                  <CommunityPage initialSlug={communitySlug} />
                ) : currentView === 'settings' ? (
                  <SettingsPage
                    onBack={() => {
                      setShowTools(false)
                      setCurrentView('exercises')
                    }}
                  />
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

          <AiQuotaModal
            open={Boolean(aiGate)}
            mode={aiGate?.mode || 'quota'}
            message={aiGate?.message || ''}
            onClose={() => {
              // Close UI first; dismiss-local cancels in-flight AI / finishes if needed
              setAiGate(null)
              emitAiGateDismissLocal()
            }}
            onSignIn={
              clerkEnabled
                ? () => {
                    // Close our overlay first — it sits above Clerk's modal (z-index 2000).
                    tracking.signInOpened('ai_gate')
                    setAiGate(null)
                    aiSignInRef.current?.()
                  }
                : undefined
            }
            onOpenSettings={() => {
              setAiGate(null)
              setShowSettings(true)
            }}
          />

          {/* Settings Modal */}
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            onOpenAccountPage={() => {
              setShowTools(false)
              setCurrentView('settings')
              if (isMobile) setShowSidebar(false)
            }}
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
              isMobile={isMobile}
              onPrepareStep={prepareTutorialStep}
              onComplete={() => {
                settingsStorage.setOnboardingComplete(true)
                setShowTutorial(false)
                if (isMobile) setShowSidebar(false)
              }}
              onSkip={() => {
                settingsStorage.setOnboardingComplete(true)
                setShowTutorial(false)
                if (isMobile) setShowSidebar(false)
              }}
            />
          )}

          {/* Toast Container */}
          <ToastContainer />
          <ScrollToTopButton />
          {showCertificate && (
            <Week1Certificate onClose={() => setShowCertificate(false)} />
          )}

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