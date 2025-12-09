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
  // Strip single-line comments (// ...)
  // Strip multi-line comments (/* ... */)
  const jsonContent = content
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
    .replace(/\/\/.*$/gm, ''); // Remove // comments
  return JSON.parse(jsonContent);
}

export async function generateProject(targetPath, answers) {
  const { template, tailwind, componentLibrary } = answers;

  // Validate shadcn requires Tailwind
  if (componentLibrary === 'shadcn' && !tailwind) {
    throw new Error('shadcn/ui requires Tailwind CSS. Please select Tailwind CSS when using shadcn/ui.');
  }

  // Get template path
  const templatePath = path.join(__dirname, 'templates', template);

  // Check if template exists
  if (!(await fs.pathExists(templatePath))) {
    throw new Error(`Template "${template}" not found at ${templatePath}`);
  }

  // Copy base template first
  const basePath = path.join(__dirname, 'base');
  if (await fs.pathExists(basePath)) {
    console.log(chalk.blue('📋 Copying base files...'));
    await copyBaseFiles(basePath, targetPath);
  }

  // Copy template files
  console.log(chalk.blue(`📁 Copying ${template} template...`));
  await copyTemplateFiles(templatePath, targetPath, template);

  // Setup Tailwind if selected
  if (tailwind) {
    console.log(chalk.blue('🎨 Setting up Tailwind CSS...'));
    await setupTailwind(targetPath);
  }

  // Setup component library
  if (componentLibrary !== 'none') {
    console.log(chalk.blue(`📦 Setting up ${componentLibrary}...`));
    await setupComponentLibrary(targetPath, componentLibrary, tailwind);
  }

  // Update package.json with dependencies
  await updatePackageJson(targetPath, tailwind, componentLibrary);

  // Install dependencies
  console.log(chalk.blue('📦 Installing dependencies...'));
  await installDependencies(targetPath);
}

async function copyBaseFiles(basePath, targetPath) {
  await fs.ensureDir(targetPath);
  const files = await fs.readdir(basePath);
  
  for (const file of files) {
    const srcPath = path.join(basePath, file);
    const destPath = path.join(targetPath, file);
    const stat = await fs.stat(srcPath);
    
    if (stat.isDirectory()) {
      await fs.copy(srcPath, destPath);
    } else {
      await fs.copy(srcPath, destPath);
    }
  }
}

async function copyTemplateFiles(templatePath, targetPath, template) {
  // Copy all template files except App.tsx (we'll handle that separately)
  const files = await fs.readdir(templatePath);
  
  for (const file of files) {
    const srcPath = path.join(templatePath, file);
    const stat = await fs.stat(srcPath);
    
    if (stat.isDirectory()) {
      // Copy directories (pages, components, layout, etc.) to src/
      await fs.copy(srcPath, path.join(targetPath, 'src', file));
    } else if (file !== 'App.tsx' && file !== 'Dashboard.tsx' && file !== 'Landing.tsx') {
      // Copy other files to root
      await fs.copy(srcPath, path.join(targetPath, file));
    }
  }
  
  // Handle template-specific App.tsx
  const templateAppPath = path.join(templatePath, 
    template === 'dashboard' ? 'Dashboard.tsx' : 
    template === 'landing' ? 'Landing.tsx' : 
    'App.tsx'
  );
  
  if (await fs.pathExists(templateAppPath)) {
    const templateAppContent = await fs.readFile(templateAppPath, 'utf-8');
    const appTsxPath = path.join(targetPath, 'src', 'App.tsx');
    
    // For dashboard and landing, we need to update the routes
    if (template === 'dashboard') {
      // Dashboard template uses Dashboard.tsx as main component
      // Copy Dashboard.tsx to src/ and create App.tsx that uses it
      const dashboardPath = path.join(targetPath, 'src', 'Dashboard.tsx');
      await fs.writeFile(dashboardPath, templateAppContent);
      
      // Create App.tsx that uses Dashboard
      const appContent = `import Dashboard from './Dashboard'\n\nfunction App() {\n  return <Dashboard />\n}\n\nexport default App\n`;
      await fs.writeFile(appTsxPath, appContent);
    } else if (template === 'landing') {
      // Landing template uses Landing.tsx as main component
      // Copy Landing.tsx to src/components/ and create App.tsx with routes
      const componentsDir = path.join(targetPath, 'src', 'components');
      await fs.ensureDir(componentsDir);
      const landingComponentPath = path.join(componentsDir, 'Landing.tsx');
      await fs.writeFile(landingComponentPath, templateAppContent);
      
      // Create App.tsx with routes for website
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
      // Empty template - just use the App.tsx as is
      await fs.writeFile(appTsxPath, templateAppContent);
    }
  }
}

async function setupTailwind(targetPath) {
  // Create tailwind.config.js
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

  // Create postcss.config.js
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

  // Create or update src/styles/tailwind.css
  const stylesDir = path.join(targetPath, 'src', 'styles');
  await fs.ensureDir(stylesDir);
  
  const tailwindCss = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;

  await fs.writeFile(
    path.join(stylesDir, 'tailwind.css'),
    tailwindCss
  );

  // Update main.tsx to import tailwind.css
  const mainTsxPath = path.join(targetPath, 'src', 'main.tsx');
  if (await fs.pathExists(mainTsxPath)) {
    let mainContent = await fs.readFile(mainTsxPath, 'utf-8');
    if (!mainContent.includes('tailwind.css')) {
      mainContent = `import './styles/tailwind.css';\n${mainContent}`;
      await fs.writeFile(mainTsxPath, mainContent);
    }
  }
}

async function setupComponentLibrary(targetPath, library, hasTailwind) {
  const packageJsonPath = path.join(targetPath, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);

  switch (library) {
    case 'mui':
      packageJson.dependencies = packageJson.dependencies || {};
      packageJson.dependencies['@mui/material'] = '^5.14.20';
      packageJson.dependencies['@emotion/react'] = '^11.11.1';
      packageJson.dependencies['@emotion/styled'] = '^11.11.0';
      
      // Setup Material UI
      await setupMaterialUI(targetPath);
      break;

    case 'antd':
      packageJson.dependencies = packageJson.dependencies || {};
      packageJson.dependencies['antd'] = '^5.12.0';
      break;

    case 'shadcn':
      // shadcn/ui requires Tailwind (validated earlier)
      packageJson.dependencies = packageJson.dependencies || {};
      packageJson.dependencies['class-variance-authority'] = '^0.7.0';
      packageJson.dependencies['clsx'] = '^2.0.0';
      packageJson.dependencies['tailwind-merge'] = '^2.1.0';
      packageJson.dependencies['lucide-react'] = '^0.294.0';
      
      // Create shadcn config
      await setupShadcn(targetPath, hasTailwind);
      break;
  }

  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
}

async function setupMaterialUI(targetPath) {
  // Update main.tsx to include Material UI ThemeProvider and CssBaseline
  const mainTsxPath = path.join(targetPath, 'src', 'main.tsx');
  if (await fs.pathExists(mainTsxPath)) {
    let mainContent = await fs.readFile(mainTsxPath, 'utf-8');
    
    // Check if Material UI is already set up
    if (!mainContent.includes('@mui/material')) {
      // Add Material UI import
      const muiImport = "import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'\n";
      
      // Find where to insert the import (after the last import statement)
      const importRegex = /(import .+ from .+\n)+/;
      const importsMatch = mainContent.match(importRegex);
      if (importsMatch) {
        mainContent = mainContent.replace(importRegex, importsMatch[0] + muiImport);
      }
      
      // Add theme creation
      const themeCode = "\nconst theme = createTheme({\n  palette: {\n    mode: 'light',\n  },\n})\n\n";
      mainContent = mainContent.replace(
        /ReactDOM\.createRoot/,
        themeCode + 'ReactDOM.createRoot'
      );
      
      // Wrap BrowserRouter with ThemeProvider and add CssBaseline
      mainContent = mainContent.replace(
        /<React\.StrictMode>\s*<BrowserRouter>/,
        '<React.StrictMode>\n    <ThemeProvider theme={theme}>\n      <CssBaseline />\n      <BrowserRouter>'
      );
      
      mainContent = mainContent.replace(
        /<\/BrowserRouter>\s*<\/React\.StrictMode>/,
        '</BrowserRouter>\n    </ThemeProvider>\n  </React.StrictMode>'
      );
      
      await fs.writeFile(mainTsxPath, mainContent);
    }
  }
}

async function setupShadcn(targetPath, hasTailwind) {
  // Create components.json for shadcn
  const componentsJson = {
    "$schema": "https://ui.shadcn.com/schema.json",
    "style": "default",
    "rsc": false,
    "tsx": true,
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

  // Create lib/utils.ts
  const libDir = path.join(targetPath, 'src', 'lib');
  await fs.ensureDir(libDir);
  
  const utilsTs = `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`;

  await fs.writeFile(path.join(libDir, 'utils.ts'), utilsTs);

  // Create a default button component
  const componentsDir = path.join(targetPath, 'src', 'components', 'ui');
  await fs.ensureDir(componentsDir);
  
  const buttonTsx = `import * as React from "react"
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
`;

  await fs.writeFile(path.join(componentsDir, 'button.tsx'), buttonTsx);

  // Update tsconfig.json to add path aliases
  const tsconfigPath = path.join(targetPath, 'tsconfig.json');
  if (await fs.pathExists(tsconfigPath)) {
    const tsconfig = await readJsonc(tsconfigPath);
    tsconfig.compilerOptions = tsconfig.compilerOptions || {};
    tsconfig.compilerOptions.paths = {
      "@/*": ["./src/*"]
    };
    await fs.writeJson(tsconfigPath, tsconfig, { spaces: 2 });
  }

  // Update vite.config.ts to add path alias
  const viteConfigPath = path.join(targetPath, 'vite.config.ts');
  if (await fs.pathExists(viteConfigPath)) {
    let viteConfig = await fs.readFile(viteConfigPath, 'utf-8');
    if (!viteConfig.includes('resolve.alias')) {
      viteConfig = viteConfig.replace(
        'import { defineConfig } from \'vite\'',
        `import { defineConfig } from 'vite'\nimport path from 'path'`
      );
      viteConfig = viteConfig.replace(
        'export default defineConfig({',
        `export default defineConfig({\n  resolve: {\n    alias: {\n      '@': path.resolve(__dirname, './src'),\n    },\n  },`
      );
      await fs.writeFile(viteConfigPath, viteConfig);
    }
  }

  // Update tailwind config for shadcn
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

    // Update tailwind.css with shadcn variables
    const tailwindCssPath = path.join(targetPath, 'src', 'styles', 'tailwind.css');
    if (await fs.pathExists(tailwindCssPath)) {
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
      await fs.writeFile(tailwindCssPath, shadcnCss);
    }
  }
}

async function updatePackageJson(targetPath, tailwind, componentLibrary) {
  const packageJsonPath = path.join(targetPath, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);

  // Add Tailwind dependencies if needed
  if (tailwind) {
    packageJson.devDependencies = packageJson.devDependencies || {};
    packageJson.devDependencies['tailwindcss'] = '^3.3.6';
    packageJson.devDependencies['autoprefixer'] = '^10.4.16';
    packageJson.devDependencies['postcss'] = '^8.4.32';
  }

  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
}

async function installDependencies(targetPath) {
  // Detect package manager
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

