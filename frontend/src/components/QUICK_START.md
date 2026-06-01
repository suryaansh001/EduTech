/**
 * QUICK INTEGRATION GUIDE
 * 
 * This file shows the fastest way to integrate UpgradePrompt
 * into your existing components.
 */

// ============================================================================
// STEP 1: Import
// ============================================================================
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { useState } from 'react';


// ============================================================================
// STEP 2: Add state to your component
// ============================================================================
function MyComponent() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  
  // Your existing component code...
  return null;
}


// ============================================================================
// STEP 3: Wrap the feature
// ============================================================================
function AIChatFeature() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const userTier = 'Free'; // Get from context or API
  
  // If user doesn't have access, show upgrade prompt
  if (userTier === 'Free') {
    return (
      <UpgradePrompt
        feature="AI Chat"
        description="Get instant answers and personalized learning support"
        currentTier={userTier}
        variant="modal"  // or 'banner', 'inline'
        onUpgradeClick={() => window.location.href = '/pricing'}
        onClose={() => setShowUpgrade(false)}
      />
    );
  }
  
  // User has access, show feature
  return <AIChatWidget />;
}


// ============================================================================
// QUICK RECIPES
// ============================================================================

// 1. SIMPLE: Show inline prompt above disabled button
export function ExportButton() {
  const [show, setShow] = useState(false);
  const userTier = 'Free';
  
  if (show) {
    return (
      <>
        <UpgradePrompt
          feature="Export to PDF"
          currentTier={userTier}
          variant="inline"
          onUpgradeClick={() => alert('Go to pricing')}
          onClose={() => setShow(false)}
        />
        <button disabled>Export (Premium)</button>
      </>
    );
  }
  
  return <button onClick={() => setShow(true)}>Export</button>;
}

// 2. CONDITIONAL: Show modal only if user tries to access
export function AnalyticsPage() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const userTier = 'Free';
  const canView = userTier !== 'Free';
  
  return (
    <div>
      {showUpgrade && (
        <UpgradePrompt
          feature="Advanced Analytics"
          description="Detailed insights into your learning progress"
          currentTier={userTier}
          variant="modal"
          onUpgradeClick={() => location.href = '/pricing'}
          onClose={() => setShowUpgrade(false)}
        />
      )}
      
      {canView ? (
        <AnalyticsWidget />
      ) : (
        <button onClick={() => setShowUpgrade(true)}>
          View Analytics (Premium)
        </button>
      )}
    </div>
  );
}

// 3. FEATURE GATE: Reusable wrapper component
export function PremiumFeature({ children, feature, tier }) {
  const [show, setShow] = useState(false);
  const premiumFeatures = ['ai-chat', 'analytics', 'export'];
  const isPremium = premiumFeatures.includes(feature);
  const hasAccess = tier !== 'Free' || !isPremium;
  
  if (!hasAccess) {
    return show ? (
      <UpgradePrompt
        feature={feature}
        currentTier={tier}
        variant="inline"
        onUpgradeClick={() => location.href = '/pricing'}
        onClose={() => setShow(false)}
      />
    ) : (
      <div onClick={() => setShow(true)} style={{ cursor: 'pointer' }}>
        🔒 Premium feature - click to upgrade
      </div>
    );
  }
  
  return children;
}

// Usage:
// <PremiumFeature feature="ai-chat" tier={userTier}>
//   <AIChatWidget />
// </PremiumFeature>


// ============================================================================
// VARIANTS AT A GLANCE
// ============================================================================

export const VariantExamples = {
  // Modal: Full overlay, best for major features
  modal: (
    <UpgradePrompt
      variant="modal"
      feature="Premium Feature"
      description="Unlock premium capabilities"
      currentTier="Free"
      onUpgradeClick={() => console.log('upgrade')}
      onClose={() => console.log('close')}
    />
  ),
  
  // Banner: Sticky bar, best for top-level sections
  banner: (
    <UpgradePrompt
      variant="banner"
      feature="Analytics"
      currentTier="Free"
      onUpgradeClick={() => console.log('upgrade')}
    />
  ),
  
  // Inline: Compact box, best for buttons/features
  inline: (
    <UpgradePrompt
      variant="inline"
      feature="Export"
      currentTier="Free"
      onUpgradeClick={() => console.log('upgrade')}
    />
  ),
};


// ============================================================================
// REAL-WORLD EXAMPLES
// ============================================================================

// AI Chat Feature
export function ChatPage() {
  const [show, setShow] = useState(false);
  const userTier = localStorage.getItem('tier') || 'Free';
  
  if (userTier === 'Free') {
    return show ? (
      <UpgradePrompt
        feature="AI Chat"
        description="Chat with our AI tutor for instant help"
        currentTier={userTier}
        variant="modal"
        showBenefits
        pricing={{ price: '$9.99', frequency: 'per month' }}
        onUpgradeClick={() => window.location.href = '/pricing?feature=ai-chat'}
        onClose={() => setShow(false)}
      />
    ) : (
      <button onClick={() => setShow(true)}>
        Open Chat (Premium)
      </button>
    );
  }
  
  return <ChatWidget />;
}

// Analytics Dashboard
export function AnalyticsDashboard() {
  const [dismiss, setDismiss] = useState(false);
  const userTier = 'Basic'; // Basic plan has limited analytics
  
  return (
    <>
      {!dismiss && userTier === 'Basic' && (
        <UpgradePrompt
          feature="Advanced Analytics"
          description="Unlock detailed insights and performance metrics"
          currentTier={userTier}
          variant="banner"
          onUpgradeClick={() => window.location.href = '/pricing'}
          onClose={() => setDismiss(true)}
        />
      )}
      <DashboardContent />
    </>
  );
}

// Course Export
export function CourseActions() {
  const [show, setShow] = useState(false);
  const userTier = 'Free';
  
  return (
    <div>
      <button>Download (Free)</button>
      <button
        disabled={userTier === 'Free'}
        onClick={() => userTier === 'Free' ? setShow(true) : exportPDF()}
      >
        Export as PDF
      </button>
      
      {show && (
        <UpgradePrompt
          feature="Export to PDF"
          description="Download your course materials in PDF format"
          currentTier={userTier}
          variant="inline"
          onUpgradeClick={() => window.location.href = '/pricing'}
          onClose={() => setShow(false)}
        />
      )}
    </div>
  );
}


// ============================================================================
// INTEGRATION WITH USER CONTEXT
// ============================================================================

// Assuming you have a UserContext
import { useUser } from '@/lib/auth-context';

export function ProtectedFeature({ feature }) {
  const { tier } = useUser();
  const [show, setShow] = useState(false);
  
  const features = {
    'ai-chat': { name: 'AI Chat', minTier: 'Premium' },
    'analytics': { name: 'Analytics', minTier: 'Basic' },
    'export': { name: 'Export to PDF', minTier: 'Premium' },
  };
  
  const tierHierarchy = { Free: 0, Basic: 1, Premium: 2 };
  const hasAccess = tierHierarchy[tier] >= tierHierarchy[features[feature].minTier];
  
  if (!hasAccess) {
    return show ? (
      <UpgradePrompt
        feature={features[feature].name}
        currentTier={tier}
        variant="modal"
        onUpgradeClick={() => window.location.href = '/pricing?feature=' + feature}
        onClose={() => setShow(false)}
      />
    ) : (
      <button onClick={() => setShow(true)}>
        {features[feature].name} (Upgrade Required)
      </button>
    );
  }
  
  return <FeatureComponent feature={feature} />;
}


// ============================================================================
// PROPS QUICK REFERENCE
// ============================================================================

/*
<UpgradePrompt
  // What to show
  feature="AI Chat"                    // Feature name
  description="Premium support"        // Description
  currentTier="Free"                   // User's tier
  
  // How to show it
  variant="modal"                      // 'modal' | 'banner' | 'inline'
  
  // Callbacks
  onUpgradeClick={() => { }}          // Upgrade button clicked
  onClose={() => { }}                 // Close/dismiss clicked
  
  // Optional (modal only)
  showBenefits={true}                 // Show benefits list
  pricing={{                           // Show pricing info
    price: '$9.99',
    frequency: 'per month',
  }}
/>
*/


// ============================================================================
// COMMON MISTAKES TO AVOID
// ============================================================================

// ❌ DON'T: Use multiple times for same feature
// <UpgradePrompt ... />
// <UpgradePrompt ... />  // Bad! Shows twice

// ✅ DO: Use conditional rendering
// {showUpgrade && <UpgradePrompt ... />}

// ❌ DON'T: Forget to set onClose callback
// <UpgradePrompt ... />  // User can't dismiss it

// ✅ DO: Always provide onClose
// <UpgradePrompt onClose={() => setShow(false)} ... />

// ❌ DON'T: Use hard-coded upgrade links
// onUpgradeClick={() => window.location.href = '/upgrade'}

// ✅ DO: Use proper pricing/feature tracking
// onUpgradeClick={() => window.location.href = '/pricing?feature=ai-chat&from=app'}


// ============================================================================
// FILE LOCATIONS
// ============================================================================

/*
Main Component:
  /home/suri/proj/EduTech/frontend/src/components/UpgradePrompt.jsx

Documentation:
  /home/suri/proj/EduTech/frontend/src/components/UPGRADE_PROMPT_README.md
  /home/suri/proj/EduTech/frontend/src/components/UPGRADE_PROMPT_IMPLEMENTATION.md

Examples:
  /home/suri/proj/EduTech/frontend/src/components/UpgradePrompt.examples.jsx

Demo:
  /home/suri/proj/EduTech/frontend/src/components/UpgradePrompt.demo.jsx
*/
