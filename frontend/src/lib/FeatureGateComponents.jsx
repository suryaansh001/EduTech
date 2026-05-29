/**
 * FeatureGate Component
 * A reusable component for conditional rendering based on feature flags
 * 
 * Useful for wrapping feature-dependent UI without cluttering your components
 */

import PropTypes from "prop-types"
import { useFeatureFlag } from "@/lib/hooks/useFeatureFlag"

/**
 * FeatureGate - Conditionally render content based on feature availability
 * 
 * @param {Object} props
 * @param {string} props.feature - Feature name to check (use FEATURES constant)
 * @param {ReactNode} props.children - Content to render if feature is enabled
 * @param {ReactNode} [props.fallback] - Content to show if feature is disabled
 * @param {boolean} [props.showLoading=true] - Show Skeleton while loading
 * 
 * @example
 * <FeatureGate feature={FEATURES.AI_CHAT} fallback={<UpgradePrompt />}>
 *   <AIChatInterface />
 * </FeatureGate>
 */
export function FeatureGate({ feature, children, fallback = null, showLoading = true }) {
  const { isFeatureEnabled, isLoading } = useFeatureFlag()

  if (isLoading && showLoading) {
    return <SkeletonLoader />
  }

  if (!isFeatureEnabled(feature)) {
    return fallback
  }

  return children
}

FeatureGate.propTypes = {
  feature: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  showLoading: PropTypes.bool,
}

/**
 * LockedFeature - Display when a feature is not available
 */
export function LockedFeature({ featureName = "This feature" }) {
  return (
    <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-center">
        <svg
          className="w-12 h-12 mx-auto mb-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Feature Locked</h3>
        <p className="text-sm text-gray-600 mb-4">
          {featureName} is not available on your current plan.
        </p>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
          Upgrade Plan
        </button>
      </div>
    </div>
  )
}

LockedFeature.propTypes = {
  featureName: PropTypes.string,
}

/**
 * SkeletonLoader - Placeholder while features are loading
 */
function SkeletonLoader() {
  return (
    <div className="space-y-4 p-4">
      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
    </div>
  )
}

/**
 * FeatureInfo - Display current user's tier and enabled features
 */
export function FeatureInfo() {
  const { userTier, enabledFeatures, isLoading } = useFeatureFlag()

  if (isLoading) {
    return <SkeletonLoader />
  }

  return (
    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">Your Plan</h4>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
        </span>
      </div>
      
      {enabledFeatures.length > 0 ? (
        <div>
          <p className="text-sm text-gray-600 mb-2">Enabled features:</p>
          <ul className="space-y-1">
            {enabledFeatures.map((feature) => (
              <li key={feature} className="flex items-center text-sm text-gray-700">
                <svg
                  className="w-4 h-4 mr-2 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          No features enabled. Upgrade to get started.
        </p>
      )}
    </div>
  )
}

/**
 * UpgradePrompt - Call-to-action for upgrading plans
 */
export function UpgradePrompt({ feature = "This feature" }) {
  return (
    <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
      <h4 className="font-semibold text-gray-900 mb-2">
        Unlock {feature}
      </h4>
      <p className="text-sm text-gray-600 mb-4">
        Upgrade your plan to access {feature.toLowerCase()} and more advanced features.
      </p>
      <div className="flex gap-3">
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700">
          View Plans
        </button>
        <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
          Learn More
        </button>
      </div>
    </div>
  )
}

UpgradePrompt.propTypes = {
  feature: PropTypes.string,
}
