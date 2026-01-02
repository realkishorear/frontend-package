import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Home from './pages/Home'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './services/authService'

// Placeholder pages for other routes
function Users() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Users</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Users management page coming soon...</p>
      </div>
    </div>
  )
}

function Orders() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Orders</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Orders management page coming soon...</p>
      </div>
    </div>
  )
}

function Messages() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Messages</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Messages page coming soon...</p>
      </div>
    </div>
  )
}

function Calendar() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Calendar</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Calendar page coming soon...</p>
      </div>
    </div>
  )
}

function Reports() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Reports</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Reports page coming soon...</p>
      </div>
    </div>
  )
}

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const auth = useAuth()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  // Redirect to login if not authenticated
  if (!auth.loading && !auth.isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Show loading while checking auth
  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} isMobile={isMobile} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <Header onMenuClick={toggleSidebar} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            <Routes>
              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calendar"
                element={
                  <ProtectedRoute>
                    <Calendar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard
