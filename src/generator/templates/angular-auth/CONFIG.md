# Configuration Guide

This Angular template uses a centralized configuration system that allows you to manage all app settings from a single file.

## Config File Location

The configuration file is located at: `src/assets/config.json`

## Setup

Make sure `config.json` is included in your `angular.json` assets:

```json
{
  "assets": [
    "src/assets/config.json"
  ]
}
```

## Using Configuration

### In Components and Services

```typescript
import { ConfigService } from './services/config.service'

constructor(private configService: ConfigService) {}

// Get API base URL
const apiUrl = this.configService.getApiBaseUrl()

// Get any config value
const appName = this.configService.get<string>('app.name')
const timeout = this.configService.get<number>('api.timeout', 5000)

// Get full config
const config = this.configService.getConfig()
```

### Observable Pattern

```typescript
import { ConfigService } from './services/config.service'

constructor(private configService: ConfigService) {}

ngOnInit() {
  this.configService.config$.subscribe(config => {
    if (config) {
      const apiUrl = config.api.baseUrl
      // Use config...
    }
  })
}
```

## Configuration Structure

```json
{
  "app": {
    "name": "Angular App",
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

To change the API base URL, simply edit `src/assets/config.json`:

```json
{
  "api": {
    "baseUrl": "https://api.yourdomain.com/api"
  }
}
```

After changing the config, restart your Angular dev server for changes to take effect.

## Example: Using in Auth Service

The `AuthService` already uses the config service:

```typescript
constructor(
  private http: HttpClient,
  private configService: ConfigService
) {
  // API URL is automatically set from config
  this.apiUrl = `${this.configService.getApiBaseUrl()}/auth`
}
```

All API calls will automatically use the configured base URL.

