import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Types
interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      // TODO: Replace with your backend token validation
      // Example: Check localStorage/sessionStorage for token and validate with backend
      const token = localStorage.getItem('authToken')
      
      if (token) {
        // TODO: Validate token with backend
        // const response = await fetch('/api/auth/validate', {
        //   headers: { Authorization: `Bearer ${token}` }
        // })
        // if (response.ok) {
        //   const userData = await response.json()
        //   setUser(userData)
        // } else {
        //   localStorage.removeItem('authToken')
        // }
        
        // For now, placeholder - replace with actual backend call
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      // TODO: Replace with your backend API call
      // Example:
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password })
      // })
      // 
      // if (!response.ok) {
      //   const error = await response.json()
      //   throw new Error(error.message || 'Login failed')
      // }
      // 
      // const data = await response.json()
      // localStorage.setItem('authToken', data.token)
      // localStorage.setItem('refreshToken', data.refreshToken)
      // setUser(data.user)

      // Placeholder implementation - replace with actual backend
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      // Dummy user data - replace with actual response
      const dummyUser: User = {
        id: '1',
        name: 'John Doe',
        email: email
      }
      
      const dummyToken = 'dummy-jwt-token-' + Date.now()
      localStorage.setItem('authToken', dummyToken)
      localStorage.setItem('user', JSON.stringify(dummyUser))
      setUser(dummyUser)
    } catch (error: any) {
      throw new Error(error.message || 'Login failed')
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      // TODO: Replace with your backend API call
      // Example:
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name, email, password })
      // })
      // 
      // if (!response.ok) {
      //   const error = await response.json()
      //   throw new Error(error.message || 'Registration failed')
      // }
      // 
      // const data = await response.json()
      // localStorage.setItem('authToken', data.token)
      // localStorage.setItem('refreshToken', data.refreshToken)
      // setUser(data.user)

      // Placeholder implementation - replace with actual backend
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      // Dummy user data - replace with actual response
      const dummyUser: User = {
        id: '1',
        name: name,
        email: email
      }
      
      const dummyToken = 'dummy-jwt-token-' + Date.now()
      localStorage.setItem('authToken', dummyToken)
      localStorage.setItem('user', JSON.stringify(dummyUser))
      setUser(dummyUser)
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed')
    }
  }

  const logout = async () => {
    try {
      // TODO: Replace with your backend API call for logout
      // Example:
      // await fetch('/api/auth/logout', {
      //   method: 'POST',
      //   headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      // })

      // Clear local storage
      localStorage.removeItem('authToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      // Clear local storage even if API call fails
      localStorage.removeItem('authToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      setUser(null)
    }
  }

  const refreshToken = async () => {
    try {
      // TODO: Replace with your backend token refresh endpoint
      // Example:
      // const refreshToken = localStorage.getItem('refreshToken')
      // const response = await fetch('/api/auth/refresh', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ refreshToken })
      // })
      // 
      // if (!response.ok) {
      //   throw new Error('Token refresh failed')
      // }
      // 
      // const data = await response.json()
      // localStorage.setItem('authToken', data.token)
      
      console.log('Token refresh - Backend integration needed')
    } catch (error) {
      console.error('Token refresh error:', error)
      await logout()
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshToken
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

