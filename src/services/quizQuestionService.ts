import type { QuizQuestion } from '../types/challenges'
import { fetchFromProviders } from './apiProviders'
import { CACHE_DURATION } from '../constants'

interface CachedQuestions {
  [key: string]: {
    questions: QuizQuestion[]
    timestamp: number
    expiresIn: number // milliseconds
  }
}

class QuizQuestionService {
  private cache: CachedQuestions = {}
  private readonly CACHE_DURATION = CACHE_DURATION.QUIZ_QUESTIONS

  /**
   * Get questions for a specific day/topic
   * @param skipLocal - If true, skip fetching local questions (for AI-only generation)
   */
  async getQuestions(
    day: number,
    topic: string,
    count: number = 5,
    skipLocal: boolean = false
  ): Promise<QuizQuestion[]> {
    const cacheKey = `day${day}-${topic}${skipLocal ? '-ai-only' : ''}`

    // Check cache first
    const cached = this.getCachedQuestions(cacheKey)
    if (cached && cached.length >= count) {
      return cached.slice(0, count)
    }

    // Try to fetch from sources in priority order
    const allQuestions: QuizQuestion[] = []

    // Start with local questions (curated, React-specific) - only if not skipping
    if (!skipLocal) {
      const localQuestions = await this.fetchLocalQuestions(topic, count)
      allQuestions.push(...localQuestions)
    }

    // If we need more, try free APIs + local generation
    // When skipLocal is true, we want AI-only, so skip templates
    if (allQuestions.length < count) {
      try {
        const generatedQuestions = await this.generateAIQuestions(
          topic,
          count - allQuestions.length,
          skipLocal // Pass skipLocal flag to skip templates when AI-only is requested
        )
        allQuestions.push(...generatedQuestions)
      } catch (error) {
        console.warn('Question generation failed:', error)
      }
    }

    // Cache the results
    if (allQuestions.length > 0) {
      this.cacheQuestions(cacheKey, allQuestions)
    }

    return allQuestions.slice(0, count)
  }

  /**
   * Fetch local questions from challenge files
   * Public method to allow fetching more local questions
   */
  async fetchLocalQuestions(
    topic: string,
    count: number
  ): Promise<QuizQuestion[]> {
    // Import questions from challenge files based on topic
    try {
      const topicLower = topic.toLowerCase()
      
      // Map topics to day numbers for importing
      // Return all questions when count >= 100 (caller will filter out used ones)
      if (topicLower.includes('rendering pipeline') || topicLower.includes('render phase')) {
        const { day01Quiz } = await import('../exercises/week1/day01-rendering-pipeline/challenges')
        return count >= 100 ? day01Quiz : day01Quiz.slice(0, count)
      }
      if (topicLower.includes('reconciliation')) {
        const { day02Quiz } = await import('../exercises/week1/day02-reconciliation/challenges')
        return count >= 100 ? day02Quiz : day02Quiz.slice(0, count)
      }
      if (topicLower.includes('fiber')) {
        const { day03Quiz } = await import('../exercises/week1/day03-fiber/challenges')
        return count >= 100 ? day03Quiz : day03Quiz.slice(0, count)
      }
      if (topicLower.includes('memoization') || topicLower.includes('memo')) {
        const { day04Quiz } = await import('../exercises/week1/day04-memoization/challenges')
        return count >= 100 ? day04Quiz : day04Quiz.slice(0, count)
      }
      if (topicLower.includes('effect') || topicLower.includes('closure')) {
        const { day05Quiz } = await import('../exercises/week1/day05-effects/challenges')
        return count >= 100 ? day05Quiz : day05Quiz.slice(0, count)
      }
      if (topicLower.includes('context')) {
        const { day06Quiz } = await import('../exercises/week1/day06-context/challenges')
        return count >= 100 ? day06Quiz : day06Quiz.slice(0, count)
      }
      if (topicLower.includes('reflection') || topicLower.includes('weekly')) {
        const { day07Quiz } = await import('../exercises/week1/day07-reflection/challenges')
        return count >= 100 ? day07Quiz : day07Quiz.slice(0, count)
      }
    } catch (error) {
      console.warn('Failed to load local questions:', error)
    }
    
    return []
  }

  /**
   * Generate questions using free APIs (fallback to local generation)
   * This generates NEW questions, not from challenge files
   * @param skipTemplates - If true, skip templates and only use AI APIs
   */
  private async generateAIQuestions(
    topic: string,
    count: number,
    skipTemplates: boolean = false
  ): Promise<QuizQuestion[]> {
    if (skipTemplates) {
      console.log(`[QuizService] 🤖 Generating ${count} AI-only questions for topic: ${topic} (skipping templates)`)
    } else {
      console.log(`[QuizService] Generating ${count} React-specific questions for topic: ${topic}`)
    }
    
    // If skipTemplates is true, go straight to AI APIs
    if (skipTemplates) {
      try {
        console.log(`[QuizService] 🔄 Attempting to fetch ${count} AI-generated questions from APIs...`)
        const aiQuestions = await fetchFromProviders(topic, count)
        
        if (aiQuestions.length > 0) {
          // Validate that questions are React-specific (especially important for AI-only mode)
          // Use strict matching: require "react" keyword OR multiple React-specific terms
          const primaryKeywords = ['react', 'reactjs', 'react.js'] // Must have one of these
          const secondaryKeywords = ['component', 'render', 'fiber', 'virtual dom', 'reconciliation', 'jsx', 'hook', 'usestate', 'useeffect', 'props', 'context', 'memo', 'suspense', 'rendering pipeline', 'commit phase']
          
          const reactSpecificQuestions = aiQuestions.filter(q => {
            const questionLower = q.question.toLowerCase()
            const explanationLower = q.explanation?.toLowerCase() || ''
            
            // Check question text first (more reliable indicator)
            // Must have "react" keyword in question OR have at least 2 secondary React keywords in question
            const hasPrimaryKeywordInQuestion = primaryKeywords.some(keyword => 
              questionLower.includes(keyword)
            )
            
            const matchedSecondaryKeywordsInQuestion = secondaryKeywords.filter(keyword => 
              questionLower.includes(keyword)
            )
            
            // Also check explanation, but exclude negative contexts
            // Negative patterns: "not react", "non-react", "for react-specific", "react-specific content" (when saying it's NOT)
            const negativePatterns = [
              'not react',
              'non-react',
              'for react-specific',
              'react-specific content',
              'react-specific questions',
              'general programming',
              'computer science question',
              'not a react',
              'not react-specific'
            ]
            const hasNegativeContext = negativePatterns.some(pattern => 
              explanationLower.includes(pattern)
            )
            
            // Only check explanation if it doesn't have negative context
            const hasPrimaryKeywordInExplanation = !hasNegativeContext && primaryKeywords.some(keyword => 
              explanationLower.includes(keyword)
            )
            
            const matchedSecondaryKeywordsInExplanation = !hasNegativeContext ? secondaryKeywords.filter(keyword => 
              explanationLower.includes(keyword)
            ) : []
            
            // Combine counts from question and explanation
            const totalSecondaryKeywords = new Set([
              ...matchedSecondaryKeywordsInQuestion,
              ...matchedSecondaryKeywordsInExplanation
            ]).size
            
            const hasPrimaryKeyword = hasPrimaryKeywordInQuestion || hasPrimaryKeywordInExplanation
            
            // Debug logging for validation (always log to see what's happening)
            const isReactSpecific = hasPrimaryKeyword || totalSecondaryKeywords >= 2
            if (!isReactSpecific) {
              console.log(`[QuizService] 🔍 Validation check for: "${q.question.substring(0, 60)}..."`)
              console.log(`[QuizService]   - Has "react" in question: ${hasPrimaryKeywordInQuestion}`)
              console.log(`[QuizService]   - Has "react" in explanation: ${hasPrimaryKeywordInExplanation} (negative context: ${hasNegativeContext})`)
              console.log(`[QuizService]   - Secondary keywords in question: ${matchedSecondaryKeywordsInQuestion.join(', ') || 'none'}`)
              console.log(`[QuizService]   - Secondary keywords in explanation: ${matchedSecondaryKeywordsInExplanation.join(', ') || 'none'}`)
              console.log(`[QuizService]   - Total unique secondary keywords: ${totalSecondaryKeywords} (need 2+)`)
              console.log(`[QuizService]   - Result: REJECTED (not React-specific)`)
            } else {
              console.log(`[QuizService] ✅ Validation passed for: "${q.question.substring(0, 60)}..."`)
              if (hasPrimaryKeyword) {
                console.log(`[QuizService]   - Reason: Contains "react" keyword`)
              } else {
                console.log(`[QuizService]   - Reason: Has ${totalSecondaryKeywords} React-specific keywords`)
              }
            }
            
            // Require "react" in question/explanation OR at least 2 React-specific terms
            return isReactSpecific
          })
          
          if (reactSpecificQuestions.length === 0 && skipTemplates) {
            console.warn(`⚠️ [QuizService] No React-specific questions found in AI-generated questions!`)
            console.warn(`[QuizService] All ${aiQuestions.length} questions appear to be generic programming questions, not React-specific.`)
            console.warn(`[QuizService] Rejecting non-React questions in AI-only mode.`)
            
            // Log sample to show what we got
            aiQuestions.slice(0, 2).forEach((q, idx) => {
              console.warn(`[QuizService] ❌ Non-React Question ${idx + 1}: "${q.question.substring(0, 80)}..."`)
            })
            
            return [] // Reject non-React questions in AI-only mode
          }
          
          if (reactSpecificQuestions.length < aiQuestions.length) {
            const nonReactCount = aiQuestions.length - reactSpecificQuestions.length
            console.warn(`⚠️ [QuizService] Filtered out ${nonReactCount} non-React-specific questions`)
            console.log(`✅ [QuizService] Keeping ${reactSpecificQuestions.length} React-specific AI questions`)
          } else {
            console.log(`✅ [QuizService] All ${aiQuestions.length} questions passed React-specific validation`)
          }
          
          // Log sample of React-specific questions for verification
          if (reactSpecificQuestions.length > 0) {
            reactSpecificQuestions.slice(0, 2).forEach((q, idx) => {
              console.log(`[QuizService] 🤖 React AI Question ${idx + 1}: "${q.question.substring(0, 60)}..."`)
            })
            console.log(`[QuizService] ✨ Returning ${reactSpecificQuestions.length} React-specific AI-generated questions`)
          } else {
            console.warn(`[QuizService] ⚠️ No React-specific questions after validation!`)
          }
          
          return reactSpecificQuestions
        } else {
          console.warn(`⚠️ [QuizService] No AI questions were generated. APIs may be unavailable or parsing failed.`)
          // When AI-only is requested and fails, return empty (don't fall back to templates)
          return []
        }
      } catch (error) {
        console.warn('[QuizService] ❌ AI generation failed:', error)
        // When AI-only is requested and fails, return empty (don't fall back to templates)
        return []
      }
    }
    
    // Normal flow: Try React-specific local templates first
    const reactTemplates = this.generateLocalQuestions(topic, count)
    
    // If we have enough React-specific templates, use them
    if (reactTemplates.length >= count) {
      console.log(`[QuizService] 📚 Using ${reactTemplates.length} React-specific template questions (no AI needed)`)
      return reactTemplates.slice(0, count)
    }
    
    // If we have some templates but need more, try AI with very specific prompts
    const needed = count - reactTemplates.length
    console.log(`[QuizService] Have ${reactTemplates.length} React templates, trying AI for ${needed} more`)
    
    // Try AI APIs with React-specific prompts
    try {
      console.log(`[QuizService] 🔄 Attempting to fetch ${needed} AI-generated questions...`)
      const aiQuestions = await fetchFromProviders(topic, needed)
      
      if (aiQuestions.length > 0) {
        console.log(`✅ [QuizService] Successfully generated ${aiQuestions.length} AI questions from APIs`)
        console.log(`[QuizService] 📊 Question breakdown: ${reactTemplates.length} templates + ${aiQuestions.length} AI = ${reactTemplates.length + aiQuestions.length} total`)
        
        // Log sample of AI questions for verification
        aiQuestions.slice(0, 2).forEach((q, idx) => {
          console.log(`[QuizService] 🤖 AI Question ${idx + 1}: "${q.question.substring(0, 60)}..."`)
        })
        
        // Combine React templates + AI questions
        const combined = [...reactTemplates, ...aiQuestions]
        const shuffled = this.shuffleArray(combined).slice(0, count)
        console.log(`[QuizService] ✨ Returning ${shuffled.length} questions (mix of templates and AI)`)
        return shuffled
      } else {
        console.log(`⚠️ [QuizService] No AI questions were generated. APIs may be unavailable or parsing failed.`)
      }
    } catch (error) {
      console.warn('[QuizService] ❌ AI generation failed:', error)
    }
    
    // Fallback: Use templates (even if we need to duplicate/vary)
    console.log(`[QuizService] 📚 Using template fallback for ${count} questions (AI generation unavailable)`)
    return this.generateLocalQuestions(topic, count)
  }

  /**
   * Shuffle array (Fisher-Yates)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  /**
   * Generate questions locally based on topic
   * If we need more questions than templates available, we'll duplicate and vary them
   */
  private generateLocalQuestions(
    topic: string,
    count: number
  ): QuizQuestion[] {
    const questionTemplates = this.getQuestionTemplates(topic)
    const questions: QuizQuestion[] = []
    const timestamp = Date.now()

    // If we have enough templates, use them
    if (questionTemplates.length >= count) {
      // Shuffle templates to get variety
      const shuffled = this.shuffleArray([...questionTemplates])
      for (let i = 0; i < count; i++) {
        const template = shuffled[i]
        questions.push({
          id: `generated-${topic}-${timestamp}-${i}`,
          question: template.question,
          options: template.options,
          correctAnswer: template.correctAnswer,
          explanation: template.explanation
        })
      }
    } else {
      // Use all available templates
      for (let i = 0; i < questionTemplates.length; i++) {
        const template = questionTemplates[i]
        questions.push({
          id: `generated-${topic}-${timestamp}-${i}`,
          question: template.question,
          options: template.options,
          correctAnswer: template.correctAnswer,
          explanation: template.explanation
        })
      }

      // If we need more, duplicate and vary existing templates
      const needed = count - questionTemplates.length
      for (let i = 0; i < needed; i++) {
        const templateIndex = i % questionTemplates.length
        const template = questionTemplates[templateIndex]
        // Create a variation by adding a suffix to make it unique
        questions.push({
          id: `generated-${topic}-${timestamp}-${questionTemplates.length + i}`,
          question: `${template.question} (Question ${i + 2})`,
          options: [...template.options], // Copy options array
          correctAnswer: template.correctAnswer,
          explanation: template.explanation
        })
      }
    }

    return questions
  }

  /**
   * Get question templates for a topic
   */
  private getQuestionTemplates(topic: string): Array<{
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
  }> {
    const topicLower = topic.toLowerCase()
    const templates: Record<string, Array<{
      question: string
      options: string[]
      correctAnswer: number
      explanation: string
    }>> = {
      'rendering pipeline': [
        {
          question: 'What are the two main phases of React rendering?',
          options: [
            'Mount and Unmount',
            'Render Phase and Commit Phase',
            'Initial and Update',
            'Synchronous and Asynchronous'
          ],
          correctAnswer: 1,
          explanation: 'React rendering consists of the Render Phase (creating the Virtual DOM tree) and the Commit Phase (applying changes to the DOM).'
        },
        {
          question: 'What happens during the Render Phase in React?',
          options: [
            'DOM is updated immediately',
            'React creates a Virtual DOM tree and determines what changed',
            'Components are mounted to the DOM',
            'Event listeners are attached'
          ],
          correctAnswer: 1,
          explanation: 'During the Render Phase, React creates a Virtual DOM tree, calls component functions, and determines what needs to change. No DOM updates happen yet.'
        },
        {
          question: 'What happens during the Commit Phase in React?',
          options: [
            'React plans what to update',
            'React applies changes to the actual DOM',
            'Components are re-rendered',
            'State is updated'
          ],
          correctAnswer: 1,
          explanation: 'During the Commit Phase, React applies the changes determined in the Render Phase to the actual DOM. This is when the browser paints the updates.'
        },
        {
          question: 'Why is the render phase interruptible but commit phase is not?',
          options: [
            'Render phase is faster',
            'Commit phase must be atomic to prevent visual glitches',
            'Render phase doesn\'t matter',
            'Commit phase is optional'
          ],
          correctAnswer: 1,
          explanation: 'Commit phase must be atomic - if interrupted, you\'d see partial DOM updates causing visual glitches. Effects must run in order.'
        },
        {
          question: 'What is the Virtual DOM in React?',
          options: [
            'A faster version of the real DOM',
            'A JavaScript representation of the DOM structure',
            'A browser API',
            'A React component'
          ],
          correctAnswer: 1,
          explanation: 'The Virtual DOM is a JavaScript representation of the DOM structure that React uses to efficiently determine what changed before updating the real DOM.'
        },
        {
          question: 'What happens from setState to DOM mutation?',
          options: [
            'setState → DOM update immediately',
            'setState → Render Phase → Commit Phase → DOM update',
            'setState → Commit Phase → Render Phase → DOM update',
            'setState → Browser paint → DOM update'
          ],
          correctAnswer: 1,
          explanation: 'setState schedules an update, Render Phase determines what changed, Commit Phase applies changes to DOM, then browser paints.'
        },
        {
          question: 'Why does React use a Virtual DOM?',
          options: [
            'To make the DOM faster',
            'To batch updates and minimize DOM operations',
            'To replace the browser DOM',
            'To simplify component code'
          ],
          correctAnswer: 1,
          explanation: 'React uses the Virtual DOM to batch updates and minimize expensive DOM operations by comparing the new Virtual DOM tree with the previous one.'
        }
      ],
      'reconciliation': [
        {
          question: 'What is React reconciliation?',
          options: [
            'The process of comparing two Virtual DOM trees',
            'Merging state updates',
            'Resolving conflicts between components',
            'Synchronizing with external data'
          ],
          correctAnswer: 0,
          explanation: 'Reconciliation is React\'s algorithm for comparing the new Virtual DOM tree with the previous one to determine what changed.'
        },
        {
          question: 'Why are keys important in React lists?',
          options: [
            'They improve performance',
            'They help React identify which items changed, were added, or removed',
            'They prevent re-renders',
            'They are required by HTML'
          ],
          correctAnswer: 1,
          explanation: 'Keys help React identify which items have changed, been added, or removed, allowing it to efficiently update only what changed.'
        },
        {
          question: 'What happens if you use array index as a key in React?',
          options: [
            'Nothing, it works fine',
            'React can incorrectly match items when the list order changes',
            'Performance improves',
            'Keys become optional'
          ],
          correctAnswer: 1,
          explanation: 'Using array index as a key can cause React to incorrectly match items when items are added, removed, or reordered, leading to bugs.'
        },
        {
          question: 'What is the "Type Comparison Rule" in React reconciliation?',
          options: [
            'React compares component names',
            'React compares element types (e.g., <div> vs <span>)',
            'React compares prop types',
            'React compares state types'
          ],
          correctAnswer: 1,
          explanation: 'If element types are different, React unmounts the old component and mounts a new one. If types are the same, it updates props.'
        },
        {
          question: 'What is the typical time complexity of React\'s list diffing algorithm with proper keys?',
          options: [
            'O(n²)',
            'O(log n)',
            'O(n)',
            'O(1)'
          ],
          correctAnswer: 2,
          explanation: 'With proper, stable keys, React\'s list diffing algorithm achieves O(n) complexity, making updates efficient.'
        },
        {
          question: 'What happens when React reconciles two trees with different root element types?',
          options: [
            'React updates the props',
            'React unmounts the old tree and mounts a new one',
            'React merges the trees',
            'React throws an error'
          ],
          correctAnswer: 1,
          explanation: 'When root element types differ, React assumes the trees are completely different and unmounts the old tree entirely, then mounts the new one.'
        }
      ],
      'fiber architecture': [
        {
          question: 'What is a Fiber in React?',
          options: [
            'A data structure representing a unit of work',
            'A type of component',
            'A rendering optimization',
            'A state management tool'
          ],
          correctAnswer: 0,
          explanation: 'A Fiber is a data structure that represents a unit of work in React\'s reconciliation algorithm, allowing React to pause and resume work.'
        },
        {
          question: 'What is the primary purpose of React\'s Fiber architecture?',
          options: [
            'To make rendering faster',
            'To enable interruptible rendering and prioritization',
            'To reduce bundle size',
            'To simplify component code'
          ],
          correctAnswer: 1,
          explanation: 'Fiber architecture enables React to interrupt rendering work, prioritize urgent updates, and resume where it left off, crucial for concurrent features.'
        },
        {
          question: 'What are the two main Fiber trees React maintains during rendering?',
          options: [
            'Virtual DOM and Real DOM',
            'Current and WorkInProgress',
            'Old and New',
            'Parent and Child'
          ],
          correctAnswer: 1,
          explanation: 'React maintains the Current tree (what\'s on screen) and the WorkInProgress tree (what\'s being built). They swap after the commit phase.'
        },
        {
          question: 'How does Fiber enable interruptible rendering?',
          options: [
            'By using web workers',
            'By breaking work into small, manageable units',
            'By rendering components in parallel',
            'By delaying all updates'
          ],
          correctAnswer: 1,
          explanation: 'Fiber breaks the reconciliation process into small "units of work" (Fibers) that can be paused and resumed, allowing the browser to handle urgent tasks.'
        },
        {
          question: 'What is the "Unit of Work" model in Fiber?',
          options: [
            'Each component is a unit of work',
            'Each Fiber node is a unit of work',
            'Each state update is a unit of work',
            'Each DOM operation is a unit of work'
          ],
          correctAnswer: 1,
          explanation: 'In the Unit of Work model, each Fiber node represents a single, interruptible unit of processing that React can perform.'
        },
        {
          question: 'Why does Fiber use a linked list instead of a tree?',
          options: [
            'Trees are slower',
            'Linked lists make it easier to traverse and interrupt work',
            'Linked lists use less memory',
            'Trees are deprecated'
          ],
          correctAnswer: 1,
          explanation: 'Linked list structure (child, sibling, return pointers) makes it easy to traverse and interrupt work at any point, unlike recursive tree traversal.'
        },
        {
          question: 'What is the alternate pointer in a Fiber node?',
          options: [
            'Points to the next Fiber',
            'Points to the corresponding node in the other tree (Current/WorkInProgress)',
            'Points to the parent',
            'Points to the first child'
          ],
          correctAnswer: 1,
          explanation: 'The alternate pointer connects Current and WorkInProgress trees. Each WorkInProgress node\'s alternate points to its Current counterpart.'
        }
      ],
      'memoization': [
        {
          question: 'What is the primary purpose of React.memo?',
          options: [
            'To memoize expensive calculations',
            'To prevent re-renders when props haven\'t changed',
            'To cache API responses',
            'To optimize bundle size'
          ],
          correctAnswer: 1,
          explanation: 'React.memo is a higher-order component that prevents re-renders when props are referentially equal, not when they contain the same values.'
        },
        {
          question: 'When should you use useMemo?',
          options: [
            'For all expensive calculations',
            'Only when the calculation depends on props/state that change frequently',
            'To prevent all re-renders',
            'Instead of useState'
          ],
          correctAnswer: 1,
          explanation: 'useMemo should be used for expensive calculations that depend on specific values. Overusing it can actually hurt performance due to memoization overhead.'
        },
        {
          question: 'What is referential equality in React?',
          options: [
            'Comparing values by their content',
            'Comparing object references (===)',
            'Deep equality comparison',
            'Comparing by type'
          ],
          correctAnswer: 1,
          explanation: 'Referential equality uses === to check if two references point to the same object in memory, not if they have the same content.'
        },
        {
          question: 'What is the difference between useMemo and useCallback?',
          options: [
            'useMemo memoizes values, useCallback memoizes functions',
            'They are the same',
            'useMemo is for components, useCallback is for hooks',
            'useMemo is faster'
          ],
          correctAnswer: 0,
          explanation: 'useMemo memoizes the result of a computation, while useCallback memoizes the function itself. Both prevent unnecessary recalculations.'
        },
        {
          question: 'When should you NOT use memoization in React?',
          options: [
            'When props change frequently',
            'When the memoization overhead exceeds the computation cost',
            'For simple calculations',
            'All of the above'
          ],
          correctAnswer: 3,
          explanation: 'Memoization has overhead. Don\'t use it for simple calculations, when props change frequently, or when overhead exceeds benefit.'
        },
        {
          question: 'What is a bailout in React memoization?',
          options: [
            'When React skips rendering because props are equal',
            'When memoization fails',
            'When a component throws an error',
            'When React unmounts a component'
          ],
          correctAnswer: 0,
          explanation: 'A bailout occurs when React.memo or useMemo determines that inputs haven\'t changed, so React skips re-rendering or recalculating.'
        }
      ],
      'effects': [
        {
          question: 'When does useEffect run in React?',
          options: [
            'Before render',
            'After render and after DOM updates',
            'During render',
            'Only on initial mount'
          ],
          correctAnswer: 1,
          explanation: 'useEffect runs after the render phase and after the browser has painted the DOM updates. This is part of the commit phase.'
        },
        {
          question: 'What causes a stale closure in a React useEffect hook?',
          options: [
            'Missing dependency array',
            'Using old state values in the effect',
            'Not cleaning up resources',
            'Running effects synchronously'
          ],
          correctAnswer: 1,
          explanation: 'Stale closures occur when an effect captures old state/props values because the dependency array is missing or incomplete, leading to unexpected behavior.'
        },
        {
          question: 'What is the cleanup function in useEffect used for?',
          options: [
            'To clean up state variables',
            'To unsubscribe from subscriptions, remove event listeners, or cancel requests',
            'To reset component props',
            'To prevent component re-renders'
          ],
          correctAnswer: 1,
          explanation: 'The cleanup function runs before the effect runs again or when the component unmounts, allowing you to clean up side effects and prevent memory leaks.'
        },
        {
          question: 'What happens if you provide an empty dependency array `[]` to useEffect?',
          options: [
            'The effect runs on every render',
            'The effect runs only once after the initial render',
            'The effect never runs',
            'It causes a warning'
          ],
          correctAnswer: 1,
          explanation: 'An empty dependency array tells React the effect does not depend on any values from props or state, so it runs only once after the initial render and cleans up on unmount.'
        },
        {
          question: 'What is a common "dependency array trap" with useEffect?',
          options: [
            'Including too many dependencies',
            'Forgetting to include functions or objects that change on every render',
            'Using primitive values as dependencies',
            'Not using a dependency array at all'
          ],
          correctAnswer: 1,
          explanation: 'A common trap is forgetting to include functions or objects (especially from props or state) in the dependency array, leading to stale closures or unexpected behavior.'
        }
      ],
      'effects closures': [
        {
          question: 'When does useEffect run in React?',
          options: [
            'Before render',
            'After render and after DOM updates',
            'During render',
            'Only on initial mount'
          ],
          correctAnswer: 1,
          explanation: 'useEffect runs after the render phase and after the browser has painted the DOM updates. This is part of the commit phase.'
        },
        {
          question: 'What causes a stale closure in a React useEffect hook?',
          options: [
            'Missing dependency array',
            'Using old state values in the effect',
            'Not cleaning up resources',
            'Running effects synchronously'
          ],
          correctAnswer: 1,
          explanation: 'Stale closures occur when an effect captures old state/props values because the dependency array is missing or incomplete, leading to unexpected behavior.'
        },
        {
          question: 'What is the cleanup function in useEffect used for?',
          options: [
            'To clean up state variables',
            'To unsubscribe from subscriptions, remove event listeners, or cancel requests',
            'To reset component props',
            'To prevent component re-renders'
          ],
          correctAnswer: 1,
          explanation: 'The cleanup function runs before the effect runs again or when the component unmounts, allowing you to clean up side effects and prevent memory leaks.'
        },
        {
          question: 'What happens if you provide an empty dependency array `[]` to useEffect?',
          options: [
            'The effect runs on every render',
            'The effect runs only once after the initial render',
            'The effect never runs',
            'It causes a warning'
          ],
          correctAnswer: 1,
          explanation: 'An empty dependency array tells React the effect does not depend on any values from props or state, so it runs only once after the initial render and cleans up on unmount.'
        },
        {
          question: 'What is a common "dependency array trap" with useEffect?',
          options: [
            'Including too many dependencies',
            'Forgetting to include functions or objects that change on every render',
            'Using primitive values as dependencies',
            'Not using a dependency array at all'
          ],
          correctAnswer: 1,
          explanation: 'A common trap is forgetting to include functions or objects (especially from props or state) in the dependency array, leading to stale closures or unexpected behavior.'
        }
      ],
      'context': [
        {
          question: 'Why do all Context consumers re-render when the Context value changes?',
          options: [
            'Because Context uses shallow comparison',
            'Because all consumers subscribe to the same value object',
            'Because Context doesn\'t use memoization',
            'It\'s a React bug'
          ],
          correctAnswer: 1,
          explanation: 'All consumers re-render because they all subscribe to the same Context value. When the value object changes (even if content is same), all consumers are notified.'
        },
        {
          question: 'How can you prevent unnecessary re-renders with React Context?',
          options: [
            'Split contexts by concern',
            'Memoize the provider value with useMemo',
            'Use React.memo on consumer components',
            'All of the above'
          ],
          correctAnswer: 3,
          explanation: 'You can prevent unnecessary re-renders by splitting contexts into smaller, more focused ones, memoizing the provider value, and using React.memo on consumer components.'
        },
        {
          question: 'What is the "blast radius" of a React Context update?',
          options: [
            'The number of components that re-render',
            'The distance from the provider in the component tree',
            'The size of the context value object',
            'The number of Context providers'
          ],
          correctAnswer: 0,
          explanation: 'Blast radius refers to how many components are affected (re-render) when a Context value changes. A large blast radius indicates a potential performance issue.'
        },
        {
          question: 'When is React Context a good choice for state management?',
          options: [
            'For global application state that changes frequently',
            'For prop drilling avoidance in deeply nested components',
            'As a replacement for Redux or Zustand',
            'For managing local component state'
          ],
          correctAnswer: 1,
          explanation: 'Context is ideal for passing data that can be considered "global" for a tree of React components, like theme or user authentication, to avoid prop drilling.'
        },
        {
          question: 'What is the main drawback of overusing React Context?',
          options: [
            'It makes components harder to test',
            'It can lead to performance issues due to widespread re-renders',
            'It increases bundle size',
            'It is difficult to set up'
          ],
          correctAnswer: 1,
          explanation: 'Overusing Context, especially with frequently changing values, can lead to performance issues because all connected consumers will re-render, even if they don\'t use the changed part of the value.'
        }
      ],
      'concurrent': [
        {
          question: 'What is concurrent rendering in React?',
          options: [
            'Rendering multiple components at once',
            'Interruptible rendering that can pause for urgent work',
            'Rendering on multiple threads',
            'Faster rendering'
          ],
          correctAnswer: 1,
          explanation: 'Concurrent rendering allows React to interrupt rendering work to handle urgent updates (like user input), then resume where it left off, improving responsiveness.'
        },
        {
          question: 'What is the purpose of `startTransition` in React 18?',
          options: [
            'To start a new render cycle',
            'To mark updates as non-urgent, allowing them to be interrupted',
            'To batch state updates together',
            'To pause all rendering indefinitely'
          ],
          correctAnswer: 1,
          explanation: '`startTransition` marks state updates as non-urgent, allowing React to interrupt them for urgent updates like user input, keeping the UI responsive.'
        },
        {
          question: 'What are "priority lanes" in React 18?',
          options: [
            'Different rendering speeds for components',
            'Different priority levels for updates (urgent vs non-urgent)',
            'Different types of React components',
            'Different browser rendering pipelines'
          ],
          correctAnswer: 1,
          explanation: 'Priority lanes categorize updates by urgency. Urgent updates (e.g., clicks) are processed before non-urgent ones (e.g., data fetching for a search result).'
        },
        {
          question: 'How does Fiber architecture enable concurrent rendering?',
          options: [
            'By using a single, synchronous work loop',
            'By breaking rendering work into small, interruptible units',
            'By avoiding the Virtual DOM entirely',
            'By forcing all updates to be high priority'
          ],
          correctAnswer: 1,
          explanation: 'Fiber\'s unit of work model allows React to pause and resume rendering, making it possible to implement concurrent features like time slicing and prioritization.'
        },
        {
          question: 'What is "time slicing" in the context of React concurrent features?',
          options: [
            'Dividing rendering time into fixed intervals',
            'Rendering components on a timer',
            'Allowing React to break up long rendering tasks into smaller chunks',
            'Measuring component render duration'
          ],
          correctAnswer: 2,
          explanation: 'Time slicing allows React to break up long rendering tasks into smaller chunks, yielding control back to the browser periodically to prevent the UI from freezing.'
        }
      ],
      'concurrent rendering': [
        {
          question: 'What is concurrent rendering in React?',
          options: [
            'Rendering multiple components at once',
            'Interruptible rendering that can pause for urgent work',
            'Rendering on multiple threads',
            'Faster rendering'
          ],
          correctAnswer: 1,
          explanation: 'Concurrent rendering allows React to interrupt rendering work to handle urgent updates (like user input), then resume where it left off, improving responsiveness.'
        },
        {
          question: 'What is the purpose of `startTransition` in React 18?',
          options: [
            'To start a new render cycle',
            'To mark updates as non-urgent, allowing them to be interrupted',
            'To batch state updates together',
            'To pause all rendering indefinitely'
          ],
          correctAnswer: 1,
          explanation: '`startTransition` marks state updates as non-urgent, allowing React to interrupt them for urgent updates like user input, keeping the UI responsive.'
        },
        {
          question: 'What are "priority lanes" in React 18?',
          options: [
            'Different rendering speeds for components',
            'Different priority levels for updates (urgent vs non-urgent)',
            'Different types of React components',
            'Different browser rendering pipelines'
          ],
          correctAnswer: 1,
          explanation: 'Priority lanes categorize updates by urgency. Urgent updates (e.g., clicks) are processed before non-urgent ones (e.g., data fetching for a search result).'
        },
        {
          question: 'How does Fiber architecture enable concurrent rendering?',
          options: [
            'By using a single, synchronous work loop',
            'By breaking rendering work into small, interruptible units',
            'By avoiding the Virtual DOM entirely',
            'By forcing all updates to be high priority'
          ],
          correctAnswer: 1,
          explanation: 'Fiber\'s unit of work model allows React to pause and resume rendering, making it possible to implement concurrent features like time slicing and prioritization.'
        },
        {
          question: 'What is "time slicing" in the context of React concurrent features?',
          options: [
            'Dividing rendering time into fixed intervals',
            'Rendering components on a timer',
            'Allowing React to break up long rendering tasks into smaller chunks',
            'Measuring component render duration'
          ],
          correctAnswer: 2,
          explanation: 'Time slicing allows React to break up long rendering tasks into smaller chunks, yielding control back to the browser periodically to prevent the UI from freezing.'
        }
      ],
      'startTransition': [
        {
          question: 'What is the primary use case for `useTransition` and `startTransition`?',
          options: [
            'To make all state updates urgent',
            'To mark certain state updates as non-urgent, allowing them to be interrupted',
            'To perform animations',
            'To fetch data'
          ],
          correctAnswer: 1,
          explanation: '`useTransition` and `startTransition` are used to mark updates that don\'t need to be immediate, allowing React to keep the UI responsive by prioritizing urgent updates.'
        },
        {
          question: 'When an update is wrapped in `startTransition`, what happens if an urgent update occurs?',
          options: [
            'The transition update is immediately aborted and restarted later',
            'Both updates run in parallel',
            'The urgent update is delayed',
            'The transition update completes first'
          ],
          correctAnswer: 0,
          explanation: 'If an urgent update (like typing) occurs during a transition, React will interrupt the transition, handle the urgent update, and then restart the transition from scratch.'
        },
        {
          question: 'What does `isPending` from `useTransition` indicate?',
          options: [
            'If the component is currently rendering',
            'If a transition is currently active (i.e., a non-urgent update is in progress)',
            'If data is being fetched',
            'If an error has occurred'
          ],
          correctAnswer: 1,
          explanation: '`isPending` is a boolean that tells you whether a transition is currently active. You can use it to show a loading indicator.'
        },
        {
          question: 'What kind of updates should typically be wrapped in `startTransition`?',
          options: [
            'Direct user input (e.g., typing in an input field)',
            'Updates that cause a significant visual change or data fetch',
            'Updates that must be immediately reflected on screen',
            'All state updates'
          ],
          correctAnswer: 1,
          explanation: 'Updates that might take a moment to render, like filtering a large list or fetching data, are good candidates for `startTransition` to keep the UI responsive.'
        },
        {
          question: 'What is the benefit of using `startTransition` for non-urgent updates?',
          options: [
            'It guarantees faster rendering for all updates',
            'It prevents the UI from freezing during heavy computations',
            'It reduces the bundle size of the application',
            'It simplifies state management logic'
          ],
          correctAnswer: 1,
          explanation: 'By marking updates as non-urgent, `startTransition` allows React to prioritize user interactions, preventing the UI from becoming unresponsive during potentially long rendering tasks.'
        }
      ],
      'automatic batching': [
        {
          question: 'What is automatic batching in React 18?',
          options: [
            'Batching multiple API requests into one',
            'Grouping multiple state updates into a single re-render',
            'Batching component imports',
            'Batching event handlers'
          ],
          correctAnswer: 1,
          explanation: 'Automatic batching in React 18 groups multiple state updates (even outside of event handlers) into a single re-render for better performance.'
        },
        {
          question: 'How does automatic batching improve performance?',
          options: [
            'By reducing the number of API calls',
            'By minimizing the number of component re-renders',
            'By caching component results',
            'By running updates in parallel'
          ],
          correctAnswer: 1,
          explanation: 'By batching updates, React avoids unnecessary re-renders, which reduces the work React has to do and improves overall performance.'
        },
        {
          question: 'Does automatic batching apply to updates inside `setTimeout` or native event handlers in React 18?',
          options: [
            'No, only React event handlers',
            'Yes, it applies to all updates regardless of where they originate',
            'Only if `ReactDOM.unstable_batchedUpdates` is used',
            'Only for asynchronous updates'
          ],
          correctAnswer: 1,
          explanation: 'In React 18, automatic batching applies to updates inside `setTimeout`, native event handlers, or any other asynchronous code, which was not the case in React 17 and earlier.'
        },
        {
          question: 'What is `ReactDOM.flushSync` used for?',
          options: [
            'To force React to batch updates',
            'To force React to apply updates synchronously and immediately',
            'To clear the component cache',
            'To optimize rendering'
          ],
          correctAnswer: 1,
          explanation: '`ReactDOM.flushSync` allows you to force React to apply any pending state updates synchronously and immediately, bypassing automatic batching for critical updates.'
        },
        {
          question: 'What is the main benefit of automatic batching for developers?',
          options: [
            'Less code to write for state updates',
            'Improved application performance without manual optimization',
            'Easier debugging of re-renders',
            'Better control over the rendering process'
          ],
          correctAnswer: 1,
          explanation: 'Automatic batching provides performance improvements out-of-the-box by reducing re-renders, meaning developers get better performance without needing to manually batch updates.'
        }
      ],
      'suspense': [
        {
          question: 'How does Suspense work under the hood in React?',
          options: [
            'It uses promises to signal data readiness',
            'It throws promises and React catches them to show fallback UI',
            'It uses async/await syntax directly in components',
            'It polls for data availability'
          ],
          correctAnswer: 1,
          explanation: 'Suspense works by components throwing promises when data isn\'t ready. React catches these promises and displays the `fallback` UI until the promise resolves.'
        },
        {
          question: 'Why shouldn\'t you wrap your entire React application in a single Suspense boundary?',
          options: [
            'It causes errors and crashes',
            'It prevents showing granular loading states for different parts of the page',
            'It significantly slows down the application startup',
            'It breaks client-side routing'
          ],
          correctAnswer: 1,
          explanation: 'Wrapping the entire app in one Suspense boundary means the whole page would show a single loading spinner. It\'s better to use multiple, smaller Suspense boundaries for granular loading states.'
        },
        {
          question: 'What is a Suspense boundary in React?',
          options: [
            'A component that uses `useState` for loading',
            'A wrapper component (`<Suspense>`) that catches thrown promises and shows a fallback UI',
            'A special type of React hook',
            'A boundary for error handling'
          ],
          correctAnswer: 1,
          explanation: 'A Suspense boundary is a `<Suspense>` component that defines a loading state (fallback) for any of its children that are not yet ready (e.g., fetching data).'
        },
        {
          question: 'What is the primary benefit of using Suspense for data fetching?',
          options: [
            'It makes data fetching faster',
            'It simplifies the UI code for loading states and reduces "waterfalls"',
            'It caches API responses automatically',
            'It replaces the need for `useEffect`'
          ],
          correctAnswer: 1,
          explanation: 'Suspense allows you to declaratively specify loading states, simplifying UI code by letting components "suspend" rendering until data is ready, avoiding manual loading state management.'
        },
        {
          question: 'Can Suspense be used for code splitting?',
          options: [
            'No, it\'s only for data fetching',
            'Yes, with `React.lazy` to show a fallback while a component\'s code is loading',
            'Only in server-side rendering environments',
            'It\'s an outdated feature'
          ],
          correctAnswer: 1,
          explanation: 'Yes, Suspense is commonly used with `React.lazy` to show a loading fallback while the code for a dynamically imported component is being fetched.'
        }
      ],
      'ssr': [
        {
          question: 'What is "hydration" in the context of React Server-Side Rendering (SSR)?',
          options: [
            'Adding water to the server',
            'The process of attaching event listeners and making server-rendered HTML interactive on the client',
            'Rendering components on the server',
            'Caching server responses'
          ],
          correctAnswer: 1,
          explanation: 'Hydration is when React takes over the server-rendered HTML on the client, attaching event handlers and making the application interactive.'
        },
        {
          question: 'What causes "hydration mismatches" in React SSR applications?',
          options: [
            'Using different React versions on client and server',
            'Non-deterministic rendering (e.g., `Date.now()`, `Math.random()`) on client vs. server',
            'Differences in HTML structure between server-rendered and client-rendered output',
            'All of the above'
          ],
          correctAnswer: 3,
          explanation: 'Hydration mismatches occur when the server-rendered HTML differs from what React expects to render on the client, often due to non-deterministic code or browser-only APIs on the server.'
        },
        {
          question: 'Why must SSR rendering be "deterministic" in React?',
          options: [
            'For better SEO performance',
            'To ensure the server and client render the exact same HTML structure',
            'To reduce server load',
            'To simplify debugging'
          ],
          correctAnswer: 1,
          explanation: 'SSR rendering must be deterministic so that the HTML generated on the server matches the HTML React expects to generate on the client, preventing hydration errors.'
        },
        {
          question: 'What is a benefit of using SSR with React?',
          options: [
            'Faster initial page load and better SEO',
            'Reduced server costs',
            'Simpler client-side routing',
            'Automatic state management'
          ],
          correctAnswer: 0,
          explanation: 'SSR provides a faster initial page load (users see content sooner) and improved SEO because search engine crawlers can easily index the fully rendered HTML.'
        },
        {
          question: 'What is a potential drawback of implementing SSR in a React application?',
          options: [
            'Increased client-side bundle size',
            'More complex setup and increased server load',
            'Slower development cycles',
            'Incompatibility with modern React features'
          ],
          correctAnswer: 1,
          explanation: 'SSR adds complexity to the application architecture and can increase server load and operational costs due to rendering on the server for each request.'
        }
      ],
      'ssr hydration': [
        {
          question: 'What is "hydration" in the context of React Server-Side Rendering (SSR)?',
          options: [
            'Adding water to the server',
            'The process of attaching event listeners and making server-rendered HTML interactive on the client',
            'Rendering components on the server',
            'Caching server responses'
          ],
          correctAnswer: 1,
          explanation: 'Hydration is when React takes over the server-rendered HTML on the client, attaching event handlers and making the application interactive.'
        },
        {
          question: 'What causes "hydration mismatches" in React SSR applications?',
          options: [
            'Using different React versions on client and server',
            'Non-deterministic rendering (e.g., `Date.now()`, `Math.random()`) on client vs. server',
            'Differences in HTML structure between server-rendered and client-rendered output',
            'All of the above'
          ],
          correctAnswer: 3,
          explanation: 'Hydration mismatches occur when the server-rendered HTML differs from what React expects to render on the client, often due to non-deterministic code or browser-only APIs on the server.'
        },
        {
          question: 'Why must SSR rendering be "deterministic" in React?',
          options: [
            'For better SEO performance',
            'To ensure the server and client render the exact same HTML structure',
            'To reduce server load',
            'To simplify debugging'
          ],
          correctAnswer: 1,
          explanation: 'SSR rendering must be deterministic so that the HTML generated on the server matches the HTML React expects to generate on the client, preventing hydration errors.'
        },
        {
          question: 'What is a benefit of using SSR with React?',
          options: [
            'Faster initial page load and better SEO',
            'Reduced server costs',
            'Simpler client-side routing',
            'Automatic state management'
          ],
          correctAnswer: 0,
          explanation: 'SSR provides a faster initial page load (users see content sooner) and improved SEO because search engine crawlers can easily index the fully rendered HTML.'
        },
        {
          question: 'What is a potential drawback of implementing SSR in a React application?',
          options: [
            'Increased client-side bundle size',
            'More complex setup and increased server load',
            'Slower development cycles',
            'Incompatibility with modern React features'
          ],
          correctAnswer: 1,
          explanation: 'SSR adds complexity to the application architecture and can increase server load and operational costs due to rendering on the server for each request.'
        }
      ],
      'code-splitting': [
        {
          question: 'What is `React.lazy` used for in React?',
          options: [
            'Lazy loading images',
            'Code splitting components to load them on demand',
            'Delaying state updates',
            'Optimizing component re-renders'
          ],
          correctAnswer: 1,
          explanation: '`React.lazy` allows you to define a component that is dynamically loaded only when it\'s rendered, enabling code splitting to reduce the initial bundle size.'
        },
        {
          question: 'When should you typically NOT use code splitting for a React component?',
          options: [
            'For very large components',
            'For components that are always visible "above the fold"',
            'For components used in infrequently accessed routes',
            'For components that are part of a critical user flow'
          ],
          correctAnswer: 1,
          explanation: 'Components that are always visible "above the fold" (i.e., immediately visible when the page loads) should generally not be code-split, as it would delay their initial rendering.'
        },
        {
          question: 'What is "route-based code splitting" in a React application?',
          options: [
            'Splitting the application\'s code into chunks based on component size',
            'Splitting the application\'s code into chunks based on different routes or pages',
            'Splitting the code based on user roles',
            'Splitting the code based on browser capabilities'
          ],
          correctAnswer: 1,
          explanation: 'Route-based code splitting involves loading different JavaScript bundles for different routes, so users only download the code needed for the page they are currently viewing.'
        },
        {
          question: 'What is the main benefit of code splitting in React applications?',
          options: [
            'Improved runtime performance',
            'Reduced initial load time and memory usage',
            'Simplified component logic',
            'Enhanced security'
          ],
          correctAnswer: 1,
          explanation: 'The primary benefit of code splitting is reducing the initial load time of your application by only loading the necessary code for the current view, which also saves memory.'
        },
        {
          question: 'Which React feature is often used in conjunction with `React.lazy` to provide a better user experience?',
          options: [
            '`useContext`',
            '`useEffect`',
            '`<Suspense>`',
            '`React.memo`'
          ],
          correctAnswer: 2,
          explanation: '`<Suspense>` is used with `React.lazy` to display a fallback UI (like a loading spinner) while the dynamically imported component\'s code is being loaded.'
        }
      ],
      'weekly reflection': [
        {
          question: 'Which React concept allows you to pause rendering for urgent updates?',
          options: [
            'React.memo',
            'useEffect',
            'Fiber Architecture',
            'Context API'
          ],
          correctAnswer: 2,
          explanation: 'Fiber Architecture enables interruptible rendering, allowing React to pause work for urgent updates.'
        },
        {
          question: 'What is the primary benefit of using keys in React lists?',
          options: [
            'To improve CSS styling',
            'To help React efficiently update list items',
            'To make components reusable',
            'To prevent prop drilling'
          ],
          correctAnswer: 1,
          explanation: 'Keys help React identify which items have changed, been added, or removed in a list, optimizing reconciliation.'
        },
        {
          question: 'What is a potential pitfall of `useEffect` related to closures?',
          options: [
            'Infinite loops',
            'Stale closures capturing old state/props',
            'Performance overhead',
            'Memory leaks'
          ],
          correctAnswer: 1,
          explanation: 'Stale closures can occur when `useEffect` captures outdated values if dependencies are not correctly specified, leading to unexpected behavior.'
        },
        {
          question: 'When should you consider splitting a large React Context into smaller ones?',
          options: [
            'When the context value changes infrequently',
            'When different parts of the context value are consumed by different components',
            'To reduce the number of providers',
            'To simplify the context API'
          ],
          correctAnswer: 1,
          explanation: 'Splitting contexts by concern can prevent unnecessary re-renders for consumers that only depend on a subset of the context value.'
        },
        {
          question: 'Which phase of React rendering is synchronous and cannot be interrupted?',
          options: [
            'Render Phase',
            'Commit Phase',
            'Reconciliation Phase',
            'Mounting Phase'
          ],
          correctAnswer: 1,
          explanation: 'The Commit Phase is synchronous because it directly manipulates the DOM and must complete atomically to prevent visual inconsistencies.'
        }
      ]
    }

    // Find matching templates (check for partial matches too)
    for (const [key, questions] of Object.entries(templates)) {
      if (topicLower.includes(key) || key.includes(topicLower.split(' ')[0])) {
        return questions
      }
    }

    // Improved fallback: Generate React-specific generic questions
    const fallbackQuestions = [
      {
        question: `What is a key concept about ${topic} in React's internal architecture?`,
        options: [
          'It relates to component rendering',
          'It affects performance optimization',
          'It involves state management',
          'It is part of React\'s core rendering mechanism'
        ],
        correctAnswer: 3,
        explanation: `This topic is an important part of React's core architecture and understanding how React works internally.`
      },
      {
        question: `How does ${topic} work in React's rendering pipeline?`,
        options: [
          'Through the Virtual DOM',
          'Using React\'s reconciliation algorithm',
          'Via the Fiber architecture',
          'All of the above'
        ],
        correctAnswer: 3,
        explanation: `This concept works through React's core mechanisms including Virtual DOM, reconciliation, and Fiber architecture.`
      },
      {
        question: `Why is understanding ${topic} important for React developers?`,
        options: [
          'It helps optimize performance',
          'It enables better debugging',
          'It improves code architecture decisions',
          'All of the above'
        ],
        correctAnswer: 3,
        explanation: `Understanding this topic helps with performance optimization, debugging, and making better architectural decisions.`
      }
    ]
    
    return fallbackQuestions
  }

  /**
   * Cache questions
   */
  private cacheQuestions(key: string, questions: QuizQuestion[]): void {
    this.cache[key] = {
      questions,
      timestamp: Date.now(),
      expiresIn: this.CACHE_DURATION
    }
  }

  /**
   * Get cached questions if still valid
   */
  private getCachedQuestions(key: string): QuizQuestion[] | null {
    const cached = this.cache[key]
    if (!cached) return null

    const age = Date.now() - cached.timestamp
    if (age > cached.expiresIn) {
      delete this.cache[key]
      return null
    }

    return cached.questions
  }

  /**
   * Clear cache for a specific key or all cache
   */
  clearCache(key?: string): void {
    if (key) {
      delete this.cache[key]
    } else {
      this.cache = {}
    }
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { keys: string[], totalQuestions: number } {
    const keys = Object.keys(this.cache)
    const totalQuestions = Object.values(this.cache).reduce(
      (sum, cached) => sum + cached.questions.length,
      0
    )
    return { keys, totalQuestions }
  }
}

// Export singleton instance
export const quizQuestionService = new QuizQuestionService()

// Export for testing
export default QuizQuestionService
