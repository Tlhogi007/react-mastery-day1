import { useEffect, useRef, useState, type JSX } from 'react'
import { motion } from 'framer-motion'
import { useUser } from '@clerk/react'
import './IntroSplash.css'

const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)
/** Minimum time on splash so the brand beat is readable. */
const MIN_MS = 5000

interface IntroSplashProps {
  onContinue: () => void
}

function GuestCopy(): JSX.Element {
  return <p className="intro-splash__greet">Welcome</p>
}

function SessionGreet(): JSX.Element {
  const { user, isLoaded } = useUser()
  if (!isLoaded) {
    return <p className="intro-splash__greet intro-splash__greet--quiet">&nbsp;</p>
  }
  if (!user) return <GuestCopy />

  const name =
    user.firstName ||
    user.username ||
    user.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    'there'

  return (
    <p className="intro-splash__greet">
      Welcome back, <span className="intro-splash__name">{name}</span>
    </p>
  )
}

/** Full-viewport brand beat before Landing. Shown on every landing visit; min 5s. */
export default function IntroSplash({ onContinue }: IntroSplashProps): JSX.Element {
  const [exiting, setExiting] = useState(false)
  const [canLeave, setCanLeave] = useState(false)
  const exitingRef = useRef(false)

  const finish = () => {
    if (!canLeave || exitingRef.current) return
    exitingRef.current = true
    setExiting(true)
    window.setTimeout(onContinue, 280)
  }

  useEffect(() => {
    const unlock = window.setTimeout(() => setCanLeave(true), MIN_MS)
    return () => window.clearTimeout(unlock)
  }, [])

  useEffect(() => {
    if (!canLeave) return
    const t = window.setTimeout(finish, 0)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- advance once unlocked
  }, [canLeave])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault()
        finish()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLeave])

  return (
    <motion.div
      className="intro-splash"
      role="dialog"
      aria-label="Welcome"
      aria-modal="true"
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      onClick={finish}
    >
      <div className="intro-splash__inner" onClick={(e) => e.stopPropagation()}>
        <motion.img
          className="intro-splash__logo"
          src="/favicon.svg"
          alt=""
          width={72}
          height={72}
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.h1
          className="intro-splash__brand"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45 }}
        >
          React Mastery
          <span className="intro-splash__lab">Lab</span>
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4 }}
        >
          {clerkEnabled ? <SessionGreet /> : <GuestCopy />}
        </motion.div>
        <motion.button
          type="button"
          className="intro-splash__continue"
          onClick={finish}
          disabled={!canLeave}
          aria-disabled={!canLeave}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.35 }}
        >
          Continue
        </motion.button>
      </div>
    </motion.div>
  )
}
