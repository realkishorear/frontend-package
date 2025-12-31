#!/usr/bin/env node

import { Command } from 'commander';
import { initProject } from '../dist/index.js';

const program = new Command();

program
  .name('jgd-fe')
  .description('JGD Frontend Template Engine - A production-ready React + TypeScript project generator')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize a new frontend project')
  .argument('[project-name]', 'Name of the project to create (or "." for current directory)', '.')
  .action(async (projectName) => {
    try {
      await initProject(projectName);
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);

