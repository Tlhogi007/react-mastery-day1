/**
 * Page Transition Component with Framer Motion
 * Single Responsibility: Provide smooth page transitions
 */

import { type JSX, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PageTransitionProps {
    children: ReactNode
    transitionKey?: string
}

function PageTransition({ children, transitionKey }: PageTransitionProps): JSX.Element {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={transitionKey}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    )
}

export default PageTransition
