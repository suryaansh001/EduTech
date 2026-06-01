# AI Service Factory Integration Guide

## Overview

The AI Service Factory provides a centralized way to instantiate and manage AI services based on user subscription tiers and feature flags. It ensures graceful degradation by returning NoOp services when features are unavailable.

## Implementation Details

### Factory Architecture

```
Factory (factory.js)
├── Service Registry - Maps service names to implementations
├── Service Cache - Instances by tier (FREE, PREMIUM, ENTERPRISE)
├── Feature Mapping - Feature flags → Service names
└── Initialization Status - Tracks service health
```

### Key Features

1. **Tier-Based Routing**: Services automatically match user subscription level
2. **Feature Flags**: Features can be enabled/disabled via `features.config.js`
3. **Caching**: Service instances are cached per tier to avoid recreation
4. **NoOp Fallback**: Disabled features return NoOp services instead of errors
5. **Graceful Degradation**: Service failures don't crash the application
6. **Logging**: Comprehensive logging for debugging and monitoring

## Usage in Controllers

### Basic Usage

```javascript
// ai-chat.controller.js
import { 
  createAIService, 
  SUBSCRIPTION_TIERS 
} from '../services/ai/index.js';

export const chat = async (req, res) => {
  try {
    // Get user's subscription tier (from User model)
    const userTier = req.user.subscriptionTier || SUBSCRIPTION_TIERS.FREE;
    
    // Create service for this user
    const chatService = createAIService('chat', userTier, {
      logger: logger
    });
    
    // Use the service - will be NoOp if feature disabled
    const result = await chatService.sendMessage(req.body.message);
    
    if (!result.success) {
      return res.status(402).json({
        success: false,
        message: result.message,
        // Prompt upgrade if needed
        requiresUpgrade: true
      });
    }
    
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Chat error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### Advanced Usage with Config

```javascript
// quiz.controller.js
export const generateQuiz = async (req, res) => {
  const userTier = req.user.subscriptionTier || SUBSCRIPTION_TIERS.FREE;
  
  // Create service with custom configuration
  const quizService = createAIService('quiz', userTier, {
    logger: logger,
    apiKey: process.env.QUIZ_API_KEY,
    maxQuestions: userTier === SUBSCRIPTION_TIERS.ENTERPRISE ? 100 : 50
  });
  
  try {
    const questions = await quizService.generateQuestions({
      content: req.body.content,
      count: req.body.count
    });
    
    res.json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

## Service Registration

Services must be registered during application startup before they can be created by the factory.

### In App Initialization

```javascript
// app.js or services initialization file
import { registerService } from './services/ai/factory.js';
import { MCPService } from './services/mcp.service.js';
import { ChatServiceImpl } from './services/chat.service.js';

export async function initializeAIServices() {
  try {
    // Register all AI services
    registerService('mcp', MCPService);
    registerService('chat', ChatServiceImpl);
    registerService('quiz', QuizService);
    registerService('rag', RAGService);
    
    logger.info('AI Services registered successfully');
    
    // Pre-initialize services for performance
    await initializeServicesForTier(
      ['mcp', 'chat', 'quiz'],
      SUBSCRIPTION_TIERS.PREMIUM,
      { logger }
    );
    
    logger.info('AI Services initialized for Premium tier');
  } catch (error) {
    logger.error('Failed to initialize AI services:', error);
    // Application continues with NoOp fallbacks
  }
}

// Call before server starts
await initializeAIServices();
```

## Feature Flags

Features are defined in `/backend/src/config/features.config.js`:

```javascript
// Tier-based feature availability
TIER_FEATURES = {
  [SUBSCRIPTION_TIERS.FREE]: {
    [FEATURES.AI_CHAT_ENABLED]: false,
    [FEATURES.MCP_ENABLED]: false,
    [FEATURES.QUIZ_GENERATION_ENABLED]: false,
  },
  [SUBSCRIPTION_TIERS.PREMIUM]: {
    [FEATURES.AI_CHAT_ENABLED]: true,
    [FEATURES.MCP_ENABLED]: true,
    [FEATURES.QUIZ_GENERATION_ENABLED]: true,
  },
  [SUBSCRIPTION_TIERS.ENTERPRISE]: {
    [FEATURES.AI_CHAT_ENABLED]: true,
    [FEATURES.MCP_ENABLED]: true,
    [FEATURES.QUIZ_GENERATION_ENABLED]: true,
  }
};
```

## Environment Variable Overrides

Feature flags can be overridden via environment variables:

```bash
# Enable a feature for all tiers (development/testing)
AI_CHAT_ENABLED=true
MCP_ENABLED=true
QUIZ_GENERATION_ENABLED=true
```

## API Reference

### createAIService(serviceName, userTier, config)

Creates or retrieves a cached service instance.

```javascript
const service = createAIService(
  'chat',                          // Service name
  SUBSCRIPTION_TIERS.PREMIUM,      // User's tier
  { logger: myLogger }             // Config object
);
```

**Returns:** BaseAIService or NoOpAIService instance

### registerService(serviceName, ServiceClass)

Registers a service implementation with the factory.

```javascript
registerService('mcp', MCPService);
```

**Throws:** TypeError if ServiceClass doesn't extend BaseAIService

### initializeServicesForTier(serviceNames, tier, config)

Pre-initializes services for a specific tier on app startup.

```javascript
await initializeServicesForTier(
  ['chat', 'mcp'],
  SUBSCRIPTION_TIERS.PREMIUM,
  { logger }
);
```

**Returns:** Promise<Object> - Status of each service

### getServicesStatus(tier)

Gets health status of all services for a tier.

```javascript
const status = await getServicesStatus(SUBSCRIPTION_TIERS.PREMIUM);
// { chat: { healthy: true, ... }, mcp: { healthy: false, ... } }
```

### getInitializationStatus()

Gets factory initialization status and any errors.

```javascript
const status = getInitializationStatus();
// { initialized: true, services: {...}, errors: [...] }
```

### getRegisteredServices()

Lists all registered service names.

```javascript
const services = getRegisteredServices();
// ['mcp', 'chat', 'quiz', 'rag']
```

### isServiceAvailable(serviceName, tier)

Checks if a service is available for a tier.

```javascript
if (isServiceAvailable('mcp', SUBSCRIPTION_TIERS.PREMIUM)) {
  // Can use MCP service
}
```

### shutdownAllServices()

Gracefully shuts down all services on app termination.

```javascript
// On app shutdown
await shutdownAllServices();
```

### clearServiceCache(tier)

Clears cached instances (useful for testing).

```javascript
clearServiceCache(SUBSCRIPTION_TIERS.PREMIUM);
clearServiceCache(); // Clear all
```

## NoOp Service Behavior

When a feature is disabled or service unavailable, a NoOp service is returned that implements the same interface:

```javascript
const service = createAIService('chat', SUBSCRIPTION_TIERS.FREE);

// All methods return failure response
const result = await service.sendMessage('Hello');
// { 
//   success: false, 
//   message: 'Chat is not available in your current tier. Upgrade to Premium...',
//   data: null 
// }
```

## Error Handling

The factory implements graceful degradation:

1. **Service not registered** → Returns NoOp service + warning log
2. **Feature disabled** → Returns NoOp service + info log
3. **Service initialization fails** → Returns NoOp service + error log
4. **Shutdown errors** → Logs error but continues shutdown

## User Model Integration

The User model should include `subscriptionTier`:

```javascript
// User model (Prisma schema)
model User {
  id                String  @id @default(cuid())
  // ... other fields
  subscriptionTier  String  @default("FREE") // FREE, PREMIUM, ENTERPRISE
  // ... other fields
}
```

Then in middleware or authentication:

```javascript
// auth.middleware.js
req.user.subscriptionTier = user.subscriptionTier;
```

## Examples

### Example 1: AI Chat Controller

```javascript
export const chat = async (req, res) => {
  try {
    const userTier = req.user.subscriptionTier || SUBSCRIPTION_TIERS.FREE;
    const chatService = createAIService('chat', userTier, { logger });
    
    const response = await chatService.sendMessage(req.body.message);
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### Example 2: Quiz Generation with Tier Check

```javascript
export const generateQuiz = async (req, res) => {
  const userTier = req.user.subscriptionTier || SUBSCRIPTION_TIERS.FREE;
  
  // Check if feature available for this tier
  if (!isServiceAvailable('quiz', userTier)) {
    return res.status(402).json({
      success: false,
      message: 'Feature not available in your tier',
      requiresUpgrade: true
    });
  }
  
  const quizService = createAIService('quiz', userTier, { logger });
  const questions = await quizService.generateQuestions(req.body);
  
  res.json({ success: true, data: questions });
};
```

### Example 3: Monitoring

```javascript
export const getAIServiceStatus = async (req, res) => {
  const userTier = req.user.subscriptionTier;
  const status = await getServicesStatus(userTier);
  
  res.json({
    success: true,
    tier: userTier,
    services: status,
    factoryStatus: getInitializationStatus()
  });
};
```

## Remaining Integration Steps

1. **Update User Model**: Add `subscriptionTier` field
2. **Update Auth Middleware**: Set `req.user.subscriptionTier` on login
3. **Register Services**: Call `registerService()` for each AI service in app startup
4. **Update Controllers**: Replace direct service imports with factory usage
5. **Add Health Checks**: Include service status in health check endpoints
6. **Testing**: Write tests to verify tier-based behavior

## Notes

- Services are cached per tier - the same instance is reused
- Factory checks feature flags on every `createAIService()` call
- Initialization is not required for the factory to work (uses lazy initialization)
- NoOp services are always available for graceful degradation
- All operations are logged for debugging and monitoring
