import { useState, useEffect } from 'react'
import { useAuth as useOidcAuth } from 'oidc-react'
import { UserManager } from 'oidc-client-ts'
import { getOidcConfig, getProviderConfig, type OidcProvider, type ExtendedOidcConfig } from '../config/oidc.config'

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
  signInRedirect: (provider?: OidcProvider) => Promise<void>
  signOutRedirect: () => Promise<void>
  testLogin: () => void
}

// Test mode storage key
const TEST_MODE_KEY = 'dashboard_test_mode'
const TEST_USER_KEY = 'dashboard_test_user'

// Test user data
const TEST_USER: User = {
  id: 'test-user-123',
  name: 'Test User',
  email: 'test@example.com',
  avatar: 'https://ui-avatars.com/api/?name=Test+User&background=3b82f6&color=fff',
}

// Helper functions for test mode
export const setTestMode = (enabled: boolean) => {
  if (enabled) {
    localStorage.setItem(TEST_MODE_KEY, 'true')
    localStorage.setItem(TEST_USER_KEY, JSON.stringify(TEST_USER))
  } else {
    localStorage.removeItem(TEST_MODE_KEY)
    localStorage.removeItem(TEST_USER_KEY)
  }
}

export const isTestMode = (): boolean => {
  return localStorage.getItem(TEST_MODE_KEY) === 'true'
}

export const getTestUser = (): User | null => {
  if (!isTestMode()) return null
  const userStr = localStorage.getItem(TEST_USER_KEY)
  if (userStr) {
    try {
      return JSON.parse(userStr) as User
    } catch {
      return TEST_USER
    }
  }
  return TEST_USER
}

/**
 * Custom hook to use OIDC authentication with test mode support
 * 
 * This wraps the oidc-react useAuth hook and provides a simplified interface
 * Supports test mode for development without OIDC configuration
 */
export function useAuth(): AuthContextType {
  const [testMode, setTestModeState] = useState(isTestMode())
  const [testUser, setTestUserState] = useState<User | null>(getTestUser())

  // Sync test mode state with localStorage
  useEffect(() => {
    const checkTestMode = () => {
      const isTest = isTestMode()
      setTestModeState(isTest)
      setTestUserState(isTest ? getTestUser() : null)
    }

    checkTestMode()
    // Listen for storage changes (e.g., from other tabs)
    window.addEventListener('storage', checkTestMode)
    return () => window.removeEventListener('storage', checkTestMode)
  }, [])

  // If test mode is active, return test user
  if (testMode && testUser) {
    return {
      user: testUser,
      loading: false,
      isAuthenticated: true,
      signIn: async () => {
        console.log('Test mode: Use test login button instead')
      },
      signOut: async () => {
        setTestMode(false)
        setTestModeState(false)
        setTestUserState(null)
        window.location.href = '/login'
      },
      signInRedirect: async () => {
        console.log('Test mode: Use test login button instead')
      },
      signOutRedirect: async () => {
        setTestMode(false)
        setTestModeState(false)
        setTestUserState(null)
        window.location.href = '/login'
      },
      testLogin: () => {
        setTestMode(true)
        setTestModeState(true)
        setTestUserState(TEST_USER)
        window.location.href = '/dashboard'
      },
    }
  }

  try {
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
      signInRedirect: async (provider?: OidcProvider) => {
        // If provider is specified, use provider-specific configuration
        if (provider) {
          const providerConfig = getProviderConfig(provider)
          if (providerConfig && providerConfig.enabled) {
            try {
              const oidcConfig = getOidcConfig(provider)
              
              // Validate required fields
              if (!oidcConfig.authority || !oidcConfig.clientId) {
                throw new Error(`${providerConfig.name} configuration is incomplete. Missing authority or clientId.`)
              }
              
              // TypeScript type narrowing: after validation, we know these are strings
              const authority = oidcConfig.authority as string
              const clientId = oidcConfig.clientId as string
              
              const userManager = new UserManager({
                authority,
                client_id: clientId,
                redirect_uri: oidcConfig.redirectUri || window.location.origin,
                post_logout_redirect_uri: oidcConfig.postLogoutRedirectUri || window.location.origin,
                response_type: oidcConfig.responseType || 'code',
                scope: oidcConfig.scope || 'openid profile email',
                automaticSilentRenew: oidcConfig.automaticSilentRenew,
                loadUserInfo: oidcConfig.loadUserInfo,
                silent_redirect_uri: oidcConfig.silentRedirectUri || `${window.location.origin}/silent-renew.html`,
                ...(oidcConfig.extraQueryParams && { extraQueryParams: oidcConfig.extraQueryParams }),
              })
              await userManager.signinRedirect()
              return
            } catch (err: any) {
              console.error(`Error signing in with ${provider}:`, err)
              throw new Error(`Failed to sign in with ${providerConfig.name}: ${err.message}`)
            }
          } else {
            throw new Error(`${providerConfig?.name || provider} is not configured`)
          }
        }
        
        // Default: use the AuthProvider's configuration
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
      testLogin: () => {
        setTestMode(true)
        setTestModeState(true)
        setTestUserState(TEST_USER)
        window.location.href = '/dashboard'
      },
    }
  } catch (error: any) {
    // Handle case where AuthProvider is not available (OIDC not configured)
    if (error?.message?.includes('AuthProvider context is undefined')) {
      // Return auth object with test login support
      return {
        user: testUser,
        loading: false,
        isAuthenticated: !!testUser,
        signIn: async () => {
          console.warn('OIDC is not configured. Use test login for development.')
        },
        signOut: async () => {
          setTestMode(false)
          setTestModeState(false)
          setTestUserState(null)
          window.location.href = '/login'
        },
        signInRedirect: async (provider?: OidcProvider) => {
          // Try provider-specific configuration even if AuthProvider is not available
          if (provider) {
            const providerConfig = getProviderConfig(provider)
            if (providerConfig && providerConfig.enabled) {
              try {
                const oidcConfig = getOidcConfig(provider)
                
                // Validate required fields
                if (!oidcConfig.authority || !oidcConfig.clientId) {
                  throw new Error(`${providerConfig.name} configuration is incomplete. Missing authority or clientId.`)
                }
                
                // TypeScript type narrowing: after validation, we know these are strings
                const authority = oidcConfig.authority as string
                const clientId = oidcConfig.clientId as string
                
                const userManager = new UserManager({
                  authority,
                  client_id: clientId,
                  redirect_uri: oidcConfig.redirectUri || window.location.origin,
                  post_logout_redirect_uri: oidcConfig.postLogoutRedirectUri || window.location.origin,
                  response_type: oidcConfig.responseType || 'code',
                  scope: oidcConfig.scope || 'openid profile email',
                  automaticSilentRenew: oidcConfig.automaticSilentRenew,
                  loadUserInfo: oidcConfig.loadUserInfo,
                  silent_redirect_uri: oidcConfig.silentRedirectUri || `${window.location.origin}/silent-renew.html`,
                  ...(oidcConfig.extraQueryParams && { extraQueryParams: oidcConfig.extraQueryParams }),
                })
                await userManager.signinRedirect()
                return
              } catch (err: any) {
                console.error(`Error signing in with ${provider}:`, err)
                throw new Error(`Failed to sign in with ${providerConfig.name}: ${err.message}`)
              }
            } else {
              throw new Error(`${providerConfig?.name || provider} is not configured`)
            }
          }
          console.warn('OIDC is not configured. Use test login for development.')
        },
        signOutRedirect: async () => {
          setTestMode(false)
          setTestModeState(false)
          setTestUserState(null)
          window.location.href = '/login'
        },
        testLogin: () => {
          setTestMode(true)
          setTestModeState(true)
          setTestUserState(TEST_USER)
          window.location.href = '/dashboard'
        },
      }
    }
    throw error
  }
}

/**
 * AuthProvider Component
 * 
 * This is now handled by the AuthProvider from oidc-react in App.tsx
 * This file exports the useAuth hook for components to use
 */
