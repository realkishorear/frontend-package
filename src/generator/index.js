import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execa } from 'execa';
import chalk from 'chalk';
import { installDependencies } from '../utils/packageManager.js';
import { logger } from '../utils/logger.js';
import { executeCommands } from './commandExecutor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createTypeScriptConfig(targetPath, bundler) {
  const tsconfigPath = path.join(targetPath, 'tsconfig.json');
  
  // Base tsconfig options
  const baseConfig = {
    compilerOptions: {
      target: "ES2020",
      useDefineForClassFields: true,
      lib: ["ES2020", "DOM", "DOM.Iterable"],
      module: "ESNext",
      skipLibCheck: true,
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "react-jsx",
      strict: true,
      noFallthroughCasesInSwitch: true,
    },
    include: ["src"]
  };
  
  // Only add tsconfig.node.json reference for Vite (needed for vite.config.ts)
  if (bundler === 'vite') {
    baseConfig.references = [{ path: "./tsconfig.node.json" }];
  }
  
  // Set noEmit based on bundler
  // Note: For webpack with ts-loader, noEmit should be false or ts-loader needs special config
  // However, ts-loader can work with noEmit: true if configured correctly
  // We'll keep noEmit: true for both and let ts-loader handle it via compiler API
  baseConfig.compilerOptions.noEmit = true;

  // Bundler-specific configurations
  if (bundler === 'vite') {
    // Vite-specific settings
    baseConfig.compilerOptions.moduleResolution = "bundler";
    baseConfig.compilerOptions.allowImportingTsExtensions = true;
    // Keep strict unused checks for Vite (can be relaxed if needed)
    baseConfig.compilerOptions.noUnusedLocals = false;
    baseConfig.compilerOptions.noUnusedParameters = false;
    // Add vite/client types for import.meta.env support
    baseConfig.compilerOptions.types = ["vite/client"];
  } else {
    // For webpack bundler
    baseConfig.compilerOptions.moduleResolution = "node";
    baseConfig.compilerOptions.allowImportingTsExtensions = false;
    baseConfig.compilerOptions.allowSyntheticDefaultImports = true;
    baseConfig.compilerOptions.esModuleInterop = true;
    // Relax unused checks for webpack to avoid build errors
    baseConfig.compilerOptions.noUnusedLocals = false;
    baseConfig.compilerOptions.noUnusedParameters = false;
    // Add node types for process.env support
    baseConfig.compilerOptions.types = ["node"];
  }

  await fs.writeJson(tsconfigPath, baseConfig, { spaces: 2 });
  console.log(chalk.green(`✅ Created tsconfig.json for ${bundler}`));
}

function getConfigPath(bundler, cssFramework) {
  // Map bundler + CSS framework to config directory
  // Note: CSS framework 'sass' maps to directory 'scss'
  const cssDirName = cssFramework === 'sass' ? 'scss' : cssFramework;
  const configDir = path.join(__dirname, 'configs', `${bundler}-${cssDirName}`);
  return configDir;
}

async function configureBundler(targetPath, bundler, cssFramework, routingType) {
  const packageJsonPath = path.join(targetPath, 'package.json');
  let packageJson = {};
  if (await fs.pathExists(packageJsonPath)) {
    packageJson = await fs.readJson(packageJsonPath);
  }
  
  // Get the static config directory for this combination
  const configPath = getConfigPath(bundler, cssFramework);

  // Remove Vite-specific dependencies if not using Vite
  if (bundler !== 'vite') {
    delete packageJson.devDependencies?.['vite'];
    delete packageJson.devDependencies?.['@vitejs/plugin-react'];
  }

  // Remove React Router v7+ specific scripts if using v6
  if (routingType === 'v6' && packageJson.scripts) {
    if (packageJson.scripts.dev === 'react-router dev') {
      delete packageJson.scripts.dev;
      delete packageJson.scripts.build;
      delete packageJson.scripts.preview;
      delete packageJson.scripts.typecheck;
    }
  }

    switch (bundler) {
    case 'vite':
      // Copy static Vite configuration files
      if (routingType === 'v7') {
        // React Router v7+ config will be written later in the code
        // Just ensure vite is in dependencies here
        if (!packageJson.devDependencies) {
          packageJson.devDependencies = {};
        }
        packageJson.devDependencies['vite'] = '^5.0.8';
        packageJson.devDependencies['@vitejs/plugin-react'] = '^4.2.1';
        // Scripts will be updated by React Router v7+ setup
      } else {
        // Copy static config files
        if (await fs.pathExists(configPath)) {
          const viteConfigSrc = path.join(configPath, 'vite.config.ts');
          const tsconfigSrc = path.join(configPath, 'tsconfig.json');
          const tsconfigNodeSrc = path.join(configPath, 'tsconfig.node.json');
          const postcssConfigSrc = path.join(configPath, 'postcss.config.js');
          
          if (await fs.pathExists(viteConfigSrc)) {
            await fs.copy(viteConfigSrc, path.join(targetPath, 'vite.config.ts'));
          }
          if (await fs.pathExists(tsconfigSrc)) {
            await fs.copy(tsconfigSrc, path.join(targetPath, 'tsconfig.json'));
          }
          if (await fs.pathExists(tsconfigNodeSrc)) {
            await fs.copy(tsconfigNodeSrc, path.join(targetPath, 'tsconfig.node.json'));
          }
          if (await fs.pathExists(postcssConfigSrc)) {
            await fs.copy(postcssConfigSrc, path.join(targetPath, 'postcss.config.js'));
          }
        }
        
        if (!packageJson.devDependencies) {
          packageJson.devDependencies = {};
        }
        packageJson.devDependencies['vite'] = '^5.0.8';
        packageJson.devDependencies['@vitejs/plugin-react'] = '^4.2.1';
        
        if (!packageJson.scripts) {
          packageJson.scripts = {};
        }
        packageJson.scripts['dev'] = 'vite';
        packageJson.scripts['build'] = 'tsc && vite build';
        packageJson.scripts['preview'] = 'vite preview';
      }
      console.log(chalk.green('✅ Configured Vite (using static config files)'));
      break;

    case 'webpack':
      // Webpack configuration - remove "type": "module" since webpack.config.js uses CommonJS
      delete packageJson.type;
      
      // Copy static config files - try multiple path resolutions
      const possibleConfigPaths = [
        configPath, // Primary path
        path.join(__dirname, 'configs', `${bundler}-${cssFramework}`), // Direct path
        path.resolve(__dirname, 'configs', `${bundler}-${cssFramework}`), // Resolved path
      ];
      
      let configFound = false;
      for (const tryConfigPath of possibleConfigPaths) {
        if (await fs.pathExists(tryConfigPath)) {
          const webpackConfigSrc = path.join(tryConfigPath, 'webpack.config.js');
          const tsconfigSrc = path.join(tryConfigPath, 'tsconfig.json');
          const postcssConfigSrc = path.join(tryConfigPath, 'postcss.config.js');
          
          if (await fs.pathExists(webpackConfigSrc)) {
            await fs.copy(webpackConfigSrc, path.join(targetPath, 'webpack.config.js'));
            console.log(chalk.green('✅ Copied webpack.config.js'));
            configFound = true;
          }
          if (await fs.pathExists(tsconfigSrc)) {
            await fs.copy(tsconfigSrc, path.join(targetPath, 'tsconfig.json'));
          }
          if (await fs.pathExists(postcssConfigSrc)) {
            await fs.copy(postcssConfigSrc, path.join(targetPath, 'postcss.config.js'));
          }
          break; // Found config, exit loop
        }
      }
      
      if (!configFound) {
        console.log(chalk.red(`❌ ERROR: Could not find webpack config for ${bundler}-${cssFramework}`));
        console.log(chalk.yellow(`   Tried paths:`));
        possibleConfigPaths.forEach(p => console.log(chalk.yellow(`     - ${p}`)));
        console.log(chalk.yellow(`   __dirname: ${__dirname}`));
        throw new Error(`Webpack configuration not found for ${bundler}-${cssFramework}`);
      }
      
      if (!packageJson.devDependencies) {
        packageJson.devDependencies = {};
      }
      packageJson.devDependencies['webpack'] = '^5.89.0';
      packageJson.devDependencies['webpack-cli'] = '^5.1.4';
      packageJson.devDependencies['webpack-dev-server'] = '^4.15.1';
      packageJson.devDependencies['html-webpack-plugin'] = '^5.5.3';
      packageJson.devDependencies['copy-webpack-plugin'] = '^11.0.0';
      packageJson.devDependencies['ts-loader'] = '^9.5.1';
      packageJson.devDependencies['style-loader'] = '^3.3.3';
      packageJson.devDependencies['css-loader'] = '^6.8.1';
      packageJson.devDependencies['sass-loader'] = '^13.3.2';
      packageJson.devDependencies['sass'] = '^1.69.0';
      packageJson.devDependencies['mini-css-extract-plugin'] = '^2.7.6';
      packageJson.devDependencies['postcss-loader'] = '^7.3.3';
      packageJson.devDependencies['postcss'] = '^8.4.32';
      packageJson.devDependencies['autoprefixer'] = '^10.4.16';
      packageJson.devDependencies['@types/node'] = '^20.10.0';
      
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }
      packageJson.scripts['dev'] = 'webpack serve';
      packageJson.scripts['build'] = 'tsc && webpack --mode production';
      packageJson.scripts['preview'] = 'webpack serve --mode production';
      
      console.log(chalk.green('✅ Configured Webpack (using static config files)'));
      break;

    default:
      console.log(chalk.yellow(`⚠️  Unknown bundler: ${bundler}, defaulting to Vite`));
      // Fallback to Vite (should only be vite or webpack)
      const defaultConfigPath = getConfigPath('vite', cssFramework);
      const defaultViteConfigSrc = path.join(defaultConfigPath, 'vite.config.ts');
      if (await fs.pathExists(defaultViteConfigSrc)) {
        await fs.copy(defaultViteConfigSrc, path.join(targetPath, 'vite.config.ts'));
      }
  }

  // Save updated package.json
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
}

/**
 * Generate Next.js project
 */
async function generateNextJSProject(targetPath, answers) {
  const { template } = answers;
  const projectName = path.basename(targetPath);
  
  console.log(chalk.blue('▲ Generating Next.js project...\n'));
  
  try {
    await fs.ensureDir(targetPath);
    
    // Create package.json
    const packageJson = {
      name: projectName,
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        next: '^14.0.0',
      },
      devDependencies: {
        '@types/node': '^20.10.0',
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        typescript: '^5.3.3',
        'eslint': '^8.55.0',
        'eslint-config-next': '^14.0.0',
        'tailwindcss': '^3.3.6',
        'postcss': '^8.4.32',
        'autoprefixer': '^10.4.16',
      },
    };
    
    // Add react-icons and oidc-client-ts if dashboard template is selected
    if (template === 'dashboard') {
      packageJson.dependencies['react-icons'] = '^4.12.0';
      packageJson.dependencies['oidc-client-ts'] = '^3.0.0'; // React 18-compatible OIDC library
    }
    
    await fs.writeJson(path.join(targetPath, 'package.json'), packageJson, { spaces: 2 });
    console.log(chalk.green('✅ Created package.json\n'));
    
    // Create tsconfig.json
    const tsconfig = {
      compilerOptions: {
        target: 'ES2017',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [
          {
            name: 'next',
          },
        ],
        paths: {
          '@/*': ['./src/*'],
        },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    };
    
    await fs.writeJson(path.join(targetPath, 'tsconfig.json'), tsconfig, { spaces: 2 });
    console.log(chalk.green('✅ Created tsconfig.json\n'));
    
    // Create next.config.js
    const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
`;
    
    await fs.writeFile(path.join(targetPath, 'next.config.js'), nextConfig);
    console.log(chalk.green('✅ Created next.config.js\n'));
    
    // Create tailwind.config.js
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;
    
    await fs.writeFile(path.join(targetPath, 'tailwind.config.js'), tailwindConfig);
    console.log(chalk.green('✅ Created tailwind.config.js\n'));
    
    // Create postcss.config.js
    const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;
    
    await fs.writeFile(path.join(targetPath, 'postcss.config.js'), postcssConfig);
    console.log(chalk.green('✅ Created postcss.config.js\n'));
    
    // Create .eslintrc.json
    const eslintConfig = {
      extends: 'next/core-web-vitals',
    };
    
    await fs.writeJson(path.join(targetPath, '.eslintrc.json'), eslintConfig, { spaces: 2 });
    console.log(chalk.green('✅ Created .eslintrc.json\n'));
    
    // Create .gitignore
    const gitignore = `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`;
    
    await fs.writeFile(path.join(targetPath, '.gitignore'), gitignore);
    console.log(chalk.green('✅ Created .gitignore\n'));
    
    // Create src directory structure
    const srcPath = path.join(targetPath, 'src');
    await fs.ensureDir(srcPath);
    
    // Create app directory (App Router)
    const appPath = path.join(srcPath, 'app');
    await fs.ensureDir(appPath);
    
    // Create global styles
    const globalCss = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;
    
    await fs.writeFile(path.join(appPath, 'globals.css'), globalCss);
    console.log(chalk.green('✅ Created app/globals.css\n'));
    
    // Create page.tsx based on template
    if (template === 'dashboard') {
      // Copy dashboard template
      const dashboardTemplatePath = path.join(__dirname, 'templates', 'dashboard');
      if (await fs.pathExists(dashboardTemplatePath)) {
        // Create components directory
        const componentsPath = path.join(srcPath, 'components');
        await fs.ensureDir(componentsPath);
        
          // Copy dashboard components
        const dashboardComponentsPath = path.join(dashboardTemplatePath, 'components');
        if (await fs.pathExists(dashboardComponentsPath)) {
          await fs.copy(dashboardComponentsPath, componentsPath);
          
          // Update Sidebar.tsx to use Next.js Link instead of react-router-dom
          const sidebarPath = path.join(componentsPath, 'Sidebar.tsx');
          if (await fs.pathExists(sidebarPath)) {
            let sidebarContent = await fs.readFile(sidebarPath, 'utf-8');
            
            // Add 'use client' directive if not present (needed for hooks in Next.js)
            if (!sidebarContent.includes("'use client'")) {
              sidebarContent = "'use client'\n\n" + sidebarContent;
            }
            
            // Replace react-router-dom imports with Next.js
            sidebarContent = sidebarContent.replace(
              /import\s+\{\s*Link,\s*useLocation\s*\}\s+from\s+['"]react-router-dom['"]/g,
              "import Link from 'next/link'\nimport { usePathname } from 'next/navigation'"
            );
            
            // Replace useLocation() with usePathname()
            sidebarContent = sidebarContent.replace(/const\s+location\s*=\s*useLocation\(\)/g, 'const pathname = usePathname()');
            
            // Replace location.pathname with pathname
            sidebarContent = sidebarContent.replace(/location\.pathname/g, 'pathname');
            
            // Update Link component usage - Next.js Link needs href prop instead of to
            // Simple and robust replacement: replace 'to=' with 'href=' (word boundary ensures we only match prop names)
            sidebarContent = sidebarContent.replace(/\bto\s*=/g, 'href=');
            
            await fs.writeFile(sidebarPath, sidebarContent);
            console.log(chalk.green('✅ Updated Sidebar component for Next.js\n'));
          }
          
          // Add 'use client' directive to Header.tsx (uses hooks)
          const headerPath = path.join(componentsPath, 'Header.tsx');
          if (await fs.pathExists(headerPath)) {
            let headerContent = await fs.readFile(headerPath, 'utf-8');
            if (!headerContent.includes("'use client'")) {
              headerContent = "'use client'\n\n" + headerContent;
              await fs.writeFile(headerPath, headerContent);
              console.log(chalk.green('✅ Updated Header component for Next.js\n'));
            }
          }
          
          // Add 'use client' directive to other components that use hooks
          const componentFiles = ['Button.tsx', 'Card.tsx', 'Input.tsx', 'StatCard.tsx'];
          for (const file of componentFiles) {
            const filePath = path.join(componentsPath, file);
            if (await fs.pathExists(filePath)) {
              let fileContent = await fs.readFile(filePath, 'utf-8');
              // Check if component uses hooks (useState, useEffect, etc.)
              if ((fileContent.includes('useState') || fileContent.includes('useEffect') || fileContent.includes('useRef')) && !fileContent.includes("'use client'")) {
                fileContent = "'use client'\n\n" + fileContent;
                await fs.writeFile(filePath, fileContent);
              }
            }
          }
          
          console.log(chalk.green('✅ Copied dashboard components\n'));
        }
        
        // Create pages directory for dashboard pages (for component imports)
        const pagesPath = path.join(srcPath, 'pages');
        await fs.ensureDir(pagesPath);
        
        const dashboardPagesPath = path.join(dashboardTemplatePath, 'pages');
        if (await fs.pathExists(dashboardPagesPath)) {
          await fs.copy(dashboardPagesPath, pagesPath);
          
          // Add 'use client' directive to all page components that use hooks
          const pageFiles = await fs.readdir(pagesPath);
          for (const file of pageFiles) {
            if (file.endsWith('.tsx')) {
              const filePath = path.join(pagesPath, file);
              let fileContent = await fs.readFile(filePath, 'utf-8');
              
              // Check if component uses hooks
              if ((fileContent.includes('useState') || fileContent.includes('useEffect') || fileContent.includes('useRef') || fileContent.includes('useCallback') || fileContent.includes('useMemo')) && !fileContent.includes("'use client'")) {
                fileContent = "'use client'\n\n" + fileContent;
                await fs.writeFile(filePath, fileContent);
              }
            }
          }
          
          console.log(chalk.green('✅ Copied dashboard pages and added client directives\n'));
        }
        
        // Create services directory and copy authService for Next.js compatibility
        const servicesPath = path.join(srcPath, 'services');
        await fs.ensureDir(servicesPath);
        
        // Copy authService from nextjs-auth template (it's compatible with dashboard Header component)
        const nextjsAuthServicePath = path.join(__dirname, 'templates', 'nextjs-auth', 'services', 'authService.tsx');
        if (await fs.pathExists(nextjsAuthServicePath)) {
          await fs.copy(nextjsAuthServicePath, path.join(servicesPath, 'authService.tsx'));
          console.log(chalk.green('✅ Copied authService for Next.js compatibility\n'));
        }
        
        // Also copy OIDC config if it exists
        const configPath = path.join(srcPath, 'config');
        await fs.ensureDir(configPath);
        
        const dashboardConfigPath = path.join(dashboardTemplatePath, 'config');
        if (await fs.pathExists(dashboardConfigPath)) {
          await fs.copy(dashboardConfigPath, configPath);
          console.log(chalk.green('✅ Copied OIDC config\n'));
        }
        
        // Create Dashboard Layout component (used by all routes)
        const dashboardLayoutContent = `'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} isMobile={isMobile} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <Header onMenuClick={toggleSidebar} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
`;
        
        await fs.writeFile(path.join(componentsPath, 'DashboardLayout.tsx'), dashboardLayoutContent);
        console.log(chalk.green('✅ Created DashboardLayout component\n'));
        
        // Create root layout with DashboardLayout
        const layoutContent = `import type { Metadata } from 'next'
import './globals.css'
import DashboardLayout from '@/components/DashboardLayout'

export const metadata: Metadata = {
  title: '${projectName}',
  description: 'Generated with JGD FE CLI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </body>
    </html>
  )
}
`;
        
        await fs.writeFile(path.join(appPath, 'layout.tsx'), layoutContent);
        console.log(chalk.green('✅ Created app/layout.tsx with DashboardLayout\n'));
        
        // Create main page.tsx (Home)
        // Check if Home component uses hooks
        const homeComponentPath = path.join(pagesPath, 'Home.tsx');
        let homePageContent = '';
        if (await fs.pathExists(homeComponentPath)) {
          const homeContent = await fs.readFile(homeComponentPath, 'utf-8');
          const needsClient = homeContent.includes('useState') || 
                             homeContent.includes('useEffect') || 
                             homeContent.includes('useRef') ||
                             homeContent.includes('useCallback') ||
                             homeContent.includes('useMemo') ||
                             homeContent.includes("'use client'");
          
          if (needsClient) {
            homePageContent = `'use client'

import Home from '@/pages/Home'

export default function Page() {
  return <Home />
}
`;
          } else {
            homePageContent = `import Home from '@/pages/Home'

export default function Page() {
  return <Home />
}
`;
          }
        } else {
          homePageContent = `export default function Page() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Home</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Home page</p>
      </div>
    </div>
  )
}`;
        }
        
        await fs.writeFile(path.join(appPath, 'page.tsx'), homePageContent);
        console.log(chalk.green('✅ Created app/page.tsx\n'));
        
        // Create route folders for all dashboard pages
        const routes = [
          { path: 'analytics', component: 'Analytics' },
          { path: 'users', component: 'Users' },
          { path: 'orders', component: 'Orders' },
          { path: 'messages', component: 'Messages' },
          { path: 'calendar', component: 'Calendar' },
          { path: 'reports', component: 'Reports' },
          { path: 'settings', component: 'Settings' },
        ];
        
        // Create placeholder components for pages that don't exist
        const placeholderComponents = {
          Users: `export default function Users() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Users</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Users management page coming soon...</p>
      </div>
    </div>
  )
}`,
          Orders: `export default function Orders() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Orders</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Orders management page coming soon...</p>
      </div>
    </div>
  )
}`,
          Messages: `export default function Messages() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Messages</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Messages page coming soon...</p>
      </div>
    </div>
  )
}`,
          Calendar: `export default function Calendar() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Calendar</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Calendar page coming soon...</p>
      </div>
    </div>
  )
}`,
          Reports: `export default function Reports() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Reports</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Reports page coming soon...</p>
      </div>
    </div>
  )
}`,
        };
        
        for (const route of routes) {
          const routePath = path.join(appPath, route.path);
          await fs.ensureDir(routePath);
          
          let pageContent = '';
          // Check if the page component exists in the pages directory
          const pageComponentPath = path.join(pagesPath, `${route.component}.tsx`);
          if (await fs.pathExists(pageComponentPath)) {
            // Check if the component uses hooks (needs 'use client')
            const componentContent = await fs.readFile(pageComponentPath, 'utf-8');
            const needsClient = componentContent.includes('useState') || 
                               componentContent.includes('useEffect') || 
                               componentContent.includes('useRef') ||
                               componentContent.includes('useCallback') ||
                               componentContent.includes('useMemo') ||
                               componentContent.includes("'use client'");
            
            // Use existing component
            if (needsClient) {
              pageContent = `'use client'

import ${route.component} from '@/pages/${route.component}'

export default function Page() {
  return <${route.component} />
}
`;
            } else {
              pageContent = `import ${route.component} from '@/pages/${route.component}'

export default function Page() {
  return <${route.component} />
}
`;
            }
          } else if (placeholderComponents[route.component]) {
            // Use placeholder
            pageContent = placeholderComponents[route.component];
          } else {
            // Generic placeholder
            pageContent = `export default function ${route.component}() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">${route.component}</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">${route.component} page coming soon...</p>
      </div>
    </div>
  )
}`;
          }
          
          await fs.writeFile(path.join(routePath, 'page.tsx'), pageContent);
          console.log(chalk.green(`✅ Created app/${route.path}/page.tsx\n`));
        }
      }
    } else {
      // Empty template - create simple layout
      const layoutContent = `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '${projectName}',
  description: 'Generated with JGD FE CLI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`;
      
      await fs.writeFile(path.join(appPath, 'layout.tsx'), layoutContent);
      console.log(chalk.green('✅ Created app/layout.tsx\n'));
      
      // Empty template - simple page
      const pageContent = `export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to ${projectName}</h1>
        <p className="text-gray-600">Start building something amazing!</p>
      </div>
    </div>
  )
}
`;
      
      await fs.writeFile(path.join(appPath, 'page.tsx'), pageContent);
      console.log(chalk.green('✅ Created app/page.tsx\n'));
    }
    
    // Copy template's public folder (for config.json and other static assets)
    const templatePath = path.join(__dirname, 'templates', template === 'dashboard' ? 'nextjs-auth' : template);
    const templatePublicPath = path.join(templatePath, 'public');
    const targetPublicPath = path.join(targetPath, 'public');
    
    if (await fs.pathExists(templatePublicPath)) {
      await fs.ensureDir(targetPublicPath);
      await fs.copy(templatePublicPath, targetPublicPath);
      console.log(chalk.green('✅ Copied template public directory with config.json\n'));
    } else {
      // Create public folder with default config.json if template doesn't have one
      await fs.ensureDir(targetPublicPath);
      const defaultConfig = {
        app: {
          name: projectName,
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
      };
      await fs.writeJson(path.join(targetPublicPath, 'config.json'), defaultConfig, { spaces: 2 });
      console.log(chalk.green('✅ Created public directory with config.json\n'));
    }
    
    // Install dependencies
    console.log(chalk.blue('📦 Installing dependencies...\n'));
    await installDependencies(targetPath);
    console.log(chalk.green('✅ Dependencies installed!\n'));
    
    console.log(chalk.green('✅ Next.js project generated successfully!\n'));
    console.log(chalk.cyan('📝 Next steps:'));
    if (targetPath !== process.cwd()) {
      console.log(chalk.white(`   cd ${path.basename(targetPath)}`));
    }
    console.log(chalk.white('   npm run dev'));
    console.log(chalk.white('\n🎉 Happy coding!\n'));
    
  } catch (error) {
    console.error(chalk.red(`❌ Error generating Next.js project: ${error.message}`));
    throw error;
  }
}

/**
 * Generate Angular project
 */
async function generateAngularProject(targetPath, answers) {
  const { cssFramework, componentLibrary, stateManagement, template } = answers;
  const projectName = path.basename(targetPath);
  const styleExt = cssFramework === 'scss' ? 'scss' : 'css';
  
  console.log(chalk.blue('🅰️  Generating Angular project...\n'));
  
  try {
    await fs.ensureDir(targetPath);
    
    // Create package.json
    const packageJson = {
      name: projectName,
      version: '0.0.0',
      scripts: {
        ng: 'ng',
        start: 'ng serve',
        build: 'ng build',
        watch: 'ng build --watch --configuration development',
        test: 'ng test'
      },
      private: true,
      dependencies: {
        '@angular/animations': '^17.0.0',
        '@angular/common': '^17.0.0',
        '@angular/compiler': '^17.0.0',
        '@angular/core': '^17.0.0',
        '@angular/forms': '^17.0.0',
        '@angular/platform-browser': '^17.0.0',
        '@angular/platform-browser-dynamic': '^17.0.0',
        '@angular/router': '^17.0.0',
        'rxjs': '~7.8.0',
        'tslib': '^2.3.0',
        'zone.js': '~0.14.2'
      },
      devDependencies: {
        '@angular-devkit/build-angular': '^17.0.0',
        '@angular/cli': '^17.0.0',
        '@angular/compiler-cli': '^17.0.0',
        '@types/jasmine': '~5.1.0',
        'jasmine-core': '~5.1.0',
        'karma': '~6.4.0',
        'karma-chrome-launcher': '~3.2.0',
        'karma-coverage': '~2.2.0',
        'karma-jasmine': '~5.1.0',
        'karma-jasmine-html-reporter': '~2.1.0',
        'typescript': '~5.2.2'
      }
    };
    
    // Add Angular Material if selected
    if (componentLibrary === 'mui') {
      packageJson.dependencies['@angular/material'] = '^17.0.0';
      packageJson.dependencies['@angular/cdk'] = '^17.0.0';
    }
    
    // Add NgRx if Redux selected
    if (stateManagement === 'redux') {
      packageJson.dependencies['@ngrx/store'] = '^17.0.0';
      packageJson.dependencies['@ngrx/effects'] = '^17.0.0';
      packageJson.devDependencies['@ngrx/store-devtools'] = '^17.0.0';
    }
    
    await fs.writeJson(path.join(targetPath, 'package.json'), packageJson, { spaces: 2 });
    console.log(chalk.green('✅ Created package.json\n'));
    
    // Create angular.json
    const angularJson = {
      '$schema': './node_modules/@angular/cli/lib/config/schema.json',
      'version': 1,
      'newProjectRoot': 'projects',
      'projects': {
        [projectName]: {
          'projectType': 'application',
          'schematics': {
            '@schematics/angular:component': {
              'style': styleExt
            }
          },
          'root': '',
          'sourceRoot': 'src',
          'prefix': 'app',
          'architect': {
            'build': {
              'builder': '@angular-devkit/build-angular:browser',
              'options': {
                'outputPath': 'dist/' + projectName,
                'index': 'src/index.html',
                'main': 'src/main.ts',
                'polyfills': ['zone.js'],
                'tsConfig': 'tsconfig.app.json',
                'assets': ['src/favicon.ico', 'src/assets'],
                'styles': [`src/styles.${styleExt}`],
                'scripts': []
              }
            },
            'serve': {
              'builder': '@angular-devkit/build-angular:dev-server',
              'options': {
                'buildTarget': projectName + ':build'
              }
            }
          }
        }
      }
    };
    await fs.writeJson(path.join(targetPath, 'angular.json'), angularJson, { spaces: 2 });
    console.log(chalk.green('✅ Created angular.json\n'));
    
    // Create tsconfig files
    const tsConfig = {
      compileOnSave: false,
      compilerOptions: {
        outDir: './dist/out-tsc',
        forceConsistentCasingInFileNames: true,
        strict: true,
        noImplicitOverride: true,
        noPropertyAccessFromIndexSignature: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        skipLibCheck: true,
        esModuleInterop: true,
        sourceMap: true,
        declaration: false,
        experimentalDecorators: true,
        moduleResolution: 'node',
        importHelpers: true,
        target: 'ES2022',
        module: 'ES2022',
        lib: ['ES2022', 'dom']
      },
      angularCompilerOptions: {
        enableI18nLegacyMessageIdFormat: false,
        strictInjectionParameters: true,
        strictInputAccessModifiers: true,
        strictTemplates: true
      }
    };
    await fs.writeJson(path.join(targetPath, 'tsconfig.json'), tsConfig, { spaces: 2 });
    
    const tsConfigApp = { ...tsConfig, extends: './tsconfig.json', compilerOptions: { outDir: './out-tsc/app' }, files: ['src/main.ts'], include: ['src/**/*.d.ts'] };
    await fs.writeJson(path.join(targetPath, 'tsconfig.app.json'), tsConfigApp, { spaces: 2 });
    console.log(chalk.green('✅ Created TypeScript configs\n'));
    
    // Create src directory structure
    const srcPath = path.join(targetPath, 'src');
    await fs.ensureDir(srcPath);
    await fs.ensureDir(path.join(srcPath, 'app'));
    const assetsPath = path.join(srcPath, 'assets');
    await fs.ensureDir(assetsPath);
    
    // Copy template's assets folder (for config.json)
    const templatePath = path.join(__dirname, 'templates', template === 'dashboard' ? 'angular-auth' : template);
    const templateAssetsPath = path.join(templatePath, 'src', 'assets');
    
    if (await fs.pathExists(templateAssetsPath)) {
      await fs.copy(templateAssetsPath, assetsPath);
      console.log(chalk.green('✅ Copied template assets with config.json\n'));
    } else {
      // Create default config.json if template doesn't have one
      const defaultConfig = {
        app: {
          name: projectName,
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
      };
      await fs.writeJson(path.join(assetsPath, 'config.json'), defaultConfig, { spaces: 2 });
      console.log(chalk.green('✅ Created assets directory with config.json\n'));
    }
    
    // Create index.html
    const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${projectName}</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <app-root></app-root>
</body>
</html>`;
    await fs.writeFile(path.join(srcPath, 'index.html'), indexHtml);
    
    // Create main.ts
    const mainTs = `import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));`;
    await fs.writeFile(path.join(srcPath, 'main.ts'), mainTs);
    
    // Create styles file
    const stylesContent = styleExt === 'scss' 
      ? `/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`
      : `/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`;
    await fs.writeFile(path.join(srcPath, `styles.${styleExt}`), stylesContent);
    
    // Create app.module.ts
    let appModuleImports = `import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';`;
    
    if (componentLibrary === 'mui') {
      appModuleImports += `\n// Angular Material imports will be added here after running: ng add @angular/material`;
    }
    
    if (stateManagement === 'redux') {
      appModuleImports += `\n// NgRx imports will be added here after running: ng add @ngrx/store`;
    }
    
    const appModule = `${appModuleImports}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule${componentLibrary === 'mui' ? ',\n    // Add Angular Material modules here' : ''}${stateManagement === 'redux' ? ',\n    // Add NgRx StoreModule here' : ''}
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }`;
    await fs.writeFile(path.join(srcPath, 'app', 'app.module.ts'), appModule);
    
    // Create app.component.ts
    const appComponent = `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.${styleExt}']
})
export class AppComponent {
  title = '${projectName}';
}`;
    await fs.writeFile(path.join(srcPath, 'app', 'app.component.ts'), appComponent);
    
    // Create app.component.html
    const appComponentHtml = template === 'dashboard' 
      ? `<div class="app-container">
  <h1>Welcome to ${projectName}</h1>
  <p>Dashboard template - customize this component to build your dashboard.</p>
</div>`
      : `<div class="app-container">
  <h1>Welcome to ${projectName}</h1>
  <p>Start building your Angular application!</p>
</div>`;
    await fs.writeFile(path.join(srcPath, 'app', 'app.component.html'), appComponentHtml);
    
    // Create app.component styles
    await fs.writeFile(path.join(srcPath, 'app', `app.component.${styleExt}`), `.app-container {
  padding: 20px;
}`);
    
    // Create app-routing.module.ts
    const appRouting = `import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }`;
    await fs.writeFile(path.join(srcPath, 'app', 'app-routing.module.ts'), appRouting);
    
    // Copy template files (services, components, guards, etc.)
    if (template === 'dashboard' || template === 'angular-auth') {
      const templatePath = path.join(__dirname, 'templates', 'angular-auth');
      
      // Copy services
      const templateServicesPath = path.join(templatePath, 'services');
      const targetServicesPath = path.join(srcPath, 'app', 'services');
      if (await fs.pathExists(templateServicesPath)) {
        await fs.copy(templateServicesPath, targetServicesPath);
        console.log(chalk.green('✅ Copied template services (including config.service.ts)\n'));
      }
      
      // Copy components
      const templateComponentsPath = path.join(templatePath, 'components');
      const targetComponentsPath = path.join(srcPath, 'app', 'components');
      if (await fs.pathExists(templateComponentsPath)) {
        await fs.copy(templateComponentsPath, targetComponentsPath);
        console.log(chalk.green('✅ Copied template components\n'));
      }
      
      // Copy guards
      const templateGuardsPath = path.join(templatePath, 'guards');
      const targetGuardsPath = path.join(srcPath, 'app', 'guards');
      if (await fs.pathExists(templateGuardsPath)) {
        await fs.copy(templateGuardsPath, targetGuardsPath);
        console.log(chalk.green('✅ Copied template guards\n'));
      }
    }
    
    console.log(chalk.green('✅ Created Angular project structure\n'));
    
    // Install dependencies
    console.log(chalk.blue('📦 Installing dependencies...\n'));
    await installDependencies(targetPath);
    console.log(chalk.green('✅ Dependencies installed!\n'));
    
    console.log(chalk.green('✅ Angular project generated successfully!\n'));
    console.log(chalk.cyan('📝 Next steps:'));
    if (targetPath !== process.cwd()) {
      console.log(chalk.white(`   cd ${path.basename(targetPath)}`));
    }
    console.log(chalk.white('   npm start'));
    if (componentLibrary === 'mui') {
      console.log(chalk.cyan('   ng add @angular/material'));
    }
    if (stateManagement === 'redux') {
      console.log(chalk.cyan('   ng add @ngrx/store'));
    }
    console.log(chalk.white('\n🎉 Happy coding!\n'));
    
  } catch (error) {
    console.error(chalk.red(`❌ Error generating Angular project: ${error.message}`));
    throw error;
  }
}

export async function generateProject(targetPath, answers, projectName) {
  // Extract project name from targetPath if not provided
  const finalProjectName = projectName || path.basename(targetPath);
  
  // Execute commands from JSON configuration
  await executeCommands(targetPath, answers, finalProjectName);
}
