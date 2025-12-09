import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execa } from 'execa';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to read JSONC (JSON with Comments) files
async function readJsonc(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const jsonContent = content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  return JSON.parse(jsonContent);
}

// Convert TypeScript code to JavaScript
function convertTsToJs(content) {
  let jsContent = content;
  
  // Remove interface declarations
  jsContent = jsContent
    .replace(/export\s+interface\s+\w+[^{]*\{[^}]*\}/g, '')
    .replace(/interface\s+\w+[^{]*\{[^}]*\}/g, '');
  
  // Remove type imports
  jsContent = jsContent.replace(/import\s+type\s+.*?from\s+['"][^'"]+['"];?\n/g, '');
  
  // Remove TypeScript generic type parameters (but not JSX)
  // Match generics like Array<string>, React.FC<Props>, useState<string>()
  // JSX typically has attributes (key="value"), quotes, or is self-closing (/>), generics don't
  // Only match simple generics (no quotes, no /, no = which indicate JSX)
  jsContent = jsContent.replace(/(\w+)\s*<([^>/="']+)>(?=\s*[\(\[\{\.\s,;=]|$)/g, '$1');
  
  // Remove type annotations from function parameters
  jsContent = jsContent.replace(/:\s*[A-Z][a-zA-Z0-9<>\[\]|&\s,{}]*(\s*=\s*[^,)]+)?/g, (match) => {
    const defaultMatch = match.match(/=\s*.+/);
    return defaultMatch ? defaultMatch[0] : '';
  });
  
  // Remove return type annotations
  jsContent = jsContent.replace(/:\s*[A-Z][a-zA-Z0-9<>\[\]|&\s,{}]*(\s*\{)/g, '$1');
  
  // Remove React type helpers
  jsContent = jsContent.replace(/React\.(ReactNode|FC|Component|ComponentType|PropsWithChildren)/g, '');
  
  // Remove type assertions (as Type)
  jsContent = jsContent.replace(/as\s+[A-Z][a-zA-Z0-9<>\[\]|&\s,{}]*/g, '');
  
  // Remove extends clauses with types
  jsContent = jsContent.replace(/extends\s+React\.\w+<[^>]+>/g, '');
  jsContent = jsContent.replace(/extends\s+[A-Z][a-zA-Z0-9<>\[\]|&\s,{}]*/g, '');

  // Remove TypeScript non-null assertion operator (!)
  jsContent = jsContent.replace(/(\w+|\)|\]|\})\s*!(?=\s*[.,;)\[\]\}\s]|$)/g, '$1');
  jsContent = jsContent.replace(/(\w+|\)|\]|\})\s*!(?=\s*\.)/g, '$1');
  jsContent = jsContent.replace(/(\w+|\)|\]|\})\s*!(?=\s*\[)/g, '$1');

  // Update import paths
  jsContent = jsContent.replace(/from\s+['"]([^'"]+)\.tsx?['"]/g, "from '$1.jsx'");
  jsContent = jsContent.replace(/from\s+['"]([^'"]+)\.tsx?['"]/g, "from '$1.js'");
  
  // Clean up trailing commas in function calls/arrays/objects
  jsContent = jsContent.replace(/,\s*\)/g, ')');
  jsContent = jsContent.replace(/,\s*\]/g, ']');
  jsContent = jsContent.replace(/,\s*\}/g, '}');
  
  // Clean up multiple blank lines
  jsContent = jsContent.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return jsContent;
}

// Convert file extension and content
async function convertFileToJs(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const jsContent = convertTsToJs(content);
  
  let newPath = filePath;
  if (filePath.endsWith('.tsx')) {
    newPath = filePath.replace(/\.tsx$/, '.jsx');
  } else if (filePath.endsWith('.ts')) {
    newPath = filePath.replace(/\.ts$/, '.js');
  }
  
  await fs.writeFile(newPath, jsContent, 'utf-8');
  
  if (newPath !== filePath) {
    await fs.remove(filePath);
  }
  
  return newPath;
}

// Recursively convert all TS/TSX files to JS/JSX
async function convertToJavaScript(targetPath) {
  const files = await fs.readdir(targetPath, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(targetPath, file.name);
    
    if (file.isDirectory()) {
      if (file.name !== 'node_modules') {
        await convertToJavaScript(filePath);
      }
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      if (!file.name.endsWith('.d.ts')) {
        await convertFileToJs(filePath);
      }
    }
  }
  
  const tsconfigPath = path.join(targetPath, 'tsconfig.json');
  const tsconfigNodePath = path.join(targetPath, 'tsconfig.node.json');
  if (await fs.pathExists(tsconfigPath)) {
    await fs.remove(tsconfigPath);
  }
  if (await fs.pathExists(tsconfigNodePath)) {
    await fs.remove(tsconfigNodePath);
  }
  
  const viteConfigTs = path.join(targetPath, 'vite.config.ts');
  const viteConfigJs = path.join(targetPath, 'vite.config.js');
  if (await fs.pathExists(viteConfigTs)) {
    const content = await fs.readFile(viteConfigTs, 'utf-8');
    const jsContent = convertTsToJs(content);
    await fs.writeFile(viteConfigJs, jsContent, 'utf-8');
    await fs.remove(viteConfigTs);
  }
}

export async function generateProject(targetPath, answers) {
  // Ensure Tailwind is enabled for shadcn/ui (should be handled in prompts, but double-check)
  if (answers.componentLibrary === 'shadcn' && !answers.tailwind) {
    answers.tailwind = true;
    console.log(chalk.yellow('⚠️  Note: Tailwind CSS has been automatically enabled (required for shadcn/ui)'));
  }

  const { language, template, tailwind, componentLibrary } = answers;
  const useTypeScript = language === 'typescript';

  const templatePath = path.join(__dirname, 'templates', template);

  if (!(await fs.pathExists(templatePath))) {
    throw new Error(`Template "${template}" not found at ${templatePath}`);
  }

  const basePath = path.join(__dirname, 'base');
  if (await fs.pathExists(basePath)) {
    console.log(chalk.blue('📋 Copying base files...'));
    await copyBaseFiles(basePath, targetPath, useTypeScript);
  }

  console.log(chalk.blue(`📁 Copying ${template} template...`));
  await copyTemplateFiles(templatePath, targetPath, template, useTypeScript);

  if (tailwind) {
    console.log(chalk.blue('🎨 Setting up Tailwind CSS...'));
    await setupTailwind(targetPath, useTypeScript);
  }

  if (componentLibrary !== 'none') {
    console.log(chalk.blue(`📦 Setting up ${componentLibrary}...`));
    await setupComponentLibrary(targetPath, componentLibrary, tailwind, useTypeScript);
  }

  await updatePackageJson(targetPath, tailwind, componentLibrary, useTypeScript);
  
  if (!useTypeScript) {
    console.log(chalk.blue('🔄 Converting to JavaScript...'));
    await convertToJavaScript(targetPath);
  }

  console.log(chalk.blue('📦 Installing dependencies...'));
  await installDependencies(targetPath);
}

async function copyBaseFiles(basePath, targetPath, useTypeScript) {
  await fs.ensureDir(targetPath);
  const files = await fs.readdir(basePath);
  
  for (const file of files) {
    const srcPath = path.join(basePath, file);
    const destPath = path.join(targetPath, file);
    const stat = await fs.stat(srcPath);
    
    if (stat.isDirectory()) {
      // Handle src directory specially - convert .tsx/.ts files to .jsx/.js for JavaScript
      if (file === 'src' && !useTypeScript) {
        const srcDir = path.join(basePath, 'src');
        const destSrcDir = path.join(targetPath, 'src');
        await fs.ensureDir(destSrcDir);
        const srcFiles = await fs.readdir(srcDir);
        for (const srcFile of srcFiles) {
          const srcFilePath = path.join(srcDir, srcFile);
          const srcFileStat = await fs.stat(srcFilePath);
          if (srcFileStat.isFile()) {
            if (srcFile.endsWith('.tsx')) {
              const content = await fs.readFile(srcFilePath, 'utf-8');
              const jsContent = convertTsToJs(content);
              const jsxPath = path.join(destSrcDir, srcFile.replace(/\.tsx$/, '.jsx'));
              await fs.writeFile(jsxPath, jsContent, 'utf-8');
            } else if (srcFile.endsWith('.ts') && !srcFile.endsWith('.d.ts')) {
              const content = await fs.readFile(srcFilePath, 'utf-8');
              const jsContent = convertTsToJs(content);
              const jsPath = path.join(destSrcDir, srcFile.replace(/\.ts$/, '.js'));
              await fs.writeFile(jsPath, jsContent, 'utf-8');
            } else {
              await fs.copy(srcFilePath, path.join(destSrcDir, srcFile));
            }
          }
        }
      } else {
        await fs.copy(srcPath, destPath);
      }
    } else {
      if (!useTypeScript && (file === 'tsconfig.json' || file === 'tsconfig.node.json')) {
        continue;
      }
      
      // Handle index.html - update main file extension and remove vite.svg reference
      if (file === 'index.html') {
        const htmlContent = await fs.readFile(srcPath, 'utf-8');
        const mainExt = useTypeScript ? 'tsx' : 'jsx';
        let updatedHtml = htmlContent.replace(
          /src="\/src\/main\.(tsx|jsx)"/,
          `src="/src/main.${mainExt}"`
        );
        // Remove or update vite.svg reference to avoid 404
        updatedHtml = updatedHtml.replace(
          /<link rel="icon"[^>]*vite\.svg[^>]*>/,
          ''
        );
        await fs.writeFile(destPath, updatedHtml, 'utf-8');
      } else if (!useTypeScript && file === 'vite.config.ts') {
        // Convert vite.config.ts to vite.config.js
        const content = await fs.readFile(srcPath, 'utf-8');
        const jsContent = convertTsToJs(content);
        await fs.writeFile(path.join(targetPath, 'vite.config.js'), jsContent, 'utf-8');
      } else if (!useTypeScript && (file.endsWith('.tsx') || (file.endsWith('.ts') && !file.endsWith('.d.ts')))) {
        // Skip other .tsx/.ts files in root - they'll be handled by convertToJavaScript
        // (src files are already handled above)
      } else {
        await fs.copy(srcPath, destPath);
      }
    }
  }
  
  // Ensure main file has CSS import
  const mainExt = useTypeScript ? 'tsx' : 'jsx';
  const mainPath = path.join(targetPath, 'src', `main.${mainExt}`);
  if (await fs.pathExists(mainPath)) {
    let mainContent = await fs.readFile(mainPath, 'utf-8');
    // Ensure index.css import exists
    if (!mainContent.includes("import './index.css'") && !mainContent.includes('import "./index.css"')) {
      // Add index.css import after other imports
      const importMatch = mainContent.match(/(import .+ from .+\n)+/);
      if (importMatch) {
        mainContent = mainContent.replace(/(import .+ from .+\n)+/, importMatch[0] + "import './index.css'\n");
      } else {
        mainContent = "import './index.css'\n" + mainContent;
      }
      await fs.writeFile(mainPath, mainContent, 'utf-8');
    }
  }
}

async function copyTemplateFiles(templatePath, targetPath, template, useTypeScript) {
  const files = await fs.readdir(templatePath);
  
  for (const file of files) {
    const srcPath = path.join(templatePath, file);
    const stat = await fs.stat(srcPath);
    
    if (stat.isDirectory()) {
      await fs.copy(srcPath, path.join(targetPath, 'src', file));
    } else if (file !== 'App.tsx' && file !== 'Dashboard.tsx' && file !== 'Landing.tsx') {
      await fs.copy(srcPath, path.join(targetPath, file));
    }
  }
  
  const templateAppPath = path.join(templatePath, 
    template === 'dashboard' ? 'Dashboard.tsx' : 
    template === 'landing' ? 'Landing.tsx' : 
    'App.tsx'
  );
  
  if (await fs.pathExists(templateAppPath)) {
    const templateAppContent = await fs.readFile(templateAppPath, 'utf-8');
    const ext = useTypeScript ? 'tsx' : 'jsx';
    const appTsxPath = path.join(targetPath, 'src', `App.${ext}`);
    
    if (template === 'dashboard') {
      const dashboardPath = path.join(targetPath, 'src', `Dashboard.${ext}`);
      await fs.writeFile(dashboardPath, templateAppContent);
      
      const appContent = `import Dashboard from './Dashboard'\n\nfunction App() {\n  return <Dashboard />\n}\n\nexport default App\n`;
      await fs.writeFile(appTsxPath, appContent);
    } else if (template === 'landing') {
      const componentsDir = path.join(targetPath, 'src', 'components');
      await fs.ensureDir(componentsDir);
      const landingComponentPath = path.join(componentsDir, `Landing.${ext}`);
      await fs.writeFile(landingComponentPath, templateAppContent);
      
      let appContent = `import { Routes, Route } from 'react-router-dom'\n`;
      appContent += `import Landing from './components/Landing'\n`;
      
      const aboutPath = path.join(templatePath, 'pages', 'About.tsx');
      const contactPath = path.join(templatePath, 'pages', 'Contact.tsx');
      
      if (await fs.pathExists(aboutPath)) {
        appContent += `import About from './pages/About'\n`;
      }
      if (await fs.pathExists(contactPath)) {
        appContent += `import Contact from './pages/Contact'\n`;
      }
      
      appContent += `\nfunction App() {\n  return (\n    <Routes>\n      <Route path="/" element={<Landing />} />\n`;
      if (await fs.pathExists(aboutPath)) {
        appContent += `      <Route path="/about" element={<About />} />\n`;
      }
      if (await fs.pathExists(contactPath)) {
        appContent += `      <Route path="/contact" element={<Contact />} />\n`;
      }
      appContent += `    </Routes>\n  )\n}\n\nexport default App\n`;
      
      await fs.writeFile(appTsxPath, appContent);
    } else {
      await fs.writeFile(appTsxPath, templateAppContent);
    }
  }
}

async function setupTailwind(targetPath, useTypeScript) {
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;

  await fs.writeFile(
    path.join(targetPath, 'tailwind.config.js'),
    tailwindConfig
  );

  const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;

  await fs.writeFile(
    path.join(targetPath, 'postcss.config.js'),
    postcssConfig
  );

  const indexCssPath = path.join(targetPath, 'src', 'index.css');
  
  const tailwindCss = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;

  // Always use index.css for consistency
  await fs.writeFile(indexCssPath, tailwindCss);
  
  // Ensure main file imports index.css
  const mainExt = useTypeScript ? 'tsx' : 'jsx';
  const mainPath = path.join(targetPath, 'src', `main.${mainExt}`);
  if (await fs.pathExists(mainPath)) {
    let mainContent = await fs.readFile(mainPath, 'utf-8');
    // Remove any styles/tailwind.css imports
    mainContent = mainContent.replace(/import\s+['"]\.\/styles\/tailwind\.css['"];?\n?/g, '');
    // Add index.css import if not present
    if (!mainContent.includes("import './index.css'") && !mainContent.includes('import "./index.css"')) {
      const importMatch = mainContent.match(/(import .+ from .+\n)+/);
      if (importMatch) {
        mainContent = mainContent.replace(/(import .+ from .+\n)+/, importMatch[0] + "import './index.css'\n");
      } else {
        mainContent = "import './index.css'\n" + mainContent;
      }
    }
    await fs.writeFile(mainPath, mainContent, 'utf-8');
  }
}

async function setupComponentLibrary(targetPath, library, hasTailwind, useTypeScript) {
  const packageJsonPath = path.join(targetPath, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);

  switch (library) {
    case 'mui':
      packageJson.dependencies = packageJson.dependencies || {};
      packageJson.dependencies['@mui/material'] = '^5.14.20';
      packageJson.dependencies['@emotion/react'] = '^11.11.1';
      packageJson.dependencies['@emotion/styled'] = '^11.11.0';
      
      await setupMaterialUI(targetPath, useTypeScript);
      break;

    case 'antd':
      packageJson.dependencies = packageJson.dependencies || {};
      packageJson.dependencies['antd'] = '^5.12.0';
      break;

    case 'shadcn':
      packageJson.dependencies = packageJson.dependencies || {};
      packageJson.dependencies['class-variance-authority'] = '^0.7.0';
      packageJson.dependencies['clsx'] = '^2.0.0';
      packageJson.dependencies['tailwind-merge'] = '^2.1.0';
      packageJson.dependencies['lucide-react'] = '^0.294.0';
      
      await setupShadcn(targetPath, hasTailwind, useTypeScript);
      break;
  }

  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
}

async function setupMaterialUI(targetPath, useTypeScript) {
  const mainExt = useTypeScript ? 'tsx' : 'jsx';
  const mainPath = path.join(targetPath, 'src', `main.${mainExt}`);
  if (await fs.pathExists(mainPath)) {
    let mainContent = await fs.readFile(mainPath, 'utf-8');
    
    if (!mainContent.includes('@mui/material')) {
      const muiImport = "import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'\n";
      
      const importRegex = /(import .+ from .+\n)+/;
      const importsMatch = mainContent.match(importRegex);
      if (importsMatch) {
        mainContent = mainContent.replace(importRegex, importsMatch[0] + muiImport);
      }
      
      const themeCode = "\nconst theme = createTheme({\n  palette: {\n    mode: 'light',\n  },\n})\n\n";
      mainContent = mainContent.replace(
        /ReactDOM\.createRoot/,
        themeCode + 'ReactDOM.createRoot'
      );
      
      mainContent = mainContent.replace(
        /<React\.StrictMode>\s*<BrowserRouter>/,
        '<React.StrictMode>\n    <ThemeProvider theme={theme}>\n      <CssBaseline />\n      <BrowserRouter>'
      );
      
      mainContent = mainContent.replace(
        /<\/BrowserRouter>\s*<\/React\.StrictMode>/,
        '</BrowserRouter>\n    </ThemeProvider>\n  </React.StrictMode>'
      );
      
      await fs.writeFile(mainPath, mainContent);
    }
  }
}

async function setupShadcn(targetPath, hasTailwind, useTypeScript) {
  const ext = useTypeScript ? 'ts' : 'js';
  const tsxExt = useTypeScript ? 'tsx' : 'jsx';
  
  const componentsJson = {
    "$schema": "https://ui.shadcn.com/schema.json",
    "style": "default",
    "rsc": false,
    "tsx": useTypeScript,
    "tailwind": {
      "config": "tailwind.config.js",
      "css": "src/styles/tailwind.css",
      "baseColor": "slate",
      "cssVariables": true
    },
    "aliases": {
      "components": "@/components",
      "utils": "@/lib/utils"
    }
  };

  await fs.writeJson(
    path.join(targetPath, 'components.json'),
    componentsJson,
    { spaces: 2 }
  );

  const libDir = path.join(targetPath, 'src', 'lib');
  await fs.ensureDir(libDir);
  
  const utilsContent = useTypeScript ? `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
` : `import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
`;

  await fs.writeFile(path.join(libDir, `utils.${ext}`), utilsContent);

  const componentsDir = path.join(targetPath, 'src', 'components', 'ui');
  await fs.ensureDir(componentsDir);
  
  const buttonContent = useTypeScript ? `import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
` : `import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
`;

  await fs.writeFile(path.join(componentsDir, `button.${tsxExt}`), buttonContent);

  if (useTypeScript) {
    const tsconfigPath = path.join(targetPath, 'tsconfig.json');
    if (await fs.pathExists(tsconfigPath)) {
      const tsconfig = await readJsonc(tsconfigPath);
      tsconfig.compilerOptions = tsconfig.compilerOptions || {};
      tsconfig.compilerOptions.paths = {
        "@/*": ["./src/*"]
      };
      await fs.writeJson(tsconfigPath, tsconfig, { spaces: 2 });
    }
  }

  const viteConfigExt = useTypeScript ? 'ts' : 'js';
  const viteConfigPath = path.join(targetPath, `vite.config.${viteConfigExt}`);
  if (await fs.pathExists(viteConfigPath)) {
    let viteConfig = await fs.readFile(viteConfigPath, 'utf-8');
    if (!viteConfig.includes('resolve.alias')) {
      viteConfig = viteConfig.replace(
        `import { defineConfig } from 'vite'`,
        `import { defineConfig } from 'vite'\nimport path from 'path'`
      );
      viteConfig = viteConfig.replace(
        'export default defineConfig({',
        `export default defineConfig({\n  resolve: {\n    alias: {\n      '@': path.resolve(__dirname, './src'),\n    },\n  },`
      );
      await fs.writeFile(viteConfigPath, viteConfig);
    }
  }

  if (hasTailwind) {
    const tailwindConfigPath = path.join(targetPath, 'tailwind.config.js');
    if (await fs.pathExists(tailwindConfigPath)) {
      const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
`;
      await fs.writeFile(tailwindConfigPath, tailwindConfig);
    }

    const tailwindCssPath = path.join(targetPath, 'src', 'styles', 'tailwind.css');
    const indexCssPath = path.join(targetPath, 'src', 'index.css');
    const cssPath = await fs.pathExists(tailwindCssPath) ? tailwindCssPath : indexCssPath;
    
    if (await fs.pathExists(cssPath)) {
      const shadcnCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
}
`;
      await fs.writeFile(cssPath, shadcnCss);
    }
  }
}

async function updatePackageJson(targetPath, tailwind, componentLibrary, useTypeScript) {
  const packageJsonPath = path.join(targetPath, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);

  if (!useTypeScript) {
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts.build = 'vite build';
    packageJson.scripts.lint = 'eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0';
  }

  if (!useTypeScript) {
    packageJson.devDependencies = packageJson.devDependencies || {};
    delete packageJson.devDependencies['typescript'];
    delete packageJson.devDependencies['@types/react'];
    delete packageJson.devDependencies['@types/react-dom'];
    delete packageJson.devDependencies['@typescript-eslint/eslint-plugin'];
    delete packageJson.devDependencies['@typescript-eslint/parser'];
  }

  if (tailwind) {
    packageJson.devDependencies = packageJson.devDependencies || {};
    packageJson.devDependencies['tailwindcss'] = '^3.3.6';
    packageJson.devDependencies['autoprefixer'] = '^10.4.16';
    packageJson.devDependencies['postcss'] = '^8.4.32';
  }

  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
}

async function installDependencies(targetPath) {
  let packageManager = 'npm';
  
  if (await fs.pathExists(path.join(process.cwd(), 'pnpm-lock.yaml'))) {
    packageManager = 'pnpm';
  } else if (await fs.pathExists(path.join(process.cwd(), 'yarn.lock'))) {
    packageManager = 'yarn';
  }

  try {
    await execa(packageManager, ['install'], {
      cwd: targetPath,
      stdio: 'inherit'
    });
  } catch (error) {
    console.warn(chalk.yellow(`Warning: ${packageManager} install failed, trying npm...`));
    await execa('npm', ['install'], {
      cwd: targetPath,
      stdio: 'inherit'
    });
  }
}
