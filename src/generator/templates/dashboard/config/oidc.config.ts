import { AuthProviderProps } from 'oidc-react'

/**
 * OIDC Configuration
 * 
 * TODO: Replace these values with your actual OIDC provider settings
 * 
 * Common OIDC Providers:
 * - Auth0: https://auth0.com/docs/quickstart/spa/react
 * - Keycloak: https://www.keycloak.org/docs/latest/securing_apps/
 * - Okta: https://developer.okta.com/docs/guides/sign-into-spa/react/before-you-begin/
 * - Azure AD: https://learn.microsoft.com/en-us/azure/active-directory/develop/tutorial-v2-react
 * 
 * Example configuration for Auth0:
 * - authority: `https://YOUR_DOMAIN.auth0.com`
 * - clientId: Your Auth0 Application Client ID
 * - redirectUri: `http://localhost:5173` (or your production URL)
 */
// Helper to safely get environment variables
// For webpack: process.env is replaced by DefinePlugin at build time (becomes a string literal)
// For vite: import.meta.env is used
// This function safely handles both cases
const getEnvVar = (key: string, defaultValue: string): string => {
  // Webpack DefinePlugin replaces process.env.KEY with the actual string value at build time
  // So we check if the value exists and is not undefined
  try {
    // @ts-ignore - process.env is replaced by webpack DefinePlugin
    const value = process?.env?.[key]
    if (value && typeof value === 'string' && value !== 'undefined') {
      return value
    }
  } catch (e) {
    // process is not defined (browser environment without DefinePlugin)
  }
  return defaultValue
}

export const oidcConfig: AuthProviderProps = {
  // Your OIDC provider's authority URL
  // Example: 'https://your-oidc-provider.com'
  authority: getEnvVar('REACT_APP_OIDC_AUTHORITY', 'https://your-oidc-provider.com'),
  
  // Your application's client ID
  clientId: getEnvVar('REACT_APP_OIDC_CLIENT_ID', 'your-client-id'),
  
  // Redirect URI after authentication
  redirectUri: getEnvVar('REACT_APP_OIDC_REDIRECT_URI', window.location.origin),
  
  // Post logout redirect URI
  postLogoutRedirectUri: getEnvVar('REACT_APP_OIDC_POST_LOGOUT_REDIRECT_URI', window.location.origin),
  
  // Response type - typically 'code' for Authorization Code Flow
  responseType: 'code',
  
  // Scope - what information you want from the identity provider
  scope: 'openid profile email',
  
  // Automatic silent renew
  automaticSilentRenew: true,
  
  // Load user info
  loadUserInfo: true,
  
  // Silent redirect URI for token renewal
  silentRedirectUri: getEnvVar('REACT_APP_OIDC_SILENT_REDIRECT_URI', `${window.location.origin}/silent-renew.html`),
  
  // Additional settings
  onSignIn: () => {
    // Called after successful sign in
    console.log('User signed in successfully')
    // You can redirect here if needed
    // window.location.href = '/dashboard'
  },
  
  onSignOut: () => {
    // Called after sign out
    console.log('User signed out')
  },
  
  // Optional: Custom user store
  // userStore: new WebStorageStateStore({ store: window.localStorage }),
}

/**
 * Environment variables needed (create a .env file):
 * 
 * REACT_APP_OIDC_AUTHORITY=https://your-oidc-provider.com
 * REACT_APP_OIDC_CLIENT_ID=your-client-id
 * REACT_APP_OIDC_REDIRECT_URI=http://localhost:5173
 * REACT_APP_OIDC_POST_LOGOUT_REDIRECT_URI=http://localhost:5173
 * REACT_APP_OIDC_SILENT_REDIRECT_URI=http://localhost:5173/silent-renew.html
 */

