import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './Landing.css'
import { tracking } from '../lib/googleAnalytics'
import { formatBuildStamp } from '../lib/buildInfo'

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
            <h1 className="brand-mark">
              React Mastery
              <span>Lab</span>
            </h1>

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
                      <span className="error-icon">!</span>
                      {codeSnippets[currentSnippet].issue}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <h2 className="hero-title-unique">
              Internals you can feel
              <br />
              <span className="highlight">in 30 days</span>
            </h2>

            <p className="hero-subtitle-unique">
              From setState to Fiber — deliberate practice for engineers who want to understand React, not just use it.
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
                  <div className="memo-skip">skip</div>
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
              <div className="divider-icon">vs</div>
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
          <div className="roadmap">
            {[
              {
                week: 1,
                title: 'React Internals',
                focus: 'Mental models & how React actually works',
                available: true,
                topics: [
                  'Rendering Pipeline & Virtual DOM',
                  'Reconciliation & Fiber Architecture',
                  'Bailouts, Effects, Context',
                ],
              },
              {
                week: 2,
                title: 'Performance & Concurrency',
                focus: 'Think like React 18',
                available: false,
                topics: [
                  'Concurrent Rendering & Transitions',
                  'Suspense & Code Splitting',
                  'SSR, Hydration & Profiling',
                ],
              },
              {
                week: 3,
                title: 'Architecture & Patterns',
                focus: 'Scale beyond components',
                available: false,
                topics: [
                  'State strategy & colocation',
                  'Optimistic UI & error boundaries',
                  'Server Components thinking',
                ],
              },
              {
                week: 4,
                title: 'Interview Domination',
                focus: 'Articulate like Senior / Staff',
                available: false,
                topics: [
                  'Rapid recall & debug drills',
                  'Trade-offs & whiteboard design',
                  'Your React philosophy',
                ],
              },
            ].map((block, i) => (
              <motion.article
                key={block.week}
                className={`roadmap-week${block.available ? '' : ' is-soon'}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <header className="roadmap-week-header">
                  <span className="roadmap-week-badge">Week {block.week}</span>
                  <div className="roadmap-week-copy">
                    <div className="roadmap-week-title-row">
                      <h3 className="roadmap-week-title">{block.title}</h3>
                      {!block.available && (
                        <span className="roadmap-soon-pill">Coming soon</span>
                      )}
                    </div>
                    <p className="roadmap-week-focus">{block.focus}</p>
                  </div>
                </header>
                <ul className="roadmap-topics">
                  {block.topics.map((topic) => (
                    <li key={topic} className="roadmap-topic">
                      <span className="roadmap-topic-mark" aria-hidden="true" />
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
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
          <p>React internals practice lab · no signup required</p>
          <p className="build-stamp" style={{ marginTop: 8 }}>
            {formatBuildStamp()}
          </p>
        </footer>
      </div>
    </div>
  )
}
