import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type JSX,
  type ReactNode,
} from 'react'

type AccordionContextValue = {
  openId: string | null
  toggle: (id: string) => void
}

const AccordionContext = createContext<AccordionContextValue | null>(null)

interface AccordionProps {
  children: ReactNode
  style?: CSSProperties
  className?: string
  /** Stable id of the section that should start open (matches CollapsibleSection `id` or `title`). */
  defaultOpenId?: string
}

function findDefaultOpenId(children: ReactNode): string | null {
  let found: string | null = null
  Children.forEach(children, (child) => {
    if (found || !isValidElement(child)) return
    const props = child.props as { defaultOpen?: boolean; id?: string; title?: string }
    if (props.defaultOpen) found = props.id ?? props.title ?? null
  })
  return found
}

/** Exclusive accordion: only one CollapsibleSection open at a time. */
export function Accordion({
  children,
  style,
  className,
  defaultOpenId,
}: AccordionProps): JSX.Element {
  const [openId, setOpenId] = useState<string | null>(
    () => defaultOpenId ?? findDefaultOpenId(children),
  )

  const toggle = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id))
  }, [])

  const value = useMemo(() => ({ openId, toggle }), [openId, toggle])

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
  const accordion = useContext(AccordionContext)
  // Prefer stable title/id inside Accordion so defaultOpenId matching works without effects.
  const sectionId = id ?? (accordion ? title : `${title}::${reactId}`)
  const [localOpen, setLocalOpen] = useState(defaultOpen)
  const panelId = useId()

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
          role="region"
          aria-label={title}
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
