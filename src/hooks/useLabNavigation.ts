import { useCallback, useMemo, useState } from 'react'
import type { ExerciseKey } from '../types/exercises'
import { exercises, exerciseKeyForDay } from '../lab/exercisesRegistry'
import { shouldNudgeDaySkip } from '../lib/learningPath'
import { setActiveTab, type AuthReturnView } from '../services/authReturnTo'
import { analytics } from '../services/analytics'
import { progressStorage } from '../services/progressStorage'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'

interface UseLabNavigationOptions {
  initialExercise: ExerciseKey
  initialView: AuthReturnView
  initialTools: boolean
  shortcutsEnabled: boolean
  onProgressBump: () => void
  progressEpoch: number
}

export function useLabNavigation({
  initialExercise,
  initialView,
  initialTools,
  shortcutsEnabled,
  onProgressBump,
  progressEpoch,
}: UseLabNavigationOptions) {
  const [currentView, setCurrentView] = useState<AuthReturnView>(initialView)
  const [currentExercise, setCurrentExercise] = useState<ExerciseKey>(initialExercise)
  const [showTools, setShowTools] = useState(initialTools)

  const exerciseKeys = useMemo(() => Object.keys(exercises) as ExerciseKey[], [])
  const currentIndex = useMemo(
    () => exerciseKeys.indexOf(currentExercise),
    [exerciseKeys, currentExercise],
  )
  const currentExerciseData = exercises[currentExercise]
  const ExerciseComponent = currentExerciseData?.component

  const handleExerciseSelect = useCallback(
    (key: ExerciseKey): void => {
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
      setCurrentExercise((prev) => {
        if (key !== prev) setActiveTab('learn')
        return key
      })
      setCurrentView('exercises')
      setShowTools(false)
      analytics.trackExerciseComplete(exercises[key].day, exercises[key].week)
    },
    [],
  )

  const handleNavigateToDay = useCallback(
    (day: number): void => {
      const key = exerciseKeyForDay(day)
      if (!key) {
        window.dispatchEvent(
          new CustomEvent('showToast', {
            detail: { message: `Day ${day} is not available yet`, type: 'error' },
          }),
        )
        return
      }
      handleExerciseSelect(key)
    },
    [handleExerciseSelect],
  )

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
    onProgressBump()
    analytics.trackFeatureUsage('mark_complete', { day })
    window.dispatchEvent(
      new CustomEvent('showToast', {
        detail: { message: `Day ${day} marked complete`, type: 'success' },
      }),
    )
  }, [currentExercise, onProgressBump])

  const isCurrentDayCompleted = useMemo(
    () => progressStorage.isDayCompleted(exercises[currentExercise].day),
    [currentExercise, progressEpoch],
  )

  useKeyboardShortcuts({
    onNext: handleNextExercise,
    onPrevious: handlePreviousExercise,
    enabled: shortcutsEnabled,
  })

  return {
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
  }
}
