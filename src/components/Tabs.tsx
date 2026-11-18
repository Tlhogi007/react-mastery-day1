import { useEffect, useState, type JSX, type ReactNode } from 'react'
import { getActiveTab, setActiveTab as persistActiveTab } from '../services/authReturnTo'

interface Tab {
  id: string
  label: string
  icon?: string
  content: ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
}

function readStoredTab(validIds: string[], fallback: string): string {
  const stored = getActiveTab()
  if (stored && validIds.includes(stored)) return stored
  return fallback
}

function Tabs({ tabs, defaultTab }: TabsProps): JSX.Element {
  const validIds = tabs.map((t) => t.id)
  const fallback = defaultTab && validIds.includes(defaultTab) ? defaultTab : validIds[0] || ''
  const [activeTab, setActiveTab] = useState<string>(() => readStoredTab(validIds, fallback))

  useEffect(() => {
    persistActiveTab(activeTab)
  }, [activeTab])

  const selectTab = (id: string) => {
    setActiveTab(id)
    persistActiveTab(id)
  }

  return (
    <div
      data-tutorial="tabs"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      <div
        role="tablist"
        aria-label="Lesson sections"
        className="touch-scroll-x"
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid var(--border-color)',
          overflowX: 'auto',
          background: 'var(--bg-section)',
          scrollSnapType: 'x proximity',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => selectTab(tab.id)}
              style={{
                flex: '0 0 auto',
                padding: '12px 14px',
                minHeight: 44,
                border: 'none',
                borderBottom: isActive ? '2px solid var(--button-primary)' : '2px solid transparent',
                marginBottom: -1,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                background: 'transparent',
                borderRadius: 0,
                whiteSpace: 'nowrap',
                scrollSnapAlign: 'start',
              }}
              onKeyDown={(e) => {
                const currentIndex = tabs.findIndex((t) => t.id === tab.id)
                if (e.key === 'ArrowRight' && currentIndex < tabs.length - 1) {
                  e.preventDefault()
                  selectTab(tabs[currentIndex + 1].id)
                } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
                  e.preventDefault()
                  selectTab(tabs[currentIndex - 1].id)
                }
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div
        style={{ padding: 'clamp(12px, 2.5vw, 24px)', minWidth: 0 }}
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  )
}

export default Tabs
