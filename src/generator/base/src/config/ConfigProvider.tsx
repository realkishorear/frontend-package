import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getConfigManager } from './configManager';

interface ConfigContextType {
  config: any;
  get: <T = any>(path: string, defaultValue?: T) => T;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

interface ConfigProviderProps {
  children: ReactNode;
  configPath?: string;
}

export function ConfigProvider({ children, configPath }: ConfigProviderProps) {
  const [config, setConfig] = useState<any>({});
  const configManager = getConfigManager(configPath);

  useEffect(() => {
    // Subscribe to config changes
    const unsubscribe = configManager.subscribe((newConfig) => {
      setConfig(newConfig);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [configManager]);

  const get = <T = any>(path: string, defaultValue?: T): T => {
    return configManager.get<T>(path, defaultValue);
  };

  return (
    <ConfigContext.Provider value={{ config, get }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig(): ConfigContextType {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}

