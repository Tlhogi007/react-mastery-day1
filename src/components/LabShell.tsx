import { lazy, Suspense, type JSX, type RefObject } from 'react'
import type { ExerciseKey } from '../types/exercises'
import type { AuthReturnView } from '../services/authReturnTo'
import { exercises } from '../lab/exercisesRegistry'
import SearchBar from './SearchBar'
import {
  MemoizedSidebar,
  MemoizedProgressDashboard,
  MemoizedBreadcrumbs,
} from './memoized/MemoizedComponents'
import SettingsModal from './SettingsModal'
import { AuthButton } from './AuthButton'
import { AiQuotaModal } from './AiQuotaModal'
import { ShareDayButton } from './ShareDayButton'
import { ScrollToTopButton } from './ScrollToTopButton'
import { Tip } from './ui/Tip'
import { SignedInGreeting } from './SignedInGreeting'
import { Week1Certificate } from './Week1Certificate'
import AnalyticsPanel from './AnalyticsPanel'
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp'
import ThemeToggle from './ThemeToggle'
import StudyMode from './StudyMode'
import ToastContainer from './ui/ToastContainer'
import Confetti from './ui/Confetti'
import PageTransition from './animations/PageTransition'
import GuidedTutorial, { onboardingTutorial, type TutorialStep } from './GuidedTutorial'
import { CardSkeleton } from './ui/LoadingSkeleton'
import { settingsStorage } from '../services/settingsStorage'
import { analytics } from '../services/analytics'
import { tracking } from '../lib/googleAnalytics'
import { emitAiGateDismissLocal } from '../services/aiAuthBridge'
import type { SearchResult } from '../lab/exercisesRegistry'

const CommunityPage = lazy(() => import('../pages/CommunityPage'))
const SettingsPage = lazy(() => import('../pages/SettingsPage'))
const SupportPage = lazy(() => import('../pages/SupportPage'))
const Tools = lazy(() => import('../pages/Tools'))

export interface LabShellProps {
  isMobile: boolean
  showSidebar: boolean
  setShowSidebar: (show: boolean) => void
  clerkEnabled: boolean
  studyMode: boolean
  setStudyMode: (value: boolean | ((prev: boolean) => boolean)) => void
  currentView: AuthReturnView
  setCurrentView: (view: AuthReturnView) => void
  currentExercise: ExerciseKey
  showTools: boolean
  setShowTools: (show: boolean) => void
  currentExerciseData: (typeof exercises)[ExerciseKey] | undefined
  ExerciseComponent: (typeof exercises)[ExerciseKey]['component'] | undefined
  handleExerciseSelect: (key: ExerciseKey) => void
  handleNavigateToDay: (day: number) => void
  handleMarkComplete: () => void
  isCurrentDayCompleted: boolean
  searchResults: SearchResult[]
  handleSearch: (query: string) => void
  searchInputRef: RefObject<HTMLInputElement | null>
  communitySlug: string | null
  showSettings: boolean
  setShowSettings: (show: boolean) => void
  showAnalytics: boolean
  setShowAnalytics: (show: boolean) => void
  showShortcutsHelp: boolean
  setShowShortcutsHelp: (show: boolean) => void
  showTutorial: boolean
  setShowTutorial: (show: boolean) => void
  prepareTutorialStep: (step: TutorialStep) => void
  showCertificate: boolean
  setShowCertificate: (show: boolean) => void
  showConfetti: boolean
  setShowConfetti: (show: boolean) => void
  aiGate: { mode: 'auth' | 'quota'; message: string } | null
  setAiGate: (gate: { mode: 'auth' | 'quota'; message: string } | null) => void
  aiSignInRef: RefObject<(() => void) | null>
  setShowLanding: (show: boolean) => void
}

export function LabShell({
  isMobile,
  showSidebar,
  setShowSidebar,
  clerkEnabled,
  studyMode,
  setStudyMode,
  currentView,
  setCurrentView,
  currentExercise,
  showTools,
  setShowTools,
  currentExerciseData,
  ExerciseComponent,
  handleExerciseSelect,
  handleNavigateToDay,
  handleMarkComplete,
  isCurrentDayCompleted,
  searchResults,
  handleSearch,
  searchInputRef,
  communitySlug,
  showSettings,
  setShowSettings,
  showAnalytics,
  setShowAnalytics,
  showShortcutsHelp,
  setShowShortcutsHelp,
  showTutorial,
  setShowTutorial,
  prepareTutorialStep,
  showCertificate,
  setShowCertificate,
  showConfetti,
  setShowConfetti,
  aiGate,
  setAiGate,
  aiSignInRef,
  setShowLanding,
}: LabShellProps): JSX.Element {
  const sidebarExpanded = showSidebar && !isMobile
  const layoutEase = '0.4s cubic-bezier(0.22, 1, 0.36, 1)'

  const appContainerStyle: React.CSSProperties = {
    display: 'flex',
    minHeight: '100dvh',
    background: 'transparent',
    width: '100%',
    margin: 0,
    padding: 0,
  }

  const mainContentStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    // Longhand only — mixing `padding` with paddingLeft/Right triggers React rerender warnings.
    paddingTop: isMobile ? 12 : 24,
    paddingBottom: isMobile ? 'calc(32px + env(safe-area-inset-bottom, 0px))' : 56,
    paddingLeft: isMobile
      ? 'max(12px, env(safe-area-inset-left, 0px))'
      : sidebarExpanded
        ? 28
        : 40,
    paddingRight: isMobile
      ? 'max(12px, env(safe-area-inset-right, 0px))'
      : sidebarExpanded
        ? 28
        : 40,
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
        : currentView === 'support'
          ? 'Support'
          : lessonTitle

  const headerSubtitle = showTools
    ? 'Practice utilities'
    : currentView === 'community'
      ? 'Shared learnings'
      : currentView === 'settings'
        ? 'Data & admin'
        : currentView === 'support'
          ? 'Help & contact'
          : currentExerciseData
            ? `Week ${currentExerciseData.week} · Day ${String(currentExerciseData.day).padStart(2, '0')}`
            : 'Internals lab'

  const showFocusControl = !showTools && currentView === 'exercises'

  const afterNav = () => {
    if (isMobile) setShowSidebar(false)
  }

  return (
    <div style={appContainerStyle} className={isMobile ? 'app-shell-mobile' : undefined}>
      {isMobile && showSidebar && !showTutorial && (
        <button
          type="button"
          aria-label="Close menu"
          className="app-drawer-backdrop"
          onClick={() => setShowSidebar(false)}
        />
      )}

      <div
        className={isMobile ? 'app-drawer-panel' : undefined}
        style={{
          position: isMobile ? 'fixed' : 'relative',
          zIndex: isMobile ? 1001 : 1000,
          height: '100dvh',
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
            onExerciseSelect={(key) => {
              handleExerciseSelect(key)
              afterNav()
            }}
            onToolsClick={() => {
              setShowTools(true)
              setCurrentView('exercises')
              afterNav()
            }}
            onCommunityClick={() => {
              setShowTools(false)
              setCurrentView('community')
              afterNav()
            }}
            onSupportClick={() => {
              setShowTools(false)
              setCurrentView('support')
              afterNav()
            }}
            onSettingsClick={() => {
              setShowSettings(true)
              afterNav()
            }}
            onAnalyticsClick={() => {
              setShowAnalytics(true)
              afterNav()
            }}
            onShortcutsClick={() => {
              setShowShortcutsHelp(true)
              afterNav()
            }}
            onToggleCollapse={() => setShowSidebar(!showSidebar)}
            isCollapsed={false}
          />
        </div>
      </div>

      <div style={mainContentStyle}>
        <main
          style={{
            width: '100%',
            maxWidth: sidebarExpanded ? 960 : 2400,
            marginLeft: 'auto',
            marginRight: 'auto',
            transition: `max-width ${layoutEase}`,
          }}
        >
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

            {!isMobile && !showSidebar && (
              <div style={{ minWidth: 0, flex: '1 1 0' }}>
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
                  order: isMobile ? 3 : undefined,
                }}
              >
                <SearchBar
                  ref={searchInputRef}
                  onSearch={handleSearch}
                  results={searchResults}
                  onResultClick={(day) => {
                    const exerciseKey = (
                      Object.entries(exercises) as [ExerciseKey, (typeof exercises)[ExerciseKey]][]
                    ).find(([, exercise]) => exercise.day === day)?.[0]
                    if (exerciseKey) {
                      handleExerciseSelect(exerciseKey)
                      afterNav()
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
                      transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
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

          {!studyMode && !showTools && currentView === 'exercises' && currentExerciseData && (
            <MemoizedBreadcrumbs
              exercise={currentExerciseData}
              isDayCompleted={isCurrentDayCompleted}
              onMarkComplete={handleMarkComplete}
            />
          )}

          <Suspense fallback={<CardSkeleton />}>
            {showTools ? (
              <Tools onBack={() => setShowTools(false)} onNavigateToDay={handleNavigateToDay} />
            ) : currentView === 'community' ? (
              <CommunityPage initialSlug={communitySlug} />
            ) : currentView === 'settings' ? (
              <SettingsPage
                onBack={() => {
                  setShowTools(false)
                  setCurrentView('exercises')
                }}
              />
            ) : currentView === 'support' ? (
              <SupportPage
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
              <div
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  background: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                }}
              >
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
          setAiGate(null)
          emitAiGateDismissLocal()
        }}
        onSignIn={
          clerkEnabled
            ? () => {
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

      {showAnalytics && <AnalyticsPanel onClose={() => setShowAnalytics(false)} />}

      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />

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

      <ToastContainer />
      <ScrollToTopButton />
      {showCertificate && <Week1Certificate onClose={() => setShowCertificate(false)} />}
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
    </div>
  )
}
