import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
  type ReactNode,
} from 'react'

type AccordionContextValue = {
  openId: string | null
  toggle: (id: string) => void
  registerDefault: (id: string) => void
}

const AccordionContext = createContext<AccordionContextValue | null>(null)

interface AccordionProps {
  children: ReactNode
  style?: CSSProperties
  className?: string
}

/** Exclusive accordion: only one CollapsibleSection open at a time. */
export function Accordion({ children, style, className }: AccordionProps): JSX.Element {
  const [openId, setOpenId] = useState<string | null>(null)
  const defaultLocked = useRef(false)

  const registerDefault = useCallback((id: string) => {
    if (defaultLocked.current) return
    defaultLocked.current = true
    setOpenId(id)
  }, [])

  const toggle = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id))
  }, [])

  const value = useMemo(
    () => ({ openId, toggle, registerDefault }),
    [openId, toggle, registerDefault],
  )

  return (
    <AccordionContext.Provider value={value}>
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          ...style,
        }}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

interface CollapsibleSectionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  style?: CSSProperties
  /** Stable id when titles might collide within an Accordion */
  id?: string
}

/** Lightweight accordion item. Inside Accordion, only one stays open. */
export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  style,
  id,
}: CollapsibleSectionProps): JSX.Element {
  const reactId = useId()
  const sectionId = id ?? `${title}::${reactId}`
  const accordion = useContext(AccordionContext)
  const [localOpen, setLocalOpen] = useState(defaultOpen)
  const panelId = useId()

  useEffect(() => {
    if (accordion && defaultOpen) accordion.registerDefault(sectionId)
  }, [accordion, defaultOpen, sectionId])

  const open = accordion ? accordion.openId === sectionId : localOpen

  const onToggle = () => {
    if (accordion) accordion.toggle(sectionId)
    else setLocalOpen((v) => !v)
  }

  return (
    <div
      style={{
        border: '1px solid var(--border-color)',
        borderRadius: 10,
        background: 'var(--bg-card)',
        overflow: 'hidden',
        ...style,
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 14px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--text-primary)',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'inherit',
        }}
      >
        <span>{title}</span>
        <span
          aria-hidden="true"
          style={{
            color: 'var(--text-muted)',
            fontSize: 12,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
        >
          ▾
        </span>
      </button>
      {open && (
        <div
          id={panelId}
          style={{
            padding: '0 14px 14px',
            borderTop: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
