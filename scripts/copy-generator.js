#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, cpSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const srcGeneratorPath = join(projectRoot, 'src', 'generator', 'index.js');
const distGeneratorPath = join(projectRoot, 'dist', 'generator', 'index.js');
const distGeneratorDir = dirname(distGeneratorPath);

// Create dist/generator directory if it doesn't exist
if (!existsSync(distGeneratorDir)) {
  mkdirSync(distGeneratorDir, { recursive: true });
}

// Copy generator/index.js to dist/generator/index.js
if (existsSync(srcGeneratorPath)) {
  copyFileSync(srcGeneratorPath, distGeneratorPath);
  console.log('✓ Copied generator/index.js to dist');
} else {
  console.warn('⚠ Warning: generator/index.js not found in src');
}

// Also copy the type declaration file if it exists
const srcGeneratorDtsPath = join(projectRoot, 'src', 'generator', 'index.d.ts');
const distGeneratorDtsPath = join(projectRoot, 'dist', 'generator', 'index.d.ts');

if (existsSync(srcGeneratorDtsPath)) {
  copyFileSync(srcGeneratorDtsPath, distGeneratorDtsPath);
  console.log('✓ Copied generator/index.d.ts to dist');
}

// Copy generator directories (configs, base, templates) to dist
// These are needed at runtime by generator/index.js
const generatorDirs = ['configs', 'base', 'templates'];
const srcGeneratorBase = join(projectRoot, 'src', 'generator');
const distGeneratorBase = join(projectRoot, 'dist', 'generator');

for (const dir of generatorDirs) {
  const srcDir = join(srcGeneratorBase, dir);
  const distDir = join(distGeneratorBase, dir);
  
  if (existsSync(srcDir)) {
    cpSync(srcDir, distDir, { recursive: true });
    console.log(`✓ Copied generator/${dir} to dist`);
  }
}

