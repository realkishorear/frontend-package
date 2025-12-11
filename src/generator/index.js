import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execa } from 'execa';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateProject(targetPath, answers) {
  let { template, cssFramework, componentLibrary, useRedux, useReactQuery } = answers;
  
  // Dashboard and Landing templates require Tailwind CSS
  // Auto-switch to Tailwind if user selected a different CSS framework
  if ((template === 'dashboard' || template === 'landing') && cssFramework !== 'tailwind') {
    console.log(chalk.yellow(`\n⚠️  Warning: ${template === 'dashboard' ? 'Dashboard' : 'Landing'} template requires Tailwind CSS.`));
    console.log(chalk.yellow(`   Automatically switching to Tailwind CSS for proper styling.\n`));
    cssFramework = 'tailwind';
  }

  try {
    // Get paths
    const basePath = path.join(__dirname, 'base');
    const templatePath = path.join(__dirname, 'templates', template);

    // Create target directory
    await fs.ensureDir(targetPath);

    console.log(chalk.blue('📁 Copying base files...'));
    
    // Copy base files (package.json, vite.config, tsconfig, etc.)
    const baseFiles = [
      'package.json',
      'vite.config.ts',
      'tsconfig.json',
      'tsconfig.node.json',
      'index.html',
      'tailwind.config.js',
      'postcss.config.js'
    ];

    for (const file of baseFiles) {
      const srcFile = path.join(basePath, file);
      if (await fs.pathExists(srcFile)) {
        await fs.copy(srcFile, path.join(targetPath, file));
      }
    }

    // Copy base src directory
    const baseSrcPath = path.join(basePath, 'src');
    const targetSrcPath = path.join(targetPath, 'src');
    if (await fs.pathExists(baseSrcPath)) {
      await fs.copy(baseSrcPath, targetSrcPath);
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
        
        const appContent = `import { Routes, Route } from 'react-router-dom'
${templateImport}

function App() {
  return <${templateName} />
}

export default App
`;
        
        await fs.writeFile(appTsxPath, appContent);
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
      console.log(chalk.blue('✅ Tailwind CSS will be configured'));
    } else {
      // Remove Tailwind files if not selected
      const tailwindFiles = [
        'tailwind.config.js',
        'postcss.config.js'
      ];
      for (const file of tailwindFiles) {
        const filePath = path.join(targetPath, file);
        if (await fs.pathExists(filePath)) {
          await fs.remove(filePath);
        }
      }

      // Remove Tailwind from package.json
      delete packageJson.devDependencies?.tailwindcss;
      delete packageJson.devDependencies?.autoprefixer;
      delete packageJson.devDependencies?.postcss;

      if (cssFramework === 'sass') {
        // Handle SASS
        console.log(chalk.blue('✅ Setting up SASS...'));
        
        // Add sass dependency
        if (!packageJson.devDependencies) {
          packageJson.devDependencies = {};
        }
        packageJson.devDependencies['sass'] = '^1.69.0';

        // Create or convert index.css to index.scss
        const cssPath = path.join(targetSrcPath, 'index.css');
        const scssPath = path.join(targetSrcPath, 'index.scss');
        
        let scssContent = '';
        
        if (await fs.pathExists(cssPath)) {
          // Read existing CSS content (remove Tailwind directives if present)
          scssContent = await fs.readFile(cssPath, 'utf-8');
          scssContent = scssContent.replace(/@tailwind\s+[^;]+;/g, '');
          scssContent = scssContent.trim();
        }
        
        // If empty or only had Tailwind, add basic SCSS structure with SCSS features
        if (!scssContent || scssContent.trim().length === 0) {
          scssContent = `// Main stylesheet
// This file will be compiled to CSS by Vite

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
        }
        
        // Ensure SCSS file is created - remove CSS file first (if it exists) to avoid conflicts
        if (await fs.pathExists(cssPath)) {
          await fs.remove(cssPath);
          console.log(chalk.blue(`🗑️  Removed old ${path.basename(cssPath)}`));
        }
        
        // Write SCSS file - ensure it's always created
        await fs.ensureDir(path.dirname(scssPath));
        await fs.writeFile(scssPath, scssContent, 'utf-8');
        
        // Verify SCSS file was created and has content
        if (await fs.pathExists(scssPath)) {
          const writtenContent = await fs.readFile(scssPath, 'utf-8');
          if (writtenContent.trim().length > 0) {
            console.log(chalk.green(`✅ Created ${path.basename(scssPath)} with ${writtenContent.split('\n').length} lines`));
          } else {
            console.log(chalk.yellow(`⚠️  Created ${path.basename(scssPath)} but file appears empty`));
          }
        } else {
          console.log(chalk.red(`❌ Failed to create ${path.basename(scssPath)}`));
        }

        // Update main.tsx to import .scss instead of .css
        const mainTsxPath = path.join(targetSrcPath, 'main.tsx');
        if (await fs.pathExists(mainTsxPath)) {
          let mainContent = await fs.readFile(mainTsxPath, 'utf-8');
          
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
          
          await fs.writeFile(mainTsxPath, mainContent);
          
          // Verify both the file and import exist
          const scssExists = await fs.pathExists(scssPath);
          const updatedContent = await fs.readFile(mainTsxPath, 'utf-8');
          const hasScssImport = updatedContent.includes('index.scss');
          const stillHasCssImport = updatedContent.includes('index.css');
          
          // Show what was found in main.tsx for debugging
          const importLines = updatedContent.split('\n').filter(line => line.includes('index.'));
          if (importLines.length > 0) {
            console.log(chalk.gray(`   Found imports: ${importLines.join(', ')}`));
          }
          
          if (scssExists && hasScssImport && !stillHasCssImport) {
            console.log(chalk.green('✅ SCSS setup complete: file created and import updated'));
          } else {
            if (!scssExists) {
              console.log(chalk.red('❌ Error: SCSS file was not created'));
            }
            if (!hasScssImport || stillHasCssImport) {
              console.log(chalk.yellow('⚠️  Warning: Import not updated correctly'));
              console.log(chalk.yellow(`   Current main.tsx still has: ${stillHasCssImport ? 'index.css' : 'no SCSS import'}`));
              console.log(chalk.yellow('   Please manually change index.css to index.scss in main.tsx'));
            }
          }
        } else {
          console.log(chalk.yellow('⚠️  Warning: main.tsx not found, cannot update SCSS import'));
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
        console.log(chalk.yellow(`ℹ️  Component library "${componentLibrary}" will be installed with dependencies`));
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
      
      // Save package.json with all dependencies (CSS framework + component library + Redux + React Query)
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
      
      // Update main.tsx to include Redux Provider
      const mainTsxPath = path.join(targetSrcPath, 'main.tsx');
      if (await fs.pathExists(mainTsxPath)) {
        let mainContent = await fs.readFile(mainTsxPath, 'utf-8');
        
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
          
          if (lastImportIndex !== -1) {
            importLines.splice(lastImportIndex + 1, 0, 
              "import { Provider } from 'react-redux'",
              "import { store } from './store/store'"
            );
            mainContent = importLines.join('\n');
          } else {
            // If no imports found, add at the beginning
            mainContent = "import { Provider } from 'react-redux'\n" +
              "import { store } from './store/store'\n" +
              mainContent;
          }
        }
        
        // Wrap the entire app with Redux Provider
        // The structure is usually: ReactDOM.createRoot(...).render(<React.StrictMode>...</React.StrictMode>)
        // We want: ReactDOM.createRoot(...).render(<Provider><React.StrictMode>...</React.StrictMode></Provider>)
        
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
        
        await fs.writeFile(mainTsxPath, mainContent, 'utf-8');
        console.log(chalk.green('✅ Updated main.tsx with Redux Provider'));
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
      
      // Update main.tsx to include QueryClientProvider
      const mainTsxPath = path.join(targetSrcPath, 'main.tsx');
      if (await fs.pathExists(mainTsxPath)) {
        let mainContent = await fs.readFile(mainTsxPath, 'utf-8');
        
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
          
          if (lastImportIndex !== -1) {
            importLines.splice(lastImportIndex + 1, 0, 
              "import { QueryClientProvider } from '@tanstack/react-query'",
              "import { queryClient } from './lib/queryClient'"
            );
            mainContent = importLines.join('\n');
          } else {
            // If no imports found, add at the beginning
            mainContent = "import { QueryClientProvider } from '@tanstack/react-query'\n" +
              "import { queryClient } from './lib/queryClient'\n" +
              mainContent;
          }
        }
        
        // Wrap the app with QueryClientProvider
        // It should wrap inside Provider if Redux is also selected, or wrap the outermost element
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
        
        await fs.writeFile(mainTsxPath, mainContent, 'utf-8');
        console.log(chalk.green('✅ Updated main.tsx with QueryClientProvider'));
      }
    }
    
    // Final verification before npm install
    if (cssFramework === 'sass') {
      const finalPackageJson = await fs.readJson(packageJsonPath);
      const scssFileExists = await fs.pathExists(path.join(targetSrcPath, 'index.scss'));
      const mainTsxContent = await fs.readFile(path.join(targetSrcPath, 'main.tsx'), 'utf-8');
      const hasScssImport = mainTsxContent.includes('index.scss');
      
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

    console.log(chalk.blue('📦 Installing dependencies...'));
    const dependencyList = [];
    if (cssFramework === 'sass') dependencyList.push('sass');
    if (useRedux) dependencyList.push('Redux Toolkit & React-Redux');
    if (useReactQuery) dependencyList.push('React Query (TanStack Query)');
    if (dependencyList.length > 0) {
      console.log(chalk.blue(`   This will install all dependencies including ${dependencyList.join(', ')}...`));
    } else {
      console.log(chalk.blue('   This will install all dependencies...'));
    }
    
    // Install dependencies
    await execa('npm', ['install'], {
      cwd: targetPath,
      stdio: 'inherit'
    });

    console.log(chalk.green('✅ Dependencies installed successfully!'));
    
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

  } catch (error) {
    console.error(chalk.red(`❌ Error generating project: ${error.message}`));
    throw error;
  }
}