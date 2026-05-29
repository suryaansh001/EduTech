# 🚀 Feature Flags Configuration System

## Quick Start

The feature flag system allows you to control which AI capabilities are available to users based on their subscription tier.

### Files Created

| File | Purpose |
|------|---------|
| `src/config/features.config.js` | Core configuration module |
| `.env` / `.env.example` | Environment variables for feature toggles |
| `FEATURE_FLAGS_USAGE.md` | Complete usage guide |
| `FEATURE_FLAGS_EXAMPLES.md` | Implementation code examples |

---

## 🎯 Key Concepts

### Features (5 AI Capabilities)
- **AI_CHAT_ENABLED** - AI-powered chat functionality
- **MCP_ENABLED** - Model Context Protocol integration
- **PINECONE_ENABLED** - Vector database (RAG) integration
- **QUIZ_GENERATION_ENABLED** - AI-powered quiz generation
- **DOCUMENT_ANALYSIS_ENABLED** - AI-powered document analysis

### Subscription Tiers
- **FREE** - No AI features
- **PREMIUM** - All AI features
- **ENTERPRISE** - All AI features (extensible)

### Configuration Priority
1. **Environment Variables** (highest) - Override everything
2. **Subscription Tier** (fallback) - Based on user's tier

---

## 📝 Usage

### Import the Module

```javascript
import {
  FEATURES,
  SUBSCRIPTION_TIERS,
  isFeatureEnabledForTier,
  getEnabledFeaturesForTier,
  getFeatureConfigurationSummary,
  logFeatureConfiguration
} from './config/features.config.js';
```

### Check if Feature is Enabled

```javascript
// Check for specific user tier
const enabled = isFeatureEnabledForTier('AI_CHAT_ENABLED', SUBSCRIPTION_TIERS.PREMIUM);

// Or with user object
const enabled = isFeatureEnabledForTier('AI_CHAT_ENABLED', user.subscriptionTier);
```

### Get All Features for a Tier

```javascript
const features = getEnabledFeaturesForTier(SUBSCRIPTION_TIERS.PREMIUM);
// Returns: { AI_CHAT_ENABLED: true, MCP_ENABLED: true, ... }
```

### Log Configuration

```javascript
logFeatureConfiguration();
// Outputs detailed feature status to console
```

---

## ⚙️ Environment Variables

Set in `.env` to enable/disable features globally:

```bash
AI_CHAT_ENABLED=true
MCP_ENABLED=true
PINECONE_ENABLED=true
QUIZ_GENERATION_ENABLED=true
DOCUMENT_ANALYSIS_ENABLED=true
```

- `true` = Feature enabled (overrides tier)
- `false` or unset = Feature disabled globally

---

## ��️ Middleware Protection

Protect routes with feature checks:

```javascript
import { requireFeature } from './middleware/features.middleware.js';
import { FEATURES } from './config/features.config.js';

router.post(
  '/api/ai-chat',
  authenticate,
  requireFeature(FEATURES.AI_CHAT_ENABLED),
  chatController
);
```

See `FEATURE_FLAGS_EXAMPLES.md` for complete middleware implementation.

---

## 🔌 Integration Steps

### Phase 1: Current (Ready Now)
- ✅ Feature flags defined
- ✅ Environment variables configured
- ✅ Utility functions exported
- ✅ Non-breaking for existing code

### Phase 2: Add Subscription Tier
```prisma
// Add to User model in prisma/schema.prisma
model User {
  id               String @id @default(cuid())
  subscriptionTier String @default("FREE") // FREE, PREMIUM, ENTERPRISE
  // ... rest of fields
}
```

### Phase 3: Implement Access Control
- Add middleware to routes that use AI features
- Use `requireFeature()` to protect endpoints
- Update error responses to indicate missing features

### Phase 4: Connect to Billing
- Sync tier with payment provider
- Automatic tier upgrades/downgrades
- Feature access tied to active subscription

---

## 📊 Current Status

| Feature | Status |
|---------|--------|
| Feature definitions | ✅ Implemented |
| Tier configurations | ✅ Implemented |
| Environment variables | ✅ Configured |
| Utility functions | ✅ Exported |
| Documentation | ✅ Complete |
| Middleware | 📋 Example provided |
| User model integration | ⏳ Next phase |
| Billing integration | ⏳ Future |

---

## 🧪 Testing

### Quick Test
```bash
cd backend
node -e "import('./src/config/features.config.js').then(m => m.default.logFeatureConfiguration())"
```

### With Environment Variables
```bash
AI_CHAT_ENABLED=true node src/config/features.config.js
```

See `FEATURE_FLAGS_EXAMPLES.md` for complete test suite examples.

---

## 📚 Documentation Files

- **`FEATURES_README.md`** (this file) - Overview and quick start
- **`FEATURE_FLAGS_USAGE.md`** - Complete usage guide with all configuration options
- **`FEATURE_FLAGS_EXAMPLES.md`** - Practical code examples for integration

---

## 🚨 Important Notes

1. **Non-Breaking**: Existing code continues to work unchanged
2. **Defaults**: Features default to enabled in development (via .env)
3. **Free Tier**: Currently shows features as disabled, but env vars override
4. **User Tier**: Must be added to User model before tier-based access works
5. **Environment Priority**: Env variables always override tier configuration

---

## 🔍 Troubleshooting

### Features showing as disabled?
- Check `.env` file has feature flags set to `true`
- Verify dotenv is loading environment variables
- Run: `logFeatureConfiguration()` to debug

### User always gets FREE tier features?
- Add `subscriptionTier` to User model (see Phase 2)
- Default tier is 'FREE' until database is updated
- Environment variables still override tier settings

### Need to disable a feature?
- Set in `.env`: `AI_CHAT_ENABLED=false`
- Or use tier configuration in `TIER_FEATURES`
- Environment variables take highest priority

---

## 📞 Support

For implementation help:
1. Check `FEATURE_FLAGS_EXAMPLES.md` for your use case
2. Review `FEATURE_FLAGS_USAGE.md` for detailed documentation
3. Run `logFeatureConfiguration()` to verify setup
4. Check that User model has `subscriptionTier` field

---

## 📋 Feature Matrix

| Feature | FREE | PREMIUM | ENTERPRISE |
|---------|------|---------|------------|
| AI Chat | ❌ | ✅ | ✅ |
| MCP | ❌ | ✅ | ✅ |
| Pinecone | ❌ | ✅ | ✅ |
| Quiz Generation | ❌ | ✅ | ✅ |
| Document Analysis | ❌ | ✅ | ✅ |

*Note: Env variables override this matrix. Currently all features default to enabled in dev.*

---

**Created:** 2024-05-29  
**Version:** 1.0.0  
**Status:** ✅ Ready for Integration
