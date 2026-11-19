import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  useDeferredValue,
  type JSX,
} from 'react'
import './App.css'
import type { ExerciseKey } from './types/exercises'
import Landing from './pages/Landing'
import IntroSplash from './pages/IntroSplash'
import { initGA, trackPageView, tracking } from './lib/googleAnalytics'
import { setAppContext } from './lib/sentry'
import { AiAuthBridge } from './components/AiAuthBridge'
import { UserCloudSync } from './components/UserCloudSync'
import { USER_CLOUD_SYNCED_EVENT, type UserCloudSnapshot } from './services/userCloudSync'
import { applyDocumentMeta } from './lib/shareDay'
import {
  prepareLandingAfterSignOut,
  getActiveTab,
  readAuthReturnTo,
  setActiveTab,
  writeLabSession,
  peekSkipIntroAfterAuth,
  clearSkipIntroAfterAuth,
} from './services/authReturnTo'
import { DismissIntroOnSignIn } from './components/DismissIntroOnSignIn'
import { clearQuizProgress } from './services/quizResume'
import { SignOutLandingRedirect } from './components/SignOutLandingRedirect'
import { LabShell } from './components/LabShell'
import type { TutorialStep } from './components/GuidedTutorial'
import { settingsStorage } from './services/settingsStorage'
import { applyAppTheme } from './services/theme'
import { analytics } from './services/analytics'
import { useLabNavigation } from './hooks/useLabNavigation'
import { exercises, searchExercises } from './lab/exercisesRegistry'
import { BREAKPOINTS } from './constants'

function App(): JSX.Element {
  const [savedReturn] = useState(() => readAuthReturnTo(exercises))
  const [showLanding, setShowLanding] = useState<boolean>(() => !savedReturn?.inLab)
  /** Intro on landing visits, but never right after Clerk sign-in remount. */
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    if (savedReturn?.inLab) return false
    if (peekSkipIntroAfterAuth()) return false
    return true
  })
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isMobile, setIsMobile] = useState<boolean>(() => window.innerWidth < BREAKPOINTS.MOBILE)
  const [showSidebar, setShowSidebar] = useState<boolean>(
    () => window.innerWidth >= BREAKPOINTS.MOBILE,
  )
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState<boolean>(false)
  const [studyMode, setStudyModeState] = useState<boolean>(() => settingsStorage.getStudyMode())
  const setStudyMode = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setStudyModeState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value
      settingsStorage.setStudyMode(next)
      return next
    })
  }, [])
  const [showConfetti, setShowConfetti] = useState<boolean>(false)
  const [showTutorial, setShowTutorial] = useState<boolean>(false)
  const [dayCompleteTick, setDayCompleteTick] = useState(0)
  const [aiGate, setAiGate] = useState<{ mode: 'auth' | 'quota'; message: string } | null>(null)
  const [showCertificate, setShowCertificate] = useState(false)
  const [communitySlug, setCommunitySlug] = useState<string | null>(null)
  const aiSignInRef = useRef<(() => void) | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

  const bumpProgress = useCallback(() => setDayCompleteTick((n) => n + 1), [])

  const nav = useLabNavigation({
    initialExercise: (savedReturn?.exercise as ExerciseKey) ?? 'day01-rendering-pipeline',
    initialView: savedReturn?.view ?? 'exercises',
    initialTools: savedReturn?.tools ?? false,
    shortcutsEnabled: !showSettings && !studyMode,
    onProgressBump: bumpProgress,
    progressEpoch: dayCompleteTick,
  })

  const {
    currentView,
    setCurrentView,
    currentExercise,
    setCurrentExercise,
    showTools,
    setShowTools,
    currentExerciseData,
    ExerciseComponent,
    handleExerciseSelect,
    handleNavigateToDay,
    handleMarkComplete,
    isCurrentDayCompleted,
  } = nav

  const handleSignedOut = useCallback(() => {
    prepareLandingAfterSignOut()
    clearQuizProgress()
    setAiGate(null)
    setShowTools(false)
    setShowSettings(false)
    setShowAnalytics(false)
    setShowIntro(false)
    setShowLanding(true)
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [setShowTools])

  useEffect(() => {
    if (showLanding) return
    writeLabSession({
      exercise: currentExercise,
      view: currentView,
      tools: showTools,
    })
  }, [showLanding, currentExercise, currentView, showTools])

  useEffect(() => {
    if (savedReturn?.tab) setActiveTab(savedReturn.tab)
  }, [savedReturn])

  useEffect(() => {
    const bump = () => setDayCompleteTick((n) => n + 1)
    window.addEventListener('rm-progress-changed', bump)
    return () => {
      window.removeEventListener('rm-progress-changed', bump)
    }
  }, [])

  // Restore focus mode / prefs after cloud pull without looping a push.
  useEffect(() => {
    const onSynced = (event: Event) => {
      const cloud = (event as CustomEvent<UserCloudSnapshot>).detail
      if (cloud?.settings && typeof cloud.settings.studyMode === 'boolean') {
        setStudyModeState(Boolean(cloud.settings.studyMode))
      }
    }
    window.addEventListener(USER_CLOUD_SYNCED_EVENT, onSynced)
    return () => window.removeEventListener(USER_CLOUD_SYNCED_EVENT, onSynced)
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

  useEffect(() => {
    initGA()
  }, [])

  const funnelExerciseRef = useRef<string | null>(null)
  const landingTrackedRef = useRef(false)
  // Landing visits re-show intro, except post-auth (keep skip flag until leave landing —
  // consuming on mount broke under React Strict Mode double-invoke).
  useEffect(() => {
    if (!showLanding) {
      clearSkipIntroAfterAuth()
      return
    }
    if (peekSkipIntroAfterAuth()) {
      setShowIntro(false)
      return
    }
    setShowIntro(true)
  }, [showLanding])

  const enterLabAfterSignIn = useCallback(() => {
    setShowIntro(false)
    setShowLanding(false)
    setShowTools(false)
    setCurrentView('exercises')
    setShowSidebar(window.innerWidth >= BREAKPOINTS.MOBILE)
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [setCurrentView])

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
    if (currentView === 'support') {
      setAppContext({ view: 'support', day: null, exercise: null, week: null })
      return
    }
    setAppContext({
      view: 'exercises',
      day: exercises[currentExercise]?.day ?? null,
      exercise: currentExercise,
      week: exercises[currentExercise]?.week ?? null,
    })
  }, [showLanding, showTools, currentView, currentExercise])

  useEffect(() => {
    if (!showLanding) {
      trackPageView(`/exercise/${currentExercise}`)
    }
  }, [currentExercise, showLanding])

  useEffect(() => {
    if (showLanding) return
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [showLanding, currentExercise, currentView])

  useEffect(() => {
    const handleConfetti = (): void => {
      setShowConfetti(true)
    }
    window.addEventListener('showConfetti', handleConfetti as EventListener)
    return () => window.removeEventListener('showConfetti', handleConfetti as EventListener)
  }, [])

  useEffect(() => {
    applyAppTheme(settingsStorage.getTheme())
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

  const prepareTutorialStep = useCallback(
    (step: TutorialStep) => {
      if (!isMobile) return
      setShowSidebar(Boolean(step.needsSidebar))
    },
    [isMobile],
  )

  const deferredSearchQuery = useDeferredValue(searchQuery)
  const searchResults = useMemo(
    () => searchExercises(deferredSearchQuery),
    [deferredSearchQuery],
  )

  const handleSearch = useCallback((query: string): void => {
    setSearchQuery(query)
    if (query.length > 2) {
      analytics.trackSearch(query, 0)
    }
  }, [])

  return (
    <>
      {clerkEnabled && <SignOutLandingRedirect onSignedOut={handleSignedOut} />}
      {clerkEnabled && <DismissIntroOnSignIn onEnterLab={enterLabAfterSignIn} />}
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
        <>
          {showIntro && <IntroSplash onContinue={() => setShowIntro(false)} />}
          <Landing
            exercises={exercises}
            onOpenSupport={() => {
              setShowIntro(false)
              setShowLanding(false)
              setShowTools(false)
              setCurrentView('support')
              setShowSidebar(window.innerWidth >= BREAKPOINTS.MOBILE)
            }}
            onGetStarted={(opts) => {
              window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
              document.documentElement.scrollTop = 0
              document.body.scrollTop = 0
              setShowIntro(false)
              setShowLanding(false)
              setShowTools(false)
              if (opts?.communitySlug) {
                setCommunitySlug(opts.communitySlug)
                setCurrentView('community')
              } else if (opts?.support) {
                setCurrentView('support')
              } else {
                setCurrentView('exercises')
                if (opts?.exercise && opts.exercise in exercises) {
                  setCurrentExercise(opts.exercise as ExerciseKey)
                }
              }
              setShowSidebar(window.innerWidth >= BREAKPOINTS.MOBILE)
              if (
                !opts?.communitySlug &&
                !opts?.support &&
                !settingsStorage.hasCompletedOnboarding()
              ) {
                window.setTimeout(() => setShowTutorial(true), 450)
              }
            }}
          />
        </>
      ) : (
        <LabShell
          isMobile={isMobile}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          clerkEnabled={clerkEnabled}
          studyMode={studyMode}
          setStudyMode={setStudyMode}
          currentView={currentView}
          setCurrentView={setCurrentView}
          currentExercise={currentExercise}
          showTools={showTools}
          setShowTools={setShowTools}
          currentExerciseData={currentExerciseData}
          ExerciseComponent={ExerciseComponent}
          handleExerciseSelect={handleExerciseSelect}
          handleNavigateToDay={handleNavigateToDay}
          handleMarkComplete={handleMarkComplete}
          isCurrentDayCompleted={isCurrentDayCompleted}
          searchResults={searchResults}
          handleSearch={handleSearch}
          searchInputRef={searchInputRef}
          communitySlug={communitySlug}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          showAnalytics={showAnalytics}
          setShowAnalytics={setShowAnalytics}
          showShortcutsHelp={showShortcutsHelp}
          setShowShortcutsHelp={setShowShortcutsHelp}
          showTutorial={showTutorial}
          setShowTutorial={setShowTutorial}
          prepareTutorialStep={prepareTutorialStep}
          showCertificate={showCertificate}
          setShowCertificate={setShowCertificate}
          showConfetti={showConfetti}
          setShowConfetti={setShowConfetti}
          aiGate={aiGate}
          setAiGate={setAiGate}
          aiSignInRef={aiSignInRef}
          setShowLanding={setShowLanding}
        />
      )}
    </>
  )
}

export default App
