#!/usr/bin/env node

import { existsSync } from 'fs';
import { execa } from 'execa';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const distPath = join(projectRoot, 'dist');

// Check if dist directory exists
if (!existsSync(distPath)) {
  console.log('📦 Building project...');
  try {
    await execa('npm', ['run', 'build'], {
      cwd: projectRoot,
      stdio: 'inherit',
    });
    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.warn('⚠️  Build failed, but continuing...');
    console.warn('   You can run "npm run build" manually later.');
  }
} else {
  console.log('✅ Project already built.');
}

