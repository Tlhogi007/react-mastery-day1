# Quiz Question Service - Free API Integration

## Overview

The quiz question service automatically fetches questions from free APIs when local questions aren't available. It uses a priority system:

1. **Local Questions** (highest priority) - Curated React-specific questions from challenge files
2. **Free APIs** - Open Trivia Database for general programming questions
3. **Local Generation** (fallback) - Template-based questions generated locally

## Free APIs Integrated

### 1. Open Trivia Database ✅
- **URL**: `https://opentdb.com/api.php`
- **Cost**: Completely free, no API key needed
- **Rate Limits**: None (but be respectful)
- **Category**: Science: Computers (programming/tech questions)
- **Format**: Multiple choice questions
- **Pros**: Reliable, fast, no authentication
- **Cons**: General programming, not React-specific

### 2. Hugging Face Inference API (Placeholder)
- **Status**: Placeholder for future implementation
- **Note**: Free tier available but can be slow/unreliable
- **Future**: Can be enabled when needed

## How It Works

```typescript
// The service automatically tries APIs when needed
const questions = await quizQuestionService.getQuestions(
  day: 4,
  topic: 'memoization',
  count: 5
)

// Priority order:
// 1. Local questions from day04-memoization/challenges.ts
// 2. If not enough, fetch from Open Trivia DB
// 3. If APIs fail, generate from local templates
// 4. Cache results for 7 days
```

## Usage

The service is already integrated into the quiz system. Questions are automatically fetched when:

- A day doesn't have enough local questions
- You request more questions than available locally
- The cache expires (7 days)

## Caching

- Questions are cached in `localStorage` for 7 days
- Cache key format: `quiz-seen-day{day}-{topic}`
- Cache can be cleared: `quizQuestionService.clearCache()`

## Adding More Free APIs

To add a new free API provider:

1. Create a provider in `apiProviders.ts`:

```typescript
export const myNewProvider: APIProvider = {
  name: 'My API',
  async isAvailable(): Promise<boolean> {
    // Check if API is accessible
  },
  async fetch(topic: string, count: number): Promise<QuizQuestion[]> {
    // Fetch and format questions
  }
}
```

2. Add it to the providers array in `getAvailableProviders()`

3. The service will automatically try it

## API Response Format

All providers must return questions in this format:

```typescript
interface QuizQuestion {
  id: string
  question: string
  options: string[]  // 4 options
  correctAnswer: number  // 0-3 index
  explanation: string
}
```

## Testing

To test the API integration:

```typescript
import { quizQuestionService } from './services/quizQuestionService'

// Test fetching questions
const questions = await quizQuestionService.getQuestions(8, 'concurrent rendering', 5)
console.log('Fetched questions:', questions)

// Check cache stats
const stats = quizQuestionService.getCacheStats()
console.log('Cache stats:', stats)
```

## Troubleshooting

**APIs not working?**
- Check browser console for errors
- Verify network connectivity
- APIs may be temporarily unavailable (service falls back to local generation)

**Questions not React-specific?**
- Open Trivia DB provides general programming questions
- For React-specific content, rely on local question bank
- The service mixes API questions with local templates for variety

**Cache issues?**
- Clear cache: `quizQuestionService.clearCache()`
- Check localStorage in browser DevTools
