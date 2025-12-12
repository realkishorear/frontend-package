import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execa } from 'execa';
import chalk from 'chalk';
import { installDependencies } from '../utils/packageManager.js';
import { logger } from '../utils/logger.js';

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
  const configDir = path.join(__dirname, 'configs', `${bundler}-${cssFramework}`);
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

export async function generateProject(targetPath, answers) {
  let { template, bundler, cssFramework, componentLibrary, useRedux, useReactQuery, useLogger, useAnimation, routingType } = answers;
  
  // React Router v7+ requires Vite
  if (routingType === 'v7' && bundler !== 'vite') {
    console.log(chalk.yellow(`\n⚠️ Warning: React Router v7+ requires Vite as the bundler.`));
    console.log(chalk.yellow(`   Automatically switching to Vite for proper routing support.\n`));
    bundler = 'vite';
  }
  
  // Dashboard and Landing templates use Tailwind utility classes
  // Show warning but allow user's CSS framework choice
  if ((template === 'dashboard' || template === 'landing') && cssFramework !== 'tailwind') {
    console.log(chalk.yellow(`\n⚠️  Warning: ${template === 'dashboard' ? 'Dashboard' : 'Landing'} template uses Tailwind utility classes.`));
    console.log(chalk.yellow(`   You've selected ${cssFramework.toUpperCase()}, so you'll need to replace Tailwind classes with your own styling.`));
    console.log(chalk.yellow(`   Proceeding with ${cssFramework.toUpperCase()} as requested...\n`));
  }

  try {
    // Get paths
    const basePath = path.join(__dirname, 'base');
    const templatePath = path.join(__dirname, 'templates', template);

    // Create target directory
    await fs.ensureDir(targetPath);

    console.log(chalk.blue('📁 Copying base files...'));
    
    // Copy base files (package.json, etc.)
    // Note: bundler config files and tsconfig will be created separately based on bundler choice
    const baseFiles = [
      'package.json',
      'index.html',
      'tailwind.config.js',
      'postcss.config.js'
    ];
    
    // Only copy tsconfig.node.json for Vite projects (needed for vite.config.ts)
    if (bundler === 'vite') {
      baseFiles.push('tsconfig.node.json');
    }

    for (const file of baseFiles) {
      const srcFile = path.join(basePath, file);
      if (await fs.pathExists(srcFile)) {
        const targetFile = path.join(targetPath, file);
        await fs.copy(srcFile, targetFile);
        
        // For webpack, remove the script tag from index.html (HtmlWebpackPlugin will inject it)
        if (file === 'index.html' && bundler === 'webpack') {
          let htmlContent = await fs.readFile(targetFile, 'utf-8');
          // Remove script tag that references /src/main.tsx
          htmlContent = htmlContent.replace(/<script[^>]*src=["']\/src\/main\.tsx["'][^>]*><\/script>\s*/g, '');
          await fs.writeFile(targetFile, htmlContent, 'utf-8');
        }
      }
    }
    
    // Handle bundler-specific configuration (including tsconfig)
    console.log(chalk.blue(`⚙️  Configuring ${bundler} bundler...`));
    await configureBundler(targetPath, bundler, cssFramework, routingType);
    
    // Note: tsconfig.json is now copied from static configs, no need to generate

    // Copy base src directory
    const baseSrcPath = path.join(basePath, 'src');
    const targetSrcPath = path.join(targetPath, 'src');
    if (await fs.pathExists(baseSrcPath)) {
      await fs.copy(baseSrcPath, targetSrcPath);
      
      // For webpack, remove .tsx/.ts extensions from imports in main.tsx
      if (bundler === 'webpack') {
        const mainTsxPath = path.join(targetSrcPath, 'main.tsx');
        if (await fs.pathExists(mainTsxPath)) {
          let mainContent = await fs.readFile(mainTsxPath, 'utf-8');
          // Remove .tsx and .ts extensions from import statements
          mainContent = mainContent.replace(/from\s+['"](\.\/[^'"]+)\.tsx['"]/g, "from '$1'");
          mainContent = mainContent.replace(/from\s+['"](\.\/[^'"]+)\.ts['"]/g, "from '$1'");
          await fs.writeFile(mainTsxPath, mainContent, 'utf-8');
        }
      }
    }

    // Copy public directory (for config.json and other static assets)
    const basePublicPath = path.join(basePath, 'public');
    const targetPublicPath = path.join(targetPath, 'public');
    if (await fs.pathExists(basePublicPath)) {
      await fs.copy(basePublicPath, targetPublicPath);
      console.log(chalk.blue('📁 Copied public directory with config.json...'));
    }

    // Copy template files
    if (await fs.pathExists(templatePath)) {
      console.log(chalk.blue(`📁 Copying ${template} template files...`));
      
      // Copy all template files to src
      const templateItems = await fs.readdir(templatePath);
      
      for (const item of templateItems) {
        const srcItem = path.join(templatePath, item);
        const targetItem = path.join(targetSrcPath, item);
        const stat = await fs.stat(srcItem);
        
        if (stat.isDirectory()) {
          await fs.copy(srcItem, targetItem);
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
          await fs.copy(srcItem, targetItem);
        }
      }

      // Update App.tsx to use the template
      if (template === 'empty') {
        const templateAppPath = path.join(templatePath, 'App.tsx');
        if (await fs.pathExists(templateAppPath)) {
          const templateAppContent = await fs.readFile(templateAppPath, 'utf-8');
          const appTsxPath = path.join(targetSrcPath, 'App.tsx');
          await fs.writeFile(appTsxPath, templateAppContent);
        }
      } else {
        // For dashboard and landing, import the main component
        const appTsxPath = path.join(targetSrcPath, 'App.tsx');
        const templateName = template === 'dashboard' ? 'Dashboard' : 'Landing';
        const templateImport = `import ${templateName} from './${templateName}'`;
        
        const appContent = `${templateImport}

function App() {
  return <${templateName} />
}

export default App
`;
        
        await fs.writeFile(appTsxPath, appContent);
      }
    }

    // Handle Routing Type
    if (routingType === 'v7') {
      console.log(chalk.blue('🛣️  Setting up React Router v7+ (File-based Routing)...'));
      
      // Update package.json for React Router v7+
      const packageJsonPath = path.join(targetPath, 'package.json');
      let packageJson = {};
      if (await fs.pathExists(packageJsonPath)) {
        packageJson = await fs.readJson(packageJsonPath);
      }
      
      // Remove react-router-dom v6
      delete packageJson.dependencies?.['react-router-dom'];
      
      // Add React Router v7+ dependencies
      if (!packageJson.dependencies) {
        packageJson.dependencies = {};
      }
      packageJson.dependencies['react-router'] = '^7.0.0';
      packageJson.dependencies['react-router-dom'] = '^7.0.0';
      
      if (!packageJson.devDependencies) {
        packageJson.devDependencies = {};
      }
      packageJson.devDependencies['@react-router/dev'] = '^7.0.0';
      packageJson.devDependencies['@react-router/serve'] = '^7.0.0';
      
      // Update scripts
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }
      packageJson.scripts['dev'] = 'react-router dev';
      packageJson.scripts['build'] = 'react-router build';
      packageJson.scripts['preview'] = 'react-router-serve ./build';
      packageJson.scripts['typecheck'] = 'react-router typegen';
      
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
      console.log(chalk.green('✅ Updated package.json for React Router v7+'));
      
      // Create routes directory structure
      const routesDir = path.join(targetSrcPath, 'routes');
      await fs.ensureDir(routesDir);
      
      // Create root route (layout)
      // CSS import will be added based on CSS framework selection later
      const rootRouteContent = `import { Outlet } from 'react-router';
      import { ConfigProvider } from '../config/ConfigProvider';

      export default function Root() {
        return (
          <ConfigProvider>
            <Outlet />
          </ConfigProvider>
        );
      }`;

      await fs.writeFile(path.join(routesDir, '_layout.tsx'), rootRouteContent, 'utf-8');
      console.log(chalk.green('✅ Created routes/_layout.tsx'));
      
      // Create home route based on template
      if (template === 'empty') {
        const homeRouteContent = `export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Your App</h1>
        <p className="text-gray-600">Start building something amazing!</p>
      </div>
    </div>
  );
}
`;
        await fs.writeFile(path.join(routesDir, 'index.tsx'), homeRouteContent, 'utf-8');
      } else if (template === 'dashboard') {
        // For dashboard, create a route that imports the Dashboard component
        const dashboardRouteContent = `import Dashboard from '../Dashboard';

export default function DashboardRoute() {
  return <Dashboard />;
}
`;
        await fs.writeFile(path.join(routesDir, 'index.tsx'), dashboardRouteContent, 'utf-8');
      } else if (template === 'landing') {
        // For landing, create a route that imports the Landing component
        const landingRouteContent = `import Landing from '../Landing';

export default function LandingRoute() {
  return <Landing />;
}
`;
        await fs.writeFile(path.join(routesDir, 'index.tsx'), landingRouteContent, 'utf-8');
      }
      console.log(chalk.green('✅ Created routes/index.tsx'));
      
      // Update vite.config.ts for React Router v7+
      const viteConfigPath = path.join(targetPath, 'vite.config.ts');
      const viteConfigContent = `import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    reactRouter(),
    react(),
  ],
});
`;
      await fs.writeFile(viteConfigPath, viteConfigContent, 'utf-8');
      console.log(chalk.green('✅ Updated vite.config.ts for React Router v7+'));
      
      // Update index.html to use entry.client.tsx
      const indexHtmlPath = path.join(targetPath, 'index.html');
      if (await fs.pathExists(indexHtmlPath)) {
        let indexHtmlContent = await fs.readFile(indexHtmlPath, 'utf-8');
        // Replace main.tsx with entry.client.tsx
        indexHtmlContent = indexHtmlContent.replace(/src\/main\.tsx/g, 'src/entry.client.tsx');
        await fs.writeFile(indexHtmlPath, indexHtmlContent, 'utf-8');
        console.log(chalk.green('✅ Updated index.html for React Router v7+'));
      }
      
      // Create entry.client.tsx for React Router v7+
      const entryClientPath = path.join(targetSrcPath, 'entry.client.tsx');
      const entryClientContent = `import { StrictMode, startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
`;
      await fs.writeFile(entryClientPath, entryClientContent, 'utf-8');
      console.log(chalk.green('✅ Created entry.client.tsx for React Router v7+'));
      
      // Create entry.server.tsx
      const entryServerPath = path.join(targetSrcPath, 'entry.server.tsx');
      const entryServerContent = `import type { EntryContext } from 'react-router';
import { ServerRouter } from 'react-router';

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  entryContext: EntryContext
) {
  return new Response(
    '<!DOCTYPE html>' + ServerRouter({ context: entryContext, url: request.url }),
    {
      status: responseStatusCode,
      headers: responseHeaders,
    }
  );
}
`;
      await fs.writeFile(entryServerPath, entryServerContent, 'utf-8');
      console.log(chalk.green('✅ Created entry.server.tsx for React Router v7+'));
      
      // Update or remove main.tsx (React Router v7+ uses entry.client.tsx)
      const mainTsxPath = path.join(targetSrcPath, 'main.tsx');
      if (await fs.pathExists(mainTsxPath)) {
        await fs.remove(mainTsxPath);
        console.log(chalk.blue('🗑️  Removed main.tsx (React Router v7+ uses entry.client.tsx)'));
      }
      
      // Remove or update App.tsx (not needed for React Router v7+)
      const appTsxPath = path.join(targetSrcPath, 'App.tsx');
      if (await fs.pathExists(appTsxPath)) {
        await fs.remove(appTsxPath);
        console.log(chalk.blue('🗑️  Removed App.tsx (not needed for React Router v7+ file-based routing)'));
      }
      
      // Create react-router.config.ts
      const routerConfigPath = path.join(targetPath, 'react-router.config.ts');
      const routerConfigContent = `import type { Config } from '@react-router/dev/config';

export default {
  // Add your React Router configuration here
  // See https://reactrouter.com/main/start/file-based/routing for more options
} satisfies Config;
`;
      await fs.writeFile(routerConfigPath, routerConfigContent, 'utf-8');
      console.log(chalk.green('✅ Created react-router.config.ts'));
      
    } else {
      // React Router v6 - keep existing setup but ensure BrowserRouter is in main.tsx
      console.log(chalk.blue('🛣️  Using React Router v6 (Manual Routes)'));
      
      // Ensure main.tsx has BrowserRouter (it should already from base)
      const mainTsxPath = path.join(targetSrcPath, 'main.tsx');
      if (await fs.pathExists(mainTsxPath)) {
        let mainContent = await fs.readFile(mainTsxPath, 'utf-8');
        if (!mainContent.includes('BrowserRouter')) {
          // Add BrowserRouter if not present
          if (mainContent.includes('import')) {
            mainContent = mainContent.replace(
              /(import.*from.*['"]react['"])/,
              "$1\nimport { BrowserRouter } from 'react-router-dom'"
            );
          } else {
            mainContent = "import { BrowserRouter } from 'react-router-dom'\n" + mainContent;
          }
          
          // Wrap App with BrowserRouter
          if (mainContent.includes('<App')) {
            mainContent = mainContent.replace(
              /(<App[^>]*>)/,
              '<BrowserRouter>\n        $1'
            );
            mainContent = mainContent.replace(
              /(<\/App>)/,
              '$1\n      </BrowserRouter>'
            );
          }
          
          await fs.writeFile(mainTsxPath, mainContent, 'utf-8');
        }
      }
    }

    // Handle CSS Framework
    const packageJsonPath = path.join(targetPath, 'package.json');
    let packageJson = {};
    if (await fs.pathExists(packageJsonPath)) {
      packageJson = await fs.readJson(packageJsonPath);
    }

    if (cssFramework === 'tailwind') {
      // Keep Tailwind - no changes needed
      // postcss.config.js is already copied from static configs in configureBundler
      console.log(chalk.blue('✅ Tailwind CSS will be configured'));
    } else {
      // Remove Tailwind files if not selected
      const tailwindFiles = [
        'tailwind.config.js'
      ];
      for (const file of tailwindFiles) {
        const filePath = path.join(targetPath, file);
        if (await fs.pathExists(filePath)) {
          await fs.remove(filePath);
        }
      }

      // Remove Tailwind from package.json (but keep postcss and autoprefixer for webpack)
      delete packageJson.devDependencies?.tailwindcss;
      
      // postcss.config.js is already copied from static configs in configureBundler
      // Just ensure dependencies are correct
      if (bundler === 'webpack') {
        // Ensure postcss and autoprefixer are in devDependencies for webpack
        if (!packageJson.devDependencies) {
          packageJson.devDependencies = {};
        }
        if (!packageJson.devDependencies['postcss']) {
          packageJson.devDependencies['postcss'] = '^8.4.32';
        }
        if (!packageJson.devDependencies['autoprefixer']) {
          packageJson.devDependencies['autoprefixer'] = '^10.4.16';
        }
      } else {
        // For Vite, remove postcss.config.js if it exists (Vite handles PostCSS differently)
        const postcssConfigPath = path.join(targetPath, 'postcss.config.js');
        if (await fs.pathExists(postcssConfigPath)) {
          await fs.remove(postcssConfigPath);
        }
        // Remove postcss and autoprefixer from package.json for Vite (not needed)
        delete packageJson.devDependencies?.autoprefixer;
        delete packageJson.devDependencies?.postcss;
      }

      if (cssFramework === 'sass') {
        // Handle SASS
        console.log(chalk.blue('✅ Setting up SASS...'));
        
        // Add sass dependency
        if (!packageJson.devDependencies) {
          packageJson.devDependencies = {};
        }
        packageJson.devDependencies['sass'] = '^1.69.0';

        // Copy static SCSS file from configs
        const configPath = getConfigPath(bundler, 'sass');
        const scssSrc = path.join(configPath, 'index.scss');
        const cssPath = path.join(targetSrcPath, 'index.css');
        const scssPath = path.join(targetSrcPath, 'index.scss');
        
        // Remove old CSS file if it exists
        if (await fs.pathExists(cssPath)) {
          await fs.remove(cssPath);
          console.log(chalk.blue(`🗑️  Removed old ${path.basename(cssPath)}`));
        }
        
        // Copy static SCSS file
        if (await fs.pathExists(scssSrc)) {
          await fs.copy(scssSrc, scssPath);
          console.log(chalk.green(`✅ Copied ${path.basename(scssPath)} from static configs`));
        } else {
          // Fallback: create basic SCSS if static file doesn't exist
          const scssContent = `// Main stylesheet
// This file will be compiled to CSS

// SCSS Variables
$font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
  sans-serif;

// Reset styles
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

// Base styles
body {
  font-family: $font-family-base;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

// Add your SCSS styles below
`;
          await fs.ensureDir(path.dirname(scssPath));
          await fs.writeFile(scssPath, scssContent, 'utf-8');
          console.log(chalk.green(`✅ Created ${path.basename(scssPath)}`));
        }

        // Update main.tsx (v6) or root layout (v7+) to import .scss instead of .css
        let cssImportFilePath;
        if (routingType === 'v7') {
          cssImportFilePath = path.join(targetSrcPath, 'routes', '_layout.tsx');
        } else {
          cssImportFilePath = path.join(targetSrcPath, 'main.tsx');
        }
        
        if (await fs.pathExists(cssImportFilePath)) {
          let mainContent = await fs.readFile(cssImportFilePath, 'utf-8');
          
          // For React Router v7+, add CSS import if not present
          if (routingType === 'v7' && !mainContent.includes('index.') && !mainContent.includes('../index.')) {
            // Add SCSS import after other imports
            const importLines = mainContent.split('\n');
            let lastImportIndex = -1;
            for (let i = 0; i < importLines.length; i++) {
              if (importLines[i].trim().startsWith('import ')) {
                lastImportIndex = i;
              }
            }
            if (lastImportIndex !== -1) {
              importLines.splice(lastImportIndex + 1, 0, "import '../index.scss';");
              mainContent = importLines.join('\n');
            } else {
              mainContent = "import '../index.scss';\n" + mainContent;
            }
          } else {
            // Replace any import of index.css with index.scss
            // Simple and reliable: just replace index.css with index.scss in import statements
            // This handles: './index.css', "./index.css", '../index.css', 'index.css', etc.
            const originalContent = mainContent;
            
            // First, try to match and replace the full import line
            mainContent = mainContent.replace(
              /(import\s+['"][^'"]*?)index\.css(['"])/g,
              '$1index.scss$2'
            );
            
            // If that didn't work, use a more aggressive fallback
            if (mainContent === originalContent && mainContent.includes('index.css')) {
              console.log(chalk.yellow('   Using fallback replacement method...'));
              // Replace index.css anywhere in import statements
              mainContent = mainContent.replace(/index\.css/g, 'index.scss');
            }
          }
          
          await fs.writeFile(cssImportFilePath, mainContent);
          
          // Verify both the file and import exist
          const scssExists = await fs.pathExists(scssPath);
          const updatedContent = await fs.readFile(cssImportFilePath, 'utf-8');
          const hasScssImport = updatedContent.includes('index.scss');
          const stillHasCssImport = updatedContent.includes('index.css');
          
          // Show what was found for debugging
          const importLines = updatedContent.split('\n').filter(line => line.includes('index.'));
          if (importLines.length > 0) {
            console.log(chalk.gray(`   Found imports: ${importLines.join(', ')}`));
          }
          
          if (scssExists && hasScssImport && !stillHasCssImport) {
            const fileType = routingType === 'v7' ? 'root layout' : 'main.tsx';
            console.log(chalk.green(`✅ SCSS setup complete: file created and import updated in ${fileType}`));
          } else {
            if (!scssExists) {
              console.log(chalk.red('❌ Error: SCSS file was not created'));
            }
            if (!hasScssImport || stillHasCssImport) {
              const fileType = routingType === 'v7' ? 'root layout' : 'main.tsx';
              console.log(chalk.yellow(`⚠️  Warning: Import not updated correctly`));
              console.log(chalk.yellow(`   Current ${fileType} still has: ${stillHasCssImport ? 'index.css' : 'no SCSS import'}`));
              console.log(chalk.yellow(`   Please manually change index.css to index.scss in ${fileType}`));
            }
          }
        } else {
          const fileType = routingType === 'v7' ? 'root layout' : 'main.tsx';
          console.log(chalk.yellow(`⚠️  Warning: ${fileType} not found, cannot update SCSS import`));
        }
      } else if (cssFramework === 'css') {
        // Handle regular CSS
        console.log(chalk.blue('✅ Using regular CSS...'));
        
        // Remove Tailwind imports from CSS
        const cssPath = path.join(targetSrcPath, 'index.css');
        if (await fs.pathExists(cssPath)) {
          let cssContent = await fs.readFile(cssPath, 'utf-8');
          cssContent = cssContent.replace(/@tailwind\s+[^;]+;/g, '');
          cssContent = cssContent.trim();
          
          // If empty, add basic CSS
          if (!cssContent) {
            cssContent = `* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',\n    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',\n    sans-serif;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n`;
          }
          
          await fs.writeFile(cssPath, cssContent);
        }
      }

      // Save updated package.json (with sass dependency if SASS was selected)
      if (await fs.pathExists(packageJsonPath)) {
        await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
        if (cssFramework === 'sass') {
          console.log(chalk.green('✅ Added sass to package.json'));
        }
      }
    }

    // Handle component library
    if (componentLibrary !== 'none') {
      if (componentLibrary === 'shadcn') {
        console.log(chalk.blue(`ℹ️ Shadcn/ui selected - you'll need to initialize it separately after project creation`));
        console.log(chalk.gray(`   Run: npx shadcn-ui@latest init`));
      } else {
        console.log(chalk.yellow(`ℹ️ Component library "${componentLibrary}" will be installed with dependencies`));
      }
    }

    // Update package.json with component library dependencies if needed
    // Read package.json fresh to ensure we have the latest version (after CSS framework changes)
    if (await fs.pathExists(packageJsonPath)) {
      packageJson = await fs.readJson(packageJsonPath);
      
      // Ensure sass dependency is preserved if it was added earlier
      if (cssFramework === 'sass' && (!packageJson.devDependencies || !packageJson.devDependencies.sass)) {
        if (!packageJson.devDependencies) {
          packageJson.devDependencies = {};
        }
        packageJson.devDependencies['sass'] = '^1.69.0';
        console.log(chalk.blue('✅ Ensuring sass dependency is in package.json'));
      }
      
      if (!packageJson.dependencies) {
        packageJson.dependencies = {};
      }
      
      if (componentLibrary === 'mui') {
        packageJson.dependencies['@mui/material'] = '^5.15.0';
        packageJson.dependencies['@emotion/react'] = '^11.11.0';
        packageJson.dependencies['@emotion/styled'] = '^11.11.0';
      } else if (componentLibrary === 'antd') {
        packageJson.dependencies['antd'] = '^5.12.0';
      }
      // Note: shadcn is not added here as it requires separate initialization via CLI
      
      // Handle Redux setup
      if (useRedux) {
        console.log(chalk.blue('✅ Setting up Redux with Redux Thunk...'));
        
        // Add Redux dependencies
        packageJson.dependencies['@reduxjs/toolkit'] = '^2.0.0';
        packageJson.dependencies['react-redux'] = '^9.0.0';
        
        console.log(chalk.green('✅ Added Redux dependencies to package.json'));
      }
      
      // Handle React Query setup
      if (useReactQuery) {
        console.log(chalk.blue('✅ Setting up React Query (TanStack Query)...'));
        
        // Add React Query dependencies
        packageJson.dependencies['@tanstack/react-query'] = '^5.17.0';
        
        console.log(chalk.green('✅ Added React Query dependencies to package.json'));
      }
      
      // Handle Logger setup
      if (useLogger) {
        console.log(chalk.blue('✅ Setting up loglevel logger...'));
        
        // Add loglevel dependency
        packageJson.dependencies['loglevel'] = '^1.9.1';
        
        console.log(chalk.green('✅ Added loglevel dependency to package.json'));
      }
      
      // Handle Animation Library setup (Framer Motion)
      if (useAnimation) {
        console.log(chalk.blue('✅ Setting up Framer Motion...'));
        
        // Add Framer Motion dependency
        packageJson.dependencies['framer-motion'] = '^10.16.16';
        
        console.log(chalk.green('✅ Added framer-motion dependency to package.json'));
      }
      
      // Save package.json with all dependencies (CSS framework + component library + Redux + React Query + Logger + Animation)
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    }
    
    // Setup Redux store structure if Redux is selected
    if (useRedux) {
      console.log(chalk.blue('📁 Setting up Redux store structure...'));
      
      // Create store directory
      const storeDir = path.join(targetSrcPath, 'store');
      await fs.ensureDir(storeDir);
      
      // Create store configuration
      const storeContent = `import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import exampleReducer from './slices/exampleSlice';

export const store = configureStore({
  reducer: {
    example: exampleReducer,
  },
  // Redux Thunk is included by default in Redux Toolkit
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks for use in components
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
`;
      
      await fs.writeFile(path.join(storeDir, 'store.ts'), storeContent, 'utf-8');
      console.log(chalk.green('✅ Created store/store.ts'));
      
      // Create hooks file (alternative export)
      const hooksContent = `// Re-export typed hooks for convenience
export { useAppDispatch, useAppSelector } from './store';
`;
      
      await fs.writeFile(path.join(storeDir, 'hooks.ts'), hooksContent, 'utf-8');
      console.log(chalk.green('✅ Created store/hooks.ts'));
      
      // Create slices directory
      const slicesDir = path.join(storeDir, 'slices');
      await fs.ensureDir(slicesDir);
      
      // Create example slice
      const exampleSliceContent = `import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Example async thunk
export const fetchExampleData = createAsyncThunk(
  'example/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      // Replace with your API call
      const response = await fetch('https://api.example.com/data');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

interface ExampleState {
  data: any;
  loading: boolean;
  error: string | null;
}

const initialState: ExampleState = {
  data: null,
  loading: false,
  error: null,
};

const exampleSlice = createSlice({
  name: 'example',
  initialState,
  reducers: {
    // Add your synchronous reducers here
    setData: (state, action: PayloadAction<any>) => {
      state.data = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchExampleData pending
      .addCase(fetchExampleData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Handle fetchExampleData fulfilled
      .addCase(fetchExampleData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      // Handle fetchExampleData rejected
      .addCase(fetchExampleData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setData, clearError } = exampleSlice.actions;
export default exampleSlice.reducer;
`;
      
      await fs.writeFile(path.join(slicesDir, 'exampleSlice.ts'), exampleSliceContent, 'utf-8');
      console.log(chalk.green('✅ Created store/slices/exampleSlice.ts'));
      
      // Update main.tsx (v6) or root layout (v7+) to include Redux Provider
      let providerFilePath;
      if (routingType === 'v7') {
        providerFilePath = path.join(targetSrcPath, 'routes', '_layout.tsx');
      } else {
        providerFilePath = path.join(targetSrcPath, 'main.tsx');
      }
      
      if (await fs.pathExists(providerFilePath)) {
        let mainContent = await fs.readFile(providerFilePath, 'utf-8');
        
        // Add Redux imports if not already present
        if (!mainContent.includes('react-redux')) {
          // Find the last import statement and add Redux imports after it
          const importLines = mainContent.split('\n');
          let lastImportIndex = -1;
          for (let i = 0; i < importLines.length; i++) {
            if (importLines[i].trim().startsWith('import ')) {
              lastImportIndex = i;
            }
          }
          
          // Determine correct import path based on routing type
          const storeImportPath = routingType === 'v7' ? '../store/store' : './store/store';
          
          if (lastImportIndex !== -1) {
            importLines.splice(lastImportIndex + 1, 0, 
              "import { Provider } from 'react-redux'",
              `import { store } from '${storeImportPath}'`
            );
            mainContent = importLines.join('\n');
          } else {
            // If no imports found, add at the beginning
            mainContent = "import { Provider } from 'react-redux'\n" +
              `import { store } from '${storeImportPath}'\n` +
              mainContent;
          }
        }
        
        // Wrap the entire app with Redux Provider
        if (routingType === 'v7') {
          // For React Router v7+, wrap ConfigProvider with Redux Provider
          if (mainContent.includes('<ConfigProvider>')) {
            mainContent = mainContent.replace(
              /(<ConfigProvider>)/,
              '<Provider store={store}>\n      $1'
            );
            mainContent = mainContent.replace(
              /(<\/ConfigProvider>)/,
              '$1\n    </Provider>'
            );
          } else {
            // If no ConfigProvider, wrap the return statement
            mainContent = mainContent.replace(
              /(return\s+\()/,
              '$1<Provider store={store}>\n      '
            );
            mainContent = mainContent.replace(
              /(\);?\s*}$)/,
              '</Provider>$1'
            );
          }
        } else {
          // For React Router v6, wrap in main.tsx
          if (mainContent.includes('<React.StrictMode>')) {
            // Wrap StrictMode with Provider
            mainContent = mainContent.replace(
              /(<React\.StrictMode>)/,
              '<Provider store={store}>\n    $1'
            );
            mainContent = mainContent.replace(
              /(<\/React\.StrictMode>)/,
              '$1\n    </Provider>'
            );
          } else {
            // If no StrictMode, find the first JSX element in render and wrap it
            // This handles cases where StrictMode might not be present
            const renderMatch = mainContent.match(/\.render\(\s*([^)]+)\)/);
            if (renderMatch) {
              // Try to wrap ConfigProvider or BrowserRouter or App
              if (mainContent.includes('<ConfigProvider>')) {
                mainContent = mainContent.replace(
                  /(<ConfigProvider>)/,
                  '<Provider store={store}>\n      $1'
                );
                mainContent = mainContent.replace(
                  /(<\/ConfigProvider>)/,
                  '$1\n    </Provider>'
                );
              } else if (mainContent.includes('<BrowserRouter>')) {
                mainContent = mainContent.replace(
                  /(<BrowserRouter>)/,
                  '<Provider store={store}>\n      $1'
                );
                mainContent = mainContent.replace(
                  /(<\/BrowserRouter>)/,
                  '$1\n    </Provider>'
                );
              }
            }
          }
        }
        
        await fs.writeFile(providerFilePath, mainContent, 'utf-8');
        const fileType = routingType === 'v7' ? 'root layout' : 'main.tsx';
        console.log(chalk.green(`✅ Updated ${fileType} with Redux Provider`));
      }
    }
    
    // Setup React Query if selected
    if (useReactQuery) {
      console.log(chalk.blue('📁 Setting up React Query structure...'));
      
      // Create lib or hooks directory for React Query setup
      const libDir = path.join(targetSrcPath, 'lib');
      await fs.ensureDir(libDir);
      
      // Create QueryClient configuration
      const queryClientContent = `import { QueryClient } from '@tanstack/react-query';

// Create a client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes
      staleTime: 1000 * 60 * 5,
      // Cache time: 10 minutes
      gcTime: 1000 * 60 * 10,
      // Retry failed requests once
      retry: 1,
      // Refetch on window focus
      refetchOnWindowFocus: false,
    },
  },
});
`;
      
      await fs.writeFile(path.join(libDir, 'queryClient.ts'), queryClientContent, 'utf-8');
      console.log(chalk.green('✅ Created lib/queryClient.ts'));
      
      // Create hooks directory for example queries
      const hooksDir = path.join(targetSrcPath, 'hooks');
      await fs.ensureDir(hooksDir);
      
      // Create example query hook
      const exampleQueryContent = `import { useQuery } from '@tanstack/react-query';

// Example: Fetch data from an API
export const useExampleData = () => {
  return useQuery({
    queryKey: ['exampleData'],
    queryFn: async () => {
      // Replace with your API endpoint
      const response = await fetch('https://api.example.com/data');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      return response.json();
    },
  });
};

// Example: Fetch data with parameters
export const useExampleDataById = (id: string) => {
  return useQuery({
    queryKey: ['exampleData', id],
    queryFn: async () => {
      const response = await fetch(\`https://api.example.com/data/\${id}\`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      return response.json();
    },
    enabled: !!id, // Only run query if id is provided
  });
};
`;
      
      await fs.writeFile(path.join(hooksDir, 'useExampleQuery.ts'), exampleQueryContent, 'utf-8');
      console.log(chalk.green('✅ Created hooks/useExampleQuery.ts'));
      
      // Update main.tsx (v6) or root layout (v7+) to include QueryClientProvider
      let queryProviderFilePath;
      if (routingType === 'v7') {
        queryProviderFilePath = path.join(targetSrcPath, 'routes', '_layout.tsx');
      } else {
        queryProviderFilePath = path.join(targetSrcPath, 'main.tsx');
      }
      
      if (await fs.pathExists(queryProviderFilePath)) {
        let mainContent = await fs.readFile(queryProviderFilePath, 'utf-8');
        
        // Add React Query imports if not already present
        if (!mainContent.includes('@tanstack/react-query')) {
          // Find the last import statement and add React Query imports after it
          const importLines = mainContent.split('\n');
          let lastImportIndex = -1;
          for (let i = 0; i < importLines.length; i++) {
            if (importLines[i].trim().startsWith('import ')) {
              lastImportIndex = i;
            }
          }
          
          // Determine correct import path based on routing type
          const queryClientImportPath = routingType === 'v7' ? '../lib/queryClient' : './lib/queryClient';
          
          if (lastImportIndex !== -1) {
            importLines.splice(lastImportIndex + 1, 0, 
              "import { QueryClientProvider } from '@tanstack/react-query'",
              `import { queryClient } from '${queryClientImportPath}'`
            );
            mainContent = importLines.join('\n');
          } else {
            // If no imports found, add at the beginning
            mainContent = "import { QueryClientProvider } from '@tanstack/react-query'\n" +
              `import { queryClient } from '${queryClientImportPath}'\n` +
              mainContent;
          }
        }
        
        // Wrap the app with QueryClientProvider
        if (routingType === 'v7') {
          // For React Router v7+, wrap inside Redux Provider if it exists, otherwise wrap ConfigProvider
          if (mainContent.includes('<Provider store={store}>')) {
            // If Redux Provider exists, wrap inside it
            mainContent = mainContent.replace(
              /(<Provider store={store}>)/,
              '$1\n      <QueryClientProvider client={queryClient}>'
            );
            mainContent = mainContent.replace(
              /(<\/Provider>)/,
              '</QueryClientProvider>\n    $1'
            );
          } else if (mainContent.includes('<ConfigProvider>')) {
            // Wrap ConfigProvider with QueryClientProvider
            mainContent = mainContent.replace(
              /(<ConfigProvider>)/,
              '<QueryClientProvider client={queryClient}>\n      $1'
            );
            mainContent = mainContent.replace(
              /(<\/ConfigProvider>)/,
              '$1\n    </QueryClientProvider>'
            );
          } else {
            // Wrap the return statement
            mainContent = mainContent.replace(
              /(return\s+\()/,
              '$1<QueryClientProvider client={queryClient}>\n      '
            );
            mainContent = mainContent.replace(
              /(\);?\s*}$)/,
              '</QueryClientProvider>$1'
            );
          }
        } else {
          // For React Router v6, wrap in main.tsx
          if (mainContent.includes('<Provider store={store}>')) {
            // If Redux Provider exists, wrap inside it
            mainContent = mainContent.replace(
              /(<Provider store={store}>)/,
              '$1\n      <QueryClientProvider client={queryClient}>'
            );
            mainContent = mainContent.replace(
              /(<\/Provider>)/,
              '</QueryClientProvider>\n    $1'
            );
          } else if (mainContent.includes('<React.StrictMode>')) {
            // Wrap StrictMode with QueryClientProvider
            mainContent = mainContent.replace(
              /(<React\.StrictMode>)/,
              '<QueryClientProvider client={queryClient}>\n    $1'
            );
            mainContent = mainContent.replace(
              /(<\/React\.StrictMode>)/,
              '$1\n    </QueryClientProvider>'
            );
          } else if (mainContent.includes('<ConfigProvider>')) {
            // Wrap ConfigProvider with QueryClientProvider
            mainContent = mainContent.replace(
              /(<ConfigProvider>)/,
              '<QueryClientProvider client={queryClient}>\n      $1'
            );
            mainContent = mainContent.replace(
              /(<\/ConfigProvider>)/,
              '$1\n    </QueryClientProvider>'
            );
          } else if (mainContent.includes('<BrowserRouter>')) {
            // Wrap BrowserRouter with QueryClientProvider
            mainContent = mainContent.replace(
              /(<BrowserRouter>)/,
              '<QueryClientProvider client={queryClient}>\n      $1'
            );
            mainContent = mainContent.replace(
              /(<\/BrowserRouter>)/,
              '$1\n    </QueryClientProvider>'
            );
          }
        }
        
        await fs.writeFile(queryProviderFilePath, mainContent, 'utf-8');
        const fileType = routingType === 'v7' ? 'root layout' : 'main.tsx';
        console.log(chalk.green(`✅ Updated ${fileType} with QueryClientProvider`));
      }
    }
    
    // Setup Logger if selected
    if (useLogger) {
      console.log(chalk.blue('📁 Setting up loglevel logger...'));
      
      // Create lib directory if it doesn't exist (might have been created for React Query)
      const libDir = path.join(targetSrcPath, 'lib');
      await fs.ensureDir(libDir);
      
      // Create logger configuration (bundler-aware)
      let loggerContent;
      if (bundler === 'vite') {
        // Vite uses import.meta.env
        loggerContent = `import log from 'loglevel';

// Set default log level based on environment
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

if (isDevelopment) {
  // In development, show all logs
  log.setLevel('DEBUG');
} else if (isProduction) {
  // In production, only show warnings and errors
  log.setLevel('WARN');
} else {
  // Default to info level
  log.setLevel('INFO');
}

// Export configured logger
export default log;

// You can also export individual log methods for convenience
export const { trace, debug, info, warn, error } = log;

// Example usage:
// import logger from './lib/logger';
// logger.info('Application started');
// logger.error('Something went wrong', error);
// 
// Or use individual methods:
// import { info, error } from './lib/logger';
// info('User logged in');
// error('Failed to fetch data', error);
`;
      } else {
        // Other bundlers use process.env.NODE_ENV
        loggerContent = `import log from 'loglevel';

// Set default log level based on environment
const isDevelopment = process.env.NODE_ENV !== 'production';
const isProduction = process.env.NODE_ENV === 'production';

if (isDevelopment) {
  // In development, show all logs
  log.setLevel('DEBUG');
} else if (isProduction) {
  // In production, only show warnings and errors
  log.setLevel('WARN');
} else {
  // Default to info level
  log.setLevel('INFO');
}

// Export configured logger
export default log;

// You can also export individual log methods for convenience
export const { trace, debug, info, warn, error } = log;

// Example usage:
// import logger from './lib/logger';
// logger.info('Application started');
// logger.error('Something went wrong', error);
// 
// Or use individual methods:
// import { info, error } from './lib/logger';
// info('User logged in');
// error('Failed to fetch data', error);
`;
      }
      
      await fs.writeFile(path.join(libDir, 'logger.ts'), loggerContent, 'utf-8');
      console.log(chalk.green('✅ Created lib/logger.ts'));
      
      // Also create a utils directory with a logger utility if needed
      const utilsDir = path.join(targetSrcPath, 'utils');
      await fs.ensureDir(utilsDir);
      
      // Create a logger utility with additional features
      const loggerUtilContent = `import log from '../lib/logger';

/**
 * Logger utility with additional helper methods
 */

// Create a logger with a prefix
export const createLogger = (prefix: string) => {
  return {
    trace: (...args: any[]) => log.trace(\`[\${prefix}]\`, ...args),
    debug: (...args: any[]) => log.debug(\`[\${prefix}]\`, ...args),
    info: (...args: any[]) => log.info(\`[\${prefix}]\`, ...args),
    warn: (...args: any[]) => log.warn(\`[\${prefix}]\`, ...args),
    error: (...args: any[]) => log.error(\`[\${prefix}]\`, ...args),
  };
};

// Example usage:
// import { createLogger } from './utils/logger';
// const logger = createLogger('API');
// logger.info('Fetching user data');
// logger.error('Failed to fetch', error);
`;
      
      await fs.writeFile(path.join(utilsDir, 'logger.ts'), loggerUtilContent, 'utf-8');
      console.log(chalk.green('✅ Created utils/logger.ts'));
    }
    
    // Setup Framer Motion if selected
    if (useAnimation) {
      console.log(chalk.blue('🎬 Setting up Framer Motion...'));
      
      // Create a hooks directory for animation utilities if it doesn't exist
      const hooksDir = path.join(targetSrcPath, 'hooks');
      await fs.ensureDir(hooksDir);
      
      // Create an example animation hook
      const animationHookContent = `import { useAnimation, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';

/**
 * Custom hook for scroll-triggered animations
 * @param options - Animation options
 * @returns Animation controls
 */
export const useScrollAnimation = (options = {}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, ...options });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  return { ref, controls, isInView };
};

/**
 * Animation variants for common use cases
 */
export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

// Example usage:
// import { motion } from 'framer-motion';
// import { useScrollAnimation, fadeInUp } from './hooks/useAnimation';
//
// function MyComponent() {
//   const { ref, controls } = useScrollAnimation();
//   return (
//     <motion.div
//       ref={ref}
//       initial="hidden"
//       animate={controls}
//       variants={fadeInUp}
//     >
//       Content that animates on scroll
//     </motion.div>
//   );
// }
`;
      
      await fs.writeFile(path.join(hooksDir, 'useAnimation.ts'), animationHookContent, 'utf-8');
      console.log(chalk.green('✅ Created hooks/useAnimation.ts with animation utilities'));
    }
    
    // Final verification before npm install
    if (cssFramework === 'sass') {
      const finalPackageJson = await fs.readJson(packageJsonPath);
      const scssFileExists = await fs.pathExists(path.join(targetSrcPath, 'index.scss'));
      // Check import in appropriate file based on routing type
      let checkFilePath;
      if (routingType === 'v7') {
        checkFilePath = path.join(targetSrcPath, 'entry.client.tsx');
      } else {
        checkFilePath = path.join(targetSrcPath, 'main.tsx');
      }
      let hasScssImport = false;
      if (await fs.pathExists(checkFilePath)) {
        const fileContent = await fs.readFile(checkFilePath, 'utf-8');
        hasScssImport = fileContent.includes('index.scss');
      }
      
      if (finalPackageJson.devDependencies?.sass && scssFileExists && hasScssImport) {
        console.log(chalk.green('✅ SCSS setup verified: sass dependency, SCSS file, and import are all configured'));
      } else {
        console.log(chalk.yellow('⚠️ SCSS setup verification:'));
        if (!finalPackageJson.devDependencies?.sass) {
          console.log(chalk.yellow('   - sass dependency missing in package.json'));
        }
        if (!scssFileExists) {
          console.log(chalk.yellow('   - index.scss file missing'));
        }
        if (!hasScssImport) {
          console.log(chalk.yellow('   - SCSS import not found in main.tsx'));
        }
      }
    }

    logger.info('📦 Installing dependencies...');
    const dependencyList = [];
    if (cssFramework === 'sass') dependencyList.push('sass');
    if (useRedux) dependencyList.push('Redux Toolkit & React-Redux');
    if (useReactQuery) dependencyList.push('React Query (TanStack Query)');
    if (useLogger) dependencyList.push('loglevel');
    if (useAnimation) dependencyList.push('Framer Motion');
    if (dependencyList.length > 0) {
      logger.info(`   This will install all dependencies including ${dependencyList.join(', ')}...`);
    } else {
      logger.info('   This will install all dependencies...');
    }
    
    // Install dependencies using detected package manager
    try {
      await installDependencies(targetPath);
      logger.success('Dependencies installed successfully!');
    } catch (error) {
      logger.error(`Failed to install dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
    
    // Verify SCSS setup if SASS was selected
    if (cssFramework === 'sass') {
      console.log(chalk.blue('\n🔍 Verifying SCSS setup...'));
      
      // Check if sass was installed
      const nodeModulesSass = path.join(targetPath, 'node_modules', 'sass');
      const sassInstalled = await fs.pathExists(nodeModulesSass);
      
      // Check package.json
      const finalPackageJson = await fs.readJson(packageJsonPath);
      const hasSassInPackage = !!finalPackageJson.devDependencies?.sass;
      
      // Check SCSS file
      const scssFileExists = await fs.pathExists(path.join(targetSrcPath, 'index.scss'));
      
      // Check import
      const mainTsxPath = path.join(targetSrcPath, 'main.tsx');
      let hasScssImport = false;
      if (await fs.pathExists(mainTsxPath)) {
        const mainContent = await fs.readFile(mainTsxPath, 'utf-8');
        hasScssImport = mainContent.includes('index.scss');
      }
      
      if (sassInstalled && hasSassInPackage && scssFileExists && hasScssImport) {
        console.log(chalk.green('✅ SCSS is fully configured and ready to use!'));
        console.log(chalk.green('   ✓ sass package installed'));
        console.log(chalk.green('   ✓ index.scss file exists'));
        console.log(chalk.green('   ✓ main.tsx imports index.scss'));
        console.log(chalk.blue('\n💡 Vite automatically compiles SCSS files - no configuration needed!'));
        console.log(chalk.blue('   Changes to your SCSS files will hot-reload automatically during development.'));
        console.log(chalk.blue('   Just run: npm run dev'));
      } else {
        console.log(chalk.yellow('⚠️  SCSS setup verification issues:'));
        if (!sassInstalled) {
          console.log(chalk.red('   ✗ sass package not found in node_modules'));
          console.log(chalk.yellow('   → Try running: npm install sass --save-dev'));
        }
        if (!hasSassInPackage) {
          console.log(chalk.red('   ✗ sass missing from package.json'));
        }
        if (!scssFileExists) {
          console.log(chalk.red('   ✗ index.scss file not found'));
        }
        if (!hasScssImport) {
          console.log(chalk.red('   ✗ SCSS import not found in main.tsx'));
          console.log(chalk.yellow('   → Update main.tsx to import "./index.scss" instead of "./index.css"'));
        }
      }
    }
    
    // Verify Redux setup if Redux was selected
    if (useRedux) {
      console.log(chalk.blue('\n🔍 Verifying Redux setup...'));
      
      // Check if Redux packages were installed
      const nodeModulesRedux = path.join(targetPath, 'node_modules', '@reduxjs', 'toolkit');
      const reduxInstalled = await fs.pathExists(nodeModulesRedux);
      
      // Check package.json
      const finalPackageJson = await fs.readJson(packageJsonPath);
      const hasReduxInPackage = !!finalPackageJson.dependencies?.['@reduxjs/toolkit'] && 
                                 !!finalPackageJson.dependencies?.['react-redux'];
      
      // Check store files
      const storeFileExists = await fs.pathExists(path.join(targetSrcPath, 'store', 'store.ts'));
      const exampleSliceExists = await fs.pathExists(path.join(targetSrcPath, 'store', 'slices', 'exampleSlice.ts'));
      
      // Check main.tsx for Provider
      const mainTsxPath = path.join(targetSrcPath, 'main.tsx');
      let hasProvider = false;
      if (await fs.pathExists(mainTsxPath)) {
        const mainContent = await fs.readFile(mainTsxPath, 'utf-8');
        hasProvider = mainContent.includes('Provider') && mainContent.includes('store');
      }
      
      if (reduxInstalled && hasReduxInPackage && storeFileExists && exampleSliceExists && hasProvider) {
        console.log(chalk.green('✅ Redux is fully configured and ready to use!'));
        console.log(chalk.green('   ✓ @reduxjs/toolkit and react-redux packages installed'));
        console.log(chalk.green('   ✓ Store structure created'));
        console.log(chalk.green('   ✓ Example slice with async thunk created'));
        console.log(chalk.green('   ✓ Redux Provider added to main.tsx'));
        console.log(chalk.blue('\n💡 Redux Thunk is included by default in Redux Toolkit'));
        console.log(chalk.blue('   You can use createAsyncThunk for async actions'));
        console.log(chalk.blue('   Use useAppDispatch and useAppSelector hooks in your components'));
        console.log(chalk.blue('   Example: import { useAppDispatch, useAppSelector } from "./store/hooks"'));
      } else {
        console.log(chalk.yellow('⚠️  Redux setup verification issues:'));
        if (!reduxInstalled) {
          console.log(chalk.red('   ✗ Redux packages not found in node_modules'));
          console.log(chalk.yellow('   → Try running: npm install @reduxjs/toolkit react-redux'));
        }
        if (!hasReduxInPackage) {
          console.log(chalk.red('   ✗ Redux missing from package.json'));
        }
        if (!storeFileExists) {
          console.log(chalk.red('   ✗ store/store.ts file not found'));
        }
        if (!exampleSliceExists) {
          console.log(chalk.red('   ✗ store/slices/exampleSlice.ts file not found'));
        }
        if (!hasProvider) {
          console.log(chalk.red('   ✗ Redux Provider not found in main.tsx'));
          console.log(chalk.yellow('   → Manually wrap your app with <Provider store={store}>'));
        }
      }
    }
    
    // Verify React Query setup if React Query was selected
    if (useReactQuery) {
      console.log(chalk.blue('\n🔍 Verifying React Query setup...'));
      
      // Check if React Query package was installed
      const nodeModulesReactQuery = path.join(targetPath, 'node_modules', '@tanstack', 'react-query');
      const reactQueryInstalled = await fs.pathExists(nodeModulesReactQuery);
      
      // Check package.json
      const finalPackageJson = await fs.readJson(packageJsonPath);
      const hasReactQueryInPackage = !!finalPackageJson.dependencies?.['@tanstack/react-query'];
      
      // Check React Query files
      const queryClientExists = await fs.pathExists(path.join(targetSrcPath, 'lib', 'queryClient.ts'));
      const exampleQueryExists = await fs.pathExists(path.join(targetSrcPath, 'hooks', 'useExampleQuery.ts'));
      
      // Check main.tsx for QueryClientProvider
      const mainTsxPath = path.join(targetSrcPath, 'main.tsx');
      let hasQueryClientProvider = false;
      if (await fs.pathExists(mainTsxPath)) {
        const mainContent = await fs.readFile(mainTsxPath, 'utf-8');
        hasQueryClientProvider = mainContent.includes('QueryClientProvider') && mainContent.includes('queryClient');
      }
      
      if (reactQueryInstalled && hasReactQueryInPackage && queryClientExists && exampleQueryExists && hasQueryClientProvider) {
        console.log(chalk.green('✅ React Query is fully configured and ready to use!'));
        console.log(chalk.green('   ✓ @tanstack/react-query package installed'));
        console.log(chalk.green('   ✓ QueryClient configured'));
        console.log(chalk.green('   ✓ Example query hooks created'));
        console.log(chalk.green('   ✓ QueryClientProvider added to main.tsx'));
        console.log(chalk.blue('\n💡 React Query provides powerful data fetching capabilities'));
        console.log(chalk.blue('   Use useQuery, useMutation, and other hooks for data management'));
        console.log(chalk.blue('   Example: import { useExampleData } from "./hooks/useExampleQuery"'));
        console.log(chalk.blue('   Check the example hooks for usage patterns'));
      } else {
        console.log(chalk.yellow('⚠️  React Query setup verification issues:'));
        if (!reactQueryInstalled) {
          console.log(chalk.red('   ✗ React Query package not found in node_modules'));
          console.log(chalk.yellow('   → Try running: npm install @tanstack/react-query'));
        }
        if (!hasReactQueryInPackage) {
          console.log(chalk.red('   ✗ React Query missing from package.json'));
        }
        if (!queryClientExists) {
          console.log(chalk.red('   ✗ lib/queryClient.ts file not found'));
        }
        if (!exampleQueryExists) {
          console.log(chalk.red('   ✗ hooks/useExampleQuery.ts file not found'));
        }
        if (!hasQueryClientProvider) {
          console.log(chalk.red('   ✗ QueryClientProvider not found in main.tsx'));
          console.log(chalk.yellow('   → Manually wrap your app with <QueryClientProvider client={queryClient}>'));
        }
      }
    }
    
    // Verify Logger setup if Logger was selected
    if (useLogger) {
      console.log(chalk.blue('\n🔍 Verifying Logger setup...'));
      
      // Check if loglevel package was installed
      const nodeModulesLogger = path.join(targetPath, 'node_modules', 'loglevel');
      const loggerInstalled = await fs.pathExists(nodeModulesLogger);
      
      // Check package.json
      const finalPackageJson = await fs.readJson(packageJsonPath);
      const hasLoggerInPackage = !!finalPackageJson.dependencies?.['loglevel'];
      
      // Check logger files
      const loggerFileExists = await fs.pathExists(path.join(targetSrcPath, 'lib', 'logger.ts'));
      const loggerUtilExists = await fs.pathExists(path.join(targetSrcPath, 'utils', 'logger.ts'));
      
      if (loggerInstalled && hasLoggerInPackage && loggerFileExists && loggerUtilExists) {
        console.log(chalk.green('✅ Logger is fully configured and ready to use!'));
        console.log(chalk.green('   ✓ loglevel package installed'));
        console.log(chalk.green('   ✓ Logger configuration created'));
        console.log(chalk.green('   ✓ Logger utility helpers created'));
        console.log(chalk.blue('\n💡 Logger is configured with environment-based log levels'));
        console.log(chalk.blue('   Development: DEBUG level (all logs)'));
        console.log(chalk.blue('   Production: WARN level (warnings and errors only)'));
        console.log(chalk.blue('   Example: import logger from "./lib/logger"'));
        console.log(chalk.blue('   Example: import { createLogger } from "./utils/logger"'));
      } else {
        console.log(chalk.yellow('⚠️  Logger setup verification issues:'));
        if (!loggerInstalled) {
          console.log(chalk.red('   ✗ loglevel package not found in node_modules'));
          console.log(chalk.yellow('   → Try running: npm install loglevel'));
        }
        if (!hasLoggerInPackage) {
          console.log(chalk.red('   ✗ loglevel missing from package.json'));
        }
        if (!loggerFileExists) {
          console.log(chalk.red('   ✗ lib/logger.ts file not found'));
        }
        if (!loggerUtilExists) {
          console.log(chalk.red('   ✗ utils/logger.ts file not found'));
        }
      }
    }
    
    // Verify Framer Motion setup if Animation was selected
    if (useAnimation) {
      console.log(chalk.blue('\n🎬 Verifying Framer Motion setup...'));
      
      // Check if framer-motion package was installed
      const nodeModulesFramer = path.join(targetPath, 'node_modules', 'framer-motion');
      const framerInstalled = await fs.pathExists(nodeModulesFramer);
      
      // Check package.json
      const finalPackageJson = await fs.readJson(packageJsonPath);
      const hasFramerInPackage = !!finalPackageJson.dependencies?.['framer-motion'];
      
      // Check animation hook file
      const animationHookExists = await fs.pathExists(path.join(targetSrcPath, 'hooks', 'useAnimation.ts'));
      
      if (framerInstalled && hasFramerInPackage && animationHookExists) {
        console.log(chalk.green('✅ Framer Motion is fully configured and ready to use!'));
        console.log(chalk.green('   ✓ framer-motion package installed'));
        console.log(chalk.green('   ✓ Animation utilities created'));
        console.log(chalk.blue('\n💡 Framer Motion is ready to use in your components'));
        console.log(chalk.blue('   Example: import { motion } from "framer-motion"'));
        console.log(chalk.blue('   Example: import { useScrollAnimation, fadeInUp } from "./hooks/useAnimation"'));
        console.log(chalk.blue('   See hooks/useAnimation.ts for animation utilities and examples'));
      } else {
        console.log(chalk.yellow('⚠️  Framer Motion setup verification issues:'));
        if (!framerInstalled) {
          console.log(chalk.red('   ✗ framer-motion package not found in node_modules'));
          console.log(chalk.yellow('   → Try running: npm install framer-motion'));
        }
        if (!hasFramerInPackage) {
          console.log(chalk.red('   ✗ framer-motion missing from package.json'));
        }
        if (!animationHookExists) {
          console.log(chalk.red('   ✗ hooks/useAnimation.ts file not found'));
        }
      }
    }

  } catch (error) {
    console.error(chalk.red(`❌ Error generating project: ${error.message}`));
    throw error;
  }
}