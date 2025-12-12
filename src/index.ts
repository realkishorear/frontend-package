import { askQuestions } from './prompts.js';
import { generateProject } from './generator/index.js';
import chalk from 'chalk';
import path from 'path';
import { validateAnswers, validateTargetPath } from './utils/validation.js';
import { ProjectGenerationError } from './utils/errors.js';
import { logger } from './utils/logger.js';

/**
 * Initialize a new React project with the specified configuration
 * @param projectName - Name of the project to create (or "." for current directory)
 */
export async function initProject(projectName: string): Promise<void> {
  try {
    // Welcome banner - show this first
    console.log(chalk.cyan.bold('\n╔═══════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║                                                       ║'));
    console.log(chalk.cyan.bold('║     Welcome to JGD Frontend Template Engine           ║'));
    console.log(chalk.cyan.bold('║                                                       ║'));
    console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════════════╝\n'));

    // Ask interactive questions FIRST, before any validation or project creation
    console.log(chalk.blue.bold('Let\'s set up your React project!\n'));
    console.log(chalk.gray('Please answer the following questions to configure your project:\n'));
    
    const answers = await askQuestions();

    // Validate answers
    validateAnswers(answers);

    // Now determine target path and validate
    const targetPath =
      projectName === '.' ? process.cwd() : path.resolve(process.cwd(), projectName);

    // Validate target path (after questions, before generation)
    await validateTargetPath(targetPath, projectName);

    // Show summary of selections
    console.log(chalk.cyan.bold('\n📋 Project Configuration Summary:\n'));
    console.log(chalk.white(`   Template: ${chalk.cyan(answers.template)}`));
    console.log(chalk.white(`   Bundler: ${chalk.cyan(answers.bundler)}`));
    console.log(chalk.white(`   CSS Framework: ${chalk.cyan(answers.cssFramework)}`));
    console.log(chalk.white(`   Component Library: ${chalk.cyan(answers.componentLibrary)}`));
    console.log(chalk.white(`   Routing: ${chalk.cyan(`React Router ${answers.routingType}`)}`));
    if (answers.useRedux) console.log(chalk.white(`   ${chalk.green('✓')} Redux`));
    if (answers.useReactQuery) console.log(chalk.white(`   ${chalk.green('✓')} React Query`));
    if (answers.useLogger) console.log(chalk.white(`   ${chalk.green('✓')} Logger`));
    if (answers.useAnimation) console.log(chalk.white(`   ${chalk.green('✓')} Framer Motion`));
    console.log(chalk.white(`\n   Target: ${chalk.cyan(targetPath)}\n`));

    logger.info('📁 Generating project...\n');

    // Generate the project
    await generateProject(targetPath, answers);

    logger.success('Project created successfully!\n');
    logger.info('📝 Next steps:');
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
    if (error instanceof ProjectGenerationError) {
      logger.error(error.message);
      if (error.code) {
        logger.debug(`Error code: ${error.code}`);
      }
    } else if (error instanceof Error) {
      logger.error(`Error: ${error.message}`);
      if (process.env.DEBUG) {
        logger.debug(error.stack || '');
      }
    } else {
      logger.error('An unknown error occurred');
    }
    process.exit(1);
  }
}

