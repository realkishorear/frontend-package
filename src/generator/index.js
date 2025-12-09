import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execa } from 'execa';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateProject(targetPath, answers) {
  const { template, tailwind, componentLibrary } = answers;

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
  return (
    <Routes>
      <Route path="/" element={<${templateName} />} />
    </Routes>
  )
}

export default App
`;
        
        await fs.writeFile(appTsxPath, appContent);
      }
    }

    // Handle Tailwind CSS
    if (!tailwind) {
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
      
      // Remove Tailwind imports from CSS
      const cssPath = path.join(targetSrcPath, 'index.css');
      if (await fs.pathExists(cssPath)) {
        await fs.writeFile(cssPath, '');
      }

      // Remove Tailwind from package.json
      const packageJsonPath = path.join(targetPath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        delete packageJson.devDependencies?.tailwindcss;
        delete packageJson.devDependencies?.autoprefixer;
        delete packageJson.devDependencies?.postcss;
        await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
      }
    }

    // Handle component library
    if (componentLibrary !== 'none') {
      console.log(chalk.yellow(`ℹ️  Component library "${componentLibrary}" will be installed with dependencies`));
    }

    // Update package.json with component library dependencies if needed
    const packageJsonPath = path.join(targetPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      
      if (componentLibrary === 'mui') {
        packageJson.dependencies['@mui/material'] = '^5.15.0';
        packageJson.dependencies['@emotion/react'] = '^11.11.0';
        packageJson.dependencies['@emotion/styled'] = '^11.11.0';
      } else if (componentLibrary === 'antd') {
        packageJson.dependencies['antd'] = '^5.12.0';
      }
      
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    }

    console.log(chalk.blue('📦 Installing dependencies...'));
    
    // Install dependencies
    await execa('npm', ['install'], {
      cwd: targetPath,
      stdio: 'inherit'
    });

    console.log(chalk.green('✅ Dependencies installed successfully!'));

  } catch (error) {
    console.error(chalk.red(`❌ Error generating project: ${error.message}`));
    throw error;
  }
}
