#!/usr/bin/env node

import { Command } from 'commander';
import { initProject } from '../src/index.js';

const program = new Command();

program
  .name('jgd-fe')
  .description('Custom React Project Generator CLI')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize a new React project with interactive prompts')
  .argument('[project-name]', 'Name of the project to create (or "." for current directory)')
  .action(async (projectName) => {
    await initProject(projectName || '.');
  });

program.parse();

