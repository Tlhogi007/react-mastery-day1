/**
 * Animated Card Component with Framer Motion
 * Single Responsibility: Provide animated card with entrance and hover effects
 */

import { type JSX, type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface AnimatedCardProps {
    children: ReactNode
    title?: string
    icon?: string
    badge?: string
    style?: React.CSSProperties
    onClick?: () => void
    delay?: number
}

function AnimatedCard({ children, title, icon, badge, style, onClick, delay = 0 }: AnimatedCardProps): JSX.Element {
    const cardStyle: React.CSSProperties = {
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.2s',
        cursor: onClick ? 'pointer' : 'default',
        ...style
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay }}
            whileHover={onClick ? {
                y: -2,
                transition: { duration: 0.2 }
            } : {}}
            style={cardStyle}
            onClick={onClick}
        >
            {(title || icon || badge) && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border-color)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {icon && <span style={{ fontSize: '24px' }}>{icon}</span>}
                        {title && <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{title}</h3>}
                    </div>
                    {badge && (
                        <span style={{
                            padding: '4px 12px',
                            background: 'var(--bg-section)',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: 'var(--text-primary)'
                        }}>
                            {badge}
                        </span>
                    )}
                </div>
            )}
            <div>{children}</div>
        </motion.div>
    )
}

export default AnimatedCard
