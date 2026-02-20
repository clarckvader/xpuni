import React, { createContext, useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/services/api'
import type { User, LoginRequest, RegisterRequest } from '@/types/api'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  setToken: (token: string | null) => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
  persistAuth?: boolean
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  persistAuth = true,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from storage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = persistAuth ? localStorage.getItem('auth_token') : null
        if (storedToken) {
          apiClient.setToken(storedToken)
          setTokenState(storedToken)
          const profile = await apiClient.getProfile()
          setUser(profile)
        }
      } catch (error) {
        console.error('Failed to restore auth:', error)
        localStorage.removeItem('auth_token')
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [persistAuth])

  // Listen for logout events from other tabs
  useEffect(() => {
    const handleLogout = () => {
      setUser(null)
      setTokenState(null)
      apiClient.setToken(null)
      localStorage.removeItem('auth_token')
    }

    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [])

  const setToken = useCallback(
    (newToken: string | null) => {
      setTokenState(newToken)
      apiClient.setToken(newToken)
      if (newToken && persistAuth) {
        localStorage.setItem('auth_token', newToken)
      } else {
        localStorage.removeItem('auth_token')
      }
    },
    [persistAuth],
  )

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const response = await apiClient.login(credentials)
      setToken(response.token)
      setUser(response.user)
    },
    [setToken],
  )

  const register = useCallback(
    async (data: RegisterRequest) => {
      const response = await apiClient.register(data)
      setToken(response.token)
      setUser(response.user)
    },
    [setToken],
  )

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
  }, [setToken])

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    setToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
