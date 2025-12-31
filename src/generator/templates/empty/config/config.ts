// Config utility for React templates
// Uses the ConfigProvider from base template

import { useConfig as useBaseConfig } from '../../../config/ConfigProvider'

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

/**
 * Hook to access configuration
 * Must be used within ConfigProvider
 */
export function useConfig() {
  const { get } = useBaseConfig()
  return {
    get: <T = any>(path: string, defaultValue?: T) => get<T>(path, defaultValue),
    getApiBaseUrl: () => get<string>('api.baseUrl', 'http://localhost:3000/api'),
    getConfig: () => ({
      app: {
        name: get<string>('app.name', 'React App'),
        version: get<string>('app.version', '1.0.0'),
        theme: get<'light' | 'dark'>('app.theme', 'light'),
        language: get<string>('app.language', 'en')
      },
      api: {
        baseUrl: get<string>('api.baseUrl', 'http://localhost:3000/api'),
        timeout: get<number>('api.timeout', 5000),
        retries: get<number>('api.retries', 3)
      },
      features: {
        analytics: get<boolean>('features.analytics', false),
        notifications: get<boolean>('features.notifications', false),
        darkMode: get<boolean>('features.darkMode', false)
      },
      ui: {
        primaryColor: get<string>('ui.primaryColor', '#3b82f6'),
        secondaryColor: get<string>('ui.secondaryColor', '#8b5cf6'),
        fontSize: get<string>('ui.fontSize', '16px'),
        spacing: get<string>('ui.spacing', '8px')
      }
    })
  }
}

/**
 * API utility function that uses config
 * Can be used outside of React components
 */
export function getApiBaseUrl(): string {
  // This will work if ConfigManager is initialized
  // For use outside components, you may need to import ConfigManager directly
  try {
    const { getConfigManager } = require('../../../config/configManager')
    const configManager = getConfigManager()
    return configManager.get<string>('api.baseUrl', 'http://localhost:3000/api')
  } catch {
    return 'http://localhost:3000/api'
  }
}

