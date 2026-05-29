# AI Services Architecture - Implementation Guide

## Overview

Created a robust, extensible base service architecture for EduTech AI services with support for tier-based feature access and graceful degradation.

## Files Created

### 1. **base.service.js** (5.4 KB)
Abstract base class that all AI services must extend.

**Key Methods:**
- `async initialize()` - Initialize service and dependencies
- `async isAvailable()` - Check if service is ready to use
- `async getStatus()` - Get detailed health information
- `async shutdown()` - Graceful cleanup

**Features:**
- Structured health status tracking
- Built-in logging with optional logger integration
- Abstract method enforcement (throws NotImplementedError)
- Protected methods for marking service health
- Comprehensive JSDoc documentation

**Example:**
```javascript
class MyAIService extends BaseAIService {
  async initialize() {
    // Initialize connections here
    this.initialized = true;
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
}
```

---

### 2. **noop.service.js** (3.9 KB)
No-operation service implementation for free tier users.

**Key Features:**
- Implements entire AI service interface
- Returns consistent "not available" responses
- No code branching needed in controllers
- Graceful feature degradation

**Response Format:**
```javascript
{
  success: false,
  message: 'Feature is not available in your current tier. Upgrade to Premium to access this feature.',
  data: null
}
```

**Usage Pattern:**
```javascript
// Controllers don't need if/else checks
const service = createAIService('quiz', userTier);
const result = await service.generateQuestions(content);

// Free tier users get: { success: false, message: '...' }
// Premium users get: { success: true, data: [...] }
```

---

### 3. **interfaces.js** (4.8 KB)
Type definitions and interface contracts for all AI services.

**Defined Interfaces:**
- `IAIService` - Base interface (initialize, isAvailable, getStatus)
- `IQuizGenerator` - Quiz generation (generateQuestions, generateAnswerKey, evaluateResponse)
- `IDocumentAnalyzer` - Document analysis (summarize, extractKeypoints, detectSentiment)
- `IRAGService` - RAG operations (indexDocument, query, generateResponse)
- `IContentGenerator` - Content generation (generateContent, generateVariations)

**Documentation:**
Each interface has detailed JSDoc comments explaining:
- Purpose and use cases
- Method signatures with parameter types
- Return value descriptions
- Usage examples

---

### 4. **factory.js** (9.2 KB)
Service factory with dependency injection and tier management.

**Core Functions:**

1. **`registerService(serviceName, ServiceClass)`**
   - Register service implementations
   - Validates that service extends BaseAIService
   - Called during app initialization

2. **`createAIService(serviceName, userTier, config)`**
   - Creates or retrieves cached service instance
   - Returns NoOp if feature unavailable for tier
   - Handles all tier-based logic in one place

3. **`initializeServices(servicesToInitialize, config)`**
   - Initializes all registered services on startup
   - Returns initialization status for monitoring

4. **`getServicesStatus(tier)`**
   - Get health status of all services for a tier
   - Useful for dashboards and monitoring

5. **`shutdownAllServices()`**
   - Graceful shutdown of all services
   - Called on app shutdown

**Tier Features Configuration:**
```javascript
TIER_FEATURES = {
  free: { quizGeneration: false, documentAnalysis: false, ... },
  premium: { quizGeneration: true, documentAnalysis: true, ... },
  enterprise: { all features enabled + custom options }
}
```

**Caching Strategy:**
- Instances cached by tier to avoid recreation
- `SERVICE_CACHE[tier][serviceName]` stores instances
- Call `clearServiceCache()` to reset for testing

---

### 5. **index.js** (596 bytes)
Barrel export file for clean module imports.

**Exports:**
```javascript
export {
  BaseAIService,
  NotImplementedError,
  NoOpAIService,
  createNoOpService,
  IAIService,
  IQuizGenerator,
  IDocumentAnalyzer,
  IRAGService,
  IContentGenerator,
  ServiceResponse,
  createAIService,
  registerService,
  initializeServices,
  getServicesStatus,
  shutdownAllServices,
  clearServiceCache,
  TIER_FEATURES
}
```

**Usage:**
```javascript
import {
  BaseAIService,
  createAIService,
  registerService
} from './services/ai/index.js';
```

---

### 6. **EXAMPLE.js** (6.4 KB)
Complete example implementation showing how to create a real service.

Demonstrates:
- Extending BaseAIService
- Implementing all required methods
- Integration with factory pattern
- Real-world usage in controllers

---

## Architecture Design Patterns

### 1. **Factory Pattern**
Services are created through `createAIService()` factory function, not instantiated directly. This enables:
- Tier-based service selection
- Service caching
- Easy swapping of implementations
- Feature toggling

### 2. **Strategy Pattern**
Different service implementations (Real vs NoOp) implement the same interface:
```javascript
// Both work identically from caller's perspective
const realService = new QuizGenerationService(config);
const noOpService = new NoOpAIService();

await realService.generateQuestions(...);  // Real LLM call
await noOpService.generateQuestions(...);  // Returns "not available"
```

### 3. **Template Method Pattern**
`BaseAIService` defines the contract; subclasses implement specifics:
```javascript
class QuizGenerationService extends BaseAIService {
  async initialize() { /* specific to quiz gen */ }
  async isAvailable() { /* specific to quiz gen */ }
  // ... etc
}
```

---

## Integration Guide

### Step 1: Register Services (App Startup)
```javascript
// In backend/src/app.js or main entry point
import { registerService, initializeServices } from './services/ai/index.js';
import { QuizGenerationService } from './services/ai/quiz.service.js';

// Register implementations
registerService('quiz', QuizGenerationService);
registerService('rag', RAGService);
registerService('chat', AdvancedChatService);

// Initialize on startup
await initializeServices(['quiz', 'rag', 'chat']);
```

### Step 2: Use in Controllers (No Tier Logic Needed)
```javascript
// In backend/src/routes/quiz.js
import { createAIService } from '../services/ai/index.js';

export async function generateQuizHandler(req, res) {
  const { content, questionCount } = req.body;
  const userTier = req.user.subscriptionTier;

  // Get appropriate service - real or NoOp based on tier
  const quizService = createAIService('quiz', userTier);
  
  const result = await quizService.generateQuestions(
    content,
    questionCount,
    'medium'
  );

  // Same response handling works for all tiers
  res.json(result);
}

// Free tier: { success: false, message: 'Feature not available...' }
// Premium tier: { success: true, data: [...questions] }
```

### Step 3: Add New AI Service
```javascript
// 1. Create implementation extending BaseAIService
class MyNewService extends BaseAIService {
  async initialize() { /* ... */ }
  async isAvailable() { /* ... */ }
  async getStatus() { /* ... */ }
  async myMethod() { /* ... */ }
}

// 2. Register it
registerService('myservice', MyNewService);

// 3. Use it - no other code changes needed
const service = createAIService('myservice', userTier);
```

---

## Feature Availability Matrix

|Feature|Free|Premium|Enterprise|
|-------|----|----|---------|
|Quiz Generation|❌|✅|✅|
|Document Analysis|❌|✅|✅|
|RAG Service|❌|✅|✅|
|Content Generation|❌|✅|✅|
|Advanced Chat|❌|✅|✅|
|Custom Models|-|-|✅|
|Dedicated Support|-|-|✅|

---

## Error Handling

### For Real Services
```javascript
// If service fails
try {
  await service.initialize();
} catch (error) {
  // Error propagates to caller
  // Service marked as unhealthy
  logger.error('Service failed:', error);
}
```

### For Free Tier (NoOp)
```javascript
// No errors - graceful degradation
const result = await service.generateQuestions(...);
// Returns: { success: false, message: '...' }
// No try/catch needed in most cases
```

---

## Testing & Monitoring

### Health Checks
```javascript
const status = await getServicesStatus('premium');
// {
//   quiz: { healthy: true, message: '...' },
//   rag: { healthy: false, message: '...' }
// }
```

### Cache Management
```javascript
// Clear cache for testing
clearServiceCache('premium');

// Create fresh instance next time
const service = createAIService('quiz', 'premium');
```

### Logging
```javascript
const service = createAIService('quiz', 'premium', {
  logger: myLogger // Optional custom logger
});
// Logs all lifecycle events with [quiz] prefix
```

---

## Next Steps

1. **Create Concrete Implementations:**
   - Quiz Generation Service
   - Document Analyzer Service
   - RAG Service
   - Advanced Chat Service

2. **Wire into Routes:**
   - Update controllers to use factory
   - Add tier checks at route entry point
   - Test with different user tiers

3. **Add Configuration:**
   - Load API keys from environment
   - Configure LLM providers
   - Set rate limits per tier

4. **Monitoring:**
   - Add service status endpoints
   - Track usage metrics
   - Alert on service failures

5. **Testing:**
   - Unit tests for each service
   - Integration tests with factory
   - Tier-based access control tests

---

## Key Benefits

✅ **No Code Branching** - Single code path for all tiers
✅ **Extensible** - Easy to add new services
✅ **Type Safe** - JSDoc interfaces document contracts
✅ **Testable** - Clear separation of concerns
✅ **Fault Tolerant** - NoOp prevents cascade failures
✅ **Cacheable** - Instances reused efficiently
✅ **Observable** - Built-in logging and health checks
✅ **Maintainable** - Clear architectural patterns

