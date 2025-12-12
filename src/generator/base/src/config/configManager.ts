// Config Manager with hot-reload support
// Watches for changes in config.json and reloads automatically

type ConfigChangeCallback = (config: any) => void;

class ConfigManager {
  private config: any = {};
  private callbacks: Set<ConfigChangeCallback> = new Set();
  private watchInterval: number | null = null;
  private configPath: string;

  constructor(configPath: string = '/config.json') {
    this.configPath = configPath;
    this.loadConfig();
    this.startWatching();
  }

  private async loadConfig(): Promise<void> {
    try {
      // Add cache-busting query parameter to ensure fresh fetch
      const url = `${this.configPath}?t=${Date.now()}`;
      const response = await fetch(url, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const newConfig = await response.json();
        
        // Check if config actually changed (deep comparison)
        const configChanged = JSON.stringify(this.config) !== JSON.stringify(newConfig);
        
        if (configChanged) {
          this.config = newConfig;
          console.log('🔄 Config reloaded:', newConfig);
          this.notifyCallbacks();
        }
      }
    } catch (error) {
      // Only warn if we don't have a config yet
      if (Object.keys(this.config).length === 0) {
        console.warn('Failed to load config, using defaults:', error);
        this.config = this.getDefaultConfig();
        this.notifyCallbacks();
      }
    }
  }

  private getDefaultConfig(): any {
    return {
      app: {
        name: 'React App',
        version: '1.0.0',
        theme: 'light'
      },
      api: {
        baseUrl: 'http://localhost:3000',
        timeout: 5000
      },
      features: {
        analytics: true,
        notifications: true
      }
    };
  }

  private startWatching(): void {
    // Check for config changes every 2 seconds
    this.watchInterval = window.setInterval(() => {
      this.loadConfig();
    }, 2000);
  }

  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => {
      try {
        callback(this.config);
      } catch (error) {
        console.error('Error in config callback:', error);
      }
    });
  }

  public getConfig(): any {
    return this.config;
  }

  public get<T = any>(path: string, defaultValue?: T): T {
    const keys = path.split('.');
    let value: any = this.config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue as T;
      }
    }
    
    return value !== undefined ? value : (defaultValue as T);
  }

  public subscribe(callback: ConfigChangeCallback): () => void {
    this.callbacks.add(callback);
    // Immediately call with current config
    callback(this.config);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  public destroy(): void {
    if (this.watchInterval !== null) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
    this.callbacks.clear();
  }
}

// Create singleton instance
let configManagerInstance: ConfigManager | null = null;

export function getConfigManager(configPath?: string): ConfigManager {
  if (!configManagerInstance) {
    configManagerInstance = new ConfigManager(configPath);
  }
  return configManagerInstance;
}

export default ConfigManager;