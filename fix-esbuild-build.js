#!/usr/bin/env node
/**
 * Fix script for esbuild projects with TypeScript errors
 * Run this in your project directory: node fix-esbuild-build.js
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixProject() {
  const projectRoot = process.cwd();
  
  console.log('🔧 Fixing TypeScript configuration for esbuild...\n');
  
  // 1. Update tsconfig.json
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
  if (await fs.pathExists(tsconfigPath)) {
    const tsconfig = await fs.readJson(tsconfigPath);
    
    // Update moduleResolution for esbuild
    tsconfig.compilerOptions = tsconfig.compilerOptions || {};
    tsconfig.compilerOptions.moduleResolution = 'node';
    tsconfig.compilerOptions.allowImportingTsExtensions = false;
    tsconfig.compilerOptions.noUnusedLocals = false;
    tsconfig.compilerOptions.noUnusedParameters = false;
    tsconfig.compilerOptions.types = ['node'];
    
    await fs.writeJson(tsconfigPath, tsconfig, { spaces: 2 });
    console.log('✅ Updated tsconfig.json');
  }
  
  // 2. Fix logger.ts if it exists
  const loggerPath = path.join(projectRoot, 'src', 'lib', 'logger.ts');
  if (await fs.pathExists(loggerPath)) {
    let loggerContent = await fs.readFile(loggerPath, 'utf-8');
    
    // Replace import.meta.env with process.env.NODE_ENV
    loggerContent = loggerContent.replace(
      /const isDevelopment = import\.meta\.env\.DEV;/g,
      "const isDevelopment = process.env.NODE_ENV !== 'production';"
    );
    loggerContent = loggerContent.replace(
      /const isProduction = import\.meta\.env\.PROD;/g,
      "const isProduction = process.env.NODE_ENV === 'production';"
    );
    
    await fs.writeFile(loggerPath, loggerContent, 'utf-8');
    console.log('✅ Fixed logger.ts');
  }
  
  // 3. Check if @types/node is in package.json
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);
    
    if (!packageJson.devDependencies) {
      packageJson.devDependencies = {};
    }
    
    if (!packageJson.devDependencies['@types/node']) {
      packageJson.devDependencies['@types/node'] = '^20.10.0';
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
      console.log('✅ Added @types/node to package.json');
      console.log('   Run: npm install');
    } else {
      console.log('✅ @types/node already in package.json');
    }
  }
  
  console.log('\n✨ Fix complete!');
  console.log('\nNext steps:');
  console.log('1. Run: npm install (if @types/node was added)');
  console.log('2. Fix remaining type errors in your components');
  console.log('3. Run: npm run build');
}

fixProject().catch(console.error);

