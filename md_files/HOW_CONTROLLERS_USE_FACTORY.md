# How AI Controllers Will Use the Factory

## Simple Pattern: Same for All Tiers

Controllers no longer need tier checks. The factory handles routing automatically.

### Before (No Factory)
```javascript
// ❌ OLD WAY - Scattered tier logic throughout controller
import mcpService from '../services/mcp.service.js';

export const createQuiz = async (req, res) => {
  // Check if user has access
  if (req.user.tier !== 'PREMIUM' && req.user.tier !== 'ENTERPRISE') {
    return res.status(402).json({
      message: 'Feature requires Premium tier'
    });
  }

  // Call service
  const result = await mcpService.callTool(...);
  res.json(result);
};
```

### After (With Factory)
```javascript
// ✅ NEW WAY - Clean, simple, tier-agnostic
import { createAIService, SUBSCRIPTION_TIERS } from '../services/ai/index.js';

export const createQuiz = async (req, res) => {
  // Get user tier
  const userTier = req.user.subscriptionTier || SUBSCRIPTION_TIERS.FREE;

  // Create service (factory handles tier routing)
  const service = createAIService('mcp', userTier, { logger });

  // Use service (returns real or NoOp based on tier)
  const result = await service.callTool(...);

  // Handle response
  if (!result.success) {
    return res.status(402).json(result);  // Payment required for free tier
  }

  res.json({ success: true, data: result.data });
};
```

**Key Difference:**
- Factory creates the right service for the tier
- Same code works for all tiers
- NoOp service handles free tier rejection

---

## Pattern 1: Simple AI Feature

### Chat Endpoint
```javascript
import { createAIService, SUBSCRIPTION_TIERS } from '../services/ai/index.js';

export const chat = async (req, res) => {
  try {
    const userTier = req.user.subscriptionTier || SUBSCRIPTION_TIERS.FREE;
    const { message } = req.body;

    // Factory creates service for this tier
    const chatService = createAIService('chat', userTier, { logger });

    // Use it - works same for all tiers
    const result = await chatService.sendMessage({
      userId: req.user.id,
      message,
      classId: req.body.classId
    });

    // NoOp returns failure for free tier
    if (!result.success) {
      return res.status(402).json({
        ...result,
        requiresUpgrade: true
      });
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

**How it works:**
- FREE tier → NoOpAIService → returns `{ success: false, message: '...not available...' }`
- PREMIUM tier → ChatService → returns `{ success: true, data: {...} }`
- ENTERPRISE tier → ChatService → returns `{ success: true, data: {...} }`

---

## Pattern 2: With Feature Check (Optional)

### Quiz Generation
```javascript
import { 
  createAIService, 
  isServiceAvailable,
  SUBSCRIPTION_TIERS 
} from '../services/ai/index.js';

export const generateQuiz = async (req, res) => {
  try {
    const userTier = req.user.subscriptionTier || SUBSCRIPTION_TIERS.FREE;
    
    // OPTIONAL: Check feature availability upfront
    // (Better UX than waiting for NoOp response)
    if (!isServiceAvailable('quiz', userTier)) {
      return res.status(402).json({
        success: false,
        message: 'Quiz generation not available in your tier',
        requiresUpgrade: true,
        requiredTier: 'PREMIUM',
        currentTier: userTier,
        upgradeUrl: '/pricing'
      });
    }

    // Create service
    const quizService = createAIService('quiz', userTier, { logger });

    // Use service
    const result = await quizService.generateQuestions({
      content: req.body.content,
      count: req.body.count,
      difficulty: req.body.difficulty
    });

    res.json({ success: true, data: result.data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

**When to use this pattern:**
- You want to show upgrade prompt before attempting the operation
- Better user experience than error response
- Useful for premium features

---

## Pattern 3: Tier-Specific Configuration

### Advanced Analysis
```javascript
import { createAIService, SUBSCRIPTION_TIERS } from '../services/ai/index.js';

export const advancedAnalysis = async (req, res) => {
  const userTier = req.user.subscriptionTier || SUBSCRIPTION_TIERS.FREE;
  
  // Pass tier-specific config to service
  const analysisService = createAIService('document-analysis', userTier, {
    logger,
    // Tier-specific limits
    maxDocumentSize: userTier === SUBSCRIPTION_TIERS.ENTERPRISE ? '50MB' : '10MB',
    summaryLength: {
      min: 100,
      max: userTier === SUBSCRIPTION_TIERS.ENTERPRISE ? 2000 : 500
    }
  });

  const result = await analysisService.summarize({
    content: req.body.content,
    length: req.body.length
  });

  if (!result.success) {
    return res.status(402).json(result);
  }

  res.json({ success: true, data: result.data });
};
```

**Benefits:**
- Configure service differently per tier
- Enforce limits in service
- No duplicate code

---

## Pattern 4: Multiple Services in One Endpoint

### Combined Analysis
```javascript
import { createAIService, SUBSCRIPTION_TIERS } from '../services/ai/index.js';

export const comprehensiveAnalysis = async (req, res) => {
  const userTier = req.user.subscriptionTier || SUBSCRIPTION_TIERS.FREE;

  // Create multiple services
  const docService = createAIService('document-analysis', userTier, { logger });
  const ragService = createAIService('rag', userTier, { logger });
  const chatService = createAIService('chat', userTier, { logger });

  try {
    // Use all services in parallel
    const [summary, relevant, suggestions] = await Promise.all([
      docService.summarize(req.body.content),
      ragService.query(req.body.query),
      chatService.generateSuggestions(req.body.context)
    ]);

    // Check if all succeeded
    if (!summary.success || !relevant.success || !suggestions.success) {
      return res.status(402).json({
        success: false,
        message: 'Advanced features not available in your tier',
        requiresUpgrade: true
      });
    }

    res.json({
      success: true,
      data: {
        summary: summary.data,
        relevant: relevant.data,
        suggestions: suggestions.data
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

**Benefits:**
- Use multiple services together
- All get same tier
- Parallel processing
- Single tier check

---

## Pattern 5: Handling NoOp Responses

### Graceful Degradation
```javascript
import { createAIService, SUBSCRIPTION_TIERS } from '../services/ai/index.js';

export const smartFeature = async (req, res) => {
  const userTier = req.user.subscriptionTier || SUBSCRIPTION_TIERS.FREE;

  // Try AI-enhanced version
  const enhancedService = createAIService('ai-enhance', userTier, { logger });
  let response = await enhancedService.enhance(req.body.data);

  // If not available (free tier), use fallback
  if (!response.success) {
    // Provide basic version for free tier
    response = {
      success: true,
      data: basicVersion(req.body.data),
      message: 'Using basic mode. Upgrade for AI enhancement.',
      upgradeable: true
    };
  }

  res.json(response);
};

function basicVersion(data) {
  // Simple non-AI version
  return { ...data, enhanced: false };
}
```

**Benefits:**
- Free users get basic version
- Premium users get AI version
- No error, graceful degradation

---

## Integration Checklist for Each Controller

```javascript
// ✅ CHECKLIST FOR UPDATING CONTROLLERS

// 1. Update imports
// ❌ Remove: import mcpService from '../services/mcp.service.js'
// ✅ Add: import { createAIService, SUBSCRIPTION_TIERS } from '../services/ai/index.js'

// 2. Get user tier
// ✅ const userTier = req.user.subscriptionTier || SUBSCRIPTION_TIERS.FREE;

// 3. Create service
// ✅ const service = createAIService('service-name', userTier, { logger });

// 4. Use service
// ✅ const result = await service.methodName(args);

// 5. Handle response
// ✅ if (!result.success) {
//    return res.status(402).json(result);  // Payment required
//  }

// 6. Return success
// ✅ res.json({ success: true, data: result.data });
```

---

## Error Responses from Services

### Real Service (PREMIUM)
```javascript
// Success
{
  success: true,
  data: { ... }
}

// Error (actual service error)
{
  success: false,
  message: "Service error: ...",
  data: null
}
```

### NoOp Service (FREE)
```javascript
// Always failure (feature not available)
{
  success: false,
  message: "AI Chat is not available in your current tier. Upgrade to Premium to access this feature.",
  data: null
}
```

---

## How to Handle Different Responses

### Response Handler Pattern
```javascript
const result = await service.operation();

// All responses have .success
if (!result.success) {
  const statusCode = req.user.subscriptionTier === SUBSCRIPTION_TIERS.FREE 
    ? 402  // Payment required
    : 500; // Server error
  
  return res.status(statusCode).json({
    success: false,
    message: result.message,
    requiresUpgrade: req.user.subscriptionTier === SUBSCRIPTION_TIERS.FREE
  });
}

// All success responses have .data
res.json({
  success: true,
  data: result.data
});
```

---

## Summary: Three Simple Rules

1. **Get the tier**
   ```javascript
   const userTier = req.user.subscriptionTier || SUBSCRIPTION_TIERS.FREE;
   ```

2. **Create the service**
   ```javascript
   const service = createAIService('chat', userTier, { logger });
   ```

3. **Handle the response**
   ```javascript
   const result = await service.operation();
   if (!result.success) return res.status(402).json(result);
   res.json({ success: true, data: result.data });
   ```

**That's it!** The factory handles:
- ✅ Tier routing
- ✅ Feature flags
- ✅ Service selection
- ✅ NoOp fallback
- ✅ Caching

No more tier checks in controllers!

---

## Files to Update

Controllers that need updating:
- `backend/src/controllers/ai-chat.controller.js`
- `backend/src/controllers/quiz.controller.js` (if AI features)
- Other AI-related controllers

Each controller follows the same pattern:
1. Get tier
2. Create service
3. Handle response

All done in 3 lines of code!
