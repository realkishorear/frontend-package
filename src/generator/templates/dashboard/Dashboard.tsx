import { useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  MoreHorizontal,
  ArrowUpDown,
} from 'lucide-react'

function Dashboard() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link to="/dashboard" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">Acme Inc.</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                to="/dashboard"
                className={`transition-colors hover:text-foreground/80 ${
                  location.pathname === '/dashboard' || location.pathname === '/dashboard/' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/dashboard/analytics"
                className={`transition-colors hover:text-foreground/80 ${
                  location.pathname === '/dashboard/analytics' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                Analytics
              </Link>
              <Link
                to="/dashboard/settings"
                className={`transition-colors hover:text-foreground/80 ${
                  location.pathname === '/dashboard/settings' ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                Settings
              </Link>
            </nav>
          </div>
          <Button
            variant="ghost"
            className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                />
              </div>
            </div>
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      CN
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">shadcn</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        shadcnm@example.com
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Get Help</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="pr-0">
          <nav className="flex flex-col space-y-4">
            <Link
              to="/dashboard"
              className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent"
              onClick={() => setSidebarOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/dashboard/analytics"
              className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent"
              onClick={() => setSidebarOpen(false)}
            >
              Analytics
            </Link>
            <Link
              to="/dashboard/settings"
              className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent"
              onClick={() => setSidebarOpen(false)}
            >
              Settings
            </Link>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="container py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}

export default Dashboard
