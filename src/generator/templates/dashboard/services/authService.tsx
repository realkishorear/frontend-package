import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { UserManager, User } from 'oidc-client-ts'
import { getOidcConfig, getProviderConfig, isOidcConfigured, type OidcProvider, type ExtendedOidcConfig } from '../config/oidc.config'

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

const AuthContext = createContext<AuthContextType | undefined>(undefined)

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

// Create default UserManager instance
let defaultUserManager: UserManager | null = null

function getDefaultUserManager(): UserManager | null {
  if (!isOidcConfigured()) return null
  if (!defaultUserManager) {
    const config = getOidcConfig('default')
    // Convert ExtendedOidcConfig to UserManagerSettings
    defaultUserManager = new UserManager({
      authority: config.authority || '',
      client_id: config.client_id || config.clientId || '',
      redirect_uri: config.redirect_uri || config.redirectUri || window.location.origin,
      post_logout_redirect_uri: config.post_logout_redirect_uri || config.postLogoutRedirectUri || window.location.origin,
      response_type: config.response_type || config.responseType || 'code',
      scope: config.scope || 'openid profile email',
      automaticSilentRenew: config.automaticSilentRenew,
      loadUserInfo: config.loadUserInfo,
      silent_redirect_uri: config.silent_redirect_uri || config.silentRedirectUri || `${window.location.origin}/silent-renew.html`,
      ...(config.extraQueryParams && { extraQueryParams: config.extraQueryParams }),
    })
  }
  return defaultUserManager
}

// Transform OIDC User to our User type
function transformUser(oidcUser: User | null): User | null {
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
  const [user, setUser] = useState<User | null>(getTestUser())
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [testMode, setTestModeState] = useState(isTestMode())

  // Sync test mode state with localStorage
  useEffect(() => {
    const checkTestMode = () => {
      const isTest = isTestMode()
      setTestModeState(isTest)
      if (isTest) {
        const testUser = getTestUser()
        setUser(testUser)
        setIsAuthenticated(!!testUser)
        setLoading(false)
      }
    }

    checkTestMode()
    window.addEventListener('storage', checkTestMode)
    return () => window.removeEventListener('storage', checkTestMode)
  }, [])

  useEffect(() => {
    // If test mode is active, skip OIDC initialization
    if (testMode) {
      setLoading(false)
      return
    }

    const manager = getDefaultUserManager()
    if (!manager) {
      setLoading(false)
      return
    }

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
      if (window.location.pathname.includes('/callback')) {
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
  }, [testMode])

  const signIn = async () => {
    if (testMode) {
      console.log('Test mode: Use test login button instead')
      return
    }
    const manager = getDefaultUserManager()
    if (!manager) {
      console.warn('OIDC is not configured. Use test login for development.')
      return
    }
    await manager.signinRedirect()
  }

  const signOut = async () => {
    if (testMode) {
      setTestMode(false)
      setTestModeState(false)
      setUser(null)
      setIsAuthenticated(false)
      window.location.href = '/login'
      return
    }
    const manager = getDefaultUserManager()
    if (manager) {
      await manager.signoutRedirect()
    } else {
      setUser(null)
      setIsAuthenticated(false)
      window.location.href = '/login'
    }
  }

  const signInRedirect = async (provider?: OidcProvider) => {
    if (testMode) {
      console.log('Test mode: Use test login button instead')
      return
    }

    // If provider is specified, use provider-specific configuration
    if (provider) {
      const providerConfig = getProviderConfig(provider)
      if (providerConfig && providerConfig.enabled) {
        try {
          const oidcConfig = getOidcConfig(provider)
          
          // Validate required fields
          if (!oidcConfig.authority || (!oidcConfig.client_id && !oidcConfig.clientId)) {
            throw new Error(`${providerConfig.name} configuration is incomplete. Missing authority or clientId.`)
          }
          
          const authority = oidcConfig.authority as string
          const clientId = (oidcConfig.client_id || oidcConfig.clientId) as string
          
          const userManager = new UserManager({
            authority,
            client_id: clientId,
            redirect_uri: oidcConfig.redirect_uri || oidcConfig.redirectUri || window.location.origin,
            post_logout_redirect_uri: oidcConfig.post_logout_redirect_uri || oidcConfig.postLogoutRedirectUri || window.location.origin,
            response_type: oidcConfig.response_type || oidcConfig.responseType || 'code',
            scope: oidcConfig.scope || 'openid profile email',
            automaticSilentRenew: oidcConfig.automaticSilentRenew,
            loadUserInfo: oidcConfig.loadUserInfo,
            silent_redirect_uri: oidcConfig.silent_redirect_uri || oidcConfig.silentRedirectUri || `${window.location.origin}/silent-renew.html`,
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
    
    // Default: use the default UserManager configuration
    const manager = getDefaultUserManager()
    if (!manager) {
      console.warn('OIDC is not configured. Use test login for development.')
      return
    }
    await manager.signinRedirect()
  }

  const signOutRedirect = async () => {
    if (testMode) {
      setTestMode(false)
      setTestModeState(false)
      setUser(null)
      setIsAuthenticated(false)
      window.location.href = '/login'
      return
    }
    const manager = getDefaultUserManager()
    if (manager) {
      await manager.signoutRedirect()
    } else {
      setUser(null)
      setIsAuthenticated(false)
      window.location.href = '/login'
    }
  }

  const testLogin = () => {
    setTestMode(true)
    setTestModeState(true)
    setUser(TEST_USER)
    setIsAuthenticated(true)
    window.location.href = '/dashboard'
  }

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    signIn,
    signOut,
    signInRedirect,
    signOutRedirect,
    testLogin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Custom hook to use OIDC authentication with test mode support
 * 
 * This provides a simplified interface using oidc-client-ts
 * Supports test mode for development without OIDC configuration
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    // If AuthProvider is not available, return a fallback that supports test mode
    const [testMode, setTestModeState] = useState(isTestMode())
    const [testUser, setTestUserState] = useState<User | null>(getTestUser())

    useEffect(() => {
      const checkTestMode = () => {
        const isTest = isTestMode()
        setTestModeState(isTest)
        setTestUserState(isTest ? getTestUser() : null)
      }
      checkTestMode()
      window.addEventListener('storage', checkTestMode)
      return () => window.removeEventListener('storage', checkTestMode)
    }, [])

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
          window.location.href = '/login'
        },
        signInRedirect: async (provider?: OidcProvider) => {
          // Try provider-specific configuration even if AuthProvider is not available
          if (provider) {
            const providerConfig = getProviderConfig(provider)
            if (providerConfig && providerConfig.enabled) {
              try {
                const oidcConfig = getOidcConfig(provider)
                
                if (!oidcConfig.authority || (!oidcConfig.client_id && !oidcConfig.clientId)) {
                  throw new Error(`${providerConfig.name} configuration is incomplete. Missing authority or clientId.`)
                }
                
                const authority = oidcConfig.authority as string
                const clientId = (oidcConfig.client_id || oidcConfig.clientId) as string
                
                const userManager = new UserManager({
                  authority,
                  client_id: clientId,
                  redirect_uri: oidcConfig.redirect_uri || oidcConfig.redirectUri || window.location.origin,
                  post_logout_redirect_uri: oidcConfig.post_logout_redirect_uri || oidcConfig.postLogoutRedirectUri || window.location.origin,
                  response_type: oidcConfig.response_type || oidcConfig.responseType || 'code',
                  scope: oidcConfig.scope || 'openid profile email',
                  automaticSilentRenew: oidcConfig.automaticSilentRenew,
                  loadUserInfo: oidcConfig.loadUserInfo,
                  silent_redirect_uri: oidcConfig.silent_redirect_uri || oidcConfig.silentRedirectUri || `${window.location.origin}/silent-renew.html`,
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
          window.location.href = '/login'
        },
        testLogin: () => {
          setTestMode(true)
          setTestModeState(true)
          window.location.href = '/dashboard'
        },
      }
    }

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
        window.location.href = '/login'
      },
      signInRedirect: async (provider?: OidcProvider) => {
        // Try provider-specific configuration even if AuthProvider is not available
        if (provider) {
          const providerConfig = getProviderConfig(provider)
          if (providerConfig && providerConfig.enabled) {
            try {
              const oidcConfig = getOidcConfig(provider)
              
              if (!oidcConfig.authority || (!oidcConfig.client_id && !oidcConfig.clientId)) {
                throw new Error(`${providerConfig.name} configuration is incomplete. Missing authority or clientId.`)
              }
              
              const authority = oidcConfig.authority as string
              const clientId = (oidcConfig.client_id || oidcConfig.clientId) as string
              
              const userManager = new UserManager({
                authority,
                client_id: clientId,
                redirect_uri: oidcConfig.redirect_uri || oidcConfig.redirectUri || window.location.origin,
                post_logout_redirect_uri: oidcConfig.post_logout_redirect_uri || oidcConfig.postLogoutRedirectUri || window.location.origin,
                response_type: oidcConfig.response_type || oidcConfig.responseType || 'code',
                scope: oidcConfig.scope || 'openid profile email',
                automaticSilentRenew: oidcConfig.automaticSilentRenew,
                loadUserInfo: oidcConfig.loadUserInfo,
                silent_redirect_uri: oidcConfig.silent_redirect_uri || oidcConfig.silentRedirectUri || `${window.location.origin}/silent-renew.html`,
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
        window.location.href = '/login'
      },
      testLogin: () => {
        setTestMode(true)
        setTestModeState(true)
        window.location.href = '/dashboard'
      },
    }
  }
  return context
}
