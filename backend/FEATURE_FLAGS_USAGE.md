# Feature Flags Configuration Guide

## Overview

The feature flag system provides environment-based control over AI capabilities in EduTech. Features can be enabled/disabled globally via environment variables or per subscription tier.

## File Location

- **Configuration Module**: `src/config/features.config.js`
- **Environment Variables**: `.env` (development) / `.env.example` (template)

## Features Defined

| Feature | Description |
|---------|-------------|
| `AI_CHAT_ENABLED` | AI-powered chat functionality |
| `MCP_ENABLED` | Model Context Protocol integration |
| `PINECONE_ENABLED` | Vector database integration (RAG) |
| `QUIZ_GENERATION_ENABLED` | AI-powered quiz generation |
| `DOCUMENT_ANALYSIS_ENABLED` | AI-powered document analysis |

## Subscription Tiers

### FREE
- All AI features disabled
- Use case: Basic platform access only

### PREMIUM
- All AI features enabled
- Use case: Individual users and small teams

### ENTERPRISE
- All AI features enabled
- Use case: Organizations with custom requirements

## Configuration Priority

1. **Environment Variables** (highest priority)
   - Override all tier configurations
   - Set in `.env` file or deployment environment
   - Example: `AI_CHAT_ENABLED=true`

2. **Tier Configuration** (fallback)
   - Applied based on user's subscription tier
   - Defined in `TIER_FEATURES` object

## Usage Examples

### Check if Feature is Enabled for a User

```javascript
import { isFeatureEnabledForTier, SUBSCRIPTION_TIERS } from './config/features.config.js';

// Check if user with PREMIUM tier can use AI Chat
const canUseAIChat = isFeatureEnabledForTier('AI_CHAT_ENABLED', SUBSCRIPTION_TIERS.PREMIUM);

// Check for specific user tier from database
const userTier = user.subscriptionTier || SUBSCRIPTION_TIERS.FREE;
const hasPinecone = isFeatureEnabledForTier('PINECONE_ENABLED', userTier);
```

### Get All Enabled Features for a Tier

```javascript
import { getEnabledFeaturesForTier, SUBSCRIPTION_TIERS } from './config/features.config.js';

const premiumFeatures = getEnabledFeaturesForTier(SUBSCRIPTION_TIERS.PREMIUM);
// Returns: {
//   AI_CHAT_ENABLED: true,
//   MCP_ENABLED: true,
//   PINECONE_ENABLED: true,
//   QUIZ_GENERATION_ENABLED: true,
//   DOCUMENT_ANALYSIS_ENABLED: true
// }
```

### Check Configuration Summary

```javascript
import { getFeatureConfigurationSummary, logFeatureConfiguration } from './config/features.config.js';

// Log to console
logFeatureConfiguration();

// Get detailed summary
const config = getFeatureConfigurationSummary();
console.log(config.environment);  // Current env overrides
console.log(config.tiers);         // All tier configurations
```

## Environment Variables

Add to `.env` file to control features globally:

```bash
# Enable/disable features globally (overrides tier configuration)
AI_CHAT_ENABLED=true
MCP_ENABLED=true
PINECONE_ENABLED=true
QUIZ_GENERATION_ENABLED=true
DOCUMENT_ANALYSIS_ENABLED=true
```

### Setting Values

- `true` - Feature enabled
- `false` or not set - Feature disabled
- String comparison: `process.env.FEATURE_NAME === 'true'`

## Middleware Implementation Example

```javascript
// Example middleware for protecting AI features
export const requireFeature = (featureName) => {
  return (req, res, next) => {
    const userTier = req.user.subscriptionTier || 'FREE';
    
    if (!isFeatureEnabledForTier(featureName, userTier)) {
      return res.status(403).json({
        error: 'Feature not available for your subscription tier',
        feature: featureName,
        tier: userTier
      });
    }
    
    next();
  };
};

// Usage in routes
app.post('/api/ai-chat', requireFeature('AI_CHAT_ENABLED'), chatController);
```

## Migration Path

### Phase 1: Current State
- All features default to enabled in development
- Environment variables override everything
- No tier-based restrictions yet

### Phase 2: Add Tier to User Model
- Add `subscriptionTier` field to User schema
- Default to 'FREE' for existing users
- Implement tier-based access control

### Phase 3: Billing Integration
- Connect subscription tier to payment system
- Automatic tier upgrade/downgrade
- Feature access tied to active subscriptions

## Testing Feature Flags

```javascript
import { isFeatureEnabledForTier, FEATURES, SUBSCRIPTION_TIERS } from './config/features.config.js';

// Test each tier
Object.values(SUBSCRIPTION_TIERS).forEach(tier => {
  console.log(`\n${tier} Tier:`);
  Object.values(FEATURES).forEach(feature => {
    const enabled = isFeatureEnabledForTier(feature, tier);
    console.log(`  ${feature}: ${enabled}`);
  });
});
```

## Debugging

Enable debug logging:

```javascript
import { logFeatureConfiguration } from './config/features.config.js';

// Log current configuration
logFeatureConfiguration();
```

Output will show:
- All environment variable overrides
- Tier configurations for FREE, PREMIUM, ENTERPRISE
- Effective feature availability for each tier

## Future Enhancements

1. **Feature Usage Limits** - Rate limits per feature per tier
2. **Time-based Features** - Trial periods, feature previews
3. **Custom Tier Features** - Enterprise-specific features
4. **Feature Analytics** - Track which features users access
5. **A/B Testing** - Beta features for select users
