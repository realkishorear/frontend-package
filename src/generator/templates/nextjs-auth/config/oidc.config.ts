import { UserManagerSettings } from 'oidc-client-ts'

/**
 * OIDC Configuration for Next.js
 * 
 * TODO: Replace these values with your actual OIDC provider settings
 */
export const oidcConfig: UserManagerSettings = {
  // Your OIDC provider's authority URL
  authority: process.env.NEXT_PUBLIC_OIDC_AUTHORITY || 'https://your-oidc-provider.com',
  
  // Your application's client ID
  client_id: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID || 'your-client-id',
  
  // Redirect URI after authentication
  redirect_uri: typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_OIDC_REDIRECT_URI || window.location.origin)
    : process.env.NEXT_PUBLIC_OIDC_REDIRECT_URI || 'http://localhost:3000',
  
  // Post logout redirect URI
  post_logout_redirect_uri: typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_OIDC_POST_LOGOUT_REDIRECT_URI || window.location.origin)
    : process.env.NEXT_PUBLIC_OIDC_POST_LOGOUT_REDIRECT_URI || 'http://localhost:3000',
  
  // Response type
  response_type: 'code',
  
  // Scope
  scope: 'openid profile email',
  
  // Automatic silent renew
  automaticSilentRenew: true,
  
  // Load user info
  loadUserInfo: true,
  
  // Silent redirect URI for token renewal
  silent_redirect_uri: typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_OIDC_SILENT_REDIRECT_URI || `${window.location.origin}/silent-renew.html`)
    : process.env.NEXT_PUBLIC_OIDC_SILENT_REDIRECT_URI || 'http://localhost:3000/silent-renew.html',
}

/**
 * Environment variables needed (create a .env.local file):
 * 
 * NEXT_PUBLIC_OIDC_AUTHORITY=https://your-oidc-provider.com
 * NEXT_PUBLIC_OIDC_CLIENT_ID=your-client-id
 * NEXT_PUBLIC_OIDC_REDIRECT_URI=http://localhost:3000
 * NEXT_PUBLIC_OIDC_POST_LOGOUT_REDIRECT_URI=http://localhost:3000
 * NEXT_PUBLIC_OIDC_SILENT_REDIRECT_URI=http://localhost:3000/silent-renew.html
 */

