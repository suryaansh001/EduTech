# AI Services Implementation Guide

## Summary of Completed Work

Created a production-ready base service architecture for EduTech AI services with:
- **Abstract base class** for all AI services
- **No-op service** for graceful tier degradation  
- **Service factory** with tier-based feature control
- **Type/interface definitions** with JSDoc documentation
- **Zero external dependencies** and ES6 module support

## What Was Created

### Directory: `/backend/src/services/ai/`

1. **base.service.js** (197 lines)
   - Abstract base class `BaseAIService` that all AI services extend
   - Enforces implementation of `initialize()`, `isAvailable()`, `getStatus()`
   - Built-in health tracking, logging, and lifecycle management
   - Throws `NotImplementedError` if methods not overridden

2. **noop.service.js** (160 lines)
   - `NoOpAIService` class for free tier users
   - Returns `{success: false, message: "Feature not available..."}` for all operations
   - Eliminates need for tier checks in controllers
   - Implements entire AI service interface

3. **interfaces.js** (144 lines)
   - JSDoc interface definitions for all AI service types
   - Includes: `IAIService`, `IQuizGenerator`, `IDocumentAnalyzer`, `IRAGService`, `IContentGenerator`
   - Documents method signatures, parameters, and return types
   - Standard `ServiceResponse` format definition

4. **factory.js** (314 lines)
   - `createAIService()` - Creates services based on user tier
   - `registerService()` - Registers service implementations
   - `initializeServices()` - Initializes all services on startup
   - `TIER_FEATURES` - Defines feature availability by tier
   - Service caching for performance
   - Handles tier-based logic in one place

5. **index.js** (26 lines)
   - Barrel export file for clean imports
   - Exports all public APIs

6. **EXAMPLE.js** (219 lines)
   - Complete example implementation (`QuizGenerationService`)
   - Shows how to extend `BaseAIService`
   - Demonstrates integration with factory pattern
   - Real-world usage patterns

## Integration Pattern

### Step 1: Register Services (App Initialization)
```javascript
// backend/src/app.js or server.js
import { registerService, initializeServices } from './services/ai/index.js';
import { QuizGenerationService } from './services/ai/quiz.service.js';
import { RAGService } from './services/ai/rag.service.js';

// Register service implementations
registerService('quiz', QuizGenerationService);
registerService('rag', RAGService);

// Initialize on startup
await initializeServices(['quiz', 'rag']);
```

### Step 2: Use in Controllers (No Branching!)
```javascript
// backend/src/routes/quiz.routes.js
import { createAIService } from '../services/ai/index.js';

export async function generateQuizHandler(req, res) {
  const { content, questionCount } = req.body;
  const userTier = req.user.subscriptionTier; // 'free', 'premium', or 'enterprise'

  // Factory returns appropriate service - real or NoOp
  const quizService = createAIService('quiz', userTier);
  
  // Same code works for all tiers!
  const result = await quizService.generateQuestions(
    content,
    questionCount,
    'medium'
  );

  // Response is consistent regardless of tier
  // Free tier: { success: false, message: 'Feature not available...' }
  // Premium tier: { success: true, data: [...questions] }
  res.json(result);
}
```

### Step 3: Accessing in Other Services
```javascript
// backend/src/services/analytics.service.js
import { createAIService } from './ai/index.js';

export async function trackQuizMetrics(userId, quizId) {
  const user = await getUser(userId);
  const quizService = createAIService('quiz', user.tier);
  
  // Check if available
  if (await quizService.isAvailable()) {
    // Perform advanced analytics
  }
}
```

## Comparison: Before vs After

### Before (Without Factory Pattern)
```javascript
// Controllers had to know about tiers
export async function generateQuiz(req, res) {
  if (req.user.tier === 'free') {
    return res.status(402).json({ message: 'Upgrade to Premium' });
  }
  
  if (req.user.tier === 'premium' || req.user.tier === 'enterprise') {
    const result = await quizService.generate(...);
    res.json(result);
  }
}
```

### After (With Factory Pattern)
```javascript
// Controllers don't know about tiers - service factory handles it
export async function generateQuiz(req, res) {
  const quizService = createAIService('quiz', req.user.tier);
  const result = await quizService.generateQuestions(...);
  res.json(result); // Works for all tiers!
}
```

## Feature Availability Matrix

| Feature | Free | Premium | Enterprise |
|---------|------|---------|------------|
| Quiz Generation | NoOp | Real | Real |
| Document Analysis | NoOp | Real | Real |
| RAG Service | NoOp | Real | Real |
| Content Generation | NoOp | Real | Real |
| Advanced Chat | NoOp | Real | Real |
| Custom Models | - | - | Real |

## Architecture Benefits

✅ **Single Code Path** - Same code handles all tiers (no if/else for tier checks)
✅ **Graceful Degradation** - Free tier gets consistent "not available" responses
✅ **Extensible** - Easy to add new AI services or modify existing ones
✅ **Type Safe** - JSDoc interfaces document what each service must implement
✅ **Testable** - Clear separation of concerns, easy to mock
✅ **Observable** - Built-in logging and health checks
✅ **Performant** - Service instances cached by tier
✅ **Maintainable** - Standard architectural patterns

## Tier-Based Behavior

### Free Tier Example
```javascript
const service = createAIService('quiz', 'free');
// Returns: NoOpAIService instance

await service.generateQuestions('content', 5);
// Returns: { success: false, message: 'Quiz Generation is not available in your current tier...', data: null }
```

### Premium Tier Example
```javascript
const service = createAIService('quiz', 'premium');
// Returns: QuizGenerationService instance (once implemented)

await service.generateQuestions('content', 5);
// Returns: { success: true, data: [question1, question2, ...] }
```

## Response Format (Consistent Across All Services)

```javascript
// Success response
{
  success: true,
  data: { /* actual result */ },
  message: 'Optional message'
}

// Feature unavailable (Free tier)
{
  success: false,
  message: 'Feature is not available in your current tier. Upgrade to Premium to access this feature.',
  data: null
}

// Error response
{
  success: false,
  message: 'Human-readable error message',
  error: 'Detailed error information',
  data: null
}
```

## Creating a New AI Service

### 1. Create Service Class
```javascript
// backend/src/services/ai/quiz.service.js
import { BaseAIService } from './base.service.js';

export class QuizGenerationService extends BaseAIService {
  async initialize() {
    try {
      // Connect to LLM provider, load configs, etc
      // this.llmClient = new OpenAI(this.config.apiKey);
      this.initialized = true;
      this._log('info', 'Service initialized');
    } catch (error) {
      this._markUnhealthy(error.message);
      throw error;
    }
  }

  async isAvailable() {
    return this.initialized && this.healthStatus.healthy;
  }

  async getStatus() {
    return {
      healthy: this.healthStatus.healthy,
      initialized: this.initialized,
      message: 'Service ready'
    };
  }

  async generateQuestions(content, count = 5, difficulty = 'medium') {
    if (!await this.isAvailable()) {
      return { success: false, message: 'Service unavailable' };
    }

    try {
      // Call LLM, generate questions
      const questions = await this._generateWithLLM(content, count, difficulty);
      
      return {
        success: true,
        data: questions
      };
    } catch (error) {
      this._markUnhealthy(error.message);
      return {
        success: false,
        message: 'Question generation failed',
        error: error.message
      };
    }
  }

  async generateAnswerKey(questions) {
    // Implementation...
  }

  async evaluateResponse(question, studentAnswer, correctAnswer) {
    // Implementation...
  }

  // Private helper methods
  async _generateWithLLM(content, count, difficulty) {
    // LLM integration logic
  }
}
```

### 2. Register in App Startup
```javascript
// backend/src/app.js
import { registerService } from './services/ai/index.js';
import { QuizGenerationService } from './services/ai/quiz.service.js';

registerService('quiz', QuizGenerationService);
```

### 3. Use in Controllers
```javascript
// No changes needed - already using factory pattern!
const quizService = createAIService('quiz', userTier);
await quizService.generateQuestions(...);
```

## Configuration

### Pass Config When Creating Service
```javascript
const service = createAIService('quiz', 'premium', {
  logger: myLogger,                    // Optional
  apiKey: process.env.OPENAI_API_KEY, // Optional
  model: 'gpt-4',                      // Optional service-specific
  temperature: 0.7                     // Optional service-specific
});
```

### Feature Overrides
```javascript
// Temporarily disable a feature
const service = createAIService('quiz', 'premium', {
  featureOverrides: { quizGeneration: false }
});
// Returns NoOp even though user is premium
```

## Health Monitoring

### Check Service Status
```javascript
const status = await service.getStatus();
console.log(status);
// {
//   healthy: true,
//   initialized: true,
//   message: 'Service ready',
//   lastChecked: '2024-05-29T16:00:00Z'
// }
```

### Get All Services Status
```javascript
import { getServicesStatus } from './services/ai/index.js';

const status = await getServicesStatus('premium');
// {
//   quiz: { healthy: true, message: '...' },
//   rag: { healthy: false, message: '...' },
//   chat: { healthy: true, message: '...' }
// }
```

## Testing

### Mock with NoOp Service
```javascript
// Force NoOp for testing free tier behavior
const service = createAIService('quiz', 'premium', {
  forceNoOp: true
});

const result = await service.generateQuestions('test');
// Always returns: { success: false, message: '...' }
```

### Clear Cache Between Tests
```javascript
import { clearServiceCache } from './services/ai/index.js';

// Clear all service instances
clearServiceCache();

// Or clear specific tier
clearServiceCache('premium');
```

## Next Steps

1. **Implement Concrete Services:**
   - `QuizGenerationService` - Integrate with LLM provider
   - `RAGService` - Document indexing and retrieval
   - `DocumentAnalyzerService` - Text analysis
   - `ContentGeneratorService` - Prompt-based generation

2. **Update Existing Routes:**
   - Quiz generation endpoints
   - Document analysis endpoints
   - Chat endpoints
   - Any other AI-powered features

3. **Add Monitoring:**
   - Health check endpoint (`GET /api/health/services`)
   - Service metrics tracking
   - Error monitoring and alerting

4. **Configuration:**
   - Load LLM API keys from environment
   - Configure model selection per service
   - Set rate limits per tier

5. **Documentation:**
   - API documentation for each endpoint
   - Integration guide for frontend
   - Tier documentation for users

## File Structure Summary

```
backend/src/
├── services/
│   ├── ai/                          ← NEW
│   │   ├── index.js                 ← Barrel exports
│   │   ├── base.service.js          ← Abstract base
│   │   ├── noop.service.js          ← No-op implementation
│   │   ├── interfaces.js            ← Type definitions
│   │   ├── factory.js               ← Service factory
│   │   ├── EXAMPLE.js               ← Example implementation
│   │   ├── quiz.service.js          ← TODO: Real implementation
│   │   ├── rag.service.js           ← TODO: Real implementation
│   │   └── ...                      ← TODO: More services
│   │
│   ├── chat.service.js              ← Existing (consider migrating)
│   ├── mcp.service.js               ← Existing (can use new factory)
│   └── ...                          ← Other services
│
└── app.js                           ← Register services here
```

## Backwards Compatibility

Existing services (`chat.service.js`, `mcp.service.js`) don't need immediate changes. You can:
1. Keep using them as-is (gradual migration)
2. Wrap them with new factory pattern
3. Refactor them to extend `BaseAIService` when convenient

Example of wrapping existing service:
```javascript
import { BaseAIService } from './ai/base.service.js';
import { chatService as originalChatService } from './chat.service.js';

export class ChatServiceWrapper extends BaseAIService {
  async initialize() {
    this.initialized = true;
  }

  async isAvailable() {
    return true; // Assuming it's always available
  }

  async getStatus() {
    return { healthy: true, initialized: true };
  }

  async sendMessage(...args) {
    return originalChatService.sendMessage(...args);
  }

  // ... wrap other methods
}
```

