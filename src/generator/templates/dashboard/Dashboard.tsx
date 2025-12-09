import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Home from './pages/Home'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

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
              <Route path="/" element={<Home />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/users" element={<Users />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard
