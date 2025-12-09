import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowUpDown, MoreHorizontal, TrendingUp, TrendingDown, ArrowUp } from 'lucide-react'

export default function Dashboard01() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <div className="mr-6 flex items-center space-x-2">
              <span className="font-bold">Acme Inc.</span>
            </div>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <span className="text-foreground">Dashboard</span>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
                <input
                  type="search"
                  placeholder="Search..."
                  className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px] h-10 px-3 py-2 text-sm border border-input"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Manage your documents and track their progress.
          </p>
        </div>

        {/* Quick Create */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Quick Create</h2>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$1,250.00</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +12.5%
                </span>
                <span className="ml-2">Trending up this month</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Customers</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600">-20%</span>
                <span className="ml-2">Down 20% this period</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Acquisition needs attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45,678</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +12.5%
                </span>
                <span className="ml-2">Strong user retention</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Engagement exceed targets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.5%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +4.5%
                </span>
                <span className="ml-2">Steady performance increase</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Meets growth projections</p>
            </CardContent>
          </Card>
        </div>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>View</CardTitle>
                <CardDescription>Outline</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Header</TableHead>
                  <TableHead>Section Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { header: 'Cover page', type: 'Cover page', status: 'In Process', reviewer: 'Eddie Lake' },
                  { header: 'Table of contents', type: 'Table of contents', status: 'Done', reviewer: 'Eddie Lake' },
                  { header: 'Executive summary', type: 'Narrative', status: 'Done', reviewer: 'Eddie Lake' },
                  { header: 'Technical approach', type: 'Narrative', status: 'In Process', reviewer: 'Jamik Tashpulatov' },
                  { header: 'Design', type: 'Narrative', status: 'In Process', reviewer: 'Jamik Tashpulatov' },
                ].map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.header}</TableCell>
                    <TableCell>{row.type}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        row.status === 'Done' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell>{row.reviewer}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Open menu</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

