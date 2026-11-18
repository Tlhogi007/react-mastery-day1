import type { Challenge, QuizQuestion, DebuggingScenario, RealWorldScenario } from '../../../types/challenges'

export const day06Challenges: Challenge[] = [
  {
    id: 'day06-challenge-1',
    title: 'Optimize Context Re-renders',
    description: 'A Context causes all consumers to re-render unnecessarily. Optimize it.',
    difficulty: 'medium',
    starterCode: `function App() {
  const [user, setUser] = useState({ name: 'John', theme: 'dark' })
  
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Header />
      <Content />
    </UserContext.Provider>
  )
}

// Problem: Any change to user causes all consumers to re-render`,
    solution: `// Split contexts by concern
const UserContext = createContext()
const ThemeContext = createContext()

// Or memoize the value
function App() {
  const [user, setUser] = useState({ name: 'John', theme: 'dark' })
  const value = useMemo(() => ({ user, setUser }), [user, setUser])
  
  return (
    <UserContext.Provider value={value}>
      <Header />
      <Content />
    </UserContext.Provider>
  )
}`,
    hints: [
      'Split contexts by concern (user vs theme)',
      'Memoize the provider value',
      'Use React.memo on consumers'
    ],
    explanation: 'Context causes all consumers to re-render when value changes. Split contexts and memoize values to reduce re-renders.'
  }
]

export const day06Quiz: QuizQuestion[] = [
  {
    id: 'day06-q1',
    question: 'Why do all Context consumers re-render when the value changes?',
    options: [
      'Because Context uses shallow comparison',
      'Because Context doesn\'t use memoization',
      'Because all consumers subscribe to the same value object',
      'It\'s a React bug'
    ],
    correctAnswer: 2,
    explanation: 'All consumers re-render because they all subscribe to the same Context value. When the value object changes, all consumers are notified.',
    difficulty: 'easy'
  },
  {
    id: 'day06-q2',
    question: 'How can you prevent unnecessary re-renders with Context?',
    options: [
      'Split contexts by concern',
      'Memoize the provider value',
      'Use React.memo on consumers',
      'All of the above'
    ],
    correctAnswer: 3,
    explanation: 'You can prevent unnecessary re-renders by splitting contexts, memoizing provider values, and using React.memo on consumers.',
    difficulty: 'medium'
  },
  {
    id: 'day06-q3',
    question: 'What is the blast radius of Context?',
    options: [
      'The number of components that re-render',
      'The distance from the provider',
      'The size of the context value',
      'The number of consumers'
    ],
    correctAnswer: 0,
    explanation: 'Blast radius refers to how many components are affected (re-render) when a Context value changes.',
    difficulty: 'easy'
  },
  {
    id: 'day06-q4',
    question: 'When should you split a Context?',
    options: [
      'Always',
      'When different parts of the app need different values',
      'Never, it\'s unnecessary',
      'Only for large apps'
    ],
    correctAnswer: 1,
    explanation: 'Split contexts when different parts of your app need different values, reducing the blast radius of updates.',
    difficulty: 'medium'
  },
  {
    id: 'day06-q5',
    question: 'What happens if you don\'t memoize the Context provider value?',
    options: [
      'Nothing, it works fine',
      'A new object is created every render, causing all consumers to re-render',
      'React throws an error',
      'The context stops working'
    ],
    correctAnswer: 1,
    explanation: 'Without memoization, a new value object is created every render, causing all consumers to re-render even if the actual data hasn\'t changed.',
    difficulty: 'medium'
  },
  {
    id: 'day06-q6',
    question: 'What is the relationship between Context and prop drilling?',
    options: [
      'Context replaces prop drilling',
      'Context is an alternative to prop drilling for deeply nested data',
      'Context and prop drilling are the same',
      'You should always use Context instead of props'
    ],
    correctAnswer: 1,
    explanation: 'Context is an alternative to prop drilling when you need to pass data through many component levels. However, prop drilling is still fine for shallow component trees.',
    difficulty: 'medium'
  }
]

export const day06Debugging: DebuggingScenario[] = [
  {
    id: 'day06-debug-1',
    title: 'All Consumers Re-render Unnecessarily',
    description: 'Changing one piece of context data causes all consumers to re-render, even those that don\'t use that data.',
    buggyCode: `function App() {
  const [user, setUser] = useState({ name: 'John', theme: 'dark' })
  
  return (
    <AppContext.Provider value={{ user, setUser }}>
      {/* All components re-render when user changes */}
      <Header /> {/* Only needs theme */}
      <Profile /> {/* Only needs user.name */}
    </AppContext.Provider>
  )
}`,
    fixedCode: `// Split contexts
const UserContext = createContext()
const ThemeContext = createContext()

function App() {
  const [user, setUser] = useState({ name: 'John' })
  const [theme, setTheme] = useState('dark')
  
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <Header /> {/* Only subscribes to ThemeContext */}
        <Profile /> {/* Only subscribes to UserContext */}
      </ThemeContext.Provider>
    </UserContext.Provider>
  )
}`,
    bugExplanation: 'A single context with multiple values causes all consumers to re-render when any value changes. Split contexts by concern.',
    hints: [
      'All consumers re-render when context value changes',
      'Split contexts by concern (user vs theme)',
      'Each consumer only subscribes to what it needs'
    ]
  }
]

export const day06RealWorld: RealWorldScenario[] = [
  {
    id: 'day06-real-1',
    title: 'Auth Context Performance Issue',
    description: 'An authentication context causes the entire app to re-render on every auth state change.',
    problem: 'The auth context includes user, permissions, and theme. Any change causes all 200+ components to re-render, making the app laggy.',
    solution: 'Split into AuthContext (user, permissions) and ThemeContext. Memoize provider values. Use React.memo on expensive consumers.',
    codeExample: `// Before: Single context
<AppContext.Provider value={{ user, permissions, theme }}>
  {/* 200+ components re-render */}
</AppContext.Provider>

// After: Split contexts
<AuthContext.Provider value={memoizedAuthValue}>
  <ThemeContext.Provider value={memoizedThemeValue}>
    {/* Only relevant consumers re-render */}
  </ThemeContext.Provider>
</AuthContext.Provider>`,
    relatedDays: [6, 4, 14]
  }
]
