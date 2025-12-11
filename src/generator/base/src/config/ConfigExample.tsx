// Example component showing how to use the config system
import { useConfig } from './ConfigProvider';

export function ConfigExample() {
  const { get } = useConfig();

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', margin: '20px' }}>
      <h2>Configuration Example</h2>
      <p>This component demonstrates how to access configuration values.</p>
      
      <div style={{ marginTop: '16px' }}>
        <h3>App Info</h3>
        <p><strong>Name:</strong> {get<string>('app.name', 'Unknown')}</p>
        <p><strong>Version:</strong> {get<string>('app.version', '1.0.0')}</p>
        <p><strong>Theme:</strong> {get<string>('app.theme', 'light')}</p>
      </div>

      <div style={{ marginTop: '16px' }}>
        <h3>API Config</h3>
        <p><strong>Base URL:</strong> {get<string>('api.baseUrl', 'Not set')}</p>
        <p><strong>Timeout:</strong> {get<number>('api.timeout', 5000)}ms</p>
      </div>

      <div style={{ marginTop: '16px' }}>
        <h3>Features</h3>
        <p><strong>Analytics:</strong> {get<boolean>('features.analytics', false) ? 'Enabled' : 'Disabled'}</p>
        <p><strong>Notifications:</strong> {get<boolean>('features.notifications', false) ? 'Enabled' : 'Disabled'}</p>
      </div>

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
        <p>💡 Tip: Edit <code>public/config.json</code> to see changes apply automatically!</p>
      </div>
    </div>
  );
}

