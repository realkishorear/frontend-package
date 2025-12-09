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

export default function Home() {
  return (
    <div className="space-y-6">
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

      {/* Visitors Chart Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Total Visitors</CardTitle>
              <CardDescription>Total for the last 3 months</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                Last 3 months
              </Button>
              <Button variant="outline" size="sm">
                Last 30 days
              </Button>
              <Button variant="outline" size="sm">
                Last 7 days
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Chart visualization area
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>View</CardTitle>
              <CardDescription>Outline</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                Past Performance
                <span className="ml-2 bg-muted px-2 py-0.5 rounded text-xs">3</span>
              </Button>
              <Button variant="outline" size="sm">
                Key Personnel
                <span className="ml-2 bg-muted px-2 py-0.5 rounded text-xs">2</span>
              </Button>
              <Button variant="outline" size="sm">
                Focus Documents
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <Button variant="outline" size="sm">
              Customize Columns
            </Button>
            <Button variant="outline" size="sm">
              Columns
            </Button>
            <Button variant="outline" size="sm">
              Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <span className="sr-only">Drag to reorder</span>
                </TableHead>
                <TableHead>Header</TableHead>
                <TableHead>Section Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Limit</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead className="w-[50px]"></TableHead>
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
                { header: 'Capabilities', type: 'Narrative', status: 'In Process', reviewer: 'Jamik Tashpulatov' },
                { header: 'Integration with existing systems', type: 'Narrative', status: 'In Process', reviewer: 'Jamik Tashpulatov' },
                { header: 'Innovation and Advantages', type: 'Narrative', status: 'Done', reviewer: 'Reviewer' },
                { header: "Overview of EMR's Innovative Solutions", type: 'Technical content', status: 'Done', reviewer: 'Reviewer' },
                { header: 'Advanced Algorithms and Machine Learning', type: 'Narrative', status: 'Done', reviewer: 'Reviewer' },
              ].map((row, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <span className="text-muted-foreground text-xs">Drag</span>
                  </TableCell>
                  <TableCell className="font-medium">{row.header}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      row.status === 'Done' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {row.status}
                    </span>
                  </TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>Limit</TableCell>
                  <TableCell>{row.reviewer}</TableCell>
                  <TableCell>
                    {row.reviewer === 'Reviewer' ? (
                      <Button variant="outline" size="sm">
                        Assign reviewer
                      </Button>
                    ) : null}
                  </TableCell>
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
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              0 of 68 row(s) selected.
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Rows per page</span>
              <Button variant="outline" size="sm">
                10
              </Button>
              <div className="flex items-center space-x-1">
                <span className="text-sm text-muted-foreground">Page 1 of 7</span>
                <Button variant="ghost" size="icon">
                  <span className="sr-only">Go to first page</span>
                  «
                </Button>
                <Button variant="ghost" size="icon">
                  <span className="sr-only">Go to previous page</span>
                  ‹
                </Button>
                <Button variant="ghost" size="icon">
                  <span className="sr-only">Go to next page</span>
                  ›
                </Button>
                <Button variant="ghost" size="icon">
                  <span className="sr-only">Go to last page</span>
                  »
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
