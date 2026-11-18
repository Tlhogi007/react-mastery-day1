/**
 * Stagger Children Animation Component with Framer Motion
 * Single Responsibility: Provide staggered animation for child elements
 */

import { type JSX, type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface StaggerChildrenProps {
    children: ReactNode
    staggerDelay?: number
}

function StaggerChildren({ children, staggerDelay = 0.1 }: StaggerChildrenProps): JSX.Element {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                visible: {
                    transition: {
                        staggerChildren: staggerDelay
                    }
                }
            }}
        >
            {children}
        </motion.div>
    )
}

export default StaggerChildren
