#!/usr/bin/env node

import { Command } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

const program = new Command();

program
  .name('jgd-fe')
  .description('A production-ready React + TypeScript project generator CLI')
  .version(packageJson.version || '1.0.0');

program
  .command('init')
  .description('Initialize a new React project with interactive prompts')
  .argument('[project-name]', 'Name of the project to create (or "." for current directory)')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (projectName, options) => {
    if (options.verbose) {
      process.env.DEBUG = 'true';
    }

    // Try to import from dist (production) or show error
    const distPath = join(__dirname, '..', 'dist', 'index.js');
    
    if (!existsSync(distPath)) {
      console.error('Error: Production build not found. Please run "npm run build" first.');
      console.error('For development, use: npm run dev');
      process.exit(1);
    }

    try {
      const { initProject } = await import('../dist/index.js');
      await initProject(projectName || '.');
    } catch (error) {
      console.error('Failed to initialize project:', error);
      process.exit(1);
    }
  });

program.parse();

