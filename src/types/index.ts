/**
 * Type definitions for the project generator
 */

export interface ProjectAnswers {
  template: 'dashboard' | 'landing' | 'empty';
  bundler: 'vite' | 'webpack';
  cssFramework: 'tailwind' | 'sass' | 'css';
  componentLibrary: 'mui' | 'antd' | 'shadcn' | 'none';
  useRedux: boolean;
  useReactQuery: boolean;
  useLogger: boolean;
  useAnimation: boolean;
  routingType: 'v6' | 'v7';
}

export type Template = ProjectAnswers['template'];
export type Bundler = ProjectAnswers['bundler'];
export type CssFramework = ProjectAnswers['cssFramework'];
export type ComponentLibrary = ProjectAnswers['componentLibrary'];
export type RoutingType = ProjectAnswers['routingType'];

