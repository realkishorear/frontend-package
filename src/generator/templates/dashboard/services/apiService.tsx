// API Service utility that uses config for BASE_URL
// Example usage for making API calls

import { getConfigManager } from '../../../config/configManager'

/**
 * Get the API base URL from config
 */
export function getApiBaseUrl(): string {
  const configManager = getConfigManager()
  return configManager.get<string>('api.baseUrl', 'http://localhost:3000/api')
}

/**
 * Make an API call with automatic base URL from config
 */
export async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`
  
  const configManager = getConfigManager()
  const timeout = configManager.get<number>('api.timeout', 5000)
  
  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout')
    }
    throw error
  }
}

/**
 * Example API service methods
 */
export const apiService = {
  // Example: GET request
  get: <T = any>(endpoint: string) => apiCall<T>(endpoint, { method: 'GET' }),
  
  // Example: POST request
  post: <T = any>(endpoint: string, data: any) =>
    apiCall<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Example: PUT request
  put: <T = any>(endpoint: string, data: any) =>
    apiCall<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // Example: DELETE request
  delete: <T = any>(endpoint: string) =>
    apiCall<T>(endpoint, { method: 'DELETE' }),
}

