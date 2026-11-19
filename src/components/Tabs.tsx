import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { getActiveTab, setActiveTab as persistActiveTab } from '../services/authReturnTo'
import { tracking } from '../lib/googleAnalytics'
import { BREAKPOINTS } from '../constants'

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

/** Always visible on mobile; the rest live under More. */
const PRIMARY_TAB_IDS = new Set(['learn', 'practice', 'quiz'])

function readStoredTab(validIds: string[], fallback: string): string {
  const stored = getActiveTab()
  if (stored && validIds.includes(stored)) return stored
  return fallback
}

function useIsMobile(breakpoint = BREAKPOINTS.MOBILE): boolean {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false,
  )
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [breakpoint])
  return mobile
}

function Tabs({ tabs, defaultTab }: TabsProps): JSX.Element {
  const validIds = tabs.map((t) => t.id)
  const fallback = defaultTab && validIds.includes(defaultTab) ? defaultTab : validIds[0] || ''
  const [activeTab, setActiveTab] = useState<string>(() => readStoredTab(validIds, fallback))
  const quizTracked = useRef(false)
  const isMobile = useIsMobile()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreBtnRef = useRef<HTMLButtonElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const moreMenuId = useId()
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)

  const primaryTabs = tabs.filter((t) => PRIMARY_TAB_IDS.has(t.id))
  const moreTabs = tabs.filter((t) => !PRIMARY_TAB_IDS.has(t.id))
  const visibleTabs = isMobile && moreTabs.length > 0 ? primaryTabs : tabs
  const activeInMore = isMobile && moreTabs.some((t) => t.id === activeTab)

  useEffect(() => {
    persistActiveTab(activeTab)
  }, [activeTab])

  useEffect(() => {
    if (activeTab !== 'quiz' || quizTracked.current) return
    quizTracked.current = true
    let day = 1
    try {
      const raw = sessionStorage.getItem('rm-lab-session')
      const parsed = raw ? (JSON.parse(raw) as { exercise?: string }) : null
      const m = parsed?.exercise?.match(/day0*(\d+)/i)
      if (m) day = Number(m[1]) || 1
    } catch {
      /* ignore */
    }
    tracking.quizStarted(day)
  }, [activeTab])

  useEffect(() => {
    if (!moreOpen || !moreBtnRef.current) {
      setMenuPos(null)
      return
    }
    const place = () => {
      const r = moreBtnRef.current?.getBoundingClientRect()
      if (!r) return
      setMenuPos({
        top: r.bottom + 4,
        right: Math.max(8, window.innerWidth - r.right),
      })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [moreOpen])

  useEffect(() => {
    if (!moreOpen) return
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const t = e.target
      if (!(t instanceof Node)) return
      if (moreBtnRef.current?.contains(t)) return
      if (moreMenuRef.current?.contains(t)) return
      setMoreOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [moreOpen])

  const selectTab = (id: string) => {
    setActiveTab(id)
    persistActiveTab(id)
    setMoreOpen(false)
  }

  const tabButtonStyle = (isActive: boolean): CSSProperties => ({
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
  })

  const moreMenu =
    moreOpen &&
    menuPos &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        ref={moreMenuRef}
        id={moreMenuId}
        role="menu"
        style={{
          position: 'fixed',
          top: menuPos.top,
          right: menuPos.right,
          zIndex: 1200,
          minWidth: 168,
          padding: 6,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 10,
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {moreTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="menuitem"
            onClick={() => selectTab(tab.id)}
            style={{
              textAlign: 'left',
              padding: '10px 12px',
              border: 'none',
              borderRadius: 8,
              background: activeTab === tab.id ? 'var(--bg-section)' : 'transparent',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 500,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>,
      document.body,
    )

  return (
    <div
      data-tutorial="tabs"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-section)',
          borderTopLeftRadius: 'var(--radius-md)',
          borderTopRightRadius: 'var(--radius-md)',
        }}
      >
        <div
          role="tablist"
          aria-label="Lesson sections"
          className="touch-scroll-x"
          style={{
            display: 'flex',
            flex: 1,
            minWidth: 0,
            gap: 0,
            // overflow-x alone promotes overflow-y to auto → tiny useless vertical scrollbar
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollSnapType: 'x proximity',
          }}
        >
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => selectTab(tab.id)}
                style={tabButtonStyle(isActive)}
                onKeyDown={(e) => {
                  const list = isMobile ? [...primaryTabs, ...moreTabs] : tabs
                  const currentIndex = list.findIndex((t) => t.id === tab.id)
                  if (e.key === 'ArrowRight' && currentIndex < list.length - 1) {
                    e.preventDefault()
                    selectTab(list[currentIndex + 1].id)
                  } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
                    e.preventDefault()
                    selectTab(list[currentIndex - 1].id)
                  }
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {isMobile && moreTabs.length > 0 && (
          <button
            ref={moreBtnRef}
            type="button"
            role="tab"
            data-tutorial="tabs-more"
            aria-selected={activeInMore}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            aria-controls={moreMenuId}
            onClick={() => setMoreOpen((v) => !v)}
            style={{
              ...tabButtonStyle(activeInMore),
              flex: '0 0 auto',
              borderLeft: '1px solid var(--border-color)',
            }}
          >
            {activeInMore
              ? moreTabs.find((t) => t.id === activeTab)?.label || 'More'
              : 'More'}{' '}
            ▾
          </button>
        )}
      </div>
      {moreMenu}
      <div
        style={{
          padding: 'clamp(12px, 2.5vw, 24px)',
          minWidth: 0,
          borderBottomLeftRadius: 'var(--radius-md)',
          borderBottomRightRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}
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
