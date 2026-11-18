// src/lib/googleAnalytics.ts
import ReactGA from 'react-ga4'

const TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID || ''

// Initialize Google Analytics
export function initGA() {
  if (!TRACKING_ID) {
    if (import.meta.env.DEV) {
      console.warn('Google Analytics tracking ID not found')
    }
    return
  }

  ReactGA.initialize(TRACKING_ID, {
    gaOptions: {
      debug_mode: import.meta.env.DEV,
    },
  })
}

// Track page views
export function trackPageView(path: string, title?: string) {
  if (!TRACKING_ID) return

  ReactGA.send({
    hitType: 'pageview',
    page: path,
    title: title || document.title
  })
}

// Track custom events
export function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: number
) {
  if (!TRACKING_ID) return
  
  ReactGA.event({
    category,
    action,
    label,
    value
  })
}

// Track user actions
export const tracking = {
  // Exercise tracking
  exerciseStarted: (day: number, week: number) => {
    trackEvent('Exercise', 'Started', `Week ${week} Day ${day}`)
  },
  
  exerciseCompleted: (day: number, week: number) => {
    trackEvent('Exercise', 'Completed', `Week ${week} Day ${day}`)
  },
  
  // Quiz tracking
  quizStarted: (day: number) => {
    trackEvent('Quiz', 'Started', `Day ${day}`)
  },
  
  quizCompleted: (day: number, score: number) => {
    trackEvent('Quiz', 'Completed', `Day ${day}`, score)
  },
  
  // Community tracking
  communityViewed: () => {
    trackEvent('Community', 'Viewed')
  },
  
  contributionClicked: (slug: string) => {
    trackEvent('Community', 'Contribution Clicked', slug)
  },
  
  // Landing page tracking
  ctaClicked: (location: string) => {
    trackEvent('Landing', 'CTA Clicked', location)
  },
  
  // Search tracking
  searchPerformed: (query: string) => {
    trackEvent('Search', 'Query', query)
  },
  
  // Settings tracking
  themeChanged: (theme: string) => {
    trackEvent('Settings', 'Theme Changed', theme)
  },
  
  studyModeToggled: (enabled: boolean) => {
    trackEvent('Settings', 'Study Mode', enabled ? 'Enabled' : 'Disabled')
  }
}
