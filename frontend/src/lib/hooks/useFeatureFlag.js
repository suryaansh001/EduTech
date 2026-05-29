/**
 * useFeatureFlag hook
 * Custom hook for accessing and using feature flag context
 *
 * @returns {Object} Feature flag context with methods:
 *   - userTier {string} - Current user's tier (free, premium, enterprise)
 *   - enabledFeatures {string[]} - Array of enabled feature names
 *   - isFeatureEnabled {function} - Function to check if specific feature is enabled
 *   - isLoading {boolean} - Whether features are still loading
 *
 * @throws {Error} If used outside FeatureFlagProvider
 *
 * @example
 * // Basic usage - check if feature is enabled
 * function MyComponent() {
 *   const { isFeatureEnabled, userTier } = useFeatureFlag()
 *
 *   if (!isFeatureEnabled('AI_CHAT')) {
 *     return <UpgradePrompt />
 *   }
 *
 *   return <AIChatComponent />
 * }
 *
 * @example
 * // With loading state
 * function MyComponent() {
 *   const { isFeatureEnabled, isLoading } = useFeatureFlag()
 *
 *   if (isLoading) {
 *     return <Skeleton />
 *   }
 *
 *   return isFeatureEnabled('QUIZ_GENERATION') ? <Quiz /> : <LockedUI />
 * }
 */

export { useFeatureFlag } from "../feature-flag-context"
export { FEATURES, TIERS, TIER_FEATURES, DEFAULT_TIER } from "../feature-flag-constants"
