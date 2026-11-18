import { type JSX } from 'react'
import type { Exercise } from '../types/exercises'

interface BreadcrumbsProps {
  exercise: Exercise
}

function Breadcrumbs({ exercise }: BreadcrumbsProps): JSX.Element {
  const containerStyle: React.CSSProperties = {
    marginBottom: '24px',
    fontSize: '14px',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  }

  const linkStyle: React.CSSProperties = {
    color: 'var(--link-color)',
    textDecoration: 'none',
    transition: 'color 0.2s'
  }

  const activeStyle: React.CSSProperties = {
    color: 'var(--text-primary)',
    fontWeight: '500'
  }

  const separatorStyle: React.CSSProperties = {
    color: 'var(--text-muted)'
  }

  return (
    <nav style={containerStyle}>
      <a href="#" style={linkStyle} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--link-hover)'}>
        Home
      </a>
      <span style={separatorStyle}>/</span>
      <a href="#" style={linkStyle} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--link-hover)'}>
        Week {exercise.week}
      </a>
      <span style={separatorStyle}>/</span>
      <span style={activeStyle}>
        Day {exercise.day}: {exercise.title}
      </span>
    </nav>
  )
}

export default Breadcrumbs
