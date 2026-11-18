/**
 * Confetti Animation Component
 * Single Responsibility: Display confetti animation for achievements
 * Uses canvas-confetti library
 */

import { useEffect, type JSX } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiProps {
    trigger: boolean
    onComplete?: () => void
}

function Confetti({ trigger, onComplete }: ConfettiProps): JSX.Element {
    useEffect(() => {
        if (!trigger) return

        const duration = 3000
        const animationEnd = Date.now() + duration
        const defaults = {
            startVelocity: 30,
            spread: 360,
            ticks: 60,
            zIndex: 10001,
            colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE']
        }

        const randomInRange = (min: number, max: number): number => {
            return Math.random() * (max - min) + min
        }

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now()

            if (timeLeft <= 0) {
                clearInterval(interval)
                onComplete?.()
                return
            }

            const particleCount = 50 * (timeLeft / duration)

            // Left side confetti
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            })

            // Right side confetti
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            })
        }, 250)

        return () => clearInterval(interval)
    }, [trigger, onComplete])

    return <></>
}

export default Confetti
