# Feature Middleware Quick Reference

## Installation/Usage

```javascript
// In your route file
import { 
  requireFeature,           // Enforce feature access
  requireAnyFeature,        // OR logic for features
  trackFeatureUsage,        // Analytics without blocking
  attachFeatureInfo,        // Helper functions for routes
  rateLimitByTier,          // Rate limit by subscription tier
  adminFeatureOverride,     // Admin bypass
  requireFeatureWithOverride // Feature check with admin bypass
} from '../middleware/feature.middleware.js';

import { FEATURES } from '../config/features.config.js';
```

## Available Features
```
✅ AI_CHAT_ENABLED
✅ MCP_ENABLED
✅ PINECONE_ENABLED
✅ QUIZ_GENERATION_ENABLED
✅ DOCUMENT_ANALYSIS_ENABLED
```

## Available Tiers
```
FREE       - Basic access
PREMIUM    - All AI features + analytics
ENTERPRISE - All features + unlimited API
```

## Common Patterns

### Pattern 1: Basic Protection
```javascript
router.post('/feature', authenticate, requireFeature(FEATURES.AI_CHAT_ENABLED), handler);
```

### Pattern 2: With Rate Limiting
```javascript
router.post('/feature',
  authenticate,
  rateLimitByTier({ freeLimit: 5, premiumLimit: 100 }),
  requireFeature(FEATURES.AI_CHAT_ENABLED),
  handler
);
```

### Pattern 3: Conditional Features
```javascript
router.get('/endpoint', authenticate, attachFeatureInfo(), (req, res) => {
  if (req.isFeatureAvailable(FEATURES.AI_CHAT_ENABLED)) {
    // Include AI feature
  }
});
```

### Pattern 4: Admin Override
```javascript
router.post('/admin/test',
  authenticate,
  adminFeatureOverride(),
  requireFeatureWithOverride(FEATURES.AI_CHAT_ENABLED),
  handler
);
```

## Error Responses

### 402 Payment Required (Free Tier)
Feature not available on FREE plan → Upgrade to PREMIUM

### 403 Forbidden (Insufficient Tier)
Higher tier required than current subscription

### 401 Unauthorized
Authentication required before feature check

### 429 Too Many Requests
Rate limit exceeded for subscription tier

## Response Status Codes

| Middleware | Success | Auth Error | Feature Denied | Rate Limited |
|------------|---------|-----------|----------------|--------------|
| requireFeature | 200 | 401 | 402/403 | - |
| requireAnyFeature | 200 | 401 | 402/403 | - |
| trackFeatureUsage | 200 | 200 | 200 | - |
| attachFeatureInfo | 200 | 200 | 200 | - |
| rateLimitByTier | 200 | 200 | 200 | 429 |

## Middleware Execution Order

```
1. authenticate()              ← User must be logged in
2. adminFeatureOverride()      ← Check admin status (optional)
3. rateLimitByTier()           ← Rate limit by tier (optional)
4. requireFeature()            ← Check feature access (required for protection)
5. controller.handler()        ← Your route logic
```

## Attached to Request Object

### req.feature (from requireFeature/requireAnyFeature)
```javascript
{
  name: 'AI_CHAT_ENABLED',
  enabled: true,
  tier: 'PREMIUM',
  enabledFeatures: [...],      // Only with requireAnyFeature
  adminOverride: false,        // Only with requireFeatureWithOverride
  checkedAt: '2024-01-15T...'
}
```

### req.featureUsage (from trackFeatureUsage)
```javascript
{
  feature: 'AI_CHAT_ENABLED',
  userId: 'user123',
  tier: 'PREMIUM',
  enabled: true,
  accessedAt: '2024-01-15T...',
  method: 'POST',
  path: '/api/ai-chat/generate'
}
```

### req.tierInfo (from attachFeatureInfo)
```javascript
{
  tier: 'PREMIUM',
  isFree: false,
  isPremium: true,
  isEnterprise: false
}
```

### req.rateLimitInfo (from rateLimitByTier)
```javascript
{
  tier: 'PREMIUM',
  limit: 100,
  current: 45,
  remaining: 55
}
```

## Helper Functions (from attachFeatureInfo)

```javascript
// Check if specific feature available
req.isFeatureAvailable('AI_CHAT_ENABLED')  // → true/false

// Get all available features
req.getAvailableFeatures()
// → { AI_CHAT_ENABLED: true, MCP_ENABLED: true, ... }

// Check tier type
req.tierInfo.isFree        // → boolean
req.tierInfo.isPremium     // → boolean
req.tierInfo.isEnterprise  // → boolean
```

## Environment Variables for Overrides

```bash
# Force enable/disable features regardless of tier
AI_CHAT_ENABLED=true
MCP_ENABLED=true
PINECONE_ENABLED=true
QUIZ_GENERATION_ENABLED=true
DOCUMENT_ANALYSIS_ENABLED=true
```

## Logging

All feature middleware logs to Winston logger:
- **DEBUG** - Feature access granted
- **INFO** - Feature usage tracked, admin overrides
- **WARN** - Feature access denied
- **ERROR** - Middleware errors

View logs in:
- `logs/all.log` - All events
- `logs/error.log` - Errors only

## Performance
- ✅ O(1) feature lookup (constant time)
- ✅ No database calls
- ✅ ~1ms per middleware
- ✅ In-memory config only

## Common Mistakes

❌ **WRONG:** Using feature middleware before authentication
```javascript
router.post('/feature', requireFeature('FEATURE'), authenticate, handler);
```

✅ **CORRECT:** Authenticate first
```javascript
router.post('/feature', authenticate, requireFeature('FEATURE'), handler);
```

---

❌ **WRONG:** Not handling feature metadata in handlers
```javascript
router.post('/feature', authenticate, requireFeature('AI_CHAT'), (req, res) => {
  // req.feature is available but ignored
});
```

✅ **CORRECT:** Use feature info if needed
```javascript
router.post('/feature', authenticate, requireFeature('AI_CHAT'), (req, res) => {
  logger.info(`Using feature ${req.feature.name}`);
  // Handler logic
});
```

---

❌ **WRONG:** Hardcoding feature checks in handlers
```javascript
if (req.user.subscriptionTier === 'PREMIUM') { /* feature logic */ }
```

✅ **CORRECT:** Use middleware + helper functions
```javascript
// In middleware setup:
requireFeature('AI_CHAT'),

// Or use helper functions:
if (req.isFeatureAvailable('AI_CHAT_ENABLED')) { /* feature logic */ }
```

## Testing Checklist

- [ ] Test FREE tier gets 402
- [ ] Test PREMIUM tier gets access
- [ ] Test ENTERPRISE tier gets access
- [ ] Test missing authentication gets 401
- [ ] Test admin bypass works
- [ ] Test rate limiting kicks in
- [ ] Test feature metadata attached correctly
- [ ] Test logging includes user ID and feature name
- [ ] Test all error responses have upgrade URL
- [ ] Test environment variable overrides work

## File Locations

| File | Purpose |
|------|---------|
| `/backend/src/middleware/feature.middleware.js` | Main middleware implementation |
| `/backend/src/config/features.config.js` | Feature & tier configuration |
| `/backend/FEATURE_MIDDLEWARE_GUIDE.md` | Complete documentation |
| `/backend/FEATURE_MIDDLEWARE_EXAMPLES.js` | Route integration examples |
| `/backend/FEATURE_MIDDLEWARE_TESTS.js` | Test suite |

## Support Commands

```bash
# Test middleware syntax
node -c backend/src/middleware/feature.middleware.js

# Run tests
npm run test -- FEATURE_MIDDLEWARE_TESTS.js

# Check logs
tail -f logs/all.log | grep "Feature"

# View feature config
node -e "import('./backend/src/config/features.config.js').then(m => console.log(m.default))"
```

## Next Steps

1. ✅ Copy middleware file to your project
2. ✅ Review FEATURE_MIDDLEWARE_GUIDE.md
3. ✅ Use examples from FEATURE_MIDDLEWARE_EXAMPLES.js
4. ✅ Add feature protection to routes gradually
5. ✅ Test all tier scenarios
6. ✅ Monitor logs for access patterns
7. ✅ Update API documentation

## FAQ

**Q: Can I use multiple feature middleware?**
A: Yes! Use `requireAnyFeature()` for OR logic, or chain multiple `requireFeature()` calls.

**Q: What if a user upgrades mid-session?**
A: Token might need refresh. Feature check uses current `req.user.subscriptionTier` from auth.

**Q: Can I rate limit without enforcing features?**
A: Yes! Use `rateLimitByTier()` separately from `requireFeature()`.

**Q: How do I test feature middleware locally?**
A: Create users with different `subscriptionTier` values in test setup.

**Q: Can I customize error messages?**
A: Yes, modify the response messages in the middleware before returning.

**Q: What happens if feature config is missing?**
A: Feature defaults to disabled (safe default).
