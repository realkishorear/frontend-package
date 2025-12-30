#!/usr/bin/env node

import { execa } from 'execa';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Check if dist directory exists and has index.js
const distIndexPath = join(projectRoot, 'dist', 'index.js');

(async () => {
  if (!existsSync(distIndexPath)) {
    console.log('📦 Building project...');
    try {
      await execa('npm', ['run', 'build'], {
        cwd: projectRoot,
        stdio: 'inherit'
      });
      console.log('✅ Build completed successfully!');
    } catch (error) {
      console.warn('⚠️  Build failed, but continuing. You may need to run "npm run build" manually.');
      process.exit(0); // Don't fail the install if build fails
    }
  } else {
    console.log('✅ Project already built.');
  }
})();

