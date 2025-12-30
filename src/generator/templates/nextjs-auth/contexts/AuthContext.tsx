'use client'

import { useContext } from 'react'
import { useAuth as useOidcAuth } from 'oidc-react'

// Types
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  signInRedirect: () => Promise<void>
  signOutRedirect: () => Promise<void>
}

/**
 * Custom hook to use OIDC authentication in Next.js
 */
export function useAuth(): AuthContextType {
  const auth = useOidcAuth()

  // Transform OIDC user to our User type
  const user: User | null = auth.userData
    ? {
        id: auth.userData.sub || auth.userData.id || '',
        name: auth.userData.name || auth.userData.preferred_username || '',
        email: auth.userData.email || '',
        avatar: auth.userData.picture || auth.userData.avatar_url,
      }
    : null

  return {
    user,
    loading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    signIn: async () => {
      await auth.signIn()
    },
    signOut: async () => {
      await auth.signOut()
    },
    signInRedirect: async () => {
      await auth.signInRedirect()
    },
    signOutRedirect: async () => {
      await auth.signOutRedirect()
    },
  }
}

/**
 * AuthProvider is now handled by oidc-react's AuthProvider in layout.tsx
 * This file exports the useAuth hook for components to use
 */
