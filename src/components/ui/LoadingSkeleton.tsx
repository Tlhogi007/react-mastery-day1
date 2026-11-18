/**
 * Loading Skeleton Component
 * Single Responsibility: Display loading placeholders
 */

import { type JSX } from 'react'

interface LoadingSkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  className?: string
  style?: React.CSSProperties
}

function LoadingSkeleton({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  className,
  style
}: LoadingSkeletonProps): JSX.Element {
  return (
    <div
      className={className}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
        background: 'linear-gradient(90deg, var(--bg-section) 25%, var(--bg-tertiary) 50%, var(--bg-section) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-loading 1.5s ease-in-out infinite',
        opacity: 0.7,
        ...style
      }}
      aria-busy="true"
      aria-label="Loading"
    />
  )
}

export function CardSkeleton(): JSX.Element {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '20px'
    }}>
      <LoadingSkeleton width="60%" height="24px" borderRadius="4px" />
      <div style={{ marginTop: '12px' }}>
        <LoadingSkeleton width="100%" height="16px" borderRadius="4px" />
      </div>
      <div style={{ marginTop: '8px' }}>
        <LoadingSkeleton width="80%" height="16px" borderRadius="4px" />
      </div>
    </div>
  )
}

export function QuizSkeleton(): JSX.Element {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '2px solid var(--border-primary)',
      borderRadius: '8px',
      padding: '20px',
      marginTop: '20px'
    }}>
      <LoadingSkeleton width="40%" height="24px" borderRadius="4px" />
      <div style={{ marginTop: '20px' }}>
        <LoadingSkeleton width="100%" height="60px" borderRadius="8px" />
      </div>
      <div style={{ marginTop: '12px' }}>
        <LoadingSkeleton width="100%" height="50px" borderRadius="6px" />
      </div>
      <div style={{ marginTop: '12px' }}>
        <LoadingSkeleton width="100%" height="50px" borderRadius="6px" />
      </div>
      <div style={{ marginTop: '12px' }}>
        <LoadingSkeleton width="100%" height="50px" borderRadius="6px" />
      </div>
    </div>
  )
}

export function SectionSkeleton(): JSX.Element {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px'
    }}>
      <LoadingSkeleton width="50%" height="28px" borderRadius="4px" />
      <div style={{ marginTop: '16px' }}>
        <LoadingSkeleton width="100%" height="16px" borderRadius="4px" />
        <LoadingSkeleton width="90%" height="16px" borderRadius="4px" style={{ marginTop: '8px' }} />
        <LoadingSkeleton width="95%" height="16px" borderRadius="4px" style={{ marginTop: '8px' }} />
      </div>
      <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
        <LoadingSkeleton width="120px" height="40px" borderRadius="6px" />
        <LoadingSkeleton width="120px" height="40px" borderRadius="6px" />
      </div>
    </div>
  )
}

export function CodePlaygroundSkeleton(): JSX.Element {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '2px solid var(--border-primary)',
      borderRadius: '8px',
      overflow: 'hidden',
      marginTop: '20px'
    }}>
      <div style={{
        padding: '10px 15px',
        background: 'var(--bg-section)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <LoadingSkeleton width="150px" height="20px" borderRadius="4px" />
        <LoadingSkeleton width="80px" height="24px" borderRadius="4px" />
      </div>
      <div style={{ padding: '15px', minHeight: '300px' }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <LoadingSkeleton
            key={i}
            width={i % 3 === 0 ? '100%' : i % 3 === 1 ? '85%' : '70%'}
            height="16px"
            borderRadius="2px"
            style={{ marginTop: i > 0 ? '4px' : '0' }}
          />
        ))}
      </div>
    </div>
  )
}

export default LoadingSkeleton
