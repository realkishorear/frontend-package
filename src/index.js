import { askQuestions } from './prompts.js';
import { generateProject } from './generator/index.js';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';

export async function initProject(projectName) {
  try {
    const targetPath = projectName === '.' 
      ? process.cwd() 
      : path.resolve(process.cwd(), projectName);

    // Check if folder exists (only if not current directory)
    if (projectName !== '.' && await fs.pathExists(targetPath)) {
      console.error(chalk.red(`❌ Error: Directory "${projectName}" already exists!`));
      process.exit(1);
    }

    // Welcome banner
    console.log(chalk.cyan.bold('\n╔═══════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║                                                       ║'));
    console.log(chalk.cyan.bold('║     Welcome to JGD Frontend Template Engine           ║'));
    console.log(chalk.cyan.bold('║                                                       ║'));
    console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════════════╝\n'));

    // Ask interactive questions
    const answers = await askQuestions();

    console.log(chalk.blue('\n📁 Generating project...\n'));

    // Generate the project
    await generateProject(targetPath, answers);

    console.log(chalk.green('\n✅ Project created successfully!\n'));
    console.log(chalk.yellow('📝 Next steps:'));
    if (projectName !== '.') {
      console.log(chalk.white(`   cd ${projectName}`));
    }
    
    // Add Shadcn setup instruction if selected
    if (answers.componentLibrary === 'shadcn') {
      console.log(chalk.cyan('   npx shadcn-ui@latest init'));
    }
    
    console.log(chalk.white('   npm run dev'));
    console.log(chalk.white('\n🎉 Happy coding!\n'));

  } catch (error) {
    console.error(chalk.red(`❌ Error: ${error.message}`));
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }
}
