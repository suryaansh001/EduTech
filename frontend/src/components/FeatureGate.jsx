'use client'

import React, { useCallback, useMemo } from 'react'
import { useFeatureFlag } from '@/lib/feature-flag-context'
import { FEATURES, TIERS, TIER_FEATURES } from '@/lib/feature-flag-constants'
import { UpgradePrompt } from './UpgradePrompt'

/**
 * FeatureGate Component
 * 
 * Wraps content and conditionally renders based on feature availability.
 * Shows upgrade prompt if feature is disabled.
 * 
 * @component
 * @example
 * // Basic usage - show upgrade modal when feature disabled
 * <FeatureGate feature="AI_CHAT">
 *   <AIChatInterface />
 * </FeatureGate>
 * 
 * @example
 * // Disable mode - show content but disabled with button
 * <FeatureGate 
 *   feature="ADVANCED_ANALYTICS"
 *   showUpgradeOn="disable"
 * >
 *   <AnalyticsPanel />
 * </FeatureGate>
 * 
 * @example
 * // Banner mode - show both content and banner
 * <FeatureGate 
 *   feature="BATCH_OPERATIONS"
 *   showUpgradeOn="banner"
 * >
 *   <BatchOperationsUI />
 * </FeatureGate>
 */
const FeatureGate = ({
  feature,
  children,
  fallback,
  onDeny,
  showUpgradeOn = 'replace',
  requiredTier,
  onFeatureAvailable,
  analytics = false,
  upgradeFeatureLabel,
}) => {
  const { isFeatureEnabled, userTier, isLoading } = useFeatureFlag()

  // Validate feature name
  if (!feature) {
    console.error('[FeatureGate] feature prop is required')
    return null
  }

  // Check if feature exists in constants
  const featureExists = Object.values(FEATURES).includes(feature)
  if (!featureExists) {
    console.warn(`[FeatureGate] Unknown feature: ${feature}. Make sure it's defined in FEATURES constants.`)
  }

  // Check if feature is enabled
  const isEnabled = isFeatureEnabled(feature)

  // Get minimum tier for this feature
  const minimumTier = useMemo(() => {
    if (requiredTier) return requiredTier
    
    for (const [tier, features] of Object.entries(TIER_FEATURES)) {
      if (features.includes(feature)) return tier
    }
    return TIERS.PREMIUM // Default to premium if not found
  }, [feature, requiredTier])

  // Track analytics if enabled
  const trackEvent = useCallback((event) => {
    if (analytics && window.gtag) {
      window.gtag('event', event, {
        feature_name: feature,
        user_tier: userTier,
        feature_accessible: isEnabled,
        minimum_tier: minimumTier,
      })
    }
  }, [analytics, feature, userTier, isEnabled, minimumTier])

  // Call onFeatureAvailable callback when feature becomes available
  React.useEffect(() => {
    if (isEnabled && onFeatureAvailable && !isLoading) {
      onFeatureAvailable()
    }
  }, [isEnabled, onFeatureAvailable, isLoading])

  // Call onDeny callback when feature is denied
  React.useEffect(() => {
    if (!isEnabled && onDeny && !isLoading) {
      trackEvent('feature_denied')
      onDeny()
    }
  }, [isEnabled, onDeny, isLoading, trackEvent])

  // Show loading state
  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading feature access...</div>
      </div>
    )
  }

  // Feature is enabled - render children
  if (isEnabled) {
    trackEvent('feature_enabled')
    return <>{children}</>
  }

  // Feature disabled - handle based on showUpgradeOn mode
  trackEvent('feature_disabled')

  const featureLabel = upgradeFeatureLabel || feature.replace(/_/g, ' ').toLowerCase()
  const featureCapitalized = featureLabel.charAt(0).toUpperCase() + featureLabel.slice(1)

  const upgradePromptProps = {
    feature: featureCapitalized,
    description: `This feature is only available on ${minimumTier.charAt(0).toUpperCase() + minimumTier.slice(1)} plans and above`,
    currentTier: userTier.charAt(0).toUpperCase() + userTier.slice(1),
    onUpgradeClick: () => {
      trackEvent('upgrade_clicked')
      window.location.href = '/pricing'
    },
    onClose: () => {
      trackEvent('upgrade_dismissed')
    },
  }

  // Replace mode: show upgrade prompt instead of content
  if (showUpgradeOn === 'replace') {
    return (
      <UpgradePrompt
        {...upgradePromptProps}
        variant="modal"
      />
    )
  }

  // Disable mode: show greyed out content with button overlay
  if (showUpgradeOn === 'disable') {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none opacity-50">
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-lg bg-black/20 backdrop-blur-sm">
          <div className="text-center text-white">
            <p className="font-semibold">{featureCapitalized} is locked</p>
            <p className="text-sm opacity-90">Upgrade to {minimumTier} to unlock</p>
          </div>
          <button
            onClick={() => {
              trackEvent('upgrade_clicked')
              window.location.href = '/pricing'
            }}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    )
  }

  // Banner mode: show content with banner above
  if (showUpgradeOn === 'banner') {
    return (
      <div className="space-y-4">
        <UpgradePrompt
          {...upgradePromptProps}
          variant="banner"
        />
        {children}
      </div>
    )
  }

  // Modal mode: children shown, modal appears on interaction
  if (showUpgradeOn === 'modal') {
    const [showModal, setShowModal] = React.useState(false)

    const handleInteraction = (e) => {
      if (!showModal) {
        e.preventDefault()
        e.stopPropagation()
        setShowModal(true)
        trackEvent('feature_interaction_denied')
      }
    }

    return (
      <>
        <div
          onClick={handleInteraction}
          onTouchStart={handleInteraction}
          className="cursor-not-allowed opacity-50"
        >
          {children}
        </div>
        {showModal && (
          <UpgradePrompt
            {...upgradePromptProps}
            variant="modal"
            onClose={() => {
              setShowModal(false)
              trackEvent('upgrade_dismissed')
            }}
          />
        )}
      </>
    )
  }

  // Inline mode: show inline upgrade prompt
  if (showUpgradeOn === 'inline') {
    return (
      <UpgradePrompt
        {...upgradePromptProps}
        variant="inline"
      />
    )
  }

  // Fallback: use custom fallback if provided
  if (fallback) {
    return fallback
  }

  // Default: show nothing
  return null
}

FeatureGate.displayName = 'FeatureGate'

export { FeatureGate }
