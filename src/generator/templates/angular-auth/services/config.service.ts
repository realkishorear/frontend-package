import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { BehaviorSubject, Observable, of } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'

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

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private configSubject = new BehaviorSubject<AppConfig | null>(null)
  public config$ = this.configSubject.asObservable()
  private config: AppConfig | null = null

  constructor(private http: HttpClient) {
    this.loadConfig()
  }

  private loadConfig(): void {
    // Load config from assets/config.json
    this.http.get<AppConfig>('/assets/config.json')
      .pipe(
        tap((config) => {
          this.config = config
          this.configSubject.next(config)
        }),
        catchError((error) => {
          console.warn('Failed to load config.json, using defaults:', error)
          this.config = this.getDefaultConfig()
          this.configSubject.next(this.config)
          return of(this.config)
        })
      )
      .subscribe()
  }

  private getDefaultConfig(): AppConfig {
    return {
      app: {
        name: 'Angular App',
        version: '1.0.0',
        theme: 'light',
        language: 'en'
      },
      api: {
        baseUrl: 'http://localhost:3000/api',
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
   * Get the current config synchronously
   * Returns default config if not loaded yet
   */
  getConfig(): AppConfig {
    return this.config || this.getDefaultConfig()
  }

  /**
   * Get a config value by path (e.g., 'api.baseUrl')
   */
  get<T = any>(path: string, defaultValue?: T): T {
    const config = this.getConfig()
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
  getApiBaseUrl(): string {
    return this.get<string>('api.baseUrl', 'http://localhost:3000/api')
  }
}

