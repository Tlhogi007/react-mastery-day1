/**
 * Fade In Animation Component with Framer Motion
 * Single Responsibility: Provide fade-in animation wrapper
 */

import { type JSX, type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface FadeInProps {
    children: ReactNode
    delay?: number
    duration?: number
}

function FadeIn({ children, delay = 0, duration = 0.3 }: FadeInProps): JSX.Element {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration, delay }}
        >
            {children}
        </motion.div>
    )
}

export default FadeIn
