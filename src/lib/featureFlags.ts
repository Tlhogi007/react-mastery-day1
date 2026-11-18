// src/lib/featureFlags.ts
// Feature flag system for React Mastery

export interface FeatureFlags {
  // Content Availability
  WEEK_2_ENABLED: boolean
  WEEK_3_ENABLED: boolean
  WEEK_4_ENABLED: boolean
  COMMUNITY_ENABLED: boolean
  
  // Premium Features
  VIDEO_EXPLANATIONS: boolean
  AI_TUTOR: boolean
  CODE_REVIEW: boolean
  CERTIFICATES: boolean
  
  // Social Features
  USER_ACCOUNTS: boolean
  PROGRESS_SYNC: boolean
  LEADERBOARD: boolean
  DISCUSSION_FORUM: boolean
  SHARE_PROGRESS: boolean
  
  // Learning Tools
  SPACED_REPETITION: boolean
  FLASHCARDS: boolean
  PRACTICE_MODE: boolean
  TIMED_CHALLENGES: boolean
  
  // Analytics
  DETAILED_ANALYTICS: boolean
  PERFORMANCE_TRACKING: boolean
  TIME_TRACKING: boolean
  HEATMAPS: boolean
  
  // Experimental
  AI_GENERATED_QUIZZES: boolean
  VOICE_EXPLANATIONS: boolean
  AR_VISUALIZATIONS: boolean
  PAIR_PROGRAMMING: boolean
  
  // Monetization
  DONATIONS_ENABLED: boolean
  PREMIUM_TIER: boolean
  SPONSORSHIPS: boolean
  AFFILIATE_LINKS: boolean
  
  // Content Types
  VIDEO_CONTENT: boolean
  PODCAST_MODE: boolean
  DOWNLOADABLE_PDFS: boolean
  OFFLINE_MODE: boolean
  
  // Gamification
  ACHIEVEMENTS: boolean
  STREAKS: boolean
  XP_SYSTEM: boolean
  BADGES: boolean
  LEVELS: boolean
  
  // UI Experiments
  NEW_LANDING_PAGE: boolean
  SIDEBAR_REDESIGN: boolean
  DARK_MODE_ONLY: boolean
  COMPACT_VIEW: boolean
}

// Default flags (production)
const defaultFlags: FeatureFlags = {
  // Content - Only Week 1 and Community
  WEEK_2_ENABLED: false,
  WEEK_3_ENABLED: false,
  WEEK_4_ENABLED: false,
  COMMUNITY_ENABLED: true,
  
  // Premium - All disabled for launch
  VIDEO_EXPLANATIONS: false,
  AI_TUTOR: false,
  CODE_REVIEW: false,
  CERTIFICATES: false,
  
  // Social - All disabled (no backend yet)
  USER_ACCOUNTS: false,
  PROGRESS_SYNC: false,
  LEADERBOARD: false,
  DISCUSSION_FORUM: false,
  SHARE_PROGRESS: false,
  
  // Learning Tools - Basic only
  SPACED_REPETITION: false,
  FLASHCARDS: false,
  PRACTICE_MODE: false,
  TIMED_CHALLENGES: false,
  
  // Analytics - Basic tracking
  DETAILED_ANALYTICS: true,
  PERFORMANCE_TRACKING: true,
  TIME_TRACKING: true,
  HEATMAPS: false,
  
  // Experimental - All disabled
  AI_GENERATED_QUIZZES: false,
  VOICE_EXPLANATIONS: false,
  AR_VISUALIZATIONS: false,
  PAIR_PROGRAMMING: false,
  
  // Monetization - Free for now
  DONATIONS_ENABLED: false,
  PREMIUM_TIER: false,
  SPONSORSHIPS: false,
  AFFILIATE_LINKS: false,
  
  // Content Types - Text only
  VIDEO_CONTENT: false,
  PODCAST_MODE: false,
  DOWNLOADABLE_PDFS: false,
  OFFLINE_MODE: false,
  
  // Gamification - Light touch
  ACHIEVEMENTS: true,
  STREAKS: true,
  XP_SYSTEM: false,
  BADGES: false,
  LEVELS: false,
  
  // UI - Current design
  NEW_LANDING_PAGE: false,
  SIDEBAR_REDESIGN: false,
  DARK_MODE_ONLY: false,
  COMPACT_VIEW: false,
}

// Development overrides
const devFlags: Partial<FeatureFlags> = {
  // Enable everything in dev for testing
  WEEK_2_ENABLED: true,
  WEEK_3_ENABLED: true,
  WEEK_4_ENABLED: true,
  VIDEO_EXPLANATIONS: true,
  AI_TUTOR: true,
}

// Get flags based on environment
function getFlags(): FeatureFlags {
  const isDev = import.meta.env.DEV
  
  // In dev, merge dev overrides
  if (isDev) {
    return { ...defaultFlags, ...devFlags }
  }
  
  // In production, check for remote config (future)
  // For now, just return defaults
  return defaultFlags
}

// Export singleton
export const featureFlags = getFlags()

// Helper function to check if feature is enabled
export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return featureFlags[flag]
}

// Helper to get all enabled features
export function getEnabledFeatures(): string[] {
  return Object.entries(featureFlags)
    .filter(([, enabled]) => enabled)
    .map(([flag]) => flag)
}

// Helper for conditional rendering
export function FeatureFlag({ 
  flag, 
  children 
}: { 
  flag: keyof FeatureFlags
  children: React.ReactNode 
}): React.ReactNode {
  if (!isFeatureEnabled(flag)) return null
  return children
}
