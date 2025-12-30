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
export const oidcConfig: AuthProviderProps = {
  // Your OIDC provider's authority URL
  // Example: 'https://your-oidc-provider.com'
  authority: process.env.REACT_APP_OIDC_AUTHORITY || 'https://your-oidc-provider.com',
  
  // Your application's client ID
  clientId: process.env.REACT_APP_OIDC_CLIENT_ID || 'your-client-id',
  
  // Redirect URI after authentication
  redirectUri: process.env.REACT_APP_OIDC_REDIRECT_URI || window.location.origin,
  
  // Post logout redirect URI
  postLogoutRedirectUri: process.env.REACT_APP_OIDC_POST_LOGOUT_REDIRECT_URI || window.location.origin,
  
  // Response type - typically 'code' for Authorization Code Flow
  responseType: 'code',
  
  // Scope - what information you want from the identity provider
  scope: 'openid profile email',
  
  // Automatic silent renew
  automaticSilentRenew: true,
  
  // Load user info
  loadUserInfo: true,
  
  // Silent redirect URI for token renewal
  silentRedirectUri: process.env.REACT_APP_OIDC_SILENT_REDIRECT_URI || `${window.location.origin}/silent-renew.html`,
  
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

