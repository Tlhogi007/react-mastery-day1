/**
 * Slide Up Animation Component with Framer Motion
 * Single Responsibility: Provide slide-up animation wrapper
 */

import { type JSX, type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface SlideUpProps {
    children: ReactNode
    delay?: number
    duration?: number
}

function SlideUp({ children, delay = 0, duration = 0.3 }: SlideUpProps): JSX.Element {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration, delay, ease: 'easeOut' }}
        >
            {children}
        </motion.div>
    )
}

export default SlideUp
