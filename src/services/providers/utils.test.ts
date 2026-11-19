import { beforeEach, describe, expect, it, vi } from 'vitest'
import { decodeHtml, parseAIQuestions } from './utils'

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('decodeHtml', () => {
  it('decodes entities', () => {
    expect(decodeHtml('&lt;div&gt; &amp; &quot;x&quot; &#039;y&#039;')).toBe('<div> & "x" \'y\'')
  })

  it('passes plain text through', () => {
    expect(decodeHtml('hello')).toBe('hello')
  })
})

const q1 = `Q: What does React do during the render phase of an update?
A) It mutates the DOM directly
B) It computes the next tree of elements
C) It runs layout effects only
D) It flushes the paint queue
Correct: B
Explanation: Render is pure and computes work.`

const q2 = `Q: Which hook preserves a value between renders without re-rendering?
A) useState
B) useMemo
C) useRef
D) useReducer
Correct: C
Explanation: Refs are mutable boxes.`

describe('parseAIQuestions', () => {
  it('parses the Q:/A)/Correct: format', () => {
    const out = parseAIQuestions(q1, 'rendering', 5)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      question: 'What does React do during the render phase of an update?',
      options: [
        'It mutates the DOM directly',
        'It computes the next tree of elements',
        'It runs layout effects only',
        'It flushes the paint queue',
      ],
      correctAnswer: 1,
      explanation: 'Render is pure and computes work.',
    })
    expect(out[0].id).toMatch(/^ai-rendering-\d+-0$/)
    expect(parseAIQuestions(q2, 't', 1)[0].correctAnswer).toBe(2)
  })

  it('returns a parsed question from multi-question text', () => {
    expect(parseAIQuestions(`${q1}\n\n${q2}`, 't', 5).length).toBeGreaterThanOrEqual(1)
  })

  it('respects count limit (count 0 yields nothing)', () => {
    expect(parseAIQuestions(q1, 't', 0)).toEqual([])
  })

  it('handles CRLF, markdown bold and numbered Q labels (Groq style)', () => {
    const text = `**Q1:** Why does React use keys when rendering lists of items?\r\nA) To style rows\r\nB) To identify items between renders\r\nC) To sort items\r\nD) To avoid re-render\r\n**Correct:** B) To identify items\r\n**Explanation:** Keys give stable identity.`
    const out = parseAIQuestions(text, 'keys', 3)
    expect(out).toHaveLength(1)
    expect(out[0].correctAnswer).toBe(1)
    expect(out[0].explanation).toBe('Keys give stable identity.')
  })

  it('parses Question:/Option A: format', () => {
    const text = `Question: What is the unit of work in React Fiber architecture?
Option A: A fiber node
Option B: A DOM node
Option C: A hook
Option D: A closure
Answer: A
Explanation: Each fiber is a unit of work.`
    const out = parseAIQuestions(text, 'fiber', 2)
    expect(out).toHaveLength(1)
    expect(out[0].correctAnswer).toBe(0)
  })

  it('cleans bullets and numbering from options', () => {
    const text = `Q: Which statement about useEffect cleanup is correct in React?
A) 1. Runs before the next effect
B) - Runs only on unmount
C) * Never runs
D) 2) Runs during render
Correct: A
Explanation: Cleanup runs before re-running the effect.`
    const out = parseAIQuestions(text, 'effects', 1)
    expect(out[0].options).toEqual([
      'Runs before the next effect',
      'Runs only on unmount',
      'Never runs',
      'Runs during render',
    ])
  })

  it('returns [] when nothing matches', () => {
    expect(parseAIQuestions('hello world', 't', 3)).toEqual([])
    expect(parseAIQuestions('', 't', 3)).toEqual([])
  })

  it('skips questions with options that are too short', () => {
    const text = `Q: Which of these options is considered the correct answer here?
A) x
B) yy
C) zz
D) ww
Correct: A
Explanation: Short options are rejected.`
    expect(parseAIQuestions(text, 't', 1)).toEqual([])
  })

  it('skips questions whose text is too short', () => {
    const text = `Q: Short?
A) option one
B) option two
C) option three
D) option four
Correct: A
Explanation: Question text is too short.`
    expect(parseAIQuestions(text, 't', 1)).toEqual([])
  })

  it('handles lowercase correct letter via flexible pattern', () => {
    const text = `Q: What triggers a re-render of a function component in React?
A) a state change
B) a DOM event only
C) CSS changes
D) network latency
Answer: d
Explanation: whatever.`
    // lowercase letters are not matched by [A-D] without the i flag; the regex is case-insensitive (flag i)
    const out = parseAIQuestions(text, 't', 1)
    expect(out).toHaveLength(1)
    expect(out[0].correctAnswer).toBe(3)
  })
})
