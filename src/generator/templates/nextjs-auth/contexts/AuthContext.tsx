'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { UserManager, User } from 'oidc-client-ts'
import { oidcConfig } from '../config/oidc.config'

// Types
export interface AuthUser {
  id: string
  name: string
  email: string
  avatar?: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  isAuthenticated: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  signInRedirect: () => Promise<void>
  signOutRedirect: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Create UserManager instance
let userManager: UserManager | null = null

function getUserManager(): UserManager {
  if (!userManager) {
    userManager = new UserManager(oidcConfig)
  }
  return userManager
}

// Transform OIDC User to AuthUser
function transformUser(oidcUser: User | null): AuthUser | null {
  if (!oidcUser) return null
  
  const profile = oidcUser.profile
  return {
    id: profile.sub || profile.id || '',
    name: profile.name || profile.preferred_username || '',
    email: profile.email || '',
    avatar: profile.picture || profile.avatar_url,
  }
}

interface AuthProviderProps {
  children: ReactNode
}

/**
 * AuthProvider Component
 * Provides OIDC authentication context using oidc-client-ts
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const manager = getUserManager()

    // Initialize: check for existing user
    const initAuth = async () => {
      try {
        setLoading(true)
        const oidcUser = await manager.getUser()
        const authUser = transformUser(oidcUser)
        setUser(authUser)
        setIsAuthenticated(oidcUser !== null && !oidcUser.expired)
      } catch (error) {
        console.error('Error initializing auth:', error)
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Handle callback if we're on the callback route
    const handleCallback = async () => {
      if (typeof window !== 'undefined' && window.location.pathname.includes('/callback')) {
        try {
          const oidcUser = await manager.signinRedirectCallback()
          const authUser = transformUser(oidcUser)
          setUser(authUser)
          setIsAuthenticated(true)
          // Redirect to dashboard after successful login
          window.history.replaceState({}, '', '/dashboard')
        } catch (error) {
          console.error('Error handling callback:', error)
          setUser(null)
          setIsAuthenticated(false)
        } finally {
          setLoading(false)
        }
      }
    }

    handleCallback()

    // Set up event listeners
    const onUserLoaded = (oidcUser: User) => {
      const authUser = transformUser(oidcUser)
      setUser(authUser)
      setIsAuthenticated(true)
      setLoading(false)
    }

    const onUserUnloaded = () => {
      setUser(null)
      setIsAuthenticated(false)
    }

    const onAccessTokenExpiring = () => {
      // Token is expiring, silent renew should handle this
      console.log('Access token expiring')
    }

    const onAccessTokenExpired = () => {
      // Token expired, user needs to re-authenticate
      setUser(null)
      setIsAuthenticated(false)
    }

    manager.events.addUserLoaded(onUserLoaded)
    manager.events.addUserUnloaded(onUserUnloaded)
    manager.events.addAccessTokenExpiring(onAccessTokenExpiring)
    manager.events.addAccessTokenExpired(onAccessTokenExpired)

    // Cleanup
    return () => {
      manager.events.removeUserLoaded(onUserLoaded)
      manager.events.removeUserUnloaded(onUserUnloaded)
      manager.events.removeAccessTokenExpiring(onAccessTokenExpiring)
      manager.events.removeAccessTokenExpired(onAccessTokenExpired)
    }
  }, [])

  const signIn = async () => {
    const manager = getUserManager()
    await manager.signinRedirect()
  }

  const signOut = async () => {
    const manager = getUserManager()
    await manager.signoutRedirect()
  }

  const signInRedirect = async () => {
    const manager = getUserManager()
    await manager.signinRedirect()
  }

  const signOutRedirect = async () => {
    const manager = getUserManager()
    await manager.signoutRedirect()
  }

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    signIn,
    signOut,
    signInRedirect,
    signOutRedirect,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Custom hook to use OIDC authentication in Next.js
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
