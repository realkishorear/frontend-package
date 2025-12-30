import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FiGithub, FiTwitter } from 'react-icons/fi'
import Button from '../components/Button'
import { useAuth } from '../services/authService'

function Register() {
  const [error, setError] = useState('')
  const { signInRedirect, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, loading, navigate])

  const handleOIDCRegister = async () => {
    try {
      setError('')
      // Most OIDC providers handle registration through their own UI
      // You can either redirect to a registration endpoint or use sign-in
      // Some providers support registration via the same sign-in flow
      await signInRedirect()
    } catch (err: any) {
      setError(err.message || 'Failed to initiate registration. Please try again.')
      console.error('OIDC registration error:', err)
    }
  }

  const handleOAuthRegister = async (provider: 'github' | 'twitter') => {
    setError('')
    console.log(`OAuth registration with ${provider} - Configure in your OIDC provider`)
    alert(`OAuth registration with ${provider} - Configure this provider in your OIDC provider settings`)
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
          <h2 className="text-3xl font-bold text-gray-900">Create an account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign up to get started with your account
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
          <p className="font-medium">OIDC Registration</p>
          <p className="text-xs mt-1">
            Registration is handled through your identity provider. Click the button below to get started.
          </p>
        </div>

        {/* OIDC Register Button */}
        <Button
          type="button"
          onClick={handleOIDCRegister}
          className="w-full"
          size="lg"
        >
          Sign up with OIDC
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

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleOAuthRegister('github')}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiGithub className="w-5 h-5 mr-2" />
            GitHub
          </button>
          <button
            type="button"
            onClick={() => handleOAuthRegister('twitter')}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiTwitter className="w-5 h-5 mr-2" />
            Twitter
          </button>
        </div>

        {/* Sign In Link */}
        <div className="text-center text-sm">
          <span className="text-gray-600">Already have an account? </span>
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in
          </Link>
        </div>

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

export default Register
