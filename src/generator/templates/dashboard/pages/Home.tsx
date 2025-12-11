import { FiTrendingUp, FiUsers, FiDollarSign, FiShoppingCart } from 'react-icons/fi'
import StatCard from '../components/StatCard'
import Card from '../components/Card'

function Home() {
  const recentActivity = [
    { id: 1, user: 'John Doe', action: 'placed an order', time: '2 minutes ago', type: 'order' },
    { id: 2, user: 'Jane Smith', action: 'updated profile', time: '15 minutes ago', type: 'update' },
    { id: 3, user: 'Bob Johnson', action: 'completed payment', time: '1 hour ago', type: 'payment' },
    { id: 4, user: 'Alice Brown', action: 'created account', time: '2 hours ago', type: 'account' },
  ]

  const topProducts = [
    { id: 1, name: 'Product A', sales: 1234, revenue: '$12,340' },
    { id: 2, name: 'Product B', sales: 987, revenue: '$9,870' },
    { id: 3, name: 'Product C', sales: 756, revenue: '$7,560' },
    { id: 4, name: 'Product D', sales: 543, revenue: '$5,430' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value="$45,678"
          change="+12.5%"
          changeType="positive"
          icon={<FiDollarSign className="w-6 h-6 text-blue-600" />}
          trend={<FiTrendingUp className="w-4 h-4 text-green-600" />}
        />
        <StatCard
          title="Total Users"
          value="1,234"
          change="+8.2%"
          changeType="positive"
          icon={<FiUsers className="w-6 h-6 text-blue-600" />}
          trend={<FiTrendingUp className="w-4 h-4 text-green-600" />}
        />
        <StatCard
          title="Orders"
          value="567"
          change="-2.1%"
          changeType="negative"
          icon={<FiShoppingCart className="w-6 h-6 text-blue-600" />}
        />
        <StatCard
          title="Growth Rate"
          value="24.5%"
          change="+5.3%"
          changeType="positive"
          icon={<FiTrendingUp className="w-6 h-6 text-blue-600" />}
          trend={<FiTrendingUp className="w-4 h-4 text-green-600" />}
        />
      </div>

      {/* Charts and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card title="Recent Activity">
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">
                    {activity.user.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all activity →
            </button>
          </div>
        </Card>

        {/* Top Products */}
        <Card title="Top Products">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Sales</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{product.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{product.sales}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 text-right">{product.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm font-medium text-gray-700">New Report</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
            <div className="text-2xl mb-2">👤</div>
            <p className="text-sm font-medium text-gray-700">Add User</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
            <div className="text-2xl mb-2">📦</div>
            <p className="text-sm font-medium text-gray-700">New Order</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
            <div className="text-2xl mb-2">⚙️</div>
            <p className="text-sm font-medium text-gray-700">Settings</p>
          </button>
        </div>
      </Card>
    </div>
  )
}

export default Home
