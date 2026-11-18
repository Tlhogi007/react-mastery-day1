/**
 * Utility functions for time formatting
 */

/**
 * Format seconds into human-readable time string
 * @param seconds - Total seconds
 * @returns Formatted string like "2m 30s" or "45s"
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (remainingSeconds === 0) {
    return `${minutes}m`
  }
  
  return `${minutes}m ${remainingSeconds}s`
}

/**
 * Format minutes into human-readable time string
 * @param minutes - Total minutes
 * @returns Formatted string like "2h 30m" or "45m"
 */
export function formatTimeMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${Math.floor(minutes)}m`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.floor(minutes % 60)
  
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  
  return `${hours}h ${remainingMinutes}m`
}
