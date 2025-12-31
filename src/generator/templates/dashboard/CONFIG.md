# Configuration Guide

This template uses a centralized configuration system that allows you to manage all app settings from a single file.

## Config File Location

The configuration file is located at: `public/config.json`

## Using Configuration

### In React Components

```tsx
import { useConfig } from './config/config'

function MyComponent() {
  const { get, getApiBaseUrl } = useConfig()
  
  // Get API base URL
  const apiUrl = getApiBaseUrl()
  
  // Get any config value
  const appName = get<string>('app.name')
  const timeout = get<number>('api.timeout', 5000) // with default
  
  // Make API call
  const response = await fetch(`${apiUrl}/users`)
}
```

### In Services (Outside Components)

```tsx
import { getApiBaseUrl } from './services/apiService'
// or
import { getConfigManager } from '../config/configManager'

// Method 1: Using apiService helper
const apiUrl = getApiBaseUrl()

// Method 2: Using ConfigManager directly
const configManager = getConfigManager()
const apiUrl = configManager.get<string>('api.baseUrl')
```

## Configuration Structure

```json
{
  "app": {
    "name": "Dashboard App",
    "version": "1.0.0",
    "theme": "light",
    "language": "en"
  },
  "api": {
    "baseUrl": "http://localhost:3000/api",
    "timeout": 5000,
    "retries": 3
  },
  "features": {
    "analytics": true,
    "notifications": true,
    "darkMode": false
  },
  "ui": {
    "primaryColor": "#3b82f6",
    "secondaryColor": "#8b5cf6",
    "fontSize": "16px",
    "spacing": "8px"
  }
}
```

## Changing BASE_URL

To change the API base URL, simply edit `public/config.json`:

```json
{
  "api": {
    "baseUrl": "https://api.yourdomain.com/api"
  }
}
```

The change will be automatically detected and applied (hot-reload enabled).

## Hot Reload

The config system watches for changes in `config.json` and automatically reloads every 2 seconds. No need to restart the dev server!

## Example: Making API Calls

```tsx
import { apiService } from './services/apiService'

// GET request
const users = await apiService.get('/users')

// POST request
const newUser = await apiService.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
})
```

The `apiService` automatically uses the `baseUrl` from your config file.

