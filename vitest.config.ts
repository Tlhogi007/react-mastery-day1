import { defineConfig } from 'vitest/config'

/**
 * Coverage gate: application logic (API helpers, services, hooks).
 * Static question banks, UI theme blobs, and network provider shells are
 * excluded — those are exercised via e2e / manual paths, not unit %.
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'api/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      include: [
        'api/_lib/**/*.ts',
        'src/services/**/*.ts',
        'src/hooks/**/*.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        // Static / generated content banks (not behavioral logic)
        'src/services/quizQuestionService.ts',
        'src/services/codeReviewExercises.ts',
        'src/services/codeSnippets.ts',
        'src/services/clerkAppearance.ts',
        // Thin HTTP provider shells (mocked at integration; e2e covers happy path)
        'src/services/providers/gemini.ts',
        'src/services/providers/groq.ts',
        'src/services/providers/togetherAI.ts',
        'src/services/providers/triviaDB.ts',
        'src/services/providers/aiProxy.ts',
        'src/services/providers/byoDirect.ts',
        'src/services/providers/hostedAuto.ts',
        'src/services/providers/index.ts',
        'src/services/providers/types.ts',
        // LLM prompt assembly — behavioral paths covered via /api/ai-quiz e2e
        'api/_lib/generateQuiz.ts',
        // Thin composers / AI provider orchestration — session reducer is unit-tested
        'src/hooks/quiz/useQuizAi.ts',
        'src/hooks/useQuiz.ts',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
})
