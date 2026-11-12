"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { API_BASE_URL } from "@/lib/api"

const AuthContext = createContext(undefined)

const normalizeUser = (u) => {
  if (!u) return null
  const role = (u.role || "").toLowerCase()
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role,
    batchId: u.batchId || u.studentProfile?.batchId || "batch1",
    tier: (u.subscriptionTier || u.tier || "free").toLowerCase(),
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user")
      const storedToken = localStorage.getItem("token")
      if (storedUser) setUser(JSON.parse(storedUser))
      if (storedToken) setToken(storedToken)
    } catch {}
    setIsLoading(false)
  }, [])

  const login = async (email, password) => {
    // Try real backend login first
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json?.data?.user && json?.data?.token) {
        const nextUser = normalizeUser(json.data.user)
        const nextToken = json.data.token
        setUser(nextUser)
        setToken(nextToken)
        localStorage.setItem("user", JSON.stringify(nextUser))
        localStorage.setItem("token", nextToken)
        return true
      }
    } catch {}

    // Fallback mock auth (demo)
    const mockUsers = [
      { id: "1", name: "Admin User", email: "admin@school.com", role: "admin", tier: "enterprise" },
      { id: "2", name: "John Teacher", email: "teacher@school.com", role: "teacher", batchId: "batch1", tier: "premium" },
      { id: "3", name: "Jane Student", email: "student@school.com", role: "student", batchId: "batch1", tier: "free" },
    ]
    const foundUser = mockUsers.find((u) => u.email === email)
    if (foundUser && password === "password") {
      setUser(foundUser)
      setToken(null)
      localStorage.setItem("user", JSON.stringify(foundUser))
      localStorage.removeItem("token")
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("user")
    localStorage.removeItem("token")
  }

  return <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
