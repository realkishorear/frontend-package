#!/usr/bin/env node

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execa } from 'execa';

(async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const projectRoot = join(__dirname, '..');
  const distPath = join(projectRoot, 'dist', 'index.js');
  const tsConfigPath = join(projectRoot, 'tsconfig.json');

  // Only build if dist doesn't exist and tsconfig exists
  if (!existsSync(distPath) && existsSync(tsConfigPath)) {
    try {
      console.log('Building project...');
      await execa('npm', ['run', 'build'], {
        cwd: projectRoot,
        stdio: 'inherit',
      });
      console.log('Build completed successfully!');
    } catch (error) {
      console.warn('Build failed during postinstall. The CLI will attempt to build on first run.');
      process.exit(0); // Don't fail the install
    }
  } else if (existsSync(distPath)) {
    // Build exists, nothing to do
  } else {
    console.log('TypeScript config not found, skipping build...');
  }
})();

