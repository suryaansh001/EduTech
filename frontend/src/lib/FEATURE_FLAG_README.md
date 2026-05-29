# Feature Flag System

A lightweight React Context-based feature flag management system for EduTech. Enables conditional rendering of features based on user tier and permissions.

## Overview

The feature flag system provides:
- **Tier-based feature access** (Free, Premium, Enterprise)
- **Easy feature checking** via custom hooks
- **Loading state management** during feature initialization
- **Type-safe constants** for feature names and tiers
- **Testable architecture** with tier override support

## Architecture

```
lib/
├── feature-flag-context.jsx      # Main context and provider
├── feature-flag-constants.js     # Feature and tier definitions
└── hooks/
    ├── useFeatureFlag.js         # Hook for using the context
    └── index.js                  # Export barrel
```

## Quick Start

### 1. Use in Components

```jsx
import { useFeatureFlag, FEATURES } from "@/lib/hooks/useFeatureFlag"

function MyComponent() {
  const { isFeatureEnabled, userTier } = useFeatureFlag()

  if (!isFeatureEnabled(FEATURES.AI_CHAT)) {
    return <UpgradePrompt />
  }

  return <AIChatInterface />
}
```

### 2. Check Multiple Features

```jsx
function Dashboard() {
  const { isFeatureEnabled, enabledFeatures, userTier } = useFeatureFlag()

  return (
    <div>
      <p>Your Plan: {userTier}</p>
      {isFeatureEnabled(FEATURES.QUIZ_GENERATION) && <QuizBuilder />}
      {isFeatureEnabled(FEATURES.DOCUMENT_ANALYSIS) && <DocumentAnalyzer />}
    </div>
  )
}
```

### 3. Handle Loading State

```jsx
function FeatureSection() {
  const { isFeatureEnabled, isLoading } = useFeatureFlag()

  if (isLoading) {
    return <Skeleton />
  }

  return isFeatureEnabled(FEATURES.ADVANCED_ANALYTICS) ? (
    <AnalyticsDashboard />
  ) : (
    <LockedFeature />
  )
}
```

## API Reference

### Context Provider

```jsx
<FeatureFlagProvider>
  <App />
</FeatureFlagProvider>
```

**Props:**
- `children` (ReactNode): Child components
- `overrideTier` (string, optional): Override tier for testing

### useFeatureFlag Hook

```jsx
const { userTier, enabledFeatures, isFeatureEnabled, isLoading } = useFeatureFlag()
```

**Returns:**
- `userTier` (string): Current user's tier (`'free'`, `'premium'`, `'enterprise'`)
- `enabledFeatures` (array): List of enabled feature names
- `isFeatureEnabled(featureName)` (function): Check if feature is enabled
- `isLoading` (boolean): Whether features are still loading

**Throws:**
- Error if used outside `FeatureFlagProvider`

### Constants

```jsx
import { FEATURES, TIERS, TIER_FEATURES, DEFAULT_TIER } from "@/lib/hooks/useFeatureFlag"
```

**FEATURES:**
- `AI_CHAT` - AI chat functionality
- `QUIZ_GENERATION` - Quiz generation tool
- `DOCUMENT_ANALYSIS` - Document analysis features
- `BATCH_OPERATIONS` - Batch operations
- `ADVANCED_ANALYTICS` - Advanced analytics dashboard
- `CUSTOM_BRANDING` - Custom branding features
- `API_ACCESS` - API access for integrations

**TIERS:**
- `FREE` - Free tier
- `PREMIUM` - Premium tier
- `ENTERPRISE` - Enterprise tier

**TIER_FEATURES:**
```javascript
{
  'free': [FEATURES.AI_CHAT],
  'premium': [FEATURES.AI_CHAT, FEATURES.QUIZ_GENERATION, ...],
  'enterprise': [all features]
}
```

## Feature Tiers

| Feature | Free | Premium | Enterprise |
|---------|------|---------|-----------|
| AI Chat | ✅ | ✅ | ✅ |
| Quiz Generation | ❌ | ✅ | ✅ |
| Document Analysis | ❌ | ✅ | ✅ |
| Batch Operations | ❌ | ✅ | ✅ |
| Advanced Analytics | ❌ | ❌ | ✅ |
| Custom Branding | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ✅ |

## Integration with Auth Context

The feature flag system automatically reads the user's tier from the auth context:

```jsx
// The auth context should include a 'tier' property
{
  user: {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    tier: 'premium'  // ← Used by FeatureFlagProvider
  }
}
```

If no tier is found, defaults to `'free'`.

## Testing

### Override Tier in Tests/Storybook

```jsx
import { FeatureFlagProvider } from "@/lib/feature-flag-context"
import { TIERS } from "@/lib/feature-flag-constants"

export function PremiumPlanStory() {
  return (
    <FeatureFlagProvider overrideTier={TIERS.PREMIUM}>
      <MyComponent />
    </FeatureFlagProvider>
  )
}

export function EnterprisePlanStory() {
  return (
    <FeatureFlagProvider overrideTier={TIERS.ENTERPRISE}>
      <MyComponent />
    </FeatureFlagProvider>
  )
}
```

## Best Practices

1. **Use Feature Constants**: Always import and use `FEATURES` constants
   ```jsx
   // ✅ Good
   isFeatureEnabled(FEATURES.AI_CHAT)
   
   // ❌ Bad
   isFeatureEnabled('AI_CHAT')
   ```

2. **Check Loading State**: Always handle the loading state for better UX
   ```jsx
   if (isLoading) return <Skeleton />
   ```

3. **Provide Fallback UI**: Show upgrade prompts or locked UI when features aren't available
   ```jsx
   {isFeatureEnabled(feature) ? <Feature /> : <UpgradePrompt />}
   ```

4. **Extract to Components**: For reusable feature gates, create wrapper components
   ```jsx
   <FeatureGate feature={FEATURES.AI_CHAT} fallback={<Upgrade />}>
     <AIChatInterface />
   </FeatureGate>
   ```

5. **Update Tier Definitions**: When adding new tiers, update `feature-flag-constants.js`
   ```javascript
   [TIERS.PREMIUM]: [
     // Add new features here
   ]
   ```

## Adding New Features

1. Add to `FEATURES` in `feature-flag-constants.js`:
   ```javascript
   export const FEATURES = {
     // ...existing features
     MY_NEW_FEATURE: 'MY_NEW_FEATURE',
   }
   ```

2. Add to appropriate tiers in `TIER_FEATURES`:
   ```javascript
   [TIERS.PREMIUM]: [
     // ...existing features
     FEATURES.MY_NEW_FEATURE,
   ]
   ```

3. Use in components:
   ```jsx
   const { isFeatureEnabled } = useFeatureFlag()
   if (isFeatureEnabled(FEATURES.MY_NEW_FEATURE)) {
     return <MyNewFeature />
   }
   ```

## Examples

See `FEATURE_FLAG_EXAMPLES.jsx` for comprehensive usage examples including:
- Basic feature checks
- Multiple feature checks
- Loading state handling
- Complex conditional rendering
- Reusable FeatureGate component
- Testing with tier overrides

## Files Created

- `feature-flag-context.jsx` - Main context and provider component
- `feature-flag-constants.js` - Feature and tier definitions
- `hooks/useFeatureFlag.js` - Hook documentation and exports
- `hooks/index.js` - Barrel export for clean imports
- `FEATURE_FLAG_EXAMPLES.jsx` - Usage examples
- `FEATURE_FLAG_README.md` - This file

## Integration in App.jsx

The `FeatureFlagProvider` is already integrated in `App.jsx`:

```jsx
<ThemeProvider>
  <AuthProvider>
    <FeatureFlagProvider>  {/* Added */}
      <QuizProvider>
        <AppContent />
      </QuizProvider>
    </FeatureFlagProvider>
  </AuthProvider>
</ThemeProvider>
```

Place the provider **after** `AuthProvider` so it can read the user tier.

## Troubleshooting

### "useFeatureFlag must be used within a FeatureFlagProvider"

Make sure your component is wrapped with `FeatureFlagProvider` in the React tree.

### Features showing as enabled but shouldn't be

1. Check that the user's `tier` property is set correctly in the auth context
2. Verify the feature is assigned to the correct tier in `TIER_FEATURES`
3. Check if an `overrideTier` prop is interfering (used in testing)

### Loading state never completes

Ensure `AuthProvider` is loaded before `FeatureFlagProvider` in the component tree.
