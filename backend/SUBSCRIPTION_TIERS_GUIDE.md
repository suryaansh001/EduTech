# Subscription Tiers & Feature Access Guide

## Overview

The EduTech platform uses a subscription tier system to control feature access. This document explains how the system works, how to query feature access, and how to implement feature gates in your code.

## Subscription Tiers

### FREE Tier
- **Description:** Basic platform access, no AI features
- **Use Case:** Students learning core platform functionality
- **Available Features:** None (all AI features disabled)
- **Default For:** New users, students without subscription

### PREMIUM Tier
- **Description:** Full AI capabilities for enhanced learning
- **Use Case:** Students and teachers wanting AI-powered features
- **Available Features:**
  - AI_CHAT_ENABLED: AI chatbot for questions
  - MCP_ENABLED: Managed content platform
  - PINECONE_ENABLED: Vector database for semantic search
  - QUIZ_GENERATION_ENABLED: AI-generated quizzes
  - DOCUMENT_ANALYSIS_ENABLED: AI document analysis

### ENTERPRISE Tier
- **Description:** All features with custom configurations
- **Use Case:** Institutions, organizations, premium customers
- **Available Features:** All (same as PREMIUM + potential custom features)

## Database Schema

### User Model
```prisma
model User {
  subscriptionTier     SubscriptionTier  // Current tier: FREE, PREMIUM, ENTERPRISE
  featuresEnabled      Json?             // Cached feature flags for tier
  tierUpdatedAt        DateTime          // When tier was last changed
  userFeatureOverrides UserFeatureOverride[] // Per-user overrides
}
```

### FeatureAccess Model
Maps subscription tiers to available features. Defines the base tier configurations.

```prisma
model FeatureAccess {
  tier        SubscriptionTier  // FREE, PREMIUM, or ENTERPRISE
  featureName String            // Feature name from features.config.js
  enabled     Boolean           // Whether feature is enabled for tier
}
```

**Key Unique Constraint:** `@@unique([tier, featureName])`

### UserFeatureOverride Model
Allows temporary granting or revoking of features for individual users.

```prisma
model UserFeatureOverride {
  userId      String    // User ID
  featureName String    // Feature name
  enabled     Boolean   // true: grant, false: revoke
  expiresAt   DateTime? // Optional expiration (null = permanent)
}
```

## Feature Access Resolution

Feature access is determined by this precedence:

1. **Check UserFeatureOverride** (if exists and not expired)
   - Returns enabled/disabled override value
2. **Check FeatureAccess for tier** (if no override)
   - Returns enabled/disabled for user's subscription tier
3. **Default to false** (if not found in FeatureAccess)
   - Feature is disabled

### Query Flow Example

```
User has PREMIUM subscription and no overrides
  → Check UserFeatureOverride for AI_CHAT_ENABLED
    → None found
  → Check FeatureAccess where tier='PREMIUM' and featureName='AI_CHAT_ENABLED'
    → Found, enabled=true
  → Result: Feature is ENABLED
```

## Implementation Guide

### 1. Checking Feature Access in Code

#### Using features.config.js helper functions:

```javascript
import { isFeatureEnabledForTier } from '../config/features.config.js';

// Check if feature is enabled for a user's tier
const isEnabled = isFeatureEnabledForTier('AI_CHAT_ENABLED', user.subscriptionTier);

if (isEnabled) {
  // User has access to AI chat
}
```

#### Querying FeatureAccess directly:

```javascript
// Get all features for a tier
const tierFeatures = await prisma.featureAccess.findMany({
  where: {
    tier: 'PREMIUM',
    enabled: true
  },
  select: { featureName: true }
});

// Check specific feature
const feature = await prisma.featureAccess.findUnique({
  where: {
    tier_featureName: {
      tier: 'PREMIUM',
      featureName: 'AI_CHAT_ENABLED'
    }
  }
});
```

### 2. Checking User Feature Access (with overrides)

```javascript
async function isFeatureEnabledForUser(userId, featureName) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userFeatureOverrides: {
        where: {
          featureName,
          expiresAt: { gt: new Date() } // Not expired
        }
      }
    }
  });

  // Check user override first
  if (user.userFeatureOverrides.length > 0) {
    return user.userFeatureOverrides[0].enabled;
  }

  // Check tier access
  const tierAccess = await prisma.featureAccess.findUnique({
    where: {
      tier_featureName: {
        tier: user.subscriptionTier,
        featureName
      }
    }
  });

  return tierAccess?.enabled ?? false;
}
```

### 3. Granting Temporary Feature Access (Trial)

```javascript
// Grant AI_CHAT to free tier user for 30 days
await prisma.userFeatureOverride.create({
  data: {
    userId: user.id,
    featureName: 'AI_CHAT_ENABLED',
    enabled: true,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
});
```

### 4. Revoking Features

```javascript
// Revoke specific feature for user
await prisma.userFeatureOverride.create({
  data: {
    userId: user.id,
    featureName: 'AI_CHAT_ENABLED',
    enabled: false,
    expiresAt: null // Permanent
  }
});

// Or delete override to use tier defaults
await prisma.userFeatureOverride.deleteMany({
  where: {
    userId: user.id,
    featureName: 'AI_CHAT_ENABLED'
  }
});
```

### 5. Upgrading User Tier

```javascript
await prisma.user.update({
  where: { id: userId },
  data: {
    subscriptionTier: 'PREMIUM',
    tierUpdatedAt: new Date()
  }
});
```

## Middleware Implementation

### Express Middleware for Feature Gate

```javascript
export async function featureGateMiddleware(featureName) {
  return async (req, res, next) => {
    try {
      const user = req.user; // Assuming authenticated

      // Check feature access
      const hasAccess = await isFeatureEnabledForUser(user.id, featureName);

      if (!hasAccess) {
        return res.status(403).json({
          error: 'Feature not available for your subscription tier',
          tier: user.subscriptionTier,
          feature: featureName
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Usage in routes:
router.post('/api/ai-chat', featureGateMiddleware('AI_CHAT_ENABLED'), aiChatController);
```

## Database Queries & Indexes

### Efficient Queries for Common Operations

#### Get enabled features for user's tier
```sql
SELECT featureName FROM feature_access
WHERE tier = $1 AND enabled = true;
```

#### Get expired overrides to clean up
```sql
SELECT id FROM user_feature_overrides
WHERE expiresAt < NOW() AND expiresAt IS NOT NULL;
```

#### Get users by subscription tier
```sql
SELECT id, email, subscriptionTier FROM users
WHERE subscriptionTier = $1;
```

### Indexes
The schema includes optimized indexes:
- `User.subscriptionTier` - For filtering users by tier
- `FeatureAccess(tier)` - For tier-based feature lookups
- `FeatureAccess(tier, featureName)` - Primary lookup (unique)
- `UserFeatureOverride(userId)` - For user override lookups
- `UserFeatureOverride(expiresAt)` - For cleanup queries

## Seeding & Testing

### Seed Data
The default seed (`seed.js`) creates:
- **Admin** (ENTERPRISE tier)
- **Teacher** (PREMIUM tier)
- **Student** (FREE tier)
- **Premium Student** (PREMIUM tier)

All with corresponding FeatureAccess entries.

### Test Users
Run `seed-test.js` to create test users with various configurations:
```bash
npx prisma db seed -- --seed-test
```

Creates:
- Free tier student (with 7-day AI_CHAT trial)
- Premium tier student (with QUIZ_GENERATION revoked)
- Enterprise tier admin
- Free tier teacher
- Premium tier teacher

## Migration Notes

### Schema Changes
1. **User model:** Added `subscriptionTier`, `featuresEnabled`, `tierUpdatedAt`
2. **FeatureAccess model:** Defines tier-feature mappings
3. **UserFeatureOverride model:** User-specific feature overrides

### Backward Compatibility
- All new users default to FREE tier
- Existing users inherit ENTERPRISE tier (if migration includes UPDATE)
- No breaking changes to existing models

### Production Deployment
1. Run migration: `npx prisma migrate deploy`
2. Seed feature access: `npx prisma db seed`
3. Verify tier-based access working in staging
4. Monitor feature gate performance

## Troubleshooting

### Feature not appearing in query
- Check `FeatureAccess` table has entry for tier+feature
- Verify `enabled=true` for tier
- Check `UserFeatureOverride` not revoking it

### User override not working
- Verify `expiresAt` is null or in future
- Confirm `UserFeatureOverride` record exists
- Check override is for correct feature name

### Performance issues
- Use indexes for tier and feature name queries
- Consider caching tier configurations (low change frequency)
- Monitor `UserFeatureOverride` for expired entries

## API Examples

### Get user feature status
```bash
GET /api/users/{id}/features
Response:
{
  "tier": "PREMIUM",
  "features": {
    "AI_CHAT_ENABLED": true,
    "MCP_ENABLED": true,
    "PINECONE_ENABLED": true,
    "QUIZ_GENERATION_ENABLED": true,
    "DOCUMENT_ANALYSIS_ENABLED": true
  },
  "overrides": [
    {
      "featureName": "QUIZ_GENERATION_ENABLED",
      "enabled": false,
      "expiresAt": null
    }
  ]
}
```

### Upgrade user tier
```bash
PUT /api/users/{id}/tier
Body:
{
  "tier": "PREMIUM"
}
```

### Grant trial access
```bash
POST /api/users/{id}/features/trial
Body:
{
  "featureName": "AI_CHAT_ENABLED",
  "daysToGrant": 30
}
```

## Security Considerations

1. **Always verify server-side:** Never trust client-side tier information
2. **Audit overrides:** Log all feature override changes
3. **Expire trials:** Implement cleanup for expired overrides
4. **Rate limiting:** Apply stronger limits to premium-only features
5. **Data isolation:** Ensure queries filter by user ID + tier check

## References

- Schema: `/backend/prisma/schema.prisma`
- Feature Config: `/backend/src/config/features.config.js`
- Seed Scripts: `/backend/prisma/seed.js`, `/backend/prisma/seed-test.js`
