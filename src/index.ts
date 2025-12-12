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
    const targetPath =
      projectName === '.' ? process.cwd() : path.resolve(process.cwd(), projectName);

    // Validate target path
    await validateTargetPath(targetPath, projectName);

    // Welcome banner
    console.log(chalk.cyan.bold('\n╔═══════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║                                                       ║'));
    console.log(chalk.cyan.bold('║     Welcome to JGD Frontend Template Engine           ║'));
    console.log(chalk.cyan.bold('║                                                       ║'));
    console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════════════╝\n'));

    // Ask interactive questions
    logger.info('Starting interactive setup...\n');
    const answers = await askQuestions();

    // Validate answers
    validateAnswers(answers);

    logger.info('\n📁 Generating project...\n');

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

