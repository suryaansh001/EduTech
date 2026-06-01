# AI Service Factory - Code Reference

## Key Functions

### 1. Register Service
```javascript
import { registerService } from '../services/ai/factory.js';
import { ChatService } from '../services/chat.service.js';

// Register service on app startup
registerService('chat', ChatService);
```

**Validation:**
- ✓ Must extend BaseAIService
- ✓ Type checked on registration
- ✓ Logged for debugging

---

### 2. Create Service Instance
```javascript
import { createAIService, SUBSCRIPTION_TIERS } from '../services/ai/factory.js';

// Get user tier from request
const userTier = req.user.subscriptionTier || SUBSCRIPTION_TIERS.FREE;

// Create service (returns real or NoOp based on tier)
const service = createAIService('chat', userTier, { logger });

// Use service
const result = await service.sendMessage(message);
```

**Behavior:**
1. Validates tier (FREE/PREMIUM/ENTERPRISE)
2. Checks cache for existing instance
3. Checks feature flag for tier
4. Returns cached instance or creates new one
5. Returns NoOp if feature disabled

**Returns:** BaseAIService or NoOpAIService instance

---

### 3. Check Feature Availability
```javascript
import { isServiceAvailable, SUBSCRIPTION_TIERS } from '../services/ai/factory.js';

// Check if feature available before using
if (!isServiceAvailable('mcp', SUBSCRIPTION_TIERS.FREE)) {
  return res.status(402).json({ 
    requiresUpgrade: true,
    message: 'Upgrade to Premium'
  });
}

const service = createAIService('mcp', SUBSCRIPTION_TIERS.FREE);
```

---

### 4. Service Initialization
```javascript
import { 
  registerService, 
  initializeServicesForTier,
  SUBSCRIPTION_TIERS 
} from '../services/ai/factory.js';

// In app.js startup
async function initializeAI() {
  // Register services
  registerService('chat', ChatService);
  registerService('mcp', MCPService);
  registerService('quiz', QuizService);
  
  // Pre-initialize for performance
  const results = await initializeServicesForTier(
    ['chat', 'mcp', 'quiz'],
    SUBSCRIPTION_TIERS.PREMIUM,
    { logger }
  );
  
  // Results: { chat: { success: true }, ... }
  return results;
}

await initializeAI();
```

---

### 5. Health Checks
```javascript
import { getServicesStatus, SUBSCRIPTION_TIERS } from '../services/ai/factory.js';

// Get status of all services
const status = await getServicesStatus(SUBSCRIPTION_TIERS.PREMIUM);

// Returns: {
//   chat: { healthy: true, initialized: true, ... },
//   mcp: { healthy: false, ... }
// }
```

---

### 6. Cache Management
```javascript
import { clearServiceCache } from '../services/ai/factory.js';

// Clear cache for specific tier (useful for testing)
clearServiceCache(SUBSCRIPTION_TIERS.PREMIUM);

// Clear all caches
clearServiceCache();
```

---

## Controller Examples

### Example 1: Simple Chat Endpoint
```javascript
import { createAIService, SUBSCRIPTION_TIERS } from '../services/ai/index.js';

export const chat = async (req, res) => {
  try {
    const userTier = req.user.subscriptionTier || SUBSCRIPTION_TIERS.FREE;
    const { message } = req.body;

    // Create service for user's tier
    const service = createAIService('chat', userTier, { logger });

    // Use service (same interface for all tiers)
    const result = await service.sendMessage({
      userId: req.user.id,
      message
    });

    // Handle response (NoOp returns success:false for free tier)
    if (!result.success) {
      return res.status(402).json(result);
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### Example 2: With Feature Check
```javascript
import { 
  createAIService, 
  isServiceAvailable,
  SUBSCRIPTION_TIERS 
} from '../services/ai/index.js';

export const generateQuiz = async (req, res) => {
  const userTier = req.user.subscriptionTier || SUBSCRIPTION_TIERS.FREE;
  
  // Optional: Check upfront for better UX
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

### Example 3: Multiple Services
```javascript
export const advancedAnalysis = async (req, res) => {
  const userTier = req.user.subscriptionTier;
  
  // Create multiple services
  const docService = createAIService('document-analysis', userTier, { logger });
  const ragService = createAIService('rag', userTier, { logger });
  
  // Use them
  const summary = await docService.summarize(content);
  const relevant = await ragService.query(query);
  
  res.json({ summary, relevant });
};
```

---

## Feature Flag Configuration

Located in: `backend/src/config/features.config.js`

### Tier Configuration
```javascript
TIER_FEATURES = {
  FREE: {
    AI_CHAT_ENABLED: false,
    MCP_ENABLED: false,
    QUIZ_GENERATION_ENABLED: false,
  },
  PREMIUM: {
    AI_CHAT_ENABLED: true,
    MCP_ENABLED: true,
    QUIZ_GENERATION_ENABLED: true,
  },
  ENTERPRISE: {
    AI_CHAT_ENABLED: true,
    MCP_ENABLED: true,
    QUIZ_GENERATION_ENABLED: true,
  }
};
```

### Environment Overrides
```bash
# .env
AI_CHAT_ENABLED=true
MCP_ENABLED=true
QUIZ_GENERATION_ENABLED=true
```

---

## Error Handling

### Service Not Registered
```javascript
const service = createAIService('unknown-service', 'PREMIUM');
// Returns: NoOpAIService with warning log
// Logger: "Service 'unknown-service' not registered"
```

### Invalid Tier
```javascript
const service = createAIService('chat', 'INVALID');
// Returns: NoOpAIService (defaults to FREE)
// Logger: "Invalid user tier: INVALID. Defaulting to FREE"
```

### Service Initialization Fails
```javascript
// In initializeServicesForTier
// If service.initialize() throws, error is caught and logged
// Factory continues without crashing
```

---

## Constants

### Subscription Tiers
```javascript
import { SUBSCRIPTION_TIERS } from '../services/ai/factory.js';

// Available:
SUBSCRIPTION_TIERS.FREE        // 'FREE'
SUBSCRIPTION_TIERS.PREMIUM     // 'PREMIUM'
SUBSCRIPTION_TIERS.ENTERPRISE  // 'ENTERPRISE'
```

### Features
```javascript
import { FEATURES } from '../services/ai/factory.js';

// Available:
FEATURES.AI_CHAT_ENABLED               // 'AI_CHAT_ENABLED'
FEATURES.MCP_ENABLED                   // 'MCP_ENABLED'
FEATURES.PINECONE_ENABLED              // 'PINECONE_ENABLED'
FEATURES.QUIZ_GENERATION_ENABLED       // 'QUIZ_GENERATION_ENABLED'
FEATURES.DOCUMENT_ANALYSIS_ENABLED     // 'DOCUMENT_ANALYSIS_ENABLED'
```

---

## Testing

### Unit Test Example
```javascript
import { createAIService, SUBSCRIPTION_TIERS } from '../services/ai/factory.js';

describe('AI Service Factory', () => {
  it('returns NoOp for free tier', () => {
    const service = createAIService('chat', SUBSCRIPTION_TIERS.FREE);
    expect(service.constructor.name).toBe('NoOpAIService');
  });

  it('returns real service for premium', () => {
    const service = createAIService('chat', SUBSCRIPTION_TIERS.PREMIUM);
    expect(service.constructor.name).toBe('ChatService');
  });

  it('caches instances', () => {
    const s1 = createAIService('chat', SUBSCRIPTION_TIERS.PREMIUM);
    const s2 = createAIService('chat', SUBSCRIPTION_TIERS.PREMIUM);
    expect(s1).toBe(s2);
  });
});
```

---

## Debugging

### Check Registered Services
```javascript
import { getRegisteredServices } from '../services/ai/factory.js';

console.log(getRegisteredServices());
// Output: ['chat', 'mcp', 'quiz', 'rag']
```

### Check Initialization Status
```javascript
import { getInitializationStatus } from '../services/ai/factory.js';

const status = getInitializationStatus();
console.log(status);
// {
//   initialized: true,
//   services: {
//     'chat-PREMIUM': 'ready',
//     'mcp-PREMIUM': 'ready'
//   },
//   errors: [],
//   totalErrors: 0
// }
```

### Check Service Health
```javascript
const health = await getServicesStatus('PREMIUM');
console.log(health);
// {
//   chat: { healthy: true, initialized: true },
//   mcp: { healthy: false, message: 'Connection failed' }
// }
```

---

## Performance Notes

- **Cache Lookup**: O(1) - instant retrieval
- **Feature Check**: O(1) - property lookup in object
- **No Memory Overhead**: Only stores initialized services
- **Lazy Initialization**: Services created on first request

---

## Migration Checklist

- [ ] Update User model with `subscriptionTier` field
- [ ] Create database migration for new field
- [ ] Register all AI services in app.js
- [ ] Update auth middleware to set tier
- [ ] Update all AI controllers to use factory
- [ ] Test with different user tiers
- [ ] Verify NoOp responses for free tier
- [ ] Add health check endpoint
- [ ] Deploy and monitor logs

---

## Support

All factory code is located in:
- **Implementation**: `backend/src/services/ai/factory.js`
- **Exports**: `backend/src/services/ai/index.js`
- **Tests**: `test-factory.js` (run: `node test-factory.js`)

For questions, refer to:
- `AI_SERVICE_FACTORY_INTEGRATION.md` - Full guide
- `FACTORY_CONTROLLER_EXAMPLE.js` - Controller examples
- `AI_SERVICE_FACTORY_IMPLEMENTATION.md` - Architecture details
