import { useState, type JSX, type ReactNode } from 'react'

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

function Tabs({ tabs, defaultTab }: TabsProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.id || '')

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
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid var(--border-color)',
          overflowX: 'auto',
          background: 'var(--bg-section)',
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
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '0 0 auto',
                padding: '12px 14px',
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
              }}
              onKeyDown={(e) => {
                const currentIndex = tabs.findIndex((t) => t.id === tab.id)
                if (e.key === 'ArrowRight' && currentIndex < tabs.length - 1) {
                  e.preventDefault()
                  setActiveTab(tabs[currentIndex + 1].id)
                } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
                  e.preventDefault()
                  setActiveTab(tabs[currentIndex - 1].id)
                }
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div
        style={{ padding: 'clamp(16px, 3vw, 24px)' }}
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
