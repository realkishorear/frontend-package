import { AuthProviderProps } from 'oidc-react'

/**
 * OIDC Configuration - Open-ended setup for OAuth/OIDC providers
 * 
 * This configuration supports any OIDC-compliant provider including:
 * - Microsoft Azure AD / Entra ID
 * - Google OAuth 2.0
 * - Facebook (via OIDC bridge or Auth0)
 * - Auth0
 * - Keycloak
 * - Okta
 * - Custom OIDC providers
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a .env file in your project root
 * 2. Add your OIDC provider credentials (see examples below)
 * 3. Restart your dev server
 * 
 * EXAMPLE CONFIGURATIONS:
 * 
 * Microsoft Azure AD:
 * REACT_APP_OIDC_AUTHORITY=https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0
 * REACT_APP_OIDC_CLIENT_ID=your-azure-app-client-id
 * 
 * Google OAuth:
 * REACT_APP_OIDC_AUTHORITY=https://accounts.google.com
 * REACT_APP_OIDC_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
 * 
 * Facebook (via Auth0 or custom OIDC):
 * REACT_APP_OIDC_AUTHORITY=https://YOUR_DOMAIN.auth0.com (if using Auth0)
 * REACT_APP_OIDC_CLIENT_ID=your-auth0-client-id
 * 
 * Auth0:
 * REACT_APP_OIDC_AUTHORITY=https://YOUR_DOMAIN.auth0.com
 * REACT_APP_OIDC_CLIENT_ID=your-auth0-client-id
 */

// Helper to safely get environment variables
const getEnvVar = (key: string, defaultValue: string): string => {
  try {
    // @ts-ignore - process.env is replaced by webpack DefinePlugin
    const value = process?.env?.[key]
    if (value && typeof value === 'string' && value !== 'undefined' && value.trim() !== '') {
      return value
    }
  } catch (e) {
    // process is not defined (browser environment without DefinePlugin)
  }
  return defaultValue
}

// Check if OIDC is properly configured (not using placeholder values)
export const isOidcConfigured = (): boolean => {
  const authority = getEnvVar('REACT_APP_OIDC_AUTHORITY', '')
  const clientId = getEnvVar('REACT_APP_OIDC_CLIENT_ID', '')
  
  return (
    authority !== '' &&
    authority !== 'https://your-oidc-provider.com' &&
    authority !== 'https://placeholder-oidc-provider.com' &&
    clientId !== '' &&
    clientId !== 'your-client-id' &&
    clientId !== 'placeholder-client-id'
  )
}

// Get configuration values
const authority = getEnvVar('REACT_APP_OIDC_AUTHORITY', '')
const clientId = getEnvVar('REACT_APP_OIDC_CLIENT_ID', '')

export const oidcConfig: AuthProviderProps = {
  // Your OIDC provider's authority URL
  // Use placeholder values if not configured to prevent network errors
  authority: authority || 'https://placeholder-oidc-provider.com',
  
  // Your application's client ID
  clientId: clientId || 'placeholder-client-id',
  
  // Redirect URI after authentication
  redirectUri: getEnvVar('REACT_APP_OIDC_REDIRECT_URI', window.location.origin),
  
  // Post logout redirect URI
  postLogoutRedirectUri: getEnvVar('REACT_APP_OIDC_POST_LOGOUT_REDIRECT_URI', window.location.origin),
  
  // Response type - typically 'code' for Authorization Code Flow
  responseType: 'code',
  
  // Scope - what information you want from the identity provider
  scope: getEnvVar('REACT_APP_OIDC_SCOPE', 'openid profile email'),
  
  // Automatic silent renew
  automaticSilentRenew: true,
  
  // Load user info
  loadUserInfo: true,
  
  // Silent redirect URI for token renewal
  silentRedirectUri: getEnvVar('REACT_APP_OIDC_SILENT_REDIRECT_URI', `${window.location.origin}/silent-renew.html`),
  
  // Error handling - prevent crashes when OIDC is not configured
  onError: (error) => {
    if (!isOidcConfigured()) {
      console.warn('OIDC is not configured. Please set up your OIDC provider in .env file.')
      console.warn('See config/oidc.config.ts for setup instructions.')
      return
    }
    console.error('OIDC Error:', error)
  },
  
  // Additional settings
  onSignIn: () => {
    console.log('User signed in successfully')
  },
  
  onSignOut: () => {
    console.log('User signed out')
  },
}

/**
 * ENVIRONMENT VARIABLES SETUP
 * 
 * Create a .env file in your project root with the following variables:
 * 
 * REQUIRED:
 * REACT_APP_OIDC_AUTHORITY=your-oidc-provider-authority-url
 * REACT_APP_OIDC_CLIENT_ID=your-client-id
 * 
 * OPTIONAL (defaults provided):
 * REACT_APP_OIDC_REDIRECT_URI=http://localhost:3000 (defaults to window.location.origin)
 * REACT_APP_OIDC_POST_LOGOUT_REDIRECT_URI=http://localhost:3000 (defaults to window.location.origin)
 * REACT_APP_OIDC_SILENT_REDIRECT_URI=http://localhost:3000/silent-renew.html
 * REACT_APP_OIDC_SCOPE=openid profile email (defaults to 'openid profile email')
 * 
 * PROVIDER-SPECIFIC EXAMPLES:
 * 
 * 1. Microsoft Azure AD / Entra ID:
 *    REACT_APP_OIDC_AUTHORITY=https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0
 *    REACT_APP_OIDC_CLIENT_ID=your-azure-app-client-id
 *    REACT_APP_OIDC_SCOPE=openid profile email
 *    Note: Register your app in Azure Portal > App registrations
 * 
 * 2. Google OAuth 2.0:
 *    REACT_APP_OIDC_AUTHORITY=https://accounts.google.com
 *    REACT_APP_OIDC_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
 *    REACT_APP_OIDC_SCOPE=openid profile email
 *    Note: Create OAuth 2.0 credentials in Google Cloud Console
 * 
 * 3. Facebook (via Auth0 or custom OIDC bridge):
 *    REACT_APP_OIDC_AUTHORITY=https://YOUR_DOMAIN.auth0.com
 *    REACT_APP_OIDC_CLIENT_ID=your-auth0-client-id
 *    REACT_APP_OIDC_SCOPE=openid profile email
 *    Note: Configure Facebook as a social connection in Auth0
 * 
 * 4. Auth0:
 *    REACT_APP_OIDC_AUTHORITY=https://YOUR_DOMAIN.auth0.com
 *    REACT_APP_OIDC_CLIENT_ID=your-auth0-client-id
 *    REACT_APP_OIDC_SCOPE=openid profile email
 * 
 * 5. Keycloak:
 *    REACT_APP_OIDC_AUTHORITY=https://your-keycloak-server.com/realms/your-realm
 *    REACT_APP_OIDC_CLIENT_ID=your-keycloak-client-id
 *    REACT_APP_OIDC_SCOPE=openid profile email
 * 
 * For more details, see: https://github.com/bjerkio/oidc-react
 */

