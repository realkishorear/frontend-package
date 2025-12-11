import { useState } from 'react'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import { FiSave, FiBell, FiShield, FiCreditCard, FiGlobe } from 'react-icons/fi'

function Settings() {
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Acme Inc.',
    timezone: 'UTC-5',
    language: 'en',
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => {
        const parentValue = prev[parent as keyof typeof prev]
        if (typeof parentValue === 'object' && parentValue !== null && !Array.isArray(parentValue)) {
          return {
            ...prev,
            [parent]: {
              ...(parentValue as Record<string, any>),
              [child]: value,
            },
          }
        }
        return prev
      })
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Profile Settings */}
      <Card title="Profile Information">
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-2xl font-semibold text-white">JD</span>
            </div>
            <div>
              <Button variant="outline" size="sm">Change Photo</Button>
              <p className="text-xs text-gray-500 mt-1">JPG, GIF or PNG. Max size of 2MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
            <Input
              label="Company"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
            />
            <Input
              label="Timezone"
              value={formData.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button>
              <FiSave className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card title={
        <div className="flex items-center gap-2">
          <FiGlobe className="w-5 h-5" />
          <span>Preferences</span>
        </div>
      }>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select
              value={formData.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <div className="grid grid-cols-3 gap-4">
              {['light', 'dark', 'auto'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleInputChange('theme', theme)}
                  className={`p-4 border-2 rounded-lg text-center capitalize transition-colors ${
                    formData.theme === theme
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card title={
        <div className="flex items-center gap-2">
          <FiBell className="w-5 h-5" />
          <span>Notifications</span>
        </div>
      }>
        <div className="space-y-4">
          {[
            { key: 'email', label: 'Email Notifications', description: 'Receive notifications via email' },
            { key: 'push', label: 'Push Notifications', description: 'Receive push notifications in browser' },
            { key: 'sms', label: 'SMS Notifications', description: 'Receive notifications via SMS' },
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-500 mt-1">{description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notifications[key as keyof typeof formData.notifications]}
                  onChange={(e) => handleInputChange(`notifications.${key}`, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Security */}
      <Card title={
        <div className="flex items-center gap-2">
          <FiShield className="w-5 h-5" />
          <span>Security</span>
        </div>
      }>
        <div className="space-y-4">
          <div>
            <Input
              label="Current Password"
              type="password"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Confirm new password"
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="primary">
              Update Password
            </Button>
          </div>
        </div>
      </Card>

      {/* Billing */}
      <Card title={
        <div className="flex items-center gap-2">
          <FiCreditCard className="w-5 h-5" />
          <span>Billing</span>
        </div>
      }>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">Current Plan</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">Pro</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">$29<span className="text-sm font-normal text-gray-600">/month</span></p>
            <p className="text-xs text-gray-500">Renews on January 15, 2024</p>
          </div>
          <div className="flex gap-3">
            <Button variant="primary">Upgrade Plan</Button>
            <Button variant="outline">Cancel Subscription</Button>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card title="Danger Zone" className="border-red-200">
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-sm font-semibold text-red-900 mb-1">Delete Account</h3>
            <p className="text-xs text-red-700 mb-3">Once you delete your account, there is no going back. Please be certain.</p>
            <Button variant="danger" size="sm">Delete Account</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Settings
