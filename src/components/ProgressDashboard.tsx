import { useEffect, useState, type JSX } from 'react'
import type { ExercisesRegistry } from '../types/exercises'
import { progressStorage } from '../services/progressStorage'
import SlideUp from './animations/SlideUp'

interface ProgressDashboardProps {
  exercises: ExercisesRegistry
}

function ProgressDashboard({ exercises }: ProgressDashboardProps): JSX.Element {
  const totalDays = Object.keys(exercises).length
  const [completedDays, setCompletedDays] = useState<number>(0)
  const [completedQuizzes, setCompletedQuizzes] = useState<number>(0)
  const [currentStreak, setCurrentStreak] = useState<number>(0)

  useEffect(() => {
    // Load progress from localStorage
    setCompletedDays(progressStorage.getCompletedDaysCount())
    setCompletedQuizzes(progressStorage.getCompletedQuizzesCount())
    setCurrentStreak(progressStorage.getCurrentStreak())
  }, [])

  const totalQuizzes = totalDays
  const overallProgress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

  const statCardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 0.2s ease'
  }

  const StatCard = ({ 
    title, 
    value, 
    total, 
    unit, 
    color,
    progressColor
  }: { 
    title: string
    value: number
    total?: number
    unit?: string
    color: string
    progressColor?: string
  }): JSX.Element => {
    const percentage = total ? Math.round((value / total) * 100) : 0

    return (
      <div style={statCardStyle}>
        <div style={{ 
          fontSize: '12px', 
          color: 'var(--text-secondary)', 
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {title}
        </div>
        <div style={{ 
          fontSize: '36px', 
          fontWeight: 'bold', 
          color: color,
          marginBottom: '8px'
        }}>
          {value}{unit && ` ${unit}`}
          {total && (
            <span style={{ 
              fontSize: '20px', 
              color: 'var(--text-secondary)',
              fontWeight: 'normal'
            }}>
              {' '}/ {total}
            </span>
          )}
        </div>
        {total && (
          <div style={{
            height: '6px',
            background: 'var(--bg-section)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginTop: '12px'
          }}>
            <div style={{
              height: '100%',
              width: `${percentage}%`,
              background: progressColor || color,
              transition: 'width 0.3s',
              borderRadius: '3px'
            }} />
          </div>
        )}
      </div>
    )
  }

  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  }

      return (
        <div style={containerStyle}>
          <SlideUp delay={0}>
            <StatCard
              title="Days Completed"
              value={completedDays}
              total={totalDays}
              color="var(--text-on-success)"
              progressColor="var(--progress-success)"
            />
          </SlideUp>
          <SlideUp delay={0.1}>
            <StatCard
              title="Quizzes Passed"
              value={completedQuizzes}
              total={totalQuizzes}
              color="var(--button-primary)"
              progressColor="var(--progress-info)"
            />
          </SlideUp>
          <SlideUp delay={0.2}>
            <StatCard
              title="Current Streak"
              value={currentStreak}
              unit="days"
              color="var(--text-on-info)"
              progressColor="var(--progress-info)"
            />
          </SlideUp>
          <SlideUp delay={0.3}>
            <StatCard
              title="Overall Progress"
              value={overallProgress}
              total={100}
              unit="%"
              color="var(--text-on-warning)"
              progressColor="var(--progress-warning)"
            />
          </SlideUp>
        </div>
      )
}

export default ProgressDashboard
