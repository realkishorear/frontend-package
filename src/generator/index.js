import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execa } from 'execa';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateProject(targetPath, answers) {
  const { template, cssFramework, componentLibrary } = answers;

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

        // Rename index.css to index.scss
        const cssPath = path.join(targetSrcPath, 'index.css');
        const scssPath = path.join(targetSrcPath, 'index.scss');
        
        if (await fs.pathExists(cssPath)) {
          // Read existing CSS content (remove Tailwind directives if present)
          let cssContent = await fs.readFile(cssPath, 'utf-8');
          cssContent = cssContent.replace(/@tailwind\s+[^;]+;/g, '');
          cssContent = cssContent.trim();
          
          // If empty, add basic SASS structure
          if (!cssContent) {
            cssContent = `// Main stylesheet\n\n* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',\n    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',\n    sans-serif;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n`;
          }
          
          await fs.writeFile(scssPath, cssContent);
          await fs.remove(cssPath);
        } else {
          // Create new index.scss
          const defaultScss = `// Main stylesheet\n\n* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',\n    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',\n    sans-serif;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n`;
          await fs.writeFile(scssPath, defaultScss);
        }

        // Update main.tsx to import .scss instead of .css
        const mainTsxPath = path.join(targetSrcPath, 'main.tsx');
        if (await fs.pathExists(mainTsxPath)) {
          let mainContent = await fs.readFile(mainTsxPath, 'utf-8');
          mainContent = mainContent.replace(/import\s+['"].*index\.css['"]/g, "import './index.scss'");
          await fs.writeFile(mainTsxPath, mainContent);
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

      // Save updated package.json
      if (await fs.pathExists(packageJsonPath)) {
        await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
      }
    }

    // Handle component library
    if (componentLibrary !== 'none') {
      console.log(chalk.yellow(`ℹ️  Component library "${componentLibrary}" will be installed with dependencies`));
    }

    // Update package.json with component library dependencies if needed
    if (await fs.pathExists(packageJsonPath)) {
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
