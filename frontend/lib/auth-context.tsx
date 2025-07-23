"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type UserRole = "admin" | "teacher" | "student"

type User = {
  id: string
  name: string
  email: string
  role: UserRole
  batchId?: string
  avatar?: string
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication - replace with real API call
    const mockUsers: User[] = [
      { id: "1", name: "Admin User", email: "admin@school.com", role: "admin" },
      { id: "2", name: "John Teacher", email: "teacher@school.com", role: "teacher", batchId: "batch1" },
      { id: "3", name: "Jane Student", email: "student@school.com", role: "student", batchId: "batch1" },
    ]

    const foundUser = mockUsers.find((u) => u.email === email)
    if (foundUser && password === "password") {
      setUser(foundUser)
      localStorage.setItem("user", JSON.stringify(foundUser))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
