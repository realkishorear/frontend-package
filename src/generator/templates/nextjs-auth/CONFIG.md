# Configuration Guide

This Next.js template uses a centralized configuration system that allows you to manage all app settings from a single file.

## Config File Location

The configuration file is located at: `public/config.json`

## Using Configuration

### In Client Components

```tsx
'use client'

import { useEffect, useState } from 'react'
import { loadConfig, getApiBaseUrl, getConfigValue } from '../lib/config'

export default function MyComponent() {
  const [config, setConfig] = useState(null)
  
  useEffect(() => {
    loadConfig().then(setConfig)
  }, [])
  
  if (!config) return <div>Loading...</div>
  
  const apiUrl = getApiBaseUrl()
  const appName = getConfigValue<string>('app.name')
  
  return <div>{appName}</div>
}
```

### In Server Components

```tsx
import { getConfig, getApiBaseUrl } from '../lib/config'

export default async function ServerComponent() {
  const config = await getConfig()
  const apiUrl = getApiBaseUrl()
  
  // Use config...
}
```

### In API Routes

```typescript
import { getApiBaseUrl } from '@/lib/config'

export async function GET() {
  const apiUrl = getApiBaseUrl()
  // Make API call...
}
```

### Outside Components

```typescript
import { getApiBaseUrl, getConfigValue } from './lib/config'

// Get API base URL
const apiUrl = getApiBaseUrl()

// Get any config value
const timeout = getConfigValue<number>('api.timeout', 5000)
```

## Configuration Structure

```json
{
  "app": {
    "name": "Next.js App",
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

## Environment Variables

You can also use environment variables as fallback:

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api
```

The config system will use `NEXT_PUBLIC_API_BASE_URL` if `config.json` is not available or if the value is not set.

## Example: Making API Calls

```typescript
import { getApiBaseUrl } from '@/lib/config'

export async function fetchUsers() {
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}/users`)
  return response.json()
}
```

