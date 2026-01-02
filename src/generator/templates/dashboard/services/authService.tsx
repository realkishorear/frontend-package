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
 * Custom hook to use OIDC authentication
 * 
 * This wraps the oidc-react useAuth hook and provides a simplified interface
 */
export function useAuth(): AuthContextType {
  const auth = useOidcAuth()

  // Transform OIDC user to our User type
  // userData from oidc-react can have various properties depending on the OIDC provider
  const user: User | null = auth.userData
    ? {
        id: (auth.userData as any).sub || (auth.userData as any).id || '',
        name: (auth.userData as any).name || (auth.userData as any).preferred_username || '',
        email: (auth.userData as any).email || '',
        avatar: (auth.userData as any).picture || (auth.userData as any).avatar_url,
      }
    : null

  // Handle oidc-react API - use type assertions for properties that may not be in the type definition
  const authAny = auth as any

  return {
    user,
    loading: auth.isLoading,
    isAuthenticated: authAny.isAuthenticated ?? !!auth.userData,
    signIn: async () => {
      if (authAny.signIn) {
        await authAny.signIn()
      } else if (authAny.signInRedirect) {
        await authAny.signInRedirect()
      }
    },
    signOut: async () => {
      if (authAny.signOut) {
        await authAny.signOut()
      } else if (authAny.signOutRedirect) {
        await authAny.signOutRedirect()
      }
    },
    signInRedirect: async () => {
      if (authAny.signInRedirect) {
        await authAny.signInRedirect()
      } else if (authAny.signIn) {
        await authAny.signIn()
      }
    },
    signOutRedirect: async () => {
      if (authAny.signOutRedirect) {
        await authAny.signOutRedirect()
      } else if (authAny.signOut) {
        await authAny.signOut()
      }
    },
  }
}

/**
 * AuthProvider Component
 * 
 * This is now handled by the AuthProvider from oidc-react in App.tsx
 * This file exports the useAuth hook for components to use
 */
