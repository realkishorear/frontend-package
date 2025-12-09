# Configuration System

This application includes a dynamic configuration system that allows you to change settings while the app is running.

## How It Works

- Configuration is stored in `/public/config.json` (accessible at `/config.json`)
- The config is automatically reloaded every 2 seconds
- Changes are detected and applied without restarting the app
- All components can access config via the `useConfig` hook

## Usage

### In Components

```tsx
import { useConfig } from './config/ConfigProvider';

function MyComponent() {
  const { config, get } = useConfig();
  
  // Access full config
  const appName = config.app?.name;
  
  // Or use the get helper with path
  const apiUrl = get<string>('api.baseUrl', 'http://localhost:3000');
  const theme = get<string>('app.theme', 'light');
  
  return <div>{appName}</div>;
}
```

### Modifying Config

Simply edit `/public/config.json` in your project root. Changes will be automatically detected and applied within 2 seconds.

Example `config.json`:
```json
{
  "app": {
    "name": "My App",
    "theme": "dark"
  },
  "api": {
    "baseUrl": "https://api.example.com"
  }
}
```

## Config Structure

The default config includes:
- `app`: Application settings (name, version, theme, language)
- `api`: API configuration (baseUrl, timeout, retries)
- `features`: Feature flags (analytics, notifications, darkMode)
- `ui`: UI settings (colors, fontSize, spacing)

You can customize this structure to fit your needs.

