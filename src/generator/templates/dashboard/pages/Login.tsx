import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import { useAuth } from '../services/authService'
import { getEnabledProviders, type OidcProvider } from '../config/oidc.config'

// Provider Icons as SVG components
const MicrosoftIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="11" height="11" fill="#F25022"/>
    <rect x="12" y="0" width="11" height="11" fill="#7FBA00"/>
    <rect x="0" y="12" width="11" height="11" fill="#00A4EF"/>
    <rect x="12" y="12" width="11" height="11" fill="#FFB900"/>
  </svg>
)

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const FacebookIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

function Login() {
  const [error, setError] = useState('')
  const { signInRedirect, isAuthenticated, loading, testLogin, signOut } = useAuth()
  const navigate = useNavigate()
  const enabledProviders = getEnabledProviders()

  // Don't auto-redirect - let users see the login page even if authenticated
  // They can manually navigate to dashboard or logout if needed

  const handleOIDCLogin = async (provider?: OidcProvider) => {
    try {
      setError('')
      // Redirect to OIDC provider for authentication
      await signInRedirect(provider)
    } catch (err: any) {
      setError(err.message || 'Failed to initiate login. Please try again.')
      console.error('OIDC login error:', err)
    }
  }

  const handleProviderLogin = async (provider: OidcProvider) => {
    await handleOIDCLogin(provider)
  }

  const handleTestLogin = () => {
    setError('')
    // Use test login to bypass OIDC
    testLogin()
  }

  const handleClearTestMode = () => {
    // Clear test mode from localStorage
    localStorage.removeItem('dashboard_test_mode')
    localStorage.removeItem('dashboard_test_user')
    // Reload page to reset state
    window.location.reload()
  }

  // Get provider-specific button info
  const getProviderButton = (provider: OidcProvider) => {
    switch (provider) {
      case 'microsoft':
        return { icon: <MicrosoftIcon />, label: 'Microsoft', className: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300' }
      case 'google':
        return { icon: <GoogleIcon />, label: 'Google', className: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300' }
      case 'facebook':
        return { icon: <FacebookIcon />, label: 'Facebook', className: 'bg-[#1877F2] hover:bg-[#166FE5] text-white border-transparent' }
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Test Login Button - Always available for development */}
        <Button
          type="button"
          onClick={handleTestLogin}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          Test Login (Demo Mode)
        </Button>

        {/* Show OIDC provider buttons if configured */}
        {enabledProviders.length > 0 && (
          <>
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or sign in with</span>
              </div>
            </div>

            {/* OIDC Provider Buttons */}
            <div className="space-y-3">
              {enabledProviders.map(({ provider, config }) => {
                const buttonInfo = getProviderButton(provider)
                if (!buttonInfo) return null
                
                return (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => handleProviderLogin(provider)}
                    className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border shadow-sm text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${buttonInfo.className}`}
                  >
                    {buttonInfo.icon}
                    <span>Continue with {buttonInfo.label}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* Default OIDC button if no specific providers configured */}
        {enabledProviders.length === 0 && (
          <>
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or sign in with OIDC</span>
              </div>
            </div>

            {/* Default OIDC Login Button */}
            <Button
              type="button"
              onClick={() => handleOIDCLogin()}
              className="w-full"
              size="lg"
            >
              Sign in with OIDC
            </Button>
          </>
        )}

        {/* Show message if already authenticated */}
        {!loading && isAuthenticated && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
            <p className="font-medium">⚠️ You are already logged in</p>
            <p className="text-xs mt-1 text-yellow-700">
              To see the login page, please logout first.
            </p>
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                Go to Dashboard
              </button>
              <button
                onClick={async () => {
                  await signOut()
                  handleClearTestMode()
                }}
                className="px-3 py-1.5 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
              >
                Logout & Clear
              </button>
            </div>
          </div>
        )}

        {/* Configuration Note */}
        <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
          <p>
            Configure your OIDC provider in{' '}
            <code className="bg-gray-100 px-1 rounded">config/oidc.config.ts</code>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
