/**
 * Application-wide constants
 */

// Responsive breakpoints (in pixels)
export const BREAKPOINTS = {
  MOBILE: 768,
  SMALL_MOBILE: 480
} as const

// Cache durations (in milliseconds)
export const CACHE_DURATION = {
  QUIZ_QUESTIONS: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const

// Quiz thresholds
export const QUIZ_THRESHOLDS = {
  PASSING_SCORE: 70, // Percentage
} as const

// Animation durations (in milliseconds)
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
} as const

// Z-index layers
export const Z_INDEX = {
  MODAL_OVERLAY: 2000,
  MODAL: 2001,
  FLOATING_ACTIONS: 1000,
  DROPDOWN: 1000,
} as const

// Timeouts (in milliseconds)
export const TIMEOUT = {
  API_REQUEST: 5000,
  API_AVAILABILITY_CHECK: 3000,
  SCROLL_DELAY: 100,
} as const
