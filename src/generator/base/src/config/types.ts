// Type definitions for configuration

export interface AppConfig {
  app: {
    name: string;
    version: string;
    theme: 'light' | 'dark';
    language: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  features: {
    analytics: boolean;
    notifications: boolean;
    darkMode: boolean;
  };
  ui: {
    primaryColor: string;
    secondaryColor: string;
    fontSize: string;
    spacing: string;
  };
}

export type ConfigPath = 
  | 'app'
  | 'app.name'
  | 'app.version'
  | 'app.theme'
  | 'app.language'
  | 'api'
  | 'api.baseUrl'
  | 'api.timeout'
  | 'api.retries'
  | 'features'
  | 'features.analytics'
  | 'features.notifications'
  | 'features.darkMode'
  | 'ui'
  | 'ui.primaryColor'
  | 'ui.secondaryColor'
  | 'ui.fontSize'
  | 'ui.spacing'
  | string; // Allow any string for flexibility

