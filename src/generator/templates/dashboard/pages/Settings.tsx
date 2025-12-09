function Settings() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Settings</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <select className="w-full p-2 border rounded">
              <option>Light</option>
              <option>Dark</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Language</label>
            <select className="w-full p-2 border rounded">
              <option>English</option>
              <option>Spanish</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings

