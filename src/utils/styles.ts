/**
 * Shared style utilities and common patterns
 */

import type { CSSProperties } from 'react'

/**
 * Common card style pattern
 */
export const cardStyle: CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
}

/**
 * Primary progress / demo trigger — accent fill.
 * Use quietButtonStyle for Hint, Reset, toggles, Prev/Next.
 */
export const buttonStyle: CSSProperties = {
  padding: '12px 24px',
  background: 'var(--button-primary)',
  color: 'var(--button-text)',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background-color 0.2s'
}

/** Secondary controls — no accent fill */
export const quietButtonStyle: CSSProperties = {
  padding: '10px 14px',
  background: 'var(--bg-section)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s, border-color 0.2s',
}

/**
 * Common button hover handlers
 */
export const buttonHoverHandlers = {
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.currentTarget.style.background = 'var(--button-primary-hover)'
  },
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.currentTarget.style.background = 'var(--button-primary)'
  }
}

/**
 * Common input style pattern
 */
export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px',
  fontSize: '14px',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box'
}

/**
 * Common section style pattern
 */
export const sectionStyle: CSSProperties = {
  background: 'var(--bg-section)',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '20px'
}

/**
 * Common warning/error message style
 */
export const warningMessageStyle: CSSProperties = {
  padding: '12px 15px',
  background: 'var(--bg-warning)',
  borderRadius: '6px',
  fontSize: '14px',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-warning)'
}

/**
 * Common success message style
 */
export const successMessageStyle: CSSProperties = {
  padding: '12px 15px',
  background: 'var(--bg-success)',
  borderRadius: '6px',
  fontSize: '14px',
  color: 'var(--text-primary)'
}

/**
 * Common info message style
 */
export const infoMessageStyle: CSSProperties = {
  padding: '12px 15px',
  background: 'var(--bg-info)',
  borderRadius: '6px',
  fontSize: '14px',
  color: 'var(--text-primary)'
}
