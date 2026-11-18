/**
 * Memoized Component Wrappers
 * Single Responsibility: Provide memoized versions of components for performance
 */

import { memo } from 'react'
import Sidebar from '../Sidebar'
import ProgressDashboard from '../ProgressDashboard'
import Breadcrumbs from '../Breadcrumbs'
import Card from '../Card'

// Memoized Sidebar - only re-renders when exercises or currentExercise changes
export const MemoizedSidebar = memo(Sidebar, (prevProps, nextProps) => {
  return (
    prevProps.currentExercise === nextProps.currentExercise &&
    Object.keys(prevProps.exercises).length === Object.keys(nextProps.exercises).length
  )
})

// Memoized ProgressDashboard - only re-renders when exercises change
export const MemoizedProgressDashboard = memo(ProgressDashboard, (prevProps, nextProps) => {
  return Object.keys(prevProps.exercises).length === Object.keys(nextProps.exercises).length
})

// Memoized Breadcrumbs - only re-renders when exercise changes
export const MemoizedBreadcrumbs = memo(Breadcrumbs, (prevProps, nextProps) => {
  return (
    prevProps.exercise.day === nextProps.exercise.day &&
    prevProps.exercise.title === nextProps.exercise.title &&
    prevProps.exercise.week === nextProps.exercise.week
  )
})

// Memoized Card - only re-renders when props change
export const MemoizedCard = memo(Card)
