import React, { useState } from 'react'
import { FeatureGate } from './FeatureGate'
import { UpgradePrompt } from './UpgradePrompt'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

/**
 * FeatureGate Examples
 * 
 * Demonstrates different usage patterns and configurations
 */

// Mock components for demo purposes
const AIChatInterface = () => (
  <Card>
    <CardHeader>
      <CardTitle>AI Chat Assistant</CardTitle>
      <CardDescription>Chat with your AI tutor</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="rounded-lg bg-slate-100 p-4 dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-400">AI: Hello! How can I help you learn today?</p>
      </div>
      <input
        type="text"
        placeholder="Type your question here..."
        className="w-full rounded-lg border px-3 py-2"
      />
    </CardContent>
  </Card>
)

const AnalyticsPanel = () => (
  <Card>
    <CardHeader>
      <CardTitle>Advanced Analytics</CardTitle>
      <CardDescription>Track your learning progress</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Quiz Completion Rate</span>
          <span className="text-lg font-bold text-green-600">87%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200">
          <div className="h-full w-[87%] rounded-full bg-green-600" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Topics Mastered</span>
          <span className="text-lg font-bold text-blue-600">12/25</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200">
          <div className="h-full w-[48%] rounded-full bg-blue-600" />
        </div>
      </div>
    </CardContent>
  </Card>
)

const BatchOperationsUI = () => (
  <Card>
    <CardHeader>
      <CardTitle>Batch Operations</CardTitle>
      <CardDescription>Perform bulk actions on your content</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Button className="w-full" variant="outline">Export All Quizzes as PDF</Button>
        <Button className="w-full" variant="outline">Delete Selected Items</Button>
        <Button className="w-full" variant="outline">Move to Folder</Button>
      </div>
    </CardContent>
  </Card>
)

const CustomBrandingUI = () => (
  <Card>
    <CardHeader>
      <CardTitle>Custom Branding</CardTitle>
      <CardDescription>Customize your learning interface</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Theme Color</label>
          <input type="color" className="mt-1 h-10 w-full rounded-lg border" />
        </div>
        <div>
          <label className="text-sm font-medium">Logo Upload</label>
          <input type="file" className="mt-1 w-full" />
        </div>
      </div>
    </CardContent>
  </Card>
)

// Example 1: Basic Replace Mode
export function Example1_BasicReplace() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <h3 className="mb-2 font-semibold">Example 1: Basic Replace Mode</h3>
        <p className="text-sm text-slate-600 mb-4">Default behavior - shows modal upgrade when feature disabled</p>
        
        <FeatureGate feature="AI_CHAT">
          <AIChatInterface />
        </FeatureGate>
      </div>
    </div>
  )
}

// Example 2: Disable Mode
export function Example2_DisableMode() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <h3 className="mb-2 font-semibold">Example 2: Disable Mode</h3>
        <p className="text-sm text-slate-600 mb-4">Shows content but greyed out with lock overlay</p>
        
        <FeatureGate 
          feature="ADVANCED_ANALYTICS"
          showUpgradeOn="disable"
        >
          <AnalyticsPanel />
        </FeatureGate>
      </div>
    </div>
  )
}

// Example 3: Banner Mode
export function Example3_BannerMode() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <h3 className="mb-2 font-semibold">Example 3: Banner Mode</h3>
        <p className="text-sm text-slate-600 mb-4">Shows both content and upgrade banner</p>
        
        <FeatureGate 
          feature="BATCH_OPERATIONS"
          showUpgradeOn="banner"
        >
          <BatchOperationsUI />
        </FeatureGate>
      </div>
    </div>
  )
}

// Example 4: Inline Mode with Custom Fallback
export function Example4_InlineMode() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <h3 className="mb-2 font-semibold">Example 4: Inline Mode</h3>
        <p className="text-sm text-slate-600 mb-4">Shows inline upgrade prompt</p>
        
        <FeatureGate 
          feature="CUSTOM_BRANDING"
          showUpgradeOn="inline"
        >
          <CustomBrandingUI />
        </FeatureGate>
      </div>
    </div>
  )
}

// Example 5: Modal Mode with Callbacks
export function Example5_ModalModeWithCallbacks() {
  const [denialCount, setDenialCount] = useState(0)
  const [availableCount, setAvailableCount] = useState(0)

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <h3 className="mb-2 font-semibold">Example 5: Modal Mode with Callbacks</h3>
        <p className="text-sm text-slate-600 mb-4">Tracks access denials and availability</p>
        
        <div className="mb-4 flex gap-4">
          <Badge variant="outline">Denials: {denialCount}</Badge>
          <Badge variant="outline" className="bg-green-50">Available: {availableCount}</Badge>
        </div>

        <FeatureGate 
          feature="AI_CHAT"
          showUpgradeOn="modal"
          onDeny={() => setDenialCount(d => d + 1)}
          onFeatureAvailable={() => setAvailableCount(a => a + 1)}
        >
          <AIChatInterface />
        </FeatureGate>
      </div>
    </div>
  )
}

// Example 6: Custom Fallback
export function Example6_CustomFallback() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <h3 className="mb-2 font-semibold">Example 6: Custom Fallback</h3>
        <p className="text-sm text-slate-600 mb-4">Shows custom fallback when feature disabled</p>
        
        <FeatureGate 
          feature="API_ACCESS"
          fallback={
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-slate-600">API access is not available in your plan</p>
                <p className="text-xs text-slate-500 mt-2">Contact support or upgrade to access API</p>
              </CardContent>
            </Card>
          }
        >
          <Card>
            <CardHeader>
              <CardTitle>API Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Your API keys and documentation would appear here.</p>
            </CardContent>
          </Card>
        </FeatureGate>
      </div>
    </div>
  )
}

// Example 7: With Custom Label
export function Example7_CustomLabel() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <h3 className="mb-2 font-semibold">Example 7: Custom Feature Label</h3>
        <p className="text-sm text-slate-600 mb-4">Shows custom label in upgrade prompt</p>
        
        <FeatureGate 
          feature="QUIZ_GENERATION"
          upgradeFeatureLabel="AI Quiz Generator"
          showUpgradeOn="replace"
        >
          <Card>
            <CardHeader>
              <CardTitle>AI Quiz Generator</CardTitle>
              <CardDescription>Automatically generate quizzes from your content</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Generate Quiz</Button>
            </CardContent>
          </Card>
        </FeatureGate>
      </div>
    </div>
  )
}

// Example 8: With Analytics Tracking
export function Example8_WithAnalytics() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <h3 className="mb-2 font-semibold">Example 8: With Analytics</h3>
        <p className="text-sm text-slate-600 mb-4">Tracks feature access events (requires gtag)</p>
        
        <FeatureGate 
          feature="DOCUMENT_ANALYSIS"
          showUpgradeOn="disable"
          analytics={true}
        >
          <Card>
            <CardHeader>
              <CardTitle>Document Analysis</CardTitle>
              <CardDescription>AI-powered document analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <input type="file" className="w-full" />
            </CardContent>
          </Card>
        </FeatureGate>
      </div>
    </div>
  )
}

// Main Demo Component
export default function FeatureGateExamples() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">FeatureGate Component Examples</h1>
        <p className="text-slate-600">
          Interactive examples showing different FeatureGate usage patterns
        </p>
      </div>

      <Example1_BasicReplace />
      <Example2_DisableMode />
      <Example3_BannerMode />
      <Example4_InlineMode />
      <Example5_ModalModeWithCallbacks />
      <Example6_CustomFallback />
      <Example7_CustomLabel />
      <Example8_WithAnalytics />
    </div>
  )
}
