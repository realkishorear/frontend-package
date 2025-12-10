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
        
        // If empty or only had Tailwind, add basic SASS structure
        if (!scssContent || scssContent.length === 0) {
          scssContent = `// Main stylesheet
// This file will be compiled to CSS by Vite

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
}
`;
        }
        
        // Ensure SCSS content is not just whitespace
        if (scssContent.trim().length === 0) {
          scssContent = `// Main stylesheet
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}
`;
        }
        
        // Write SCSS file
        await fs.writeFile(scssPath, scssContent);
        
        // Verify SCSS file was created
        if (await fs.pathExists(scssPath)) {
          console.log(chalk.green(`✅ Created ${path.basename(scssPath)}`));
        } else {
          console.log(chalk.red(`❌ Failed to create ${path.basename(scssPath)}`));
        }
        
        // Remove CSS file if it exists
        if (await fs.pathExists(cssPath)) {
          await fs.remove(cssPath);
          console.log(chalk.blue(`🗑️  Removed old ${path.basename(cssPath)}`));
        }

        // Update main.tsx to import .scss instead of .css
        const mainTsxPath = path.join(targetSrcPath, 'main.tsx');
        if (await fs.pathExists(mainTsxPath)) {
          let mainContent = await fs.readFile(mainTsxPath, 'utf-8');
          
          // Replace any import of index.css with index.scss
          // Handle various import patterns
          if (mainContent.includes("import './index.css'")) {
            mainContent = mainContent.replace("import './index.css'", "import './index.scss'");
          } else if (mainContent.includes('import "./index.css"')) {
            mainContent = mainContent.replace('import "./index.css"', 'import "./index.scss"');
          } else if (mainContent.includes("import '../index.css'")) {
            mainContent = mainContent.replace("import '../index.css'", "import './index.scss'");
          } else {
            // Fallback: use regex for any other pattern
            mainContent = mainContent.replace(
              /import\s+(['"])([^'"]*\/)?index\.css\1/g,
              "import './index.scss'"
            );
          }
          
          // Final fallback: simple string replace
          if (mainContent.includes('index.css') && !mainContent.includes('index.scss')) {
            mainContent = mainContent.replace(/index\.css/g, 'index.scss');
          }
          
          await fs.writeFile(mainTsxPath, mainContent);
          
          // Verify both the file and import exist
          const scssExists = await fs.pathExists(scssPath);
          const updatedContent = await fs.readFile(mainTsxPath, 'utf-8');
          const hasScssImport = updatedContent.includes('index.scss');
          
          if (scssExists && hasScssImport) {
            console.log(chalk.green('✅ SCSS setup complete: file created and import updated'));
          } else {
            if (!scssExists) {
              console.log(chalk.red('❌ Error: SCSS file was not created'));
            }
            if (!hasScssImport) {
              console.log(chalk.yellow('⚠️  Warning: Import not updated. Please manually change index.css to index.scss in main.tsx'));
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
        console.log(chalk.blue(`ℹ️  Shadcn/ui selected - you'll need to initialize it separately after project creation`));
        console.log(chalk.gray(`   Run: npx shadcn-ui@latest init`));
      } else {
        console.log(chalk.yellow(`ℹ️  Component library "${componentLibrary}" will be installed with dependencies`));
      }
    }

    // Update package.json with component library dependencies if needed
    // Read package.json fresh to ensure we have the latest version (after CSS framework changes)
    if (await fs.pathExists(packageJsonPath)) {
      packageJson = await fs.readJson(packageJsonPath);
      
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
      
      // Save package.json with all dependencies (CSS framework + component library)
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
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
        console.log(chalk.yellow('⚠️  SCSS setup verification:'));
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
    console.log(chalk.blue('   This will install all dependencies including sass (if selected)...'));
    
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
        console.log(chalk.blue('\n💡 Vite will automatically compile your SCSS files when you run: npm run dev'));
        console.log(chalk.blue('   Your SCSS will be compiled to CSS automatically - no manual steps needed!'));
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

  } catch (error) {
    console.error(chalk.red(`❌ Error generating project: ${error.message}`));
    throw error;
  }
}
