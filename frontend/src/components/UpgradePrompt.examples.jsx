/**
 * UpgradePrompt Component - Usage Examples
 * 
 * This file demonstrates how to use the UpgradePrompt component
 * in various scenarios throughout your application.
 */

import { useState } from 'react';
import { UpgradePrompt } from '@/components/UpgradePrompt';

// ============================================================================
// Example 1: Modal Variant - User tries to access AI Chat
// ============================================================================
export function AIChat() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userTier] = useState('Free');

  const handleAccessAIChat = () => {
    if (userTier === 'Free') {
      setShowUpgradeModal(true);
    } else {
      // Allow access to AI chat
    }
  };

  return (
    <div>
      <button onClick={handleAccessAIChat}>
        Open AI Chat
      </button>

      {showUpgradeModal && (
        <UpgradePrompt
          feature="AI Chat"
          description="Get instant answers from your AI tutor and receive personalized learning suggestions"
          currentTier={userTier}
          variant="modal"
          onUpgradeClick={() => {
            // Navigate to pricing page or open upgrade flow
            window.location.href = '/pricing';
          }}
          onClose={() => setShowUpgradeModal(false)}
          showBenefits={true}
          pricing={{
            price: '$9.99',
            frequency: 'per month',
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// Example 2: Banner Variant - Sticky notification for premium feature
// ============================================================================
export function AdvancedAnalytics() {
  const [dismissBanner, setDismissBanner] = useState(false);
  const [userTier] = useState('Basic');

  if (dismissBanner) {
    return null;
  }

  return (
    <>
      <UpgradePrompt
        feature="Advanced Analytics"
        description="Unlock detailed learning insights, progress tracking, and performance analytics"
        currentTier={userTier}
        variant="banner"
        onUpgradeClick={() => {
          // Open upgrade modal or navigate to pricing
          console.log('Opening upgrade flow...');
        }}
        onClose={() => setDismissBanner(true)}
      />

      <div className="p-6">
        {/* Your analytics content goes here */}
        <h1>Analytics Dashboard (Basic features only)</h1>
      </div>
    </>
  );
}

// ============================================================================
// Example 3: Inline Variant - Small notification near disabled button
// ============================================================================
export function CourseExport() {
  const [userTier] = useState('Free');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-6">
        <h2>My Courses</h2>
        <button
          disabled
          className="mt-4 opacity-50 cursor-not-allowed"
        >
          Export Course Materials
        </button>
      </div>

      {showUpgradePrompt && (
        <UpgradePrompt
          feature="Export to PDF"
          description="Download course materials and notes in PDF format for offline access"
          currentTier={userTier}
          variant="inline"
          onUpgradeClick={() => {
            window.location.href = '/pricing?feature=export';
          }}
          onClose={() => setShowUpgradePrompt(false)}
        />
      )}

      <button
        onClick={() => setShowUpgradePrompt(true)}
        className="text-sm text-blue-600 hover:underline"
      >
        Learn about PDF export
      </button>
    </div>
  );
}

// ============================================================================
// Example 4: Programmatic unlock based on feature flags
// ============================================================================
export function FeatureGate({ feature, children }) {
  const [userTier] = useState('Free');
  const [showUpgrade, setShowUpgrade] = useState(false);

  const premiumFeatures = ['ai-chat', 'advanced-analytics', 'export-pdf'];
  const isPremiumFeature = premiumFeatures.includes(feature);
  const hasAccess = userTier !== 'Free' || !isPremiumFeature;

  const featureDescriptions = {
    'ai-chat': 'Unlock AI-powered tutoring and personalized learning support',
    'advanced-analytics': 'Get detailed insights into your learning progress',
    'export-pdf': 'Download and export your course materials',
  };

  if (!hasAccess) {
    return (
      <>
        {showUpgrade ? (
          <UpgradePrompt
            feature={feature.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            description={featureDescriptions[feature]}
            currentTier={userTier}
            variant="inline"
            onUpgradeClick={() => {
              window.location.href = `/pricing?feature=${feature}`;
            }}
            onClose={() => setShowUpgrade(false)}
          />
        ) : (
          <div
            className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 text-center"
            onClick={() => setShowUpgrade(true)}
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setShowUpgrade(true);
              }
            }}
          >
            <p className="text-muted-foreground">
              🔒 This feature is locked. Click to learn more.
            </p>
          </div>
        )}
      </>
    );
  }

  return children;
}

// ============================================================================
// Example 5: Integration with hooks for reusable logic
// ============================================================================
export function useFeatureAccess() {
  const [userTier] = useState('Free');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(null);

  const checkAccess = (feature) => {
    const premiumFeatures = ['ai-chat', 'advanced-analytics', 'export-pdf'];
    const hasAccess = userTier !== 'Free' || !premiumFeatures.includes(feature);

    if (!hasAccess) {
      setCurrentFeature(feature);
      setShowUpgradePrompt(true);
      return false;
    }

    return true;
  };

  return {
    hasUpgradePrompt: showUpgradePrompt,
    currentFeature,
    checkAccess,
    closeUpgradePrompt: () => setShowUpgradePrompt(false),
  };
}

// Usage with hook:
export function DashboardWithHook() {
  const { hasUpgradePrompt, currentFeature, checkAccess, closeUpgradePrompt } = useFeatureAccess();

  const handleClickFeature = () => {
    if (checkAccess('ai-chat')) {
      // User has access, proceed with action
      console.log('Opening AI chat...');
    }
  };

  return (
    <div>
      <button onClick={handleClickFeature}>
        Use AI Chat
      </button>

      {hasUpgradePrompt && (
        <UpgradePrompt
          feature="AI Chat"
          description="Premium feature"
          currentTier="Free"
          variant="modal"
          onUpgradeClick={() => window.location.href = '/pricing'}
          onClose={closeUpgradePrompt}
        />
      )}
    </div>
  );
}
