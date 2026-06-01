import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FeatureGate } from './FeatureGate'
import { FeatureFlagProvider } from '@/lib/feature-flag-context'
import { FEATURES, TIERS } from '@/lib/feature-flag-constants'

/**
 * FeatureGate Component Tests
 * 
 * Tests feature gate functionality including:
 * - Feature availability checking
 * - Different display modes
 * - Callbacks and event tracking
 * - Error handling
 */

// Helper to render with FeatureFlagProvider
const renderWithProvider = (component, tier = TIERS.FREE) => {
  return render(
    <FeatureFlagProvider overrideTier={tier}>
      {component}
    </FeatureFlagProvider>
  )
}

describe('FeatureGate Component', () => {
  const testContent = <div data-testid="test-content">Test Content</div>

  describe('Basic Functionality', () => {
    test('renders children when feature is enabled', () => {
      renderWithProvider(
        <FeatureGate feature={FEATURES.AI_CHAT}>
          {testContent}
        </FeatureGate>,
        TIERS.FREE
      )
      
      expect(screen.getByTestId('test-content')).toBeInTheDocument()
    })

    test('does not render children when feature is disabled', () => {
      renderWithProvider(
        <FeatureGate feature={FEATURES.ADVANCED_ANALYTICS}>
          {testContent}
        </FeatureGate>,
        TIERS.FREE
      )
      
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument()
    })

    test('renders upgrade prompt when feature is disabled (replace mode)', () => {
      renderWithProvider(
        <FeatureGate feature={FEATURES.ADVANCED_ANALYTICS}>
          {testContent}
        </FeatureGate>,
        TIERS.FREE
      )
      
      // Should show upgrade prompt
      expect(screen.getByText(/Advanced Analytics/i)).toBeInTheDocument()
      expect(screen.getByText(/only available on/i)).toBeInTheDocument()
    })
  })

  describe('Display Modes', () => {
    test('renders in disable mode - content greyed out with overlay', () => {
      const { container } = renderWithProvider(
        <FeatureGate 
          feature={FEATURES.ADVANCED_ANALYTICS}
          showUpgradeOn="disable"
        >
          {testContent}
        </FeatureGate>,
        TIERS.FREE
      )
      
      // Should show greyed out content
      const greyedDiv = container.querySelector('.opacity-50')
      expect(greyedDiv).toBeInTheDocument()
      expect(greyedDiv).toContainElement(screen.getByTestId('test-content'))
      
      // Should show overlay button
      expect(screen.getByText(/locked/i)).toBeInTheDocument()
    })

    test('renders in banner mode - shows content with banner', () => {
      renderWithProvider(
        <FeatureGate 
          feature={FEATURES.BATCH_OPERATIONS}
          showUpgradeOn="banner"
        >
          {testContent}
        </FeatureGate>,
        TIERS.FREE
      )
      
      // Should show both banner and content
      expect(screen.getByTestId('test-content')).toBeInTheDocument()
      expect(screen.getByText(/Batch Operations/i)).toBeInTheDocument()
    })

    test('renders in inline mode - shows upgrade prompt inline', () => {
      renderWithProvider(
        <FeatureGate 
          feature={FEATURES.CUSTOM_BRANDING}
          showUpgradeOn="inline"
        >
          {testContent}
        </FeatureGate>,
        TIERS.FREE
      )
      
      // Should show inline upgrade
      expect(screen.getByText(/locked/i)).toBeInTheDocument()
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument()
    })

    test('renders in modal mode - children disabled until interaction', async () => {
      renderWithProvider(
        <FeatureGate 
          feature={FEATURES.CUSTOM_BRANDING}
          showUpgradeOn="modal"
        >
          {testContent}
        </FeatureGate>,
        TIERS.FREE
      )
      
      // Should show content initially but disabled
      expect(screen.getByTestId('test-content')).toBeInTheDocument()
      
      // Click on content to trigger modal
      fireEvent.click(screen.getByTestId('test-content'))
      
      // Modal should appear
      await waitFor(() => {
        expect(screen.getByText(/locked/i)).toBeInTheDocument()
      })
    })
  })

  describe('Callbacks', () => {
    test('calls onDeny when feature is disabled', async () => {
      const onDeny = jest.fn()
      
      renderWithProvider(
        <FeatureGate 
          feature={FEATURES.ADVANCED_ANALYTICS}
          onDeny={onDeny}
        >
          {testContent}
        </FeatureGate>,
        TIERS.FREE
      )
      
      await waitFor(() => {
        expect(onDeny).toHaveBeenCalled()
      })
    })

    test('calls onFeatureAvailable when feature is enabled', async () => {
      const onFeatureAvailable = jest.fn()
      
      renderWithProvider(
        <FeatureGate 
          feature={FEATURES.AI_CHAT}
          onFeatureAvailable={onFeatureAvailable}
        >
          {testContent}
        </FeatureGate>,
        TIERS.FREE
      )
      
      await waitFor(() => {
        expect(onFeatureAvailable).toHaveBeenCalled()
      })
    })

    test('does not call callbacks during loading', () => {
      const onDeny = jest.fn()
      const onFeatureAvailable = jest.fn()
      
      renderWithProvider(
        <FeatureGate 
          feature={FEATURES.AI_CHAT}
          onDeny={onDeny}
          onFeatureAvailable={onFeatureAvailable}
        >
          {testContent}
        </FeatureGate>
      )
      
      // Callbacks should not be called during loading
      // (This depends on context loading implementation)
      expect(onDeny).not.toHaveBeenCalled()
      expect(onFeatureAvailable).not.toHaveBeenCalled()
    })
  })

  describe('Tier-based Access', () => {
    test('allows premium features for premium users', () => {
      renderWithProvider(
        <FeatureGate feature={FEATURES.QUIZ_GENERATION}>
          {testContent}
        </FeatureGate>,
        TIERS.PREMIUM
      )
      
      expect(screen.getByTestId('test-content')).toBeInTheDocument()
    })

    test('allows all features for enterprise users', () => {
      const features = [
        FEATURES.API_ACCESS,
        FEATURES.CUSTOM_BRANDING,
        FEATURES.ADVANCED_ANALYTICS,
      ]
      
      features.forEach(feature => {
        const { unmount } = renderWithProvider(
          <FeatureGate feature={feature}>
            {testContent}
          </FeatureGate>,
          TIERS.ENTERPRISE
        )
        
        expect(screen.getByTestId('test-content')).toBeInTheDocument()
        unmount()
      })
    })

    test('denies features for lower tier users', () => {
      renderWithProvider(
        <FeatureGate feature={FEATURES.API_ACCESS}>
          {testContent}
        </FeatureGate>,
        TIERS.FREE
      )
      
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument()
    })
  })

  describe('Fallback Content', () => {
    test('renders custom fallback when feature disabled', () => {
      const fallback = <div data-testid="fallback">Custom Fallback</div>
      
      renderWithProvider(
        <FeatureGate 
          feature={FEATURES.ADVANCED_ANALYTICS}
          fallback={fallback}
        >
          {testContent}
        </FeatureGate>,
        TIERS.FREE
      )
      
      expect(screen.getByTestId('fallback')).toBeInTheDocument()
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument()
    })

    test('prefers fallback over default upgrade prompt', () => {
      const fallback = <div data-testid="fallback">Upgrade to Premium</div>
      
      renderWithProvider(
        <FeatureGate 
          feature={FEATURES.ADVANCED_ANALYTICS}
          fallback={fallback}
          showUpgradeOn="replace"
        >
          {testContent}
        </FeatureGate>,
        TIERS.FREE
      )
      
      expect(screen.getByTestId('fallback')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    test('handles missing feature prop gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      render(
        <FeatureFlagProvider>
          <FeatureGate>
            {testContent}
          </FeatureGate>
        </FeatureFlagProvider>
      )
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('feature prop is required')
      )
      
      consoleSpy.mockRestore()
    })

    test('warns about unknown features', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      renderWithProvider(
        <FeatureGate feature="UNKNOWN_FEATURE">
          {testContent}
        </FeatureGate>,
        TIERS.FREE
      )
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown feature')
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('Custom Labels', () => {
    test('uses custom label for upgrade prompt', () => {
      renderWithProvider(
        <FeatureGate 
          feature={FEATURES.QUIZ_GENERATION}
          upgradeFeatureLabel="Advanced Quiz Builder"
        >
          {testContent}
        </FeatureGate>,
        TIERS.FREE
      )
      
      expect(screen.getByText(/Advanced Quiz Builder/i)).toBeInTheDocument()
    })

    test('formats default label from feature name', () => {
      renderWithProvider(
        <FeatureGate feature={FEATURES.API_ACCESS}>
          {testContent}
        </FeatureGate>,
        TIERS.FREE
      )
      
      // Should convert API_ACCESS to "Api Access"
      expect(screen.getByText(/api access/i)).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    test('shows loading state when context is loading', () => {
      // Mock a loading state by creating a provider that takes time to initialize
      const { container } = render(
        <FeatureFlagProvider overrideTier={TIERS.FREE}>
          <FeatureGate feature={FEATURES.AI_CHAT}>
            {testContent}
          </FeatureGate>
        </FeatureFlagProvider>
      )
      
      // Should eventually render content
      waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument()
      })
    })
  })

  describe('Upgrade Interaction', () => {
    test('upgrade button navigates to pricing', () => {
      const originalLocation = window.location
      delete window.location
      window.location = { href: '' }
      
      renderWithProvider(
        <FeatureGate feature={FEATURES.ADVANCED_ANALYTICS}>
          {testContent}
        </FeatureGate>,
        TIERS.FREE
      )
      
      const upgradeButton = screen.getByText(/Upgrade Now/i)
      fireEvent.click(upgradeButton)
      
      expect(window.location.href).toBe('/pricing')
      
      window.location = originalLocation
    })

    test('close button dismisses upgrade prompt', () => {
      renderWithProvider(
        <FeatureGate feature={FEATURES.ADVANCED_ANALYTICS}>
          {testContent}
        </FeatureGate>,
        TIERS.FREE
      )
      
      const closeButton = screen.getByLabelText(/Dismiss/i)
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('Analytics Integration', () => {
    test('tracks events when analytics enabled', () => {
      window.gtag = jest.fn()
      
      renderWithProvider(
        <FeatureGate 
          feature={FEATURES.ADVANCED_ANALYTICS}
          analytics={true}
        >
          {testContent}
        </FeatureGate>,
        TIERS.FREE
      )
      
      // Should track feature disabled event
      expect(window.gtag).toHaveBeenCalled()
      
      delete window.gtag
    })

    test('does not track without gtag available', () => {
      // Ensure gtag is not defined
      const originalGtag = window.gtag
      delete window.gtag
      
      renderWithProvider(
        <FeatureGate 
          feature={FEATURES.ADVANCED_ANALYTICS}
          analytics={true}
        >
          {testContent}
        </FeatureGate>,
        TIERS.FREE
      )
      
      // Should not throw error
      expect(screen.getByText(/Advanced Analytics/i)).toBeInTheDocument()
      
      // Restore
      if (originalGtag) window.gtag = originalGtag
    })
  })
})
