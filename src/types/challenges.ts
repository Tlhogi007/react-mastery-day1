export interface Challenge {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  starterCode: string
  solution: string
  hints: string[]
  explanation: string
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

export interface DebuggingScenario {
  id: string
  title: string
  description: string
  buggyCode: string
  fixedCode: string
  bugExplanation: string
  hints: string[]
}

export interface RealWorldScenario {
  id: string
  title: string
  description: string
  problem: string
  solution: string
  codeExample: string
  relatedDays: number[]
}
