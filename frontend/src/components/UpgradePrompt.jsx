import React from 'react';
import { X, Star, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * UpgradePrompt Component
 * 
 * Displays a locked/premium feature notification in three variants:
 * - modal: Full-screen overlay (blocking)
 * - banner: Top/inline notification
 * - inline: Small message near the disabled feature
 * 
 * @component
 * @example
 * // Modal variant
 * <UpgradePrompt
 *   feature="AI Chat"
 *   description="Get instant answers from your AI tutor"
 *   currentTier="Free"
 *   variant="modal"
 *   onUpgradeClick={() => window.location.href = '/pricing'}
 *   onClose={() => setShowUpgradePrompt(false)}
 * />
 * 
 * @example
 * // Banner variant
 * <UpgradePrompt
 *   feature="Advanced Analytics"
 *   description="Track your learning progress with detailed insights"
 *   currentTier="Basic"
 *   variant="banner"
 *   onUpgradeClick={() => openUpgradeModal()}
 * />
 * 
 * @example
 * // Inline variant
 * <UpgradePrompt
 *   feature="Export to PDF"
 *   description="Available on Premium plan"
 *   currentTier="Free"
 *   variant="inline"
 *   onUpgradeClick={handleUpgrade}
 * />
 */
const UpgradePrompt = ({
  feature = 'Premium Feature',
  description = 'This feature is only available on Premium plan',
  currentTier = 'Free',
  variant = 'inline',
  onUpgradeClick = () => {},
  onClose = () => {},
  showBenefits = false,
  pricing = null,
}) => {
  const benefits = [
    '✨ Unlimited AI chat sessions',
    '📊 Advanced analytics & insights',
    '🎯 Personalized learning paths',
    '📚 Access to all premium courses',
    '🎓 Priority support',
  ];

  // Modal Variant
  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <Card className="w-full max-w-md border-2 border-primary/20 shadow-2xl">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
                  <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">{feature}</CardTitle>
                  <CardDescription className="mt-1">{description}</CardDescription>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Close upgrade prompt"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Current Tier Display */}
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium text-muted-foreground">Current Tier</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{currentTier}</p>
            </div>

            {/* Benefits List */}
            {showBenefits && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Premium Features</p>
                <ul className="space-y-2">
                  {benefits.map((benefit, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground flex gap-2"
                    >
                      <Star className="h-4 w-4 flex-shrink-0 text-amber-500 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pricing Info */}
            {pricing && (
              <div className="space-y-1 border-t pt-4">
                <p className="text-sm font-medium text-foreground">Premium Plan</p>
                <p className="text-2xl font-bold text-primary">{pricing.price}</p>
                <p className="text-xs text-muted-foreground">{pricing.frequency}</p>
              </div>
            )}

            {/* CTA Button */}
            <Button
              onClick={onUpgradeClick}
              size="lg"
              className="w-full gap-2"
              aria-label="Upgrade to Premium"
            >
              Upgrade Now
              <ArrowRight className="h-4 w-4" />
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Unlock all premium features with a single upgrade
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Banner Variant
  if (variant === 'banner') {
    return (
      <div className="sticky top-0 z-40 w-full border-b border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-4 dark:border-amber-900/30 dark:from-amber-950/20 dark:to-orange-950/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
              <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-amber-900 dark:text-amber-100">
                {feature}
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={onUpgradeClick}
              className="gap-2"
              aria-label="Upgrade to Premium"
            >
              Upgrade
              <ArrowRight className="h-4 w-4" />
            </Button>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-amber-800 transition-colors hover:bg-amber-200 dark:text-amber-200 dark:hover:bg-amber-900/30"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Inline Variant (default)
  return (
    <div className={cn(
      'rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/30 dark:bg-amber-950/10',
      'flex items-start gap-3'
    )}>
      <div className="mt-0.5 flex-shrink-0">
        <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-amber-900 dark:text-amber-100">
          {feature}
        </p>
        <p className="text-sm text-amber-800 dark:text-amber-200 mt-0.5">
          {description}
        </p>

        {/* Upgrade Button - Inline */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onUpgradeClick}
            className="gap-1"
            aria-label="Upgrade to Premium"
          >
            Upgrade Now
            <ArrowRight className="h-3 w-3" />
          </Button>
          <span className="text-xs text-amber-700 dark:text-amber-300">
            Premium feature ({currentTier} user)
          </span>
        </div>
      </div>

      {/* Close Button - Inline */}
      <button
        onClick={onClose}
        className="flex-shrink-0 rounded-md p-0.5 text-amber-700 transition-colors hover:bg-amber-200 dark:text-amber-300 dark:hover:bg-amber-900/30 focus:outline-none focus:ring-2 focus:ring-amber-500"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

UpgradePrompt.displayName = 'UpgradePrompt';

export { UpgradePrompt };
