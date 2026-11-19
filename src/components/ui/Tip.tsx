import { type CSSProperties, type JSX, type ReactNode } from 'react'

interface TipProps {
  label: string
  children: ReactNode
  style?: CSSProperties
}

/** Lightweight hover tooltip for icon controls (desktop). */
export function Tip({ label, children, style }: TipProps): JSX.Element {
  return (
    <span className="ui-tip" data-tip={label} style={{ display: 'inline-flex', position: 'relative', ...style }}>
      {children}
    </span>
  )
}
