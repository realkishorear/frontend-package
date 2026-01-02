import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiGithub, FiTwitter } from 'react-icons/fi'
import Button from '../components/Button'
import { useAuth } from '../services/authService'

function Login() {
  const [error, setError] = useState('')
  const { signInRedirect, isAuthenticated, loading, testLogin, signOut } = useAuth()
  const navigate = useNavigate()

  // Don't auto-redirect - let users see the login page even if authenticated
  // They can manually navigate to dashboard or logout if needed

  const handleOIDCLogin = async () => {
    try {
      setError('')
      // Redirect to OIDC provider for authentication
      await signInRedirect()
    } catch (err: any) {
      setError(err.message || 'Failed to initiate login. Please try again.')
      console.error('OIDC login error:', err)
    }
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

  const handleOAuthLogin = async (provider: 'github' | 'twitter') => {
    setError('')
    // Note: For OAuth providers like GitHub/Twitter, you would typically
    // configure them as additional identity providers in your OIDC provider
    // or use their OAuth endpoints directly
    console.log(`OAuth login with ${provider} - Configure in your OIDC provider`)
    alert(`OAuth login with ${provider} - Configure this provider in your OIDC provider settings`)
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

        {/* Info Message */}
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
          <p className="font-medium">OIDC Authentication</p>
          <p className="text-xs mt-1">
            Click the button below to sign in with your identity provider.
          </p>
        </div>

        {/* Test Login Button - Always available for development */}
        <Button
          type="button"
          onClick={handleTestLogin}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          Test Login (Demo Mode)
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or sign in with OIDC</span>
          </div>
        </div>

        {/* OIDC Login Button */}
        <Button
          type="button"
          onClick={handleOIDCLogin}
          className="w-full"
          size="lg"
        >
          Sign in with OIDC
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* OAuth Buttons (if configured in OIDC provider) */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleOAuthLogin('github')}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiGithub className="w-5 h-5 mr-2" />
            GitHub
          </button>
          <button
            type="button"
            onClick={() => handleOAuthLogin('twitter')}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiTwitter className="w-5 h-5 mr-2" />
            Twitter
          </button>
        </div>

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
