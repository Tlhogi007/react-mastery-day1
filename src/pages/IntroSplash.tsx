import { useEffect, useRef, useState, type JSX } from 'react'
import { motion } from 'framer-motion'
import { useUser } from '@clerk/react'
import './IntroSplash.css'

const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

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

/** Full-viewport brand beat before Landing. Continues only via the Continue button. */
export default function IntroSplash({ onContinue }: IntroSplashProps): JSX.Element {
  const [exiting, setExiting] = useState(false)
  const exitingRef = useRef(false)

  const finish = () => {
    if (exitingRef.current) return
    exitingRef.current = true
    setExiting(true)
    window.setTimeout(onContinue, 280)
  }

  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow
    const prevBody = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        finish()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.style.overflow = prevHtml
      document.body.style.overflow = prevBody
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      className="intro-splash"
      role="dialog"
      aria-label="Welcome"
      aria-modal="true"
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="intro-splash__inner">
        <motion.div
          className="intro-splash__magnet"
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: exiting ? 0 : 1 }}
          transition={{ delay: 0.12, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          className="intro-splash__logo-wrap"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            className="intro-splash__logo"
            src="/favicon.svg"
            alt=""
            width={72}
            height={72}
          />
        </motion.div>
        <motion.h1
          className="intro-splash__brand"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
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
