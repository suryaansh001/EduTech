"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useAuth } from "./auth-context"
import { DEFAULT_TIER, TIER_FEATURES } from "./feature-flag-constants"

/**
 * FeatureFlagContext
 * Manages feature flag state based on user tier
 * Provides feature checking utilities for conditional UI rendering
 */
const FeatureFlagContext = createContext(undefined)

/**
 * FeatureFlagProvider component
 * Wraps your app to provide feature flag context to all children
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {Object} [props.overrideTier] - Optional tier override for testing
 */
export function FeatureFlagProvider({ children, overrideTier = null }) {
  const { user, isLoading: authLoading } = useAuth()
  const [userTier, setUserTier] = useState(DEFAULT_TIER)
  const [enabledFeatures, setEnabledFeatures] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Determine the user's tier based on user data or override
  useEffect(() => {
    if (authLoading) {
      setIsLoading(true)
      return
    }

    // Use override tier if provided (useful for testing)
    if (overrideTier) {
      setUserTier(overrideTier)
      setEnabledFeatures(TIER_FEATURES[overrideTier] || [])
      setIsLoading(false)
      return
    }

    // Get tier from user object - assumes user has a 'tier' property
    // Falls back to DEFAULT_TIER if not found or user is not authenticated
    const tier = user?.tier || DEFAULT_TIER
    setUserTier(tier)
    setEnabledFeatures(TIER_FEATURES[tier] || [])
    setIsLoading(false)
  }, [user, authLoading, overrideTier])

  /**
   * Check if a specific feature is enabled for the current user
   * @param {string} featureName - Name of the feature to check
   * @returns {boolean} - True if feature is enabled, false otherwise
   */
  const isFeatureEnabled = useCallback(
    (featureName) => {
      if (!featureName) {
        console.warn("[FeatureFlag] isFeatureEnabled called with empty feature name")
        return false
      }
      return enabledFeatures.includes(featureName)
    },
    [enabledFeatures]
  )

  const value = {
    userTier,
    enabledFeatures,
    isFeatureEnabled,
    isLoading,
  }

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  )
}

/**
 * Hook to access feature flag context
 * Must be used within a FeatureFlagProvider
 * @returns {Object} Feature flag context value
 * @throws {Error} If used outside FeatureFlagProvider
 */
export const useFeatureFlag = () => {
  const context = useContext(FeatureFlagContext)
  if (context === undefined) {
    throw new Error(
      "useFeatureFlag must be used within a FeatureFlagProvider. " +
      "Make sure your component is wrapped with <FeatureFlagProvider>"
    )
  }
  return context
}
