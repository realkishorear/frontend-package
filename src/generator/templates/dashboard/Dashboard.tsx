import { useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-800 text-white transition-all duration-300`}>
        <div className="p-4">
          <h1 className="text-xl font-bold">Dashboard</h1>
        </div>
        <nav className="mt-8">
          <Link to="/" className="block px-4 py-2 hover:bg-gray-700">
            Home
          </Link>
          <Link to="/analytics" className="block px-4 py-2 hover:bg-gray-700">
            Analytics
          </Link>
          <Link to="/settings" className="block px-4 py-2 hover:bg-gray-700">
            Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow p-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Toggle Sidebar
          </button>
        </header>
        <div className="p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default Dashboard

