import { Link, useLocation } from 'react-router-dom'
import { 
  FiHome, 
  FiBarChart2, 
  FiSettings, 
  FiUsers, 
  FiShoppingBag, 
  FiFileText,
  FiMail,
  FiCalendar,
  FiX
} from 'react-icons/fi'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isMobile: boolean
}

interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: <FiHome className="w-5 h-5" /> },
  { path: '/analytics', label: 'Analytics', icon: <FiBarChart2 className="w-5 h-5" /> },
  { path: '/users', label: 'Users', icon: <FiUsers className="w-5 h-5" /> },
  { path: '/orders', label: 'Orders', icon: <FiShoppingBag className="w-5 h-5" /> },
  { path: '/messages', label: 'Messages', icon: <FiMail className="w-5 h-5" /> },
  { path: '/calendar', label: 'Calendar', icon: <FiCalendar className="w-5 h-5" /> },
  { path: '/reports', label: 'Reports', icon: <FiFileText className="w-5 h-5" /> },
  { path: '/settings', label: 'Settings', icon: <FiSettings className="w-5 h-5" /> },
]

function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const location = useLocation()

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-gray-900 text-white
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isMobile ? 'w-64' : 'w-64'}
          flex flex-col
          shadow-xl lg:shadow-none
        `}
      >
        {/* Logo and Close Button */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          {isMobile && (
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <FiX className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={isMobile ? onClose : undefined}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors duration-150
                    ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-sm font-semibold">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">John Doe</p>
              <p className="text-xs text-gray-400 truncate">john@example.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

