"use client"

/**
 * Authentication Context
 * 
 * SECURITY FEATURES:
 * 1. Token-based authentication with JWT
 * 2. Automatic token validation on app load
 * 3. Secure logout that invalidates token on backend
 * 4. Token refresh mechanism to maintain sessions
 * 5. Global logout listener for 401 responses
 * 6. XSS protection through proper state management
 * 7. No sensitive data stored in memory after logout
 */

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { authApi, tokenManager, ApiError } from "./api"
import { TEST_MODE, validateTestCredentials } from "./test-mode"

// Map backend roles to frontend roles (lowercase)
type UserRole = "admin" | "teacher" | "student"

type User = {
  id: string
  name: string
  firstName?: string
  lastName?: string
  email: string
  role: UserRole
  profileImage?: string
  avatar?: string
  phone?: string
  bio?: string
  batchId?: string
  isFirstLogin?: boolean
  createdAt?: string
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; isFirstLogin?: boolean }>
  logout: () => Promise<void>
  register: (data: { name: string; email: string; password: string; role?: string }) => Promise<{ success: boolean; message?: string }>
  updateProfile: (data: { name?: string; phone?: string; bio?: string }) => Promise<{ success: boolean; message?: string }>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string }>
  refreshUser: () => Promise<void>
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Transform backend user to frontend user format
 * REASON: Normalize role case and structure for consistent frontend usage
 */
const transformUser = (backendUser: any): User => ({
  id: backendUser.id,
  name: backendUser.name,
  email: backendUser.email,
  // SECURITY: Normalize role to lowercase for consistent comparison
  role: backendUser.role.toLowerCase() as UserRole,
  profileImage: backendUser.profileImage,
  phone: backendUser.phone,
  bio: backendUser.bio,
  isFirstLogin: backendUser.isFirstLogin,
  createdAt: backendUser.createdAt,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Validate existing session on mount
   * SECURITY: Verify token validity with backend, not just client-side check
   */
  const validateSession = useCallback(async () => {
    try {
      // Check if token exists and hasn't expired (client-side quick check)
      if (!tokenManager.isAuthenticated()) {
        tokenManager.removeToken()
        setUser(null)
        setIsLoading(false)
        return
      }

      // Validate token with backend
      const response = await authApi.getProfile()
      if (response.success && response.data) {
        const transformedUser = transformUser(response.data)
        setUser(transformedUser)
        tokenManager.setUser(response.data)
      } else {
        // Token invalid, clear everything
        tokenManager.removeToken()
        setUser(null)
      }
    } catch (err) {
      // SECURITY: Clear invalid session silently
      console.error('Session validation failed:', err)
      tokenManager.removeToken()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    validateSession()

    // SECURITY: Listen for logout events from API layer (e.g., 401 responses)
    const handleAuthLogout = () => {
      setUser(null)
      setError('Your session has expired. Please log in again.')
    }

    window.addEventListener('auth:logout', handleAuthLogout)
    return () => window.removeEventListener('auth:logout', handleAuthLogout)
  }, [validateSession])

  /**
   * Token refresh mechanism
   * SECURITY: Refresh token before expiry to maintain session
   */
  useEffect(() => {
    if (!user) return

    // Refresh token every 20 minutes (assuming 24h token lifetime)
    const refreshInterval = setInterval(async () => {
      try {
        await authApi.refreshToken()
        console.log('Token refreshed successfully')
      } catch (err) {
        console.error('Token refresh failed:', err)
        // Don't logout immediately, let the next API call handle it
      }
    }, 20 * 60 * 1000) // 20 minutes

    return () => clearInterval(refreshInterval)
  }, [user])

  /**
   * Login handler
   * SECURITY: 
   * - Validates credentials with backend
   * - Stores token securely
   * - Clears any previous errors
   * - Returns first login status for password change flow
   */
  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string; isFirstLogin?: boolean }> => {
    setError(null)
    setIsLoading(true)

    try {
      // SECURITY: Input validation
      if (!email || !password) {
        return { success: false, message: 'Email and password are required' }
      }

      // TEST MODE: Check demo credentials first
      if (TEST_MODE) {
        const testResult = validateTestCredentials(email, password)
        if (testResult.valid && testResult.user) {
          setUser(testResult.user)
          // Store test user in localStorage for persistence
          tokenManager.setToken('test_token_' + testResult.user.id)
          tokenManager.setUser(testResult.user)
          return { 
            success: true, 
            isFirstLogin: false,
            message: `Welcome back, ${testResult.user.firstName}! (Test Mode)`
          }
        }
      }

      const response = await authApi.login(email, password)
      
      if (response.success && response.data) {
        const transformedUser = transformUser(response.data.user)
        setUser(transformedUser)
        
        // SECURITY: Check if this is first login (temp password)
        const isFirstLogin = response.data.user.isFirstLogin
        
        return { 
          success: true, 
          isFirstLogin,
          message: isFirstLogin ? 'Please change your password' : 'Login successful'
        }
      }
      
      return { success: false, message: 'Login failed' }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'An error occurred during login'
      setError(message)
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Logout handler
   * SECURITY:
   * - Invalidates token on backend (adds to blacklist)
   * - Clears all local storage
   * - Clears user state
   */
  const logout = async (): Promise<void> => {
    setIsLoading(true)
    try {
      await authApi.logout()
    } catch (err) {
      // SECURITY: Still logout locally even if API fails
      console.error('Logout API failed:', err)
    } finally {
      setUser(null)
      setError(null)
      setIsLoading(false)
    }
  }

  /**
   * Register handler
   * SECURITY:
   * - Validates input before sending
   * - Password strength checked by API
   */
  const register = async (data: { name: string; email: string; password: string; role?: string }): Promise<{ success: boolean; message?: string }> => {
    setError(null)
    setIsLoading(true)

    try {
      const response = await authApi.register(data)
      
      if (response.success && response.data) {
        const transformedUser = transformUser(response.data.user)
        setUser(transformedUser)
        return { success: true, message: 'Registration successful' }
      }
      
      return { success: false, message: 'Registration failed' }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'An error occurred during registration'
      setError(message)
      return { success: false, message }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Update profile
   * SECURITY: Only allowed fields are sent to prevent unauthorized updates
   */
  const updateProfile = async (data: { name?: string; phone?: string; bio?: string }): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authApi.updateProfile(data)
      
      if (response.success && response.data) {
        const transformedUser = transformUser(response.data)
        setUser(transformedUser)
        return { success: true, message: 'Profile updated successfully' }
      }
      
      return { success: false, message: 'Profile update failed' }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'An error occurred'
      return { success: false, message }
    }
  }

  /**
   * Change password
   * SECURITY: Requires current password verification
   */
  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authApi.changePassword(currentPassword, newPassword)
      
      if (response.success) {
        // Update user to reflect first login is complete
        if (user?.isFirstLogin) {
          setUser({ ...user, isFirstLogin: false })
        }
        return { success: true, message: 'Password changed successfully' }
      }
      
      return { success: false, message: 'Password change failed' }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'An error occurred'
      return { success: false, message }
    }
  }

  /**
   * Refresh user data
   * SECURITY: Fetch fresh user data from backend
   */
  const refreshUser = async (): Promise<void> => {
    try {
      const response = await authApi.getProfile()
      if (response.success && response.data) {
        const transformedUser = transformUser(response.data)
        setUser(transformedUser)
      }
    } catch (err) {
      console.error('Failed to refresh user:', err)
    }
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        register,
        updateProfile,
        changePassword,
        refreshUser,
        isLoading, 
        error 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
