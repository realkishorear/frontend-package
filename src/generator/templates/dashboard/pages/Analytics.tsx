import React from 'react'
import { FiTrendingUp, FiTrendingDown, FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi'
import Card from '../components/Card'
import StatCard from '../components/StatCard'

function Analytics() {
  const analyticsData = [
    { period: 'Jan', value: 4000 },
    { period: 'Feb', value: 3000 },
    { period: 'Mar', value: 5000 },
    { period: 'Apr', value: 4500 },
    { period: 'May', value: 6000 },
    { period: 'Jun', value: 5500 },
    { period: 'Jul', value: 7000 },
  ]

  const maxValue = Math.max(...analyticsData.map(d => d.value))

  const metrics = [
    { label: 'Page Views', value: '124,563', change: '+12.5%', trend: 'up' },
    { label: 'Unique Visitors', value: '45,231', change: '+8.2%', trend: 'up' },
    { label: 'Bounce Rate', value: '32.1%', change: '-5.3%', trend: 'down' },
    { label: 'Avg. Session', value: '4m 32s', change: '+2.1%', trend: 'up' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-600">Track and analyze your performance metrics</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">{metric.label}</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{metric.value}</p>
              <div className="flex items-center gap-1">
                {metric.trend === 'up' ? (
                  <>
                    <FiTrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">{metric.change}</span>
                  </>
                ) : (
                  <>
                    <FiTrendingDown className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-600">{metric.change}</span>
                  </>
                )}
                <span className="text-xs text-gray-500 ml-1">vs last month</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card title="Revenue Overview" action={
          <select className="text-sm border border-gray-300 rounded px-2 py-1">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 3 months</option>
          </select>
        }>
          <div className="space-y-4">
            <div className="flex items-end justify-between h-64 gap-2">
              {analyticsData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer group relative"
                    style={{ height: `${(data.value / maxValue) * 100}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      ${data.value.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 mt-2">{data.period}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">$35,000</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-600">
                  <FiArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium">+12.5%</span>
                </div>
                <p className="text-xs text-gray-500">vs last period</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Traffic Sources */}
        <Card title="Traffic Sources">
          <div className="space-y-4">
            {[
              { source: 'Organic Search', value: 45, color: 'bg-blue-500' },
              { source: 'Direct', value: 30, color: 'bg-green-500' },
              { source: 'Social Media', value: 15, color: 'bg-yellow-500' },
              { source: 'Referrals', value: 10, color: 'bg-purple-500' },
            ].map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{item.source}</span>
                  <span className="text-sm text-gray-600">{item.value}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card title="Conversion Funnel">
        <div className="space-y-6">
          {[
            { stage: 'Visitors', count: 10000, percentage: 100 },
            { stage: 'Sign Ups', count: 2500, percentage: 25 },
            { stage: 'Trial Users', count: 1500, percentage: 15 },
            { stage: 'Paid Users', count: 500, percentage: 5 },
          ].map((stage, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium text-gray-700">{stage.stage}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">{stage.count.toLocaleString()}</span>
                  <span className="text-sm text-gray-600">{stage.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all"
                    style={{ width: `${stage.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Pages */}
      <Card title="Top Pages">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Page</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Views</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Unique</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Bounce Rate</th>
              </tr>
            </thead>
            <tbody>
              {[
                { page: '/home', views: 12453, unique: 8932, bounce: '32.1%' },
                { page: '/products', views: 9876, unique: 6543, bounce: '28.5%' },
                { page: '/about', views: 5432, unique: 4321, bounce: '45.2%' },
                { page: '/contact', views: 3210, unique: 2987, bounce: '38.7%' },
              ].map((row, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900 font-mono">{row.page}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 text-right">{row.views.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 text-right">{row.unique.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 text-right">{row.bounce}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default Analytics
