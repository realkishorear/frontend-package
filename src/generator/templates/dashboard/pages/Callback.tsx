import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/authService'

/**
 * OIDC Callback Page
 * 
 * This page handles the OIDC redirect callback.
 * The AuthProvider from authService handles callbacks automatically using oidc-client-ts,
 * but this page can be used for additional handling or user feedback.
 */
export default function Callback() {
  const navigate = useNavigate()
  const auth = useAuth()

  useEffect(() => {
    // Check if authentication was successful
    if (auth.isAuthenticated) {
      // Redirect to dashboard after successful authentication
      navigate('/dashboard', { replace: true })
    } else if (!auth.loading) {
      // If not loading and not authenticated, redirect to login
      navigate('/login', { replace: true })
    }
  }, [auth.isAuthenticated, auth.loading, navigate])

  // Show loading state while processing callback
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing login...</p>
      </div>
    </div>
  )
}

