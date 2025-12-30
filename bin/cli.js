#!/usr/bin/env node

import { Command } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const distIndexPath = join(projectRoot, 'dist', 'index.js');

// Check if dist/index.js exists, if not, try to build or show helpful error
if (!existsSync(distIndexPath)) {
  console.error('❌ Error: Project not built. Please run:');
  console.error('   npm run build');
  console.error('\nOr if installing via npx, the postinstall script should build automatically.');
  process.exit(1);
}

// Import after checking file exists
const { initProject } = await import('../dist/index.js');

const program = new Command();

program
  .name('jgd-fe')
  .description('JGD Frontend Template Engine - A production-ready React + TypeScript project generator')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize a new frontend project')
  .argument('<project-name>', 'Name of the project to create (or "." for current directory)')
  .action(async (projectName) => {
    try {
      await initProject(projectName);
    } catch (error) {
      console.error('❌ Error:', error.message);
      if (error.stack && process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Show help if no command provided
if (process.argv.length === 2) {
  program.help();
}

program.parse(process.argv);

