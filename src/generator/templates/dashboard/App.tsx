import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Dashboard from './Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import { AuthProvider, useAuth } from './services/authService'

const theme = createTheme({
  palette: {
    mode: 'light',
  },
})

// List of known dashboard routes
const dashboardRoutes = [
  '/',
  '/analytics',
  '/users',
  '/orders',
  '/messages',
  '/calendar',
  '/reports',
  '/settings'
]

// Catch-all route component that redirects based on auth status
function CatchAllRoute() {
  const location = useLocation()
  const auth = useAuth()
  
  // Show loading while checking auth
  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  // If authenticated, redirect to dashboard with the requested path
  if (auth.isAuthenticated) {
    const requestedPath = location.pathname
    
    // If it's a known dashboard route, redirect to dashboard version
    if (dashboardRoutes.includes(requestedPath) || requestedPath.startsWith('/dashboard')) {
      const path = requestedPath === '/' ? '/dashboard' : 
                   requestedPath.startsWith('/dashboard') ? requestedPath : 
                   `/dashboard${requestedPath}`
      return <Navigate to={path} replace />
    }
    
    // For any other path, redirect to dashboard home
    return <Navigate to="/dashboard" replace />
  }
  
  // If not authenticated, redirect to login with return path
  return <Navigate to="/login" state={{ from: location }} replace />
}

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
      
      {/* Catch-all route: redirect all unmatched routes */}
      <Route path="*" element={<CatchAllRoute />} />
    </Routes>
  )

  // Wrap everything with MaterialUI ThemeProvider, CssBaseline, and AuthProvider
  const appContent = (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        {routes}
      </AuthProvider>
    </ThemeProvider>
  )

  return appContent
}

export default App

