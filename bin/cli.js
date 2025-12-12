#!/usr/bin/env node

import { Command } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { execa } from 'execa';

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

    const distPath = join(__dirname, '..', 'dist', 'index.js');
    const srcPath = join(__dirname, '..', 'src', 'index.ts');
    const projectRoot = join(__dirname, '..');

    // If dist doesn't exist, try to build it
    if (!existsSync(distPath)) {
      console.log('Building project...');
      try {
        // Check if TypeScript is available
        const tsConfigPath = join(projectRoot, 'tsconfig.json');
        if (existsSync(tsConfigPath)) {
          // Try to build using npm run build
          await execa('npm', ['run', 'build'], {
            cwd: projectRoot,
            stdio: 'inherit',
          });
        } else {
          throw new Error('TypeScript configuration not found');
        }
      } catch (buildError) {
        console.error('Error: Could not build the project.');
        console.error('Please ensure TypeScript is installed and run: npm run build');
        if (buildError instanceof Error) {
          console.error('Build error:', buildError.message);
        }
        process.exit(1);
      }
    }

    // Verify dist exists after build attempt
    if (!existsSync(distPath)) {
      console.error('Error: Production build not found after build attempt.');
      console.error('Please run "npm install" to install dependencies, then "npm run build"');
      process.exit(1);
    }

    try {
      const { initProject } = await import('../dist/index.js');
      await initProject(projectName || '.');
    } catch (error) {
      console.error('Failed to initialize project:', error);
      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program.parse();

