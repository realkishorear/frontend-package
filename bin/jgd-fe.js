#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execa } from 'execa';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name('jgd-fe')
  .description('Frontend scaffolding CLI for React + Vite + TypeScript + TailwindCSS')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize a new project from template')
  .argument('<project-name>', 'Name of the project to create')
  .action(async (projectName) => {
    try {
      const targetPath = path.resolve(process.cwd(), projectName);

      // Check if folder exists
      if (await fs.pathExists(targetPath)) {
        console.error(chalk.red(`❌ Error: Directory "${projectName}" already exists!`));
        process.exit(1);
      }

      console.log(chalk.blue(`🚀 Creating project "${projectName}"...`));

      // Get template path
      const templatePath = path.join(__dirname, '..', 'templates', 'react-tailwind');

      // Check if template exists
      if (!(await fs.pathExists(templatePath))) {
        console.error(chalk.red(`❌ Error: Template not found at ${templatePath}`));
        process.exit(1);
      }

      // Copy template folder
      console.log(chalk.blue('📁 Copying template files...'));
      await fs.copy(templatePath, targetPath);

      console.log(chalk.blue('📦 Installing dependencies...'));
      
      // Run npm install inside the created project
      await execa('npm', ['install'], {
        cwd: targetPath,
        stdio: 'inherit'
      });

      console.log(chalk.green('\n✅ Project created successfully!\n'));
      console.log(chalk.yellow('📝 Next steps:'));
      console.log(chalk.white(`   cd ${projectName}`));
      console.log(chalk.white('   npm run dev'));
      console.log(chalk.white('\n🎉 Happy coding!\n'));

    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();

