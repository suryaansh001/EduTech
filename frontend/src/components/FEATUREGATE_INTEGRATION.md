# FeatureGate Component Documentation

## Overview
`FeatureGate` is a lightweight, reusable React component wrapper that conditionally renders content based on feature availability. It integrates seamlessly with the existing `FeatureFlagContext` and provides multiple display modes for handling locked features.

## Quick Start

### Basic Usage
```jsx
import { FeatureGate } from '@/components/FeatureGate'
import { FEATURES } from '@/lib/feature-flag-constants'

// Show AI Chat only to users who have access
<FeatureGate feature={FEATURES.AI_CHAT}>
  <AIChatInterface />
</FeatureGate>
```

## Architecture

### Integration with Existing System
```
App.jsx
├── FeatureFlagProvider (context/feature-flag-context.jsx)
│   └── FeatureGate (component wrapper)
│       ├── Children (if feature enabled)
│       └── UpgradePrompt (if feature disabled)
```

### Context Usage
FeatureGate uses the `useFeatureFlag` hook internally:
- `isFeatureEnabled(featureName)` - Check if feature is available
- `userTier` - Current user's tier (free, premium, enterprise)
- `isLoading` - Whether auth context is loading

### Feature Checking
Features are defined in `feature-flag-constants.js`:
```javascript
FEATURES = {
  AI_CHAT: 'AI_CHAT',
  QUIZ_GENERATION: 'QUIZ_GENERATION',
  DOCUMENT_ANALYSIS: 'DOCUMENT_ANALYSIS',
  BATCH_OPERATIONS: 'BATCH_OPERATIONS',
  ADVANCED_ANALYTICS: 'ADVANCED_ANALYTICS',
  CUSTOM_BRANDING: 'CUSTOM_BRANDING',
  API_ACCESS: 'API_ACCESS',
}

TIER_FEATURES = {
  free: [AI_CHAT],
  premium: [AI_CHAT, QUIZ_GENERATION, DOCUMENT_ANALYSIS, BATCH_OPERATIONS],
  enterprise: [All features],
}
```

## Component Props

### Required Props
| Prop | Type | Description |
|------|------|-------------|
| `feature` | string | Feature name from FEATURES constants |
| `children` | React.ReactNode | Content to render if feature enabled |

### Optional Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fallback` | React.ReactNode | null | Custom fallback component when feature disabled |
| `onDeny` | function | null | Callback when user denies feature access |
| `showUpgradeOn` | string | 'replace' | Display mode: 'replace', 'disable', 'banner', 'modal', 'inline' |
| `requiredTier` | string | auto-detect | Override minimum tier requirement |
| `onFeatureAvailable` | function | null | Callback when feature becomes available |
| `analytics` | boolean | false | Enable Google Analytics tracking |
| `upgradeFeatureLabel` | string | auto-generated | Custom feature name for upgrade prompt |

## Display Modes

### 1. Replace Mode (default)
Shows a modal upgrade prompt instead of children.
```jsx
<FeatureGate feature="ADVANCED_ANALYTICS">
  <AnalyticsPanel />
</FeatureGate>
// Result: Modal popup with upgrade CTA
```

**Use case**: Features that require upgrade. User sees upgrade modal instead of content.

### 2. Disable Mode
Shows content but greyed out with overlay and unlock button.
```jsx
<FeatureGate 
  feature="ADVANCED_ANALYTICS"
  showUpgradeOn="disable"
>
  <AnalyticsPanel />
</FeatureGate>
// Result: Greyed content with "locked" overlay
```

**Use case**: Show users what they're missing. Teases premium features.

### 3. Banner Mode
Shows content with upgrade banner above it.
```jsx
<FeatureGate 
  feature="BATCH_OPERATIONS"
  showUpgradeOn="banner"
>
  <BatchOperationsUI />
</FeatureGate>
// Result: Content + notification banner
```

**Use case**: Show partial functionality. Upgrade notification doesn't block usage.

### 4. Modal Mode
Shows content but disabled. Modal appears on interaction.
```jsx
<FeatureGate 
  feature="CUSTOM_BRANDING"
  showUpgradeOn="modal"
>
  <BrandingUI />
</FeatureGate>
// Result: Content visible but non-interactive. Modal on click.
```

**Use case**: Interactive features. Prevent usage but don't block viewing.

### 5. Inline Mode
Shows inline upgrade prompt.
```jsx
<FeatureGate 
  feature="API_ACCESS"
  showUpgradeOn="inline"
>
  <APIDocumentation />
</FeatureGate>
// Result: Inline notification widget
```

**Use case**: Smaller features in forms or sidebars.

## Usage Patterns

### Pattern 1: Feature Availability Check with Callback
```jsx
const MyComponent = () => {
  const [featuresUnlocked, setFeaturesUnlocked] = useState(false)

  return (
    <FeatureGate 
      feature="AI_CHAT"
      onFeatureAvailable={() => setFeaturesUnlocked(true)}
      onDeny={() => setFeaturesUnlocked(false)}
    >
      <AIChatInterface />
    </FeatureGate>
  )
}
```

### Pattern 2: Custom Fallback for Better UX
```jsx
<FeatureGate 
  feature="ADVANCED_ANALYTICS"
  fallback={
    <Card className="text-center">
      <p>Analytics available on Premium</p>
      <Button onClick={() => window.location.href = '/pricing'}>
        View Plans
      </Button>
    </Card>
  }
>
  <AnalyticsPanel />
</FeatureGate>
```

### Pattern 3: Multiple Gates in Layout
```jsx
export default function Dashboard() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FeatureGate feature="AI_CHAT">
        <ChatWidget />
      </FeatureGate>
      
      <FeatureGate feature="ADVANCED_ANALYTICS" showUpgradeOn="disable">
        <AnalyticsSummary />
      </FeatureGate>
      
      <FeatureGate feature="BATCH_OPERATIONS" showUpgradeOn="banner">
        <BulkActions />
      </FeatureGate>
    </div>
  )
}
```

### Pattern 4: With Analytics Tracking
```jsx
<FeatureGate 
  feature="DOCUMENT_ANALYSIS"
  analytics={true}
  showUpgradeOn="disable"
>
  <DocumentAnalyzer />
</FeatureGate>
```

Tracks events:
- `feature_enabled` - User has access
- `feature_disabled` - Feature locked
- `feature_denied` - User denied access
- `upgrade_clicked` - User clicked upgrade
- `upgrade_dismissed` - User dismissed upgrade prompt

## Best Practices

### 1. Use Feature Constants
```jsx
// ✅ Good
import { FEATURES } from '@/lib/feature-flag-constants'
<FeatureGate feature={FEATURES.AI_CHAT}>

// ❌ Avoid
<FeatureGate feature="AI_CHAT">
```

### 2. Choose Appropriate Display Mode
- **replace**: Critical features requiring upgrade
- **disable**: Teaser features showing value
- **banner**: Features that add utility
- **modal**: Interactive-heavy features
- **inline**: Small, non-critical features

### 3. Provide Custom Fallback for Best UX
```jsx
// ✅ Better UX
<FeatureGate 
  feature="CUSTOM_BRANDING"
  fallback={<CustomBrandingUpsell />}
>
  <BrandingUI />
</FeatureGate>

// ⚠️ Default fallback is fine for simple cases
<FeatureGate feature="CUSTOM_BRANDING">
  <BrandingUI />
</FeatureGate>
```

### 4. Avoid Nested FeatureGates
```jsx
// ❌ Avoid nesting
<FeatureGate feature={FEATURES.AI_CHAT}>
  <FeatureGate feature={FEATURES.QUIZ_GENERATION}>
    <Content />
  </FeatureGate>
</FeatureGate>

// ✅ Use flat structure
<FeatureGate feature={FEATURES.AI_CHAT} showUpgradeOn="banner">
  <FeatureGate feature={FEATURES.QUIZ_GENERATION} showUpgradeOn="banner">
    <Content />
  </FeatureGate>
</FeatureGate>
```

### 5. Track Important Feature Denials
```jsx
const analyticsService = useAnalytics()

<FeatureGate 
  feature="ADVANCED_ANALYTICS"
  onDeny={() => {
    analyticsService.track('premium_feature_blocked', {
      feature: 'ADVANCED_ANALYTICS',
      tier: userTier,
    })
  }}
>
  <Analytics />
</FeatureGate>
```

## Error Handling

### Missing Feature Prop
```jsx
// ❌ Will log error and return null
<FeatureGate>
  <Content />
</FeatureGate>
// Error: [FeatureGate] feature prop is required
```

### Unknown Feature Name
```jsx
// ⚠️ Will log warning but render normally
<FeatureGate feature="UNKNOWN_FEATURE">
  <Content />
</FeatureGate>
// Warning: [FeatureGate] Unknown feature: UNKNOWN_FEATURE
```

### Missing FeatureFlagProvider
```jsx
// ❌ Will throw error
<FeatureGate feature="AI_CHAT">
  <Content />
</FeatureGate>
// Error: useFeatureFlag must be used within a FeatureFlagProvider
```

## Accessibility

FeatureGate ensures accessibility:
- Semantic HTML structure
- ARIA labels on buttons
- Keyboard navigation support
- Screen reader friendly
- Proper focus management

## Performance Considerations

### Lightweight Implementation
- No heavy dependencies
- Minimal re-renders (uses useCallback)
- Efficient feature checking
- Lazy loads upgrade prompt (only when needed)

### Optimization Tips
1. Use React.memo for frequently gated expensive components
```jsx
const ExpensiveComponent = React.memo(() => <HeavyUI />)

<FeatureGate feature="ADVANCED_ANALYTICS">
  <ExpensiveComponent />
</FeatureGate>
```

2. Separate gate for each feature to avoid unnecessary re-renders
```jsx
// ✅ Each feature gates independently
<div className="grid">
  <FeatureGate feature="AI_CHAT"><ChatUI /></FeatureGate>
  <FeatureGate feature="ANALYTICS"><AnalyticsUI /></FeatureGate>
</div>
```

## Testing

### Basic Test
```jsx
import { render, screen } from '@testing-library/react'
import { FeatureGate } from '@/components/FeatureGate'
import { FeatureFlagProvider } from '@/lib/feature-flag-context'
import { TIERS } from '@/lib/feature-flag-constants'

test('renders children for premium users', () => {
  render(
    <FeatureFlagProvider overrideTier={TIERS.PREMIUM}>
      <FeatureGate feature="QUIZ_GENERATION">
        <div>Quiz Generator</div>
      </FeatureGate>
    </FeatureFlagProvider>
  )
  
  expect(screen.getByText('Quiz Generator')).toBeInTheDocument()
})
```

### Test Different Modes
```jsx
test('disable mode shows greyed content', () => {
  const { container } = render(
    <FeatureFlagProvider overrideTier={TIERS.FREE}>
      <FeatureGate feature="API_ACCESS" showUpgradeOn="disable">
        <div>API Access</div>
      </FeatureGate>
    </FeatureFlagProvider>
  )
  
  expect(container.querySelector('.opacity-50')).toBeInTheDocument()
})
```

## File Structure
```
frontend/src/
├── components/
│   ├── FeatureGate.jsx                    # Main component
│   ├── FeatureGate.examples.jsx           # 8+ usage examples
│   ├── FeatureGate.test.jsx               # Jest tests
│   ├── UpgradePrompt.jsx                  # Related component
│   └── ...
├── lib/
│   ├── feature-flag-context.jsx           # Provides hooks
│   ├── feature-flag-constants.js          # Feature definitions
│   ├── auth-context.jsx                   # User tier info
│   └── ...
└── App.jsx                                # Must wrap with FeatureFlagProvider
```

## Common Issues & Solutions

### Issue: FeatureGate always shows upgrade
**Cause**: User tier not set correctly in auth context
**Solution**: Verify `user.tier` property exists in auth context

### Issue: Feature appears in wrong tier
**Cause**: Feature not added to TIER_FEATURES mapping
**Solution**: Update `feature-flag-constants.js` with correct tier

### Issue: Multiple upgrade prompts stacking
**Cause**: Multiple FeatureGates for same feature
**Solution**: Consolidate to single gate or use custom fallback

### Issue: Analytics not tracking
**Cause**: gtag not loaded or analytics prop not set
**Solution**: Set `analytics={true}` and ensure gtag is loaded

## Extending FeatureGate

### Custom Display Mode
```jsx
// Extend component to add custom mode
const CustomFeatureGate = (props) => {
  if (props.showUpgradeOn === 'custom') {
    return <YourCustomUI />
  }
  return <FeatureGate {...props} />
}
```

### Custom Upgrade Handler
```jsx
const handleUpgrade = () => {
  // Custom logic: open modal, start trial, etc.
  openUpgradeFlow()
}

<FeatureGate 
  feature="AI_CHAT"
  onDeny={() => handleUpgrade()}
>
  <Content />
</FeatureGate>
```

## Migration Guide

If migrating from direct feature checks to FeatureGate:

### Before (Direct Hook Usage)
```jsx
const MyComponent = () => {
  const { isFeatureEnabled } = useFeatureFlag()
  
  if (!isFeatureEnabled('AI_CHAT')) {
    return <UpgradePrompt feature="AI_CHAT" />
  }
  
  return <AIChatInterface />
}
```

### After (With FeatureGate)
```jsx
const MyComponent = () => {
  return (
    <FeatureGate feature={FEATURES.AI_CHAT}>
      <AIChatInterface />
    </FeatureGate>
  )
}
```

**Benefits**:
- Less boilerplate
- Consistent upgrade UX
- Better maintainability
- Built-in analytics

## Summary

FeatureGate is the recommended way to gate features in the frontend:
- ✅ Zero-config for basic use
- ✅ Works with existing context
- ✅ Multiple display modes
- ✅ Built-in accessibility
- ✅ Analytics tracking
- ✅ Lightweight and performant
- ✅ Fully tested
- ✅ Comprehensive examples
