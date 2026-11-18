/**
 * Memoized Component Wrappers
 * Single Responsibility: Provide memoized versions of components for performance
 */

import { memo } from 'react'
import Sidebar from '../Sidebar'
import ProgressDashboard from '../ProgressDashboard'
import Breadcrumbs from '../Breadcrumbs'
import Card from '../Card'

// Default memo — custom comparators were skipping prop updates (e.g. isCollapsed)
export const MemoizedSidebar = memo(Sidebar)

export const MemoizedProgressDashboard = memo(ProgressDashboard)

export const MemoizedBreadcrumbs = memo(Breadcrumbs)

// Memoized Card - only re-renders when props change
export const MemoizedCard = memo(Card)
