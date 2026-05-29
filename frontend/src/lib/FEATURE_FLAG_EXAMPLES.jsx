/**
 * FEATURE FLAG USAGE EXAMPLES
 * 
 * This file demonstrates how to use the feature flag context and hooks
 * in your React components.
 */

// ============================================================================
// EXAMPLE 1: Basic Feature Check
// ============================================================================

import { useFeatureFlag, FEATURES } from "@/lib/hooks/useFeatureFlag"

function AIChatFeature() {
  const { isFeatureEnabled } = useFeatureFlag()

  if (!isFeatureEnabled(FEATURES.AI_CHAT)) {
    return (
      <div className="p-4 bg-yellow-100 rounded">
        AI Chat is not available on your current plan. Upgrade to use this feature.
      </div>
    )
  }

  return <AIChatComponent />
}

// ============================================================================
// EXAMPLE 2: Multiple Feature Checks
// ============================================================================

function AnalyticsSection() {
  const { isFeatureEnabled, userTier } = useFeatureFlag()
  const hasAnalytics = isFeatureEnabled(FEATURES.ADVANCED_ANALYTICS)
  const hasCustomBranding = isFeatureEnabled(FEATURES.CUSTOM_BRANDING)

  return (
    <div>
      <h2>Your Plan: {userTier}</h2>
      
      {hasAnalytics ? (
        <AnalyticsDashboard />
      ) : (
        <UpgradeCard feature="Advanced Analytics" />
      )}

      {hasCustomBranding && <BrandingSettings />}
    </div>
  )
}

// ============================================================================
// EXAMPLE 3: Loading State Handling
// ============================================================================

function FeatureGatedContent() {
  const { isFeatureEnabled, isLoading } = useFeatureFlag()

  if (isLoading) {
    return <Skeleton />
  }

  if (!isFeatureEnabled(FEATURES.DOCUMENT_ANALYSIS)) {
    return <LockedFeature />
  }

  return <DocumentAnalyzer />
}

// ============================================================================
// EXAMPLE 4: Conditional Rendering with All Features
// ============================================================================

import { Skeleton } from "@/components/ui/skeleton"

function ComplexFeatureComponent() {
  const { userTier, enabledFeatures, isFeatureEnabled, isLoading } = useFeatureFlag()

  if (isLoading) {
    return <Skeleton className="w-full h-96" />
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">
        Plan: <span className="font-semibold">{userTier}</span>
      </div>

      {isFeatureEnabled(FEATURES.QUIZ_GENERATION) && (
        <div>
          <h3>Quiz Generation</h3>
          <QuizGenerator />
        </div>
      )}

      {isFeatureEnabled(FEATURES.BATCH_OPERATIONS) && (
        <div>
          <h3>Batch Operations</h3>
          <BatchOperations />
        </div>
      )}

      {isFeatureEnabled(FEATURES.API_ACCESS) && (
        <div>
          <h3>API Access</h3>
          <ApiDocs />
        </div>
      )}

      {enabledFeatures.length === 0 && (
        <UpgradePrompt />
      )}
    </div>
  )
}

// ============================================================================
// EXAMPLE 5: Using in Custom Components
// ============================================================================

/**
 * Reusable component that only renders if feature is enabled
 * @param {string} featureName - Name of the feature to check
 * @param {React.ReactNode} children - Content to render if feature is enabled
 * @param {React.ReactNode} fallback - Content to show if feature is disabled
 */
function FeatureGate({ featureName, children, fallback = null }) {
  const { isFeatureEnabled, isLoading } = useFeatureFlag()

  if (isLoading) {
    return <Skeleton />
  }

  return isFeatureEnabled(featureName) ? children : fallback
}

// Usage:
function MyPage() {
  return (
    <FeatureGate
      featureName={FEATURES.AI_CHAT}
      fallback={<UpgradePrompt feature="AI Chat" />}
    >
      <AIChatInterface />
    </FeatureGate>
  )
}

// ============================================================================
// EXAMPLE 6: Styling/Disabling UI Based on Features
// ============================================================================

function QuizButton() {
  const { isFeatureEnabled } = useFeatureFlag()
  const isEnabled = isFeatureEnabled(FEATURES.QUIZ_GENERATION)

  return (
    <button
      disabled={!isEnabled}
      className={isEnabled ? "bg-blue-500" : "bg-gray-300 cursor-not-allowed"}
      title={isEnabled ? "Generate Quiz" : "Upgrade to generate quizzes"}
    >
      {isEnabled ? "Generate Quiz" : "Generate Quiz (Upgrade required)"}
    </button>
  )
}

// ============================================================================
// EXAMPLE 7: Testing with Override Tier
// ============================================================================

// In your test file or storybook:
import { FeatureFlagProvider } from "@/lib/feature-flag-context"
import { TIERS } from "@/lib/feature-flag-constants"

export function PremiumPlanStory() {
  return (
    <FeatureFlagProvider overrideTier={TIERS.PREMIUM}>
      <YourComponent />
    </FeatureFlagProvider>
  )
}

export function EnterprisePlanStory() {
  return (
    <FeatureFlagProvider overrideTier={TIERS.ENTERPRISE}>
      <YourComponent />
    </FeatureFlagProvider>
  )
}

// ============================================================================
// SUMMARY
// ============================================================================
/*
 * Key Points:
 * 
 * 1. Import the hook:
 *    import { useFeatureFlag, FEATURES } from "@/lib/hooks/useFeatureFlag"
 * 
 * 2. Use feature names from the FEATURES constant to avoid typos
 * 
 * 3. Always check isLoading when features are first fetched
 * 
 * 4. Use enabledFeatures array for advanced use cases
 * 
 * 5. Use userTier to show plan information to users
 * 
 * 6. The FeatureFlagProvider is already wrapped in App.jsx
 * 
 * 7. Features are determined by user tier from the auth context
 * 
 * 8. Use overrideTier prop for testing different plan levels
 */
