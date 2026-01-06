"use client"

/**
 * Login Page Component
 * 
 * SECURITY FEATURES:
 * 1. Input validation before submission
 * 2. Rate limiting awareness (handled by API)
 * 3. Secure password field (type="password")
 * 4. CSRF protection via API layer
 * 5. Error messages don't reveal if email exists
 * 6. Loading states prevent double submission
 * 7. First login detection for password change flow
 */

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { ThemeToggle } from "./theme-toggle"
import { GraduationCap, Eye, EyeOff, AlertCircle, Loader2, TestTube } from "lucide-react"
import MathPhysicsBackground from "@/components/ui/mathsphysicsbackground"
import { TEST_MODE } from "@/lib/test-mode"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false)
  const { login } = useAuth()

  /**
   * Handle login form submission
   * SECURITY: Validates input and handles errors securely
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // SECURITY: Basic client-side validation
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password")
      return
    }

    // SECURITY: Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await login(email, password)
      
      if (!result.success) {
        // SECURITY: Generic error message to prevent enumeration
        setError(result.message || "Invalid credentials. Please try again.")
      } else if (result.isFirstLogin) {
        // TODO: Redirect to password change page
        // For now, just notify user
        setError("Please change your password after logging in.")
      }
    } catch (err) {
      // SECURITY: Don't expose technical errors to users
      setError("An error occurred. Please try again later.")
      console.error("Login error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle forgot password submission
   * SECURITY: Doesn't reveal if email exists in system
   */
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!forgotEmail.trim()) {
      setError("Please enter your email address")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // API call would go here
      // For now, show success message regardless (security best practice)
      setForgotPasswordSent(true)
    } catch (err) {
      setError("An error occurred. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-1000 p-6">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <Card className="w-full max-w-md shadow-2xl border-2 border-blue-500 dark:border-white/40 bg-white/90 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-white dark:to-blue-1000">
              Reset Password
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-white/70">
              {forgotPasswordSent 
                ? "Check your email for password reset instructions"
                : "Enter your email to receive a password reset link"
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {forgotPasswordSent ? (
              <div className="text-center space-y-4">
                <div className="text-green-600 dark:text-green-1000 bg-green-500 dark:bg-green-900/20 p-4 rounded-lg">
                  If an account exists with this email, you will receive password reset instructions.
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setForgotPasswordSent(false)
                    setForgotEmail("")
                  }}
                  className="w-full rounded-xl"
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="rounded-xl"
                    required
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setError("")
                  }}
                  className="w-full rounded-xl"
                  disabled={isLoading}
                >
                  Back to Login
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-1000 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {TEST_MODE && (
        <div className="fixed top-4 left-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-500 text-yellow-800 dark:text-yellow-100 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
          <TestTube className="w-4 h-4" />
          <span>TEST MODE ENABLED - Using mock data</span>
        </div>
      )}

      <Card className="w-full max-w-md shadow-2xl border-2 border-blue-500 dark:border-white/40 bg-white/90 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-white dark:to-blue-1000">
            EduPlatform
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-white/70">Sign in to your account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-blue-700 dark:text-white">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="rounded-xl transition-all duration-1000 focus:scale-[1.02] border-2 border-blue-1000 dark:border-white/40"
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-blue-700 dark:text-white">Password</Label>
              <div className="relative flex items-center">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="rounded-xl transition-all duration-1000 focus:scale-[1.02] pr-12 border-2 border-blue-1000 dark:border-white/40"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 flex items-center justify-center h-full text-blue-500 hover:text-blue-700 dark:text-white/70 dark:hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true)
                  setError("")
                }}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-1000"
                disabled={isLoading}
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-white/5 rounded-2xl border-2 border-blue-300 dark:border-white/20">
            <p className="text-center text-sm text-blue-700 dark:text-white mb-2">
              <strong>Demo Credentials:</strong>
            </p>
            <div className="text-xs text-blue-600 dark:text-white/80 space-y-1">
              <p>• Admin: admin@edutech.com</p>
              <p>• Teacher: teacher@edutech.com</p>
              <p>• Student: student@edutech.com</p>
              <p className="mt-2 text-blue-500 dark:text-white/60">Password: Password123!</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <MathPhysicsBackground />
    </div>
  )
}
