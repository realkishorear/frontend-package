import { UserManagerSettings } from 'oidc-client-ts'

// Extended config interface that includes extraQueryParams for UserManager
export interface ExtendedOidcConfig extends UserManagerSettings {
  extraQueryParams?: Record<string, string>
  // Legacy camelCase properties for backward compatibility
  authority?: string
  clientId?: string
  redirectUri?: string
  postLogoutRedirectUri?: string
  responseType?: string
  scope?: string
  silentRedirectUri?: string
  onSignIn?: () => void
  onSignOut?: () => void
}

/**
 * OIDC Configuration - Multi-Provider Support
 * 
 * This configuration supports multiple OIDC providers:
 * - Microsoft Azure AD / Entra ID
 * - Google OAuth 2.0
 * - Facebook (via Auth0 or custom OIDC bridge)
 * - Auth0 (supports multiple social providers)
 * - Keycloak
 * - Okta
 * - Custom OIDC providers
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a .env file in your project root
 * 2. Configure your providers (see examples below)
 * 3. Restart your dev server
 * 
 * MULTI-PROVIDER CONFIGURATION:
 * 
 * To enable multiple providers, configure each one:
 * 
 * Microsoft Azure AD:
 * REACT_APP_OIDC_MICROSOFT_AUTHORITY=https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0
 * REACT_APP_OIDC_MICROSOFT_CLIENT_ID=your-azure-app-client-id
 * 
 * Google OAuth:
 * REACT_APP_OIDC_GOOGLE_AUTHORITY=https://accounts.google.com
 * REACT_APP_OIDC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
 * 
 * Facebook (via Auth0):
 * REACT_APP_OIDC_FACEBOOK_AUTHORITY=https://YOUR_DOMAIN.auth0.com
 * REACT_APP_OIDC_FACEBOOK_CLIENT_ID=your-auth0-client-id
 * REACT_APP_OIDC_FACEBOOK_CONNECTION=facebook (Auth0 connection name)
 * 
 * SINGLE PROVIDER (Legacy):
 * REACT_APP_OIDC_AUTHORITY=your-oidc-provider-authority-url
 * REACT_APP_OIDC_CLIENT_ID=your-client-id
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

// Provider types
export type OidcProvider = 'microsoft' | 'google' | 'facebook' | 'default'

// Provider configuration interface
export interface ProviderConfig {
  authority: string
  clientId: string
  enabled: boolean
  name: string
  connection?: string // For Auth0 connections
}

// Get provider-specific configuration
export const getProviderConfig = (provider: OidcProvider): ProviderConfig | null => {
  switch (provider) {
    case 'microsoft': {
      const authority = getEnvVar('REACT_APP_OIDC_MICROSOFT_AUTHORITY', '')
      const clientId = getEnvVar('REACT_APP_OIDC_MICROSOFT_CLIENT_ID', '')
      return {
        authority,
        clientId,
        enabled: authority !== '' && clientId !== '' && 
                !authority.includes('placeholder') && !clientId.includes('placeholder'),
        name: 'Microsoft',
      }
    }
    case 'google': {
      const authority = getEnvVar('REACT_APP_OIDC_GOOGLE_AUTHORITY', 'https://accounts.google.com')
      const clientId = getEnvVar('REACT_APP_OIDC_GOOGLE_CLIENT_ID', '')
      return {
        authority,
        clientId,
        enabled: clientId !== '' && !clientId.includes('placeholder'),
        name: 'Google',
      }
    }
    case 'facebook': {
      const authority = getEnvVar('REACT_APP_OIDC_FACEBOOK_AUTHORITY', '')
      const clientId = getEnvVar('REACT_APP_OIDC_FACEBOOK_CLIENT_ID', '')
      const connection = getEnvVar('REACT_APP_OIDC_FACEBOOK_CONNECTION', 'facebook')
      return {
        authority,
        clientId,
        enabled: authority !== '' && clientId !== '' && 
                !authority.includes('placeholder') && !clientId.includes('placeholder'),
        name: 'Facebook',
        connection,
      }
    }
    case 'default': {
      const authority = getEnvVar('REACT_APP_OIDC_AUTHORITY', '')
      const clientId = getEnvVar('REACT_APP_OIDC_CLIENT_ID', '')
      return {
        authority,
        clientId,
        enabled: authority !== '' && clientId !== '' && 
                !authority.includes('placeholder') && !authority.includes('your-oidc-provider') &&
                !clientId.includes('placeholder') && !clientId.includes('your-client-id'),
        name: 'OIDC',
      }
    }
    default:
      return null
  }
}

// Get all enabled providers
export const getEnabledProviders = (): Array<{ provider: OidcProvider; config: ProviderConfig }> => {
  const providers: OidcProvider[] = ['microsoft', 'google', 'facebook', 'default']
  return providers
    .map(provider => {
      const config = getProviderConfig(provider)
      return config && config.enabled ? { provider, config } : null
    })
    .filter((item): item is { provider: OidcProvider; config: ProviderConfig } => item !== null)
}

// Get OIDC config for a specific provider
export const getOidcConfig = (provider: OidcProvider = 'default'): ExtendedOidcConfig => {
  const providerConfig = getProviderConfig(provider)
  
  if (!providerConfig || !providerConfig.enabled) {
    // Fallback to default or placeholder
    const defaultConfig = getProviderConfig('default')
    if (defaultConfig && defaultConfig.enabled) {
      return createOidcConfig(defaultConfig)
    }
    // Return placeholder config
    return createOidcConfig({
      authority: 'https://placeholder-oidc-provider.com',
      clientId: 'placeholder-client-id',
      enabled: false,
      name: 'Placeholder',
    })
  }
  
  return createOidcConfig(providerConfig, provider)
}

// Create OIDC config from provider config
const createOidcConfig = (providerConfig: ProviderConfig, provider?: OidcProvider): ExtendedOidcConfig => {
  const baseRedirectUri = getEnvVar('REACT_APP_OIDC_REDIRECT_URI', window.location.origin)
  
  const config: ExtendedOidcConfig = {
    authority: providerConfig.authority || 'https://placeholder-oidc-provider.com',
    client_id: providerConfig.clientId || 'placeholder-client-id',
    redirect_uri: baseRedirectUri,
    post_logout_redirect_uri: getEnvVar('REACT_APP_OIDC_POST_LOGOUT_REDIRECT_URI', window.location.origin),
    response_type: 'code',
    scope: getEnvVar('REACT_APP_OIDC_SCOPE', 'openid profile email'),
    automaticSilentRenew: true,
    loadUserInfo: true,
    silent_redirect_uri: getEnvVar('REACT_APP_OIDC_SILENT_REDIRECT_URI', `${window.location.origin}/silent-renew.html`),
    // Legacy camelCase properties for backward compatibility
    clientId: providerConfig.clientId || 'placeholder-client-id',
    redirectUri: baseRedirectUri,
    postLogoutRedirectUri: getEnvVar('REACT_APP_OIDC_POST_LOGOUT_REDIRECT_URI', window.location.origin),
    responseType: 'code',
    silentRedirectUri: getEnvVar('REACT_APP_OIDC_SILENT_REDIRECT_URI', `${window.location.origin}/silent-renew.html`),
    onSignIn: () => {
      console.log(`User signed in successfully with ${providerConfig.name}`)
    },
    onSignOut: () => {
      console.log('User signed out')
    },
  }
  
  // For Auth0 with Facebook connection, add connection parameter
  if (provider === 'facebook' && providerConfig.connection && providerConfig.authority.includes('auth0.com')) {
    // Auth0 requires connection parameter in extraQueryParams for UserManager
    config.extraQueryParams = {
      connection: providerConfig.connection,
    }
  }
  
  return config
}

// Check if any OIDC provider is configured
export const isOidcConfigured = (): boolean => {
  const enabledProviders = getEnabledProviders()
  return enabledProviders.length > 0
}

// Default OIDC config (for backward compatibility)
export const oidcConfig: ExtendedOidcConfig = getOidcConfig('default')

/**
 * ENVIRONMENT VARIABLES SETUP
 * 
 * Create a .env file in your project root with the following variables.
 * You can configure multiple providers simultaneously - buttons will appear for each configured provider.
 * 
 * MULTI-PROVIDER CONFIGURATION (Recommended):
 * 
 * Microsoft Azure AD / Entra ID:
 * REACT_APP_OIDC_MICROSOFT_AUTHORITY=https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0
 * REACT_APP_OIDC_MICROSOFT_CLIENT_ID=your-azure-app-client-id
 * 
 * Google OAuth 2.0:
 * REACT_APP_OIDC_GOOGLE_AUTHORITY=https://accounts.google.com
 * REACT_APP_OIDC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
 * 
 * Facebook (via Auth0):
 * REACT_APP_OIDC_FACEBOOK_AUTHORITY=https://YOUR_DOMAIN.auth0.com
 * REACT_APP_OIDC_FACEBOOK_CLIENT_ID=your-auth0-client-id
 * REACT_APP_OIDC_FACEBOOK_CONNECTION=facebook
 * 
 * OPTIONAL (defaults provided):
 * REACT_APP_OIDC_REDIRECT_URI=http://localhost:3000 (defaults to window.location.origin)
 * REACT_APP_OIDC_POST_LOGOUT_REDIRECT_URI=http://localhost:3000 (defaults to window.location.origin)
 * REACT_APP_OIDC_SILENT_REDIRECT_URI=http://localhost:3000/silent-renew.html
 * REACT_APP_OIDC_SCOPE=openid profile email (defaults to 'openid profile email')
 * 
 * SINGLE PROVIDER (Legacy - for backward compatibility):
 * REACT_APP_OIDC_AUTHORITY=your-oidc-provider-authority-url
 * REACT_APP_OIDC_CLIENT_ID=your-client-id
 * 
 * PROVIDER SETUP INSTRUCTIONS:
 * 
 * 1. Microsoft Azure AD / Entra ID:
 *    - Go to Azure Portal > App registrations
 *    - Create a new app registration
 *    - Set redirect URI to: http://localhost:3000 (or your production URL)
 *    - Copy the Application (client) ID and Directory (tenant) ID
 *    - Set REACT_APP_OIDC_MICROSOFT_AUTHORITY=https://login.microsoftonline.com/{TENANT_ID}/v2.0
 *    - Set REACT_APP_OIDC_MICROSOFT_CLIENT_ID={CLIENT_ID}
 * 
 * 2. Google OAuth 2.0:
 *    - Go to Google Cloud Console > APIs & Services > Credentials
 *    - Create OAuth 2.0 Client ID (Web application)
 *    - Set authorized redirect URIs: http://localhost:3000 (or your production URL)
 *    - Copy the Client ID
 *    - Set REACT_APP_OIDC_GOOGLE_AUTHORITY=https://accounts.google.com
 *    - Set REACT_APP_OIDC_GOOGLE_CLIENT_ID={CLIENT_ID}
 * 
 * 3. Facebook (via Auth0):
 *    - Create an Auth0 account and application
 *    - Go to Authentication > Social > Facebook
 *    - Configure Facebook as a social connection
 *    - Set REACT_APP_OIDC_FACEBOOK_AUTHORITY=https://{YOUR_DOMAIN}.auth0.com
 *    - Set REACT_APP_OIDC_FACEBOOK_CLIENT_ID={AUTH0_CLIENT_ID}
 *    - Set REACT_APP_OIDC_FACEBOOK_CONNECTION=facebook
 * 
 * 4. Other OIDC Providers (Keycloak, Okta, etc.):
 *    - Use the single provider configuration (REACT_APP_OIDC_AUTHORITY and REACT_APP_OIDC_CLIENT_ID)
 *    - Or configure as a custom provider by modifying this file
 * 
 * For more details, see: https://github.com/authts/oidc-client-ts
 */

