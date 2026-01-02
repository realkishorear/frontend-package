import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from 'oidc-react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { oidcConfig, isOidcConfigured } from './config/oidc.config'
import Dashboard from './Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'

const theme = createTheme({
  palette: {
    mode: 'light',
  },
})

function App() {
  // Only wrap with AuthProvider if OIDC is properly configured
  // This allows the app to work even without OIDC setup (for development)
  const routes = (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Dashboard Routes */}
      <Route path="/dashboard/*" element={<Dashboard />} />
      
      {/* Default redirect to login page */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )

  // Wrap everything with MaterialUI ThemeProvider and CssBaseline
  const appContent = (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* If OIDC is configured, wrap with AuthProvider */}
      {isOidcConfigured() ? (
        <AuthProvider {...oidcConfig}>{routes}</AuthProvider>
      ) : (
        routes
      )}
    </ThemeProvider>
  )

  return appContent
}

export default App

