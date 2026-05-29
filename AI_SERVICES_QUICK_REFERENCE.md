# AI Services - Quick Reference

## File Structure
```
/backend/src/services/ai/
├── index.js              # Barrel exports
├── base.service.js       # Abstract base class
├── noop.service.js       # Free tier no-op implementation
├── interfaces.js         # Type definitions
├── factory.js            # Service factory & tier management
└── EXAMPLE.js            # Example implementation
```

## Quick Start

### 1. Import What You Need
```javascript
// Controllers/Routes
import { createAIService } from '../services/ai/index.js';

// When creating new services
import { BaseAIService, registerService } from '../services/ai/index.js';
```

### 2. Use in Controllers (It's This Simple!)
```javascript
const quizService = createAIService('quiz', req.user.tier);
const result = await quizService.generateQuestions(content);
res.json(result);
```

### 3. Create New Service
```javascript
import { BaseAIService } from '../services/ai/base.service.js';

export class MyService extends BaseAIService {
  async initialize() { /* setup */ }
  async isAvailable() { return this.initialized; }
  async getStatus() { /* status */ }
  async myMethod() { /* implementation */ }
}
```

### 4. Register in App Startup
```javascript
import { registerService, initializeServices } from './services/ai/index.js';
import { MyService } from './services/ai/my.service.js';

registerService('myservice', MyService);
await initializeServices(['myservice']);
```

## Tier Behavior

| Action | Free Tier | Premium Tier |
|--------|-----------|--------------|
| `createAIService('quiz', 'free')` | Returns NoOpAIService | - |
| `createAIService('quiz', 'premium')` | - | Returns QuizGenerationService |
| `service.generateQuestions(...)` | `{ success: false, message: '...' }` | `{ success: true, data: [...] }` |
| No code branching needed | ✅ | ✅ |

## Available Methods

### BaseAIService
- `initialize()` - Required by subclass
- `isAvailable()` - Required by subclass
- `getStatus()` - Required by subclass
- `shutdown()` - Optional cleanup
- `_log(level, message, data)` - Internal logging
- `_markHealthy(message)` - Internal health tracking
- `_markUnhealthy(error)` - Internal health tracking

### Factory Functions
- `createAIService(name, tier, config)` - Get service instance
- `registerService(name, Class)` - Register implementation
- `initializeServices(names, config)` - Init on startup
- `getServicesStatus(tier)` - Health check
- `shutdownAllServices()` - Cleanup on shutdown
- `clearServiceCache(tier)` - Testing helper

## Response Format
```javascript
// Success
{ success: true, data: [...] }

// Feature not available (Free tier)
{ 
  success: false,
  message: 'Feature is not available in your current tier...',
  data: null 
}

// Error
{
  success: false,
  message: 'Specific error message',
  error: 'Error details'
}
```

## Common Patterns

### Pattern 1: Simple Feature Check
```javascript
const service = createAIService('quiz', userTier);
const result = await service.generateQuestions(content);
if (result.success) {
  // Use result.data
} else {
  // Feature not available or error
  res.status(402).json({ message: result.message });
}
```

### Pattern 2: Health Monitoring
```javascript
const status = await getServicesStatus('premium');
console.log(status);
// { quiz: { healthy: true }, rag: { healthy: false } }
```

### Pattern 3: Custom Logger
```javascript
const service = createAIService('quiz', 'premium', {
  logger: myLogger,
  apiKey: process.env.OPENAI_KEY
});
```

### Pattern 4: Testing with NoOp
```javascript
// Force NoOp for testing
const noOpService = createAIService('quiz', 'free', {
  forceNoOp: true
});
// All methods return { success: false, ... }
```

## Config Options

When creating a service, pass config object:
```javascript
createAIService('quiz', 'premium', {
  logger: myLoggerInstance,           // Optional
  apiKey: 'key-value',                // Optional
  featureOverrides: { quiz: false },  // Optional override
  forceNoOp: false                    // Force no-op for testing
})
```

## Tier Features
```javascript
TIER_FEATURES = {
  free: {
    quizGeneration: false,
    documentAnalysis: false,
    ragService: false,
    contentGeneration: false,
    advancedChat: false
  },
  premium: {
    quizGeneration: true,
    documentAnalysis: true,
    ragService: true,
    contentGeneration: true,
    advancedChat: true
  },
  enterprise: { /* all enabled */ }
}
```

## Supported Service Names
(Will be added as services are implemented)
- `quiz` - Quiz Generation
- `rag` - Retrieval-Augmented Generation
- `document` - Document Analysis
- `content` - Content Generation
- `chat` - Advanced Chat

## Error Handling

### Service Not Registered
Returns NoOp service with warning in logs

### Service Initialization Fails
NoOp returned, error logged, request continues gracefully

### Free Tier Access
Returns NoOp response, no error thrown

### Real Service Error
Propagates error, service marked unhealthy

## Testing Checklist
- [ ] Register all services in app startup
- [ ] Test creating service for each tier
- [ ] Verify free tier gets NoOp
- [ ] Verify premium tier gets real service
- [ ] Test error handling
- [ ] Check health status endpoint
- [ ] Verify caching works
- [ ] Test service initialization

## File Sizes
- base.service.js: 5.4 KB
- noop.service.js: 3.9 KB
- interfaces.js: 4.8 KB
- factory.js: 9.2 KB
- index.js: 0.6 KB
- EXAMPLE.js: 6.4 KB
- **Total: 30.3 KB**

All files are zero-dependency and use standard ES6 imports.
