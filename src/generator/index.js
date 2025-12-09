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
  await copyTemplateFiles(templatePath, targetPath, template, answers);

  // Setup Tailwind if selected
  if (tailwind) {
    console.log(chalk.blue('🎨 Setting up Tailwind CSS...'));
    await setupTailwind(targetPath);
  }

  // Setup component library
  if (componentLibrary !== 'none') {
    console.log(chalk.blue(`📦 Setting up ${componentLibrary}...`));
    await setupComponentLibrary(targetPath, componentLibrary, tailwind, template);
  }

  // Update package.json with dependencies
  await updatePackageJson(targetPath, tailwind, componentLibrary);

  // Install dependencies
  console.log(chalk.blue('📦 Installing dependencies...'));
  await installDependencies(targetPath);

  // Add shadcn examples for dashboard + shadcn combination
  if (template === 'dashboard' && componentLibrary === 'shadcn') {
    console.log(chalk.blue('🎨 Adding shadcn/ui examples...'));
    await addShadcnExamples(targetPath);
  }
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

async function copyTemplateFiles(templatePath, targetPath, template, answers) {
  // Check if we're using shadcn examples (dashboard + shadcn)
  const useShadcnExamples = template === 'dashboard' && answers.componentLibrary === 'shadcn';
  
  // Copy all template files except App.tsx and Dashboard.tsx (we'll handle those separately)
  const files = await fs.readdir(templatePath);
  
  for (const file of files) {
    const srcPath = path.join(templatePath, file);
    const stat = await fs.stat(srcPath);
    
    if (stat.isDirectory()) {
      // Skip copying pages directory if using shadcn examples (they'll be added by shadcn CLI)
      if (useShadcnExamples && file === 'pages') {
        continue;
      }
      // Skip copying components directory if using shadcn examples (they'll be added by shadcn CLI)
      if (useShadcnExamples && file === 'components') {
        continue;
      }
      // Copy directories (pages, components, layout, etc.) to src/
      await fs.copy(srcPath, path.join(targetPath, 'src', file));
    } else if (file !== 'App.tsx' && file !== 'Dashboard.tsx' && file !== 'Landing.tsx') {
      // Copy other files to root
      await fs.copy(srcPath, path.join(targetPath, file));
    }
  }
  
  // Handle template-specific App.tsx
  // Skip if using shadcn examples (App.tsx will be created after shadcn CLI runs)
  if (useShadcnExamples) {
    // Create a placeholder App.tsx that will be updated after shadcn examples are added
    const appTsxPath = path.join(targetPath, 'src', 'App.tsx');
    const appContent = `import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Loading...</div>} />
    </Routes>
  )
}

export default App
`;
    await fs.writeFile(appTsxPath, appContent);
    return; // Exit early, App.tsx will be updated by updateAppWithShadcnExamples
  }
  
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
      
      // Create App.tsx that uses Dashboard without auth
      const appContent = `import Dashboard from './Dashboard'

function App() {
  return <Dashboard />
}

export default App
`;
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

async function setupComponentLibrary(targetPath, library, hasTailwind, template) {
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
      packageJson.dependencies['@radix-ui/react-label'] = '^2.0.2';
      packageJson.dependencies['@radix-ui/react-dropdown-menu'] = '^2.0.6';
      packageJson.dependencies['@radix-ui/react-dialog'] = '^1.0.5';
      
      // Create shadcn config
      await setupShadcn(targetPath, hasTailwind, template);
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

async function setupShadcn(targetPath, hasTailwind, template) {
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

  // Create shadcn/ui components
  const componentsDir = path.join(targetPath, 'src', 'components', 'ui');
  await fs.ensureDir(componentsDir);
  
  // Button component
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

  // Card component
  const cardTsx = `import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
`;

  await fs.writeFile(path.join(componentsDir, 'card.tsx'), cardTsx);

  // Input component
  const inputTsx = `import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
`;

  await fs.writeFile(path.join(componentsDir, 'input.tsx'), inputTsx);

  // Label component
  const labelTsx = `import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
`;

  await fs.writeFile(path.join(componentsDir, 'label.tsx'), labelTsx);

  // Table component
  const tableTsx = `import * as React from "react"
import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
`;

  await fs.writeFile(path.join(componentsDir, 'table.tsx'), tableTsx);

  // DropdownMenu component
  const dropdownMenuTsx = `import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup = DropdownMenuPrimitive.Group
const DropdownMenuPortal = DropdownMenuPrimitive.Portal
const DropdownMenuSub = DropdownMenuPrimitive.Sub
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
        </svg>
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <div className="h-2 w-2 rounded-full bg-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
`;

  await fs.writeFile(path.join(componentsDir, 'dropdown-menu.tsx'), dropdownMenuTsx);

  // Sheet component
  const sheetTsx = `import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close
const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & {
    side?: "top" | "right" | "bottom" | "left"
  }
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
        side === "top" &&
          "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        side === "bottom" &&
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        side === "left" &&
          "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        side === "right" &&
          "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
        className
      )}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
`;

  await fs.writeFile(path.join(componentsDir, 'sheet.tsx'), sheetTsx);

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

async function addShadcnExamples(targetPath) {
  try {
    // Add login-01 example
    console.log(chalk.blue('  Adding login-01 example...'));
    await execa('npx', ['shadcn@latest', 'add', 'login-01', '--yes', '--overwrite'], {
      cwd: targetPath,
      stdio: 'inherit'
    });

    // Add dashboard-01 example
    console.log(chalk.blue('  Adding dashboard-01 example...'));
    await execa('npx', ['shadcn@latest', 'add', 'dashboard-01', '--yes', '--overwrite'], {
      cwd: targetPath,
      stdio: 'inherit'
    });

    // Update App.tsx to use the shadcn examples
    await updateAppWithShadcnExamples(targetPath);
  } catch (error) {
    console.warn(chalk.yellow(`Warning: Failed to add shadcn examples: ${error.message}`));
  }
}

async function updateAppWithShadcnExamples(targetPath) {
  const appTsxPath = path.join(targetPath, 'src', 'App.tsx');
  
  // Check where shadcn added the examples
  // They're typically in src/app/examples/ directory
  const possibleLoginPaths = [
    path.join(targetPath, 'src', 'app', 'examples', 'login-01', 'login-01.tsx'),
    path.join(targetPath, 'src', 'app', 'examples', 'login-01', 'page.tsx'),
    path.join(targetPath, 'src', 'app', 'login-01', 'login-01.tsx'),
    path.join(targetPath, 'src', 'app', 'login-01', 'page.tsx'),
  ];

  const possibleDashboardPaths = [
    path.join(targetPath, 'src', 'app', 'examples', 'dashboard-01', 'dashboard-01.tsx'),
    path.join(targetPath, 'src', 'app', 'examples', 'dashboard-01', 'page.tsx'),
    path.join(targetPath, 'src', 'app', 'dashboard-01', 'dashboard-01.tsx'),
    path.join(targetPath, 'src', 'app', 'dashboard-01', 'page.tsx'),
  ];

  let loginPath = null;
  let dashboardPath = null;

  for (const p of possibleLoginPaths) {
    if (await fs.pathExists(p)) {
      loginPath = p;
      break;
    }
  }

  for (const p of possibleDashboardPaths) {
    if (await fs.pathExists(p)) {
      dashboardPath = p;
      break;
    }
  }

  if (loginPath && dashboardPath) {
    // Get relative paths from src/App.tsx
    const loginRelative = path.relative(path.join(targetPath, 'src'), loginPath).replace(/\\/g, '/').replace(/\.tsx?$/, '');
    const dashboardRelative = path.relative(path.join(targetPath, 'src'), dashboardPath).replace(/\\/g, '/').replace(/\.tsx?$/, '');

    // Read the example files to get the component names
    const loginContent = await fs.readFile(loginPath, 'utf-8');
    const dashboardContent = await fs.readFile(dashboardPath, 'utf-8');

    // Extract component names (usually default export or named export)
    let loginComponent = 'Login01';
    let dashboardComponent = 'Dashboard01';

    // Try to find default export name
    const loginDefaultMatch = loginContent.match(/export\s+default\s+(?:function\s+)?(\w+)/);
    if (loginDefaultMatch) {
      loginComponent = loginDefaultMatch[1];
    } else {
      // Try named export
      const loginNamedMatch = loginContent.match(/export\s+(?:function|const)\s+(\w+)/);
      if (loginNamedMatch) {
        loginComponent = loginNamedMatch[1];
      }
    }

    const dashboardDefaultMatch = dashboardContent.match(/export\s+default\s+(?:function\s+)?(\w+)/);
    if (dashboardDefaultMatch) {
      dashboardComponent = dashboardDefaultMatch[1];
    } else {
      // Try named export
      const dashboardNamedMatch = dashboardContent.match(/export\s+(?:function|const)\s+(\w+)/);
      if (dashboardNamedMatch) {
        dashboardComponent = dashboardNamedMatch[1];
      }
    }

    // Check if login component accepts onLogin prop or if we need to wrap it
    const hasOnLoginProp = loginContent.includes('onLogin') || loginContent.includes('onSubmit');
    const hasNavigate = loginContent.includes('useNavigate');
    
    // Create App.tsx with routing
    let appContent;
    if (hasOnLoginProp) {
      // Component accepts onLogin/onSubmit prop
      appContent = `import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import ${loginComponent} from './${loginRelative}'
import ${dashboardComponent} from './${dashboardRelative}'

// Wrap login to add navigation
function Login() {
  const navigate = useNavigate()
  
  const handleLogin = () => {
    // Accept any username/password and navigate to dashboard
    navigate('/dashboard')
  }
  
  return <${loginComponent} onLogin={handleLogin} onSubmit={handleLogin} />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<${dashboardComponent} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
`;
    } else {
      // Wrap login to intercept form submissions
      appContent = `import { useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import ${loginComponent} from './${loginRelative}'
import ${dashboardComponent} from './${dashboardRelative}'

// Wrap login to add navigation
function Login() {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    // Intercept form submissions to navigate to dashboard
    // Accept any username/password
    const container = containerRef.current
    if (!container) return
    
    const handleSubmit = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      navigate('/dashboard')
      return false
    }
    
    // Find all forms and intercept their submit events
    const forms = container.querySelectorAll('form')
    forms.forEach(form => {
      form.addEventListener('submit', handleSubmit, true)
    })
    
    // Also intercept button clicks that might trigger navigation
    const buttons = container.querySelectorAll('button[type="submit"]')
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        const form = button.closest('form')
        if (form) {
          e.preventDefault()
          navigate('/dashboard')
        }
      }, true)
    })
    
    return () => {
      forms.forEach(form => {
        form.removeEventListener('submit', handleSubmit, true)
      })
    }
  }, [navigate])
  
  return (
    <div ref={containerRef}>
      <${loginComponent} />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<${dashboardComponent} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
`;
    }

    await fs.writeFile(appTsxPath, appContent);
  } else {
    // Fallback: create a simple App.tsx that will work
    console.warn(chalk.yellow('Could not find shadcn example files. You may need to manually update App.tsx.'));
    const appContent = `import { Routes, Route, Navigate } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Please check src/app/examples/ for login-01 and dashboard-01</div>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
`;
    await fs.writeFile(appTsxPath, appContent);
  }
}

