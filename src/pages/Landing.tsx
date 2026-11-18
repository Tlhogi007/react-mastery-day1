import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './Landing.css'
import { tracking } from '../lib/googleAnalytics'

interface LandingProps {
  onGetStarted: () => void
}

const codeSnippets = [
  { bad: 'useEffect(() => {\n  fetchData()\n}, [])', issue: 'Missing dependency' },
  { bad: 'const obj = { count }\nreturn <Child data={obj} />', issue: 'New object every render' },
  { bad: 'if (loading) return null\nuseEffect(...)', issue: 'Hooks after conditional' },
  { bad: '<div key={index}>', issue: 'Index as key' }
]

export default function Landing({ onGetStarted }: LandingProps) {
  const [currentSnippet, setCurrentSnippet] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSnippet((prev) => (prev + 1) % codeSnippets.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="landing-unique">
      <div className="grid-background" style={{
        transform: `translate(${mousePos.x * 0.02}px, ${mousePos.y * 0.02}px)`
      }} />

      <div className="landing-container">
        
        <section className="hero-unique">
          <motion.div
            className="hero-content-unique"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="terminal-window">
              <div className="terminal-header">
                <span className="terminal-dot red"></span>
                <span className="terminal-dot yellow"></span>
                <span className="terminal-dot green"></span>
                <span className="terminal-title">react-internals.tsx</span>
              </div>
              <div className="terminal-body">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSnippet}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5 }}
                    className="code-snippet"
                  >
                    <pre className="code-bad">{codeSnippets[currentSnippet].bad}</pre>
                    <div className="code-error">
                      <span className="error-icon">⚠️</span>
                      {codeSnippets[currentSnippet].issue}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <h1 className="hero-title-unique">
              Master React Internals
              <br />
              <span className="highlight">in 30 Days</span>
            </h1>

            <p className="hero-subtitle-unique">
              From setState to Fiber. Structured learning path for engineers who want to understand, not just use React.
            </p>

            <button className="cta-unique" onClick={() => {
              tracking.ctaClicked('hero')
              onGetStarted()
            }}>
              <span className="cta-text">Start Day 1</span>
              <span className="cta-arrow">→</span>
            </button>
          </motion.div>
        </section>

        <section className="concepts-section">
          <h2 className="section-title-unique">Not another React course</h2>
          
          <div className="concepts-grid">
            <motion.div 
              className="concept-card fiber"
              whileHover={{ scale: 1.05, rotateZ: 2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="concept-visual">
                <div className="fiber-node">
                  <div className="node-line"></div>
                  <div className="node-circle"></div>
                  <div className="node-line"></div>
                </div>
              </div>
              <h3>Rendering Pipeline</h3>
              <p>Understand render phase, commit phase, and Virtual DOM diffing</p>
            </motion.div>

            <motion.div 
              className="concept-card reconciliation"
              whileHover={{ scale: 1.05, rotateZ: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="concept-visual">
                <div className="tree-visual">
                  <div className="tree-node"></div>
                  <div className="tree-branches">
                    <div className="tree-node small"></div>
                    <div className="tree-node small"></div>
                  </div>
                </div>
              </div>
              <h3>Reconciliation Algorithm</h3>
              <p>Master keys, type comparison, and list diffing complexity</p>
            </motion.div>

            <motion.div 
              className="concept-card rendering"
              whileHover={{ scale: 1.05, rotateZ: 2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="concept-visual">
                <div className="render-phases">
                  <div className="phase render">R</div>
                  <div className="phase-arrow">→</div>
                  <div className="phase commit">C</div>
                </div>
              </div>
              <h3>Fiber Architecture</h3>
              <p>How React breaks work into units and enables concurrency</p>
            </motion.div>

            <motion.div 
              className="concept-card memoization"
              whileHover={{ scale: 1.05, rotateZ: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="concept-visual">
                <div className="memo-visual">
                  <div className="memo-box">memo</div>
                  <div className="memo-skip">⚡</div>
                </div>
              </div>
              <h3>Performance Optimization</h3>
              <p>Bailouts, memoization, and concurrent rendering strategies</p>
            </motion.div>
          </div>
        </section>

        <section className="difference-section">
          <div className="split-view">
            <div className="split-side before">
              <h3>Most React Courses</h3>
              <ul>
                <li>Build a todo app</li>
                <li>Learn useState and useEffect</li>
                <li>Copy patterns without understanding</li>
                <li>"Just wrap it in useMemo"</li>
              </ul>
            </div>
            <div className="split-divider">
              <div className="divider-line"></div>
              <div className="divider-icon">⚡</div>
            </div>
            <div className="split-side after">
              <h3>React Mastery</h3>
              <ul>
                <li>Understand the rendering engine</li>
                <li>Master reconciliation & Fiber</li>
                <li>Know exactly why patterns work</li>
                <li>Debug performance like a senior</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="week-section">
          <h2 className="section-title-unique">30-Day Structured Roadmap</h2>
          <div className="days-timeline">
            {[
              { day: 1, topic: 'Week 1: React Internals' },
              { day: 2, topic: 'Rendering Pipeline & Virtual DOM' },
              { day: 3, topic: 'Reconciliation & Fiber Architecture' },
              { day: 4, topic: 'Week 2: Performance & Concurrency' },
              { day: 5, topic: 'Concurrent Rendering & Transitions' },
              { day: 6, topic: 'Suspense & Code Splitting' },
              { day: 7, topic: 'Week 3: Architecture & Patterns' }
            ].map((item, i) => (
              <motion.div
                key={item.day}
                className="day-item"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ x: 10 }}
              >
                <span className="day-number">{item.day === 1 || item.day === 4 || item.day === 7 ? '📅' : '•'}</span>
                <span className="day-topic">{item.topic}</span>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="final-cta">
          <motion.div
            className="cta-box-unique"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2>Ready to go deep?</h2>
            <p>No signup. No email. Start your 30-day mastery journey now.</p>
            <button className="cta-unique large" onClick={() => {
              tracking.ctaClicked('final')
              onGetStarted()
            }}>
              <span className="cta-text">Start Week 1</span>
              <span className="cta-arrow">→</span>
            </button>
          </motion.div>
        </section>

        <footer className="footer-unique">
          <p>A structured path to React mastery • Built for ambitious engineers</p>
        </footer>
      </div>
    </div>
  )
}
