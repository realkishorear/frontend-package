// Config utility for Next.js
// Loads config from public/config.json at runtime

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

let cachedConfig: AppConfig | null = null

/**
 * Get default configuration
 */
function getDefaultConfig(): AppConfig {
  return {
    app: {
      name: 'Next.js App',
      version: '1.0.0',
      theme: 'light',
      language: 'en'
    },
    api: {
      baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
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
}

/**
 * Load config from public/config.json
 * This works on both client and server side
 */
export async function loadConfig(): Promise<AppConfig> {
  // If already cached, return it
  if (cachedConfig) {
    return cachedConfig
  }

  try {
    // In Next.js, public files are served from the root
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/config.json`, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })

    if (response.ok) {
      const config = await response.json()
      cachedConfig = config
      return config
    } else {
      console.warn('Failed to load config.json, using defaults')
      cachedConfig = getDefaultConfig()
      return cachedConfig
    }
  } catch (error) {
    console.warn('Error loading config.json, using defaults:', error)
    cachedConfig = getDefaultConfig()
    return cachedConfig
  }
}

/**
 * Get config synchronously (returns cached or default)
 * For client-side use, prefer using loadConfig() in useEffect
 */
export function getConfig(): AppConfig {
  return cachedConfig || getDefaultConfig()
}

/**
 * Get a config value by path (e.g., 'api.baseUrl')
 */
export function getConfigValue<T = any>(path: string, defaultValue?: T): T {
  const config = getConfig()
  const keys = path.split('.')
  let value: any = config

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key]
    } else {
      return defaultValue as T
    }
  }

  return value !== undefined ? value : (defaultValue as T)
}

/**
 * Get API base URL
 */
export function getApiBaseUrl(): string {
  return getConfigValue<string>('api.baseUrl', process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api')
}

/**
 * React hook to use config (client-side only)
 */
export function useConfig(): AppConfig {
  if (typeof window === 'undefined') {
    return getConfig()
  }

  // For client-side, we can use React hooks
  // But since this is a utility file, we'll return the config directly
  // Components should use loadConfig() in useEffect if they need fresh config
  return getConfig()
}

