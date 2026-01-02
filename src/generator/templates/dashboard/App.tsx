import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from 'oidc-react'
import { oidcConfig, isOidcConfigured } from './config/oidc.config'
import Dashboard from './Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  // Only wrap with AuthProvider if OIDC is properly configured
  // This allows the app to work even without OIDC setup (for development)
  const routes = (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Dashboard Routes */}
      <Route path="/*" element={<Dashboard />} />
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )

  // If OIDC is configured, wrap with AuthProvider
  if (isOidcConfigured()) {
    return <AuthProvider {...oidcConfig}>{routes}</AuthProvider>
  }

  // If OIDC is not configured, render routes without AuthProvider
  // Components will handle missing auth gracefully
  return routes
}

export default App

