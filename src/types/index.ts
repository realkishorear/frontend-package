/**
 * Type definitions for the project generator
 */

export interface ProjectAnswers {
  framework: 'react' | 'angular' | 'nextjs';
  cssFramework: 'tailwind' | 'scss' | 'css';
  componentLibrary: 'mui' | 'shadcn' | 'antd' | 'plain';
  bundler?: 'vite' | 'webpack'; // Only for React
  stateManagement: 'redux' | 'plain';
  auth: 'oidc' | 'none'; // OIDC/Auth option
  template: 'dashboard' | 'none';
}

export type Framework = ProjectAnswers['framework'];
export type CssFramework = ProjectAnswers['cssFramework'];
export type ComponentLibrary = ProjectAnswers['componentLibrary'];
export type Bundler = ProjectAnswers['bundler'];
export type StateManagement = ProjectAnswers['stateManagement'];
export type Auth = ProjectAnswers['auth'];
export type Template = ProjectAnswers['template'];

