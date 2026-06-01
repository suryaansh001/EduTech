# AI Routes Feature Protection Test

## Overview
All AI routes have been wrapped with feature availability checks using the feature middleware. This document demonstrates the expected behavior and error responses.

## Protected AI Routes

### 1. **POST /api/ai/chat**
- **Feature Required:** `AI_CHAT_ENABLED`
- **Description:** General AI chat with conversation history
- **Middleware Chain:** `authenticate → requireFeature(AI_CHAT_ENABLED) → controller`

### 2. **POST /api/ai/quiz/create**
- **Feature Required:** `QUIZ_GENERATION_ENABLED`
- **Description:** Teacher creates quiz from natural language
- **Middleware Chain:** `authenticate → requireFeature(QUIZ_GENERATION_ENABLED) → controller`

### 3. **POST /api/ai/quiz/:quizId/analyze**
- **Feature Required:** `QUIZ_GENERATION_ENABLED`
- **Description:** Student analyzes quiz performance with AI
- **Middleware Chain:** `authenticate → requireFeature(QUIZ_GENERATION_ENABLED) → controller`

### 4. **GET /api/ai/documents/search**
- **Feature Required:** `DOCUMENT_ANALYSIS_ENABLED`
- **Description:** Search documents with semantic search
- **Middleware Chain:** `authenticate → requireFeature(DOCUMENT_ANALYSIS_ENABLED) → controller`

### 5. **POST /api/ai/documents/chat**
- **Feature Required:** `DOCUMENT_ANALYSIS_ENABLED`
- **Description:** Chat with uploaded documents (RAG)
- **Middleware Chain:** `authenticate → requireFeature(DOCUMENT_ANALYSIS_ENABLED) → controller`

### 6. **POST /api/ai/quiz/generate-questions**
- **Feature Required:** `QUIZ_GENERATION_ENABLED`
- **Description:** Generate quiz questions from content
- **Middleware Chain:** `authenticate → requireFeature(QUIZ_GENERATION_ENABLED) → controller`

### 7. **GET /api/ai/history/:userId**
- **Feature Required:** `AI_CHAT_ENABLED`
- **Description:** Get AI chat history
- **Middleware Chain:** `authenticate → requireFeature(AI_CHAT_ENABLED) → controller`

## Error Response Format

### Free Tier Access (402 Payment Required)
When a free tier user tries to access a feature:

```json
{
  "success": false,
  "message": "This feature is only available on Premium plan",
  "feature": "AI_CHAT_ENABLED",
  "currentTier": "FREE",
  "requiredTier": "PREMIUM",
  "upgradeUrl": "/pricing",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

**Status Code:** `402` (Payment Required)

### Other Tier Access Denial (403 Forbidden)
When a user on non-matching tier tries to access:

```json
{
  "success": false,
  "message": "This feature requires a higher subscription tier",
  "feature": "FEATURE_NAME",
  "currentTier": "ENTERPRISE",
  "requiredTier": "PREMIUM",
  "upgradeUrl": "/pricing",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

**Status Code:** `403` (Forbidden)

### Successful Access (200 OK)
When a premium or enterprise user accesses a feature:

Request proceeds normally to controller, which handles the business logic and returns appropriate response.

## Feature Availability by Tier

### FREE Tier
- ✗ AI_CHAT_ENABLED
- ✗ QUIZ_GENERATION_ENABLED
- ✗ DOCUMENT_ANALYSIS_ENABLED
- ✗ MCP_ENABLED
- ✗ PINECONE_ENABLED

### PREMIUM Tier
- ✓ AI_CHAT_ENABLED
- ✓ QUIZ_GENERATION_ENABLED
- ✓ DOCUMENT_ANALYSIS_ENABLED
- ✓ MCP_ENABLED
- ✓ PINECONE_ENABLED

### ENTERPRISE Tier
- ✓ All features enabled
- ✓ Custom features support

## Testing Guide

### Test 1: Free Tier User Access
```bash
# Setup: User with subscriptionTier = "FREE"
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Authorization: Bearer FREE_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Expected Response (402):
# {
#   "success": false,
#   "message": "This feature is only available on Premium plan",
#   "feature": "AI_CHAT_ENABLED",
#   "currentTier": "FREE",
#   "requiredTier": "PREMIUM",
#   "upgradeUrl": "/pricing"
# }
```

### Test 2: Premium Tier User Access
```bash
# Setup: User with subscriptionTier = "PREMIUM"
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Authorization: Bearer PREMIUM_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Expected Response (200):
# Normal controller response with chat completion
```

### Test 3: Unauthenticated Access
```bash
# No authentication token
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Expected Response (401):
# Handled by authenticate middleware before feature check
```

## Logging

Feature access checks are logged at different levels:

**DEBUG (Feature Granted):**
```
✅ Feature access granted: AI_CHAT_ENABLED for user 12345 (PREMIUM)
```

**WARN (Feature Denied):**
```
❌ Feature access denied: AI_CHAT_ENABLED for user 12345 (FREE)
```

**ERROR (Middleware Error):**
```
Error in requireFeature middleware: [error message]
```

## Implementation Details

### Route Protection Pattern
```javascript
router.post(
  '/chat',
  authenticate,                                    // Step 1: Verify user identity
  requireFeature(FEATURES.AI_CHAT_ENABLED),       // Step 2: Check feature access
  aiChatController.chat                            // Step 3: Execute controller
);
```

### Feature Middleware Behavior
1. **Authenticate Check:** Ensures `req.user` exists
2. **Tier Lookup:** Gets `req.user.subscriptionTier` (defaults to FREE)
3. **Feature Check:** Validates if feature is enabled for tier
4. **Allow/Deny:** 
   - Allows and proceeds if feature is enabled
   - Returns 402 (free tier) or 403 (other tier) if denied
5. **Metadata Attachment:** Adds `req.feature` object with access details

### Request Metadata (on success)
```javascript
req.feature = {
  name: 'AI_CHAT_ENABLED',
  enabled: true,
  tier: 'PREMIUM',
  checkedAt: '2024-01-15T10:30:45.123Z'
}
```

## Non-Breaking Changes

✓ **Backward Compatible:** All routes maintain same URL paths and HTTP methods
✓ **Additive Only:** Only adds middleware, doesn't modify existing logic
✓ **Transparent:** Free tier users see clear upgrade message, not cryptic errors
✓ **Maintained Auth:** Existing authentication flow unchanged

## Configuration Override

Features can be overridden via environment variables (takes precedence over tier config):

```bash
# Enable AI_CHAT for all tiers
AI_CHAT_ENABLED=true

# Disable QUIZ_GENERATION for all tiers  
QUIZ_GENERATION_ENABLED=false
```

## Feature Config Reference

**File:** `/backend/src/config/features.config.js`

Features defined:
- `AI_CHAT_ENABLED`: Chat and history features
- `QUIZ_GENERATION_ENABLED`: Quiz creation and analysis
- `DOCUMENT_ANALYSIS_ENABLED`: Document search and RAG
- `MCP_ENABLED`: MCP server access
- `PINECONE_ENABLED`: Pinecone vector DB access

**Middleware File:** `/backend/src/middleware/feature.middleware.js`

Available middleware functions:
- `requireFeature(featureName)`: Enforce feature access
- `requireAnyFeature(featureArray)`: OR logic - any one feature
- `trackFeatureUsage(featureName)`: Log without enforcing
- `attachFeatureInfo()`: Provide feature info helpers
- `rateLimitByTier()`: Apply tier-based rate limits
- `adminFeatureOverride()`: Allow admin bypass
