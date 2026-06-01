# Feature Middleware Implementation Guide

## Overview
Express middleware for checking and enforcing feature availability on backend routes based on subscription tier.

## File Location
`/backend/src/middleware/feature.middleware.js`

## Key Features

### 1. **requireFeature(featureName)**
Enforces that a user has access to a specific feature based on their subscription tier.

**Returns:**
- ✅ Continues to next middleware if feature enabled
- 🔒 403 Forbidden if feature disabled on Premium/Enterprise tier
- 💳 402 Payment Required if user on Free tier

**Usage:**
```javascript
import { requireFeature } from '../middleware/feature.middleware.js';

router.post(
  '/ai-chat/generate',
  authenticate,
  requireFeature('AI_CHAT_ENABLED'),
  aiChatController.generate
);
```

**Response (Feature Disabled):**
```json
{
  "success": false,
  "message": "This feature is only available on Premium plan",
  "feature": "AI_CHAT_ENABLED",
  "currentTier": "FREE",
  "requiredTier": "PREMIUM",
  "upgradeUrl": "/pricing",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. **requireAnyFeature(featureArray)**
Requires user to have access to AT LEAST ONE of multiple features (OR logic).

**Use Case:** When routes support fallback features or multiple access paths.

**Usage:**
```javascript
router.post(
  '/analyze',
  authenticate,
  requireAnyFeature(['DOCUMENT_ANALYSIS_ENABLED', 'AI_CHAT_ENABLED']),
  analyzeController.process
);
```

**Response:**
```json
{
  "success": false,
  "message": "None of the requested features are available on your subscription tier",
  "features": ["DOCUMENT_ANALYSIS_ENABLED", "AI_CHAT_ENABLED"],
  "currentTier": "FREE",
  "requiredTier": "PREMIUM",
  "upgradeUrl": "/pricing"
}
```

### 3. **trackFeatureUsage(featureName)**
Tracks feature usage for analytics WITHOUT blocking access.

**Use Case:** Monitoring, usage analytics, free trial tracking.

**Features:**
- Logs usage without enforcing
- Doesn't block requests
- Attaches data to `req.featureUsage`

**Usage:**
```javascript
router.get(
  '/documents',
  optionalAuth,
  trackFeatureUsage('DOCUMENT_ANALYSIS_ENABLED'),
  documentsController.list
);
```

**Attached Data:**
```javascript
// Available in route handler as req.featureUsage
{
  feature: 'DOCUMENT_ANALYSIS_ENABLED',
  userId: 'user123',
  tier: 'PREMIUM',
  enabled: true,
  accessedAt: '2024-01-15T10:30:00.000Z',
  method: 'GET',
  path: '/api/documents'
}
```

### 4. **attachFeatureInfo()**
Attaches helper functions and tier information to request for use in route handlers.

**Provides:**
- `req.isFeatureAvailable(featureName)` - Check if feature available
- `req.getAvailableFeatures()` - Get all available features
- `req.tierInfo` - Tier information and boolean flags

**Usage:**
```javascript
router.get(
  '/dashboard',
  authenticate,
  attachFeatureInfo(),
  dashboardController.getDashboard
);

// In controller:
if (req.isFeatureAvailable('AI_CHAT_ENABLED')) {
  data.aiChatEnabled = true;
}

const features = req.getAvailableFeatures();
// {
//   AI_CHAT_ENABLED: true,
//   MCP_ENABLED: true,
//   PINECONE_ENABLED: true,
//   QUIZ_GENERATION_ENABLED: true,
//   DOCUMENT_ANALYSIS_ENABLED: true
// }

// Check tier
if (req.tierInfo.isPremium) {
  data.premiumFeatures = [...];
}
```

### 5. **rateLimitByTier(options)**
Rate limits requests based on subscription tier.

**Default Limits:**
- FREE: 10 requests/minute
- PREMIUM: 100 requests/minute
- ENTERPRISE: 1000 requests/minute

**Usage:**
```javascript
import { rateLimitByTier } from '../middleware/feature.middleware.js';

router.post(
  '/ai-chat/generate',
  authenticate,
  rateLimitByTier({
    freeLimit: 5,
    premiumLimit: 50,
    enterpriseLimit: 500
  }),
  requireFeature('AI_CHAT_ENABLED'),
  aiChatController.generate
);
```

**Response (Rate Limited):**
```json
{
  "success": false,
  "message": "Rate limit exceeded. Maximum 10 requests per minute for FREE tier",
  "tier": "FREE",
  "limit": 10,
  "retryAfter": 60,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Attached Data:**
```javascript
// Available as req.rateLimitInfo
{
  tier: "PREMIUM",
  limit: 100,
  current: 45,
  remaining: 55
}
```

### 6. **adminFeatureOverride()**
Allows admins to bypass all feature restrictions.

**Usage:**
```javascript
router.post(
  '/ai-chat/generate',
  authenticate,
  adminFeatureOverride(),           // Check for admin status
  requireFeatureWithOverride('AI_CHAT_ENABLED'),
  aiChatController.generate
);
```

**Behavior:**
- ADMIN and SUPER_ADMIN roles bypass feature checks
- Sets `req.adminOverride = true`
- Logs override for auditing

### 7. **requireFeatureWithOverride(featureName)**
Enhanced version of `requireFeature` that respects admin overrides.

**Usage:**
```javascript
router.post(
  '/premium-feature',
  authenticate,
  adminFeatureOverride(),
  requireFeatureWithOverride('PREMIUM_FEATURE'),
  controller.handler
);
```

## Available Features
From `/backend/src/config/features.config.js`:

```javascript
FEATURES = {
  AI_CHAT_ENABLED: 'AI_CHAT_ENABLED',
  MCP_ENABLED: 'MCP_ENABLED',
  PINECONE_ENABLED: 'PINECONE_ENABLED',
  QUIZ_GENERATION_ENABLED: 'QUIZ_GENERATION_ENABLED',
  DOCUMENT_ANALYSIS_ENABLED: 'DOCUMENT_ANALYSIS_ENABLED',
}
```

## Subscription Tiers
```javascript
SUBSCRIPTION_TIERS = {
  FREE: 'FREE',
  PREMIUM: 'PREMIUM',
  ENTERPRISE: 'ENTERPRISE',
}
```

## Tier Feature Matrix

| Feature | FREE | PREMIUM | ENTERPRISE |
|---------|------|---------|------------|
| AI_CHAT_ENABLED | ❌ | ✅ | ✅ |
| MCP_ENABLED | ❌ | ✅ | ✅ |
| PINECONE_ENABLED | ❌ | ✅ | ✅ |
| QUIZ_GENERATION_ENABLED | ❌ | ✅ | ✅ |
| DOCUMENT_ANALYSIS_ENABLED | ❌ | ✅ | ✅ |

## Integration Examples

### Example 1: Basic Feature Protection
```javascript
import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireFeature } from '../middleware/feature.middleware.js';

const router = express.Router();

router.post(
  '/ai-chat/generate',
  authenticate,
  requireFeature('AI_CHAT_ENABLED'),
  async (req, res) => {
    // Access feature metadata
    console.log(req.feature); // { name: 'AI_CHAT_ENABLED', enabled: true, ... }
    
    // Handler code here
  }
);

export default router;
```

### Example 2: Multiple Features with Fallback
```javascript
router.post(
  '/analyze-document',
  authenticate,
  requireAnyFeature(['DOCUMENT_ANALYSIS_ENABLED', 'AI_CHAT_ENABLED']),
  async (req, res) => {
    const enabledFeatures = req.feature.enabledFeatures;
    
    if (enabledFeatures.includes('DOCUMENT_ANALYSIS_ENABLED')) {
      // Use document analysis
    } else {
      // Fall back to AI chat
    }
  }
);
```

### Example 3: Conditional Feature Display
```javascript
router.get(
  '/dashboard',
  authenticate,
  attachFeatureInfo(),
  async (req, res) => {
    const data = {
      user: req.user,
      tier: req.tierInfo.tier,
      features: req.getAvailableFeatures()
    };

    // Include AI chat section only if available
    if (req.isFeatureAvailable('AI_CHAT_ENABLED')) {
      data.aiChatEnabled = true;
    }

    res.json({ success: true, data });
  }
);
```

### Example 4: Protected with Rate Limiting
```javascript
import { rateLimitByTier } from '../middleware/feature.middleware.js';

router.post(
  '/quiz-generate',
  authenticate,
  rateLimitByTier({
    freeLimit: 2,
    premiumLimit: 50
  }),
  requireFeature('QUIZ_GENERATION_ENABLED'),
  async (req, res) => {
    // Generate quiz
    res.json({
      success: true,
      data: quiz,
      rateLimitInfo: req.rateLimitInfo
    });
  }
);
```

### Example 5: Admin Override
```javascript
router.post(
  '/admin/test-premium-feature',
  authenticate,
  adminFeatureOverride(),
  requireFeatureWithOverride('AI_CHAT_ENABLED'),
  async (req, res) => {
    // Admins bypass feature checks
    res.json({ success: true });
  }
);
```

## Middleware Execution Order

**Important:** Feature middleware should run AFTER authentication middleware.

```javascript
router.post(
  '/protected-endpoint',
  authenticate,                    // 1. Authenticate user
  adminFeatureOverride(),          // 2. Check admin status (optional)
  rateLimitByTier(),               // 3. Rate limit (optional)
  requireFeature('FEATURE_NAME'),  // 4. Check feature access
  controller.handler               // 5. Route handler
);
```

## Error Responses

### 402 Payment Required (Free Tier)
```json
{
  "success": false,
  "message": "This feature is only available on Premium plan",
  "feature": "AI_CHAT_ENABLED",
  "currentTier": "FREE",
  "requiredTier": "PREMIUM",
  "upgradeUrl": "/pricing",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 403 Forbidden (Insufficient Tier)
```json
{
  "success": false,
  "message": "This feature requires a higher subscription tier",
  "feature": "PREMIUM_FEATURE",
  "currentTier": "PREMIUM",
  "requiredTier": "ENTERPRISE",
  "upgradeUrl": "/pricing",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 401 Unauthorized (Not Authenticated)
```json
{
  "success": false,
  "message": "Authentication required to access this feature",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 429 Too Many Requests (Rate Limited)
```json
{
  "success": false,
  "message": "Rate limit exceeded. Maximum 10 requests per minute for FREE tier",
  "tier": "FREE",
  "limit": 10,
  "retryAfter": 60,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Environment Variable Overrides
Features can be overridden via environment variables:

```bash
AI_CHAT_ENABLED=true
MCP_ENABLED=true
PINECONE_ENABLED=true
QUIZ_GENERATION_ENABLED=true
DOCUMENT_ANALYSIS_ENABLED=true
```

Environment variables take precedence over tier configurations.

## Logging
All feature middleware logs are emitted at different levels:

- **DEBUG:** Feature access granted
- **INFO:** Feature usage tracked, admin overrides
- **WARN:** Feature access denied, rate limits exceeded
- **ERROR:** Middleware errors

Access logs in:
- `logs/all.log` - All logs
- `logs/error.log` - Error-level logs only

## Performance
- **O(1) lookup:** Feature checks are constant time
- **No database calls:** All checks use in-memory config
- **Minimal overhead:** ~1ms per middleware

## Best Practices

1. **Always authenticate first** - Feature middleware requires `req.user`
2. **Order middleware correctly** - Auth → Admin Check → Rate Limit → Feature Check
3. **Use `attachFeatureInfo()` for dynamic content** - Instead of hardcoding tier checks
4. **Track usage for analytics** - Use `trackFeatureUsage()` on public endpoints
5. **Document required features** - Include in API documentation
6. **Test tier scenarios** - Verify all tier responses work correctly
7. **Use admin override for testing** - Don't bypass in production
8. **Monitor rate limit headers** - Communicate limits to clients

## Testing

### Test Free Tier Denials
```javascript
const freeUserToken = generateToken({ subscriptionTier: 'FREE' });
// Should get 402 with requireFeature
```

### Test Premium Access
```javascript
const premiumUserToken = generateToken({ subscriptionTier: 'PREMIUM' });
// Should pass through
```

### Test Admin Override
```javascript
const adminToken = generateToken({ role: 'ADMIN', subscriptionTier: 'FREE' });
// Should bypass feature checks with adminFeatureOverride
```

### Test Rate Limiting
```javascript
// Send 11 requests as free user
// 11th request should get 429
```

## Future Enhancements

1. **Redis-based rate limiting** - For distributed systems
2. **Trial period tracking** - Temporary feature access
3. **Usage quotas** - Storage limits, API call quotas
4. **Feature expiration** - Time-limited access
5. **A/B testing** - Beta features for specific users
6. **Audit logging** - Track all feature access
7. **Feature analytics** - Track adoption rates
