// Config utility for React templates
// Simple configuration management for dashboard template

export interface AppConfig {
  app: {
    name: string
    version: string
    theme: 'light' | 'dark'
    language: string
  }
  api: {
    baseUrl: string
    timeout: number
    retries: number
  }
  features: {
    analytics: boolean
    notifications: boolean
    darkMode: boolean
  }
  ui: {
    primaryColor: string
    secondaryColor: string
    fontSize: string
    spacing: string
  }
}

// Default configuration
const defaultConfig: AppConfig = {
  app: {
    name: 'Dashboard App',
    version: '1.0.0',
    theme: 'light',
    language: 'en'
  },
  api: {
    baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api',
    timeout: 5000,
    retries: 3
  },
  features: {
    analytics: true,
    notifications: true,
    darkMode: false
  },
  ui: {
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    fontSize: '16px',
    spacing: '8px'
  }
}

/**
 * Hook to access configuration
 */
export function useConfig() {
  return {
    get: <T = any>(path: string, defaultValue?: T): T => {
      // Simple path-based config access
      const keys = path.split('.')
      let value: any = defaultConfig
      for (const key of keys) {
        value = value?.[key]
        if (value === undefined) return defaultValue as T
      }
      return (value ?? defaultValue) as T
    },
    getApiBaseUrl: () => defaultConfig.api.baseUrl,
    getConfig: (): AppConfig => defaultConfig
  }
}

/**
 * API utility function that uses config
 * Can be used outside of React components
 */
export function getApiBaseUrl(): string {
  return defaultConfig.api.baseUrl
}

