# Centralized Configuration System

All templates now support a centralized configuration system that allows you to manage all app settings (including `BASE_URL`) from a single `config.json` file.

## Overview

Each template includes:
- A `config.json` file with default settings
- Config utilities/services to access configuration values
- Automatic integration with API services

## Template-Specific Implementation

### React Templates (dashboard, landing, empty)

**Config Location:** `public/config.json`

**Usage:**
```tsx
import { useConfig } from './config/config'

function MyComponent() {
  const { getApiBaseUrl } = useConfig()
  const apiUrl = getApiBaseUrl()
  // Use apiUrl for API calls
}
```

**API Service Helper:**
```tsx
import { apiService } from './services/apiService'

// Automatically uses BASE_URL from config.json
const users = await apiService.get('/users')
```

**Documentation:** See `CONFIG.md` in each template folder.

### Angular Template (angular-auth)

**Config Location:** `src/assets/config.json`

**Usage:**
```typescript
import { ConfigService } from './services/config.service'

constructor(private configService: ConfigService) {}

const apiUrl = this.configService.getApiBaseUrl()
```

**Documentation:** See `CONFIG.md` in the angular-auth template folder.

### Next.js Template (nextjs-auth)

**Config Location:** `public/config.json`

**Usage:**
```typescript
import { getApiBaseUrl, loadConfig } from '@/lib/config'

// Client component
const apiUrl = getApiBaseUrl()

// Or load config asynchronously
const config = await loadConfig()
```

**Documentation:** See `CONFIG.md` in the nextjs-auth template folder.

## Configuration Structure

All templates use the same configuration structure:

```json
{
  "app": {
    "name": "App Name",
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

To change the API base URL, simply edit the `config.json` file in your project:

1. **React/Next.js:** Edit `public/config.json`
2. **Angular:** Edit `src/assets/config.json`

Change the `api.baseUrl` value:
```json
{
  "api": {
    "baseUrl": "https://api.yourdomain.com/api"
  }
}
```

The change will be automatically picked up:
- **React:** Hot-reload enabled (watches for changes every 2 seconds)
- **Angular:** Restart dev server
- **Next.js:** Restart dev server or use environment variables as fallback

## Benefits

1. **Single Source of Truth:** All configuration in one place
2. **Easy Environment Management:** Different config files for dev/staging/prod
3. **Type Safety:** TypeScript interfaces for all config values
4. **Hot Reload:** React templates support automatic config reloading
5. **Framework Agnostic:** Same structure across all frameworks

## Generator Integration

The generator automatically:
- Copies `config.json` files to generated projects
- Includes config utilities/services in templates
- Sets up proper file paths for each framework

No additional setup required!

