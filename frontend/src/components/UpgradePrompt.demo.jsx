/**
 * UpgradePrompt Component - Visual Showcase
 * 
 * A demonstration page showing all UpgradePrompt variants
 * Place this in a route to see component in action
 * 
 * Usage: Navigate to /upgrade-prompt-demo to see all variants
 */

import React, { useState } from 'react';
import { UpgradePrompt } from '@/components/UpgradePrompt';

export function UpgradePromptDemo() {
  const [showModalVariant, setShowModalVariant] = useState(false);
  const [dismissBanner, setDismissBanner] = useState(false);
  const [dismissInline, setDismissInline] = useState(false);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">UpgradePrompt Component</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Visual showcase of all component variants and styling
          </p>
        </div>

        {/* ========== MODAL VARIANT ========== */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Modal Variant</h2>
            <p className="text-muted-foreground">
              Full-screen overlay for important feature upgrades. Best for gatekeeping premium features.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <button
              onClick={() => setShowModalVariant(true)}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Click to show modal
            </button>
            <p className="mt-4 text-sm text-muted-foreground">
              This will open an overlay modal showing the premium feature upgrade prompt.
            </p>
          </div>

          {/* Modal Demo */}
          {showModalVariant && (
            <UpgradePrompt
              feature="AI Chat"
              description="Get instant answers from your AI tutor and receive personalized learning suggestions"
              currentTier="Free"
              variant="modal"
              onUpgradeClick={() => {
                alert('User clicked: Upgrade Now\n\nIn production, this would navigate to /pricing or open an upgrade flow.');
                setShowModalVariant(false);
              }}
              onClose={() => setShowModalVariant(false)}
              showBenefits={true}
              pricing={{
                price: '$9.99',
                frequency: 'per month',
              }}
            />
          )}

          {/* Code Example */}
          <details className="rounded-lg border bg-muted/50 p-4">
            <summary className="cursor-pointer font-semibold">View code</summary>
            <pre className="mt-4 overflow-x-auto rounded bg-background p-4 text-sm">
              {`<UpgradePrompt
  feature="AI Chat"
  description="Get instant answers from your AI tutor"
  currentTier="Free"
  variant="modal"
  onUpgradeClick={() => window.location.href = '/pricing'}
  onClose={() => setShowUpgradeModal(false)}
  showBenefits={true}
  pricing={{ price: '$9.99', frequency: 'per month' }}
/>`}
            </pre>
          </details>
        </section>

        {/* ========== BANNER VARIANT ========== */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Banner Variant</h2>
            <p className="text-muted-foreground">
              Sticky notification bar at the top of content. Best for less critical feature upgrades.
            </p>
          </div>

          <div className="space-y-4">
            {!dismissBanner && (
              <UpgradePrompt
                feature="Advanced Analytics"
                description="Track your learning progress with detailed insights and performance metrics"
                currentTier="Basic"
                variant="banner"
                onUpgradeClick={() => {
                  alert('User clicked: Upgrade\n\nIn production, this would navigate to pricing or open upgrade modal.');
                }}
                onClose={() => setDismissBanner(true)}
              />
            )}

            <div className="rounded-lg border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                {dismissBanner ? (
                  <>
                    ✓ Banner dismissed. 
                    <button
                      onClick={() => setDismissBanner(false)}
                      className="ml-2 underline hover:text-foreground"
                    >
                      Show again
                    </button>
                  </>
                ) : (
                  'Banner is visible above. You can dismiss it with the X button.'
                )}
              </p>
            </div>
          </div>

          {/* Code Example */}
          <details className="rounded-lg border bg-muted/50 p-4">
            <summary className="cursor-pointer font-semibold">View code</summary>
            <pre className="mt-4 overflow-x-auto rounded bg-background p-4 text-sm">
              {`{!dismissBanner && (
  <UpgradePrompt
    feature="Advanced Analytics"
    description="Track your learning progress with detailed insights"
    currentTier="Basic"
    variant="banner"
    onUpgradeClick={() => openUpgradeModal()}
    onClose={() => setDismissBanner(true)}
  />
)}`}
            </pre>
          </details>
        </section>

        {/* ========== INLINE VARIANT ========== */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Inline Variant</h2>
            <p className="text-muted-foreground">
              Compact inline notification near disabled features. Best for button-level upgrades.
            </p>
          </div>

          <div className="space-y-4">
            {!dismissInline && (
              <UpgradePrompt
                feature="Export to PDF"
                description="Download course materials and notes in PDF format for offline access"
                currentTier="Free"
                variant="inline"
                onUpgradeClick={() => {
                  alert('User clicked: Upgrade Now\n\nIn production, this would navigate to pricing with feature parameter.');
                }}
                onClose={() => setDismissInline(true)}
              />
            )}

            <div className="rounded-lg border bg-card p-6">
              <button
                disabled
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-50 cursor-not-allowed"
              >
                Export to PDF (Disabled)
              </button>
              <p className="mt-4 text-sm text-muted-foreground">
                {dismissInline ? (
                  <>
                    ✓ Inline prompt dismissed.
                    <button
                      onClick={() => setDismissInline(false)}
                      className="ml-2 underline hover:text-foreground"
                    >
                      Show again
                    </button>
                  </>
                ) : (
                  'The upgrade prompt appears above the disabled button.'
                )}
              </p>
            </div>
          </div>

          {/* Code Example */}
          <details className="rounded-lg border bg-muted/50 p-4">
            <summary className="cursor-pointer font-semibold">View code</summary>
            <pre className="mt-4 overflow-x-auto rounded bg-background p-4 text-sm">
              {`<button
  disabled
  className="... opacity-50 cursor-not-allowed"
>
  Export to PDF
</button>

{showUpgradePrompt && (
  <UpgradePrompt
    feature="Export to PDF"
    description="Download materials"
    currentTier="Free"
    variant="inline"
    onUpgradeClick={handleUpgrade}
    onClose={() => setShowUpgradePrompt(false)}
  />
)}`}
            </pre>
          </details>
        </section>

        {/* ========== PROPS REFERENCE ========== */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Props Reference</h2>
          
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Prop</th>
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Default</th>
                  <th className="px-4 py-3 text-left font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-3 font-mono text-xs">feature</td>
                  <td className="px-4 py-3 font-mono text-xs">string</td>
                  <td className="px-4 py-3 font-mono text-xs">"Premium Feature"</td>
                  <td className="px-4 py-3">Feature name (e.g., "AI Chat")</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-mono text-xs">description</td>
                  <td className="px-4 py-3 font-mono text-xs">string</td>
                  <td className="px-4 py-3 font-mono text-xs">"This feature is only available..."</td>
                  <td className="px-4 py-3">Feature description</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-mono text-xs">currentTier</td>
                  <td className="px-4 py-3 font-mono text-xs">string</td>
                  <td className="px-4 py-3 font-mono text-xs">"Free"</td>
                  <td className="px-4 py-3">User's current subscription tier</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-mono text-xs">variant</td>
                  <td className="px-4 py-3 font-mono text-xs">string</td>
                  <td className="px-4 py-3 font-mono text-xs">"inline"</td>
                  <td className="px-4 py-3">Display variant: "modal" | "banner" | "inline"</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-mono text-xs">onUpgradeClick</td>
                  <td className="px-4 py-3 font-mono text-xs">function</td>
                  <td className="px-4 py-3 font-mono text-xs">() =&gt; {}</td>
                  <td className="px-4 py-3">Upgrade button callback</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-mono text-xs">onClose</td>
                  <td className="px-4 py-3 font-mono text-xs">function</td>
                  <td className="px-4 py-3 font-mono text-xs">() =&gt; {}</td>
                  <td className="px-4 py-3">Close button callback</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-mono text-xs">showBenefits</td>
                  <td className="px-4 py-3 font-mono text-xs">boolean</td>
                  <td className="px-4 py-3 font-mono text-xs">false</td>
                  <td className="px-4 py-3">Show benefits list (modal only)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs">pricing</td>
                  <td className="px-4 py-3 font-mono text-xs">object</td>
                  <td className="px-4 py-3 font-mono text-xs">null</td>
                  <td className="px-4 py-3">Pricing info object (modal only)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ========== FEATURES ========== */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Key Features</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { icon: '✨', title: 'Three Variants', desc: 'Modal, Banner, and Inline display options' },
              { icon: '🎨', title: 'Tailwind Styled', desc: 'Beautiful design with light/dark mode support' },
              { icon: '♿', title: 'Accessible', desc: 'ARIA labels, keyboard navigation, screen reader support' },
              { icon: '📱', title: 'Responsive', desc: 'Works perfectly on mobile and desktop' },
              { icon: '🔧', title: 'Customizable', desc: 'Flexible props for any use case' },
              { icon: '⚡', title: 'Lightweight', desc: 'No external dependencies beyond project\'s stack' },
            ].map((feature, idx) => (
              <div key={idx} className="rounded-lg border bg-card p-6">
                <div className="text-3xl mb-2">{feature.icon}</div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ========== USAGE PATTERNS ========== */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Common Usage Patterns</h2>
          
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-2">🔒 Feature Gate Wrapper</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Wrap premium features to show upgrade prompt when users lack access.
              </p>
              <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
                {`if (userTier === 'Free' && isPremiumFeature) {
  return <UpgradePrompt variant="modal" {...props} />;
}
return <PremiumFeature />;`}
              </pre>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-2">🎯 Button-Level Upgrade</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Disable button and show inline upgrade prompt when clicked.
              </p>
              <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
                {`<button
  onClick={() => userTier === 'Free' ? showUpgrade() : doAction()}
  disabled={userTier === 'Free'}
>
  Export {userTier === 'Free' && '(Premium)'}
</button>`}
              </pre>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-2">📢 Feature Banner</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Show banner to encourage upgrade while user explores features.
              </p>
              <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
                {`{isFeaturePreview && (
  <UpgradePrompt variant="banner" {...props} />
)}
<div>{/* Preview content */}</div>`}
              </pre>
            </div>
          </div>
        </section>

        {/* ========== INTEGRATION ========== */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Integration Guide</h2>
          
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-2">1. Import the component</h3>
              <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
                {`import { UpgradePrompt } from '@/components/UpgradePrompt';`}
              </pre>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-2">2. Get user subscription tier</h3>
              <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
                {`const userTier = useUserContext().tier; // or from API`}
              </pre>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold text-foreground mb-2">3. Check access and show prompt</h3>
              <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
                {`if (userTier === 'Free' && needsPremium) {
  return <UpgradePrompt feature="..." currentTier={userTier} {...props} />;
}
return <FeatureComponent />;`}
              </pre>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t pt-8 text-center text-sm text-muted-foreground">
          <p>UpgradePrompt Component Documentation</p>
          <p className="mt-2">
            For more examples, see: 
            <code className="rounded bg-muted px-2 py-1">
              src/components/UpgradePrompt.examples.jsx
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}

export default UpgradePromptDemo;
