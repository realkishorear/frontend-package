import inquirer from 'inquirer';
import chalk from 'chalk';
import type { ProjectAnswers } from './types/index.js';

// Logo/Icon mappings
const logos = {
  tailwind: '📦',
  sass: '📦',
  css: '📦',
  mui: '📦',
  antd: '📦',
  shadcn: '📦',
  none: '📦',
  redux: '📦',
  reactQuery: '📦',
  logger: '📦',
  animation: '📦',
  router: '📦',
  vite: '⚡',
  webpack: '📦',
} as const;

/**
 * Interactive prompts to gather project configuration from the user
 * @returns Project configuration answers
 */
export async function askQuestions(): Promise<ProjectAnswers> {
  try {
    // First question: Application type
    const templateAnswer = await inquirer.prompt<{ template: ProjectAnswers['template'] }>([
      {
        type: 'list',
        name: 'template',
        message: chalk.cyan.bold('\nChoose what kind of application you want to build:'),
        choices: [
          { name: '📊 Dashboard', value: 'dashboard' },
          { name: '🌐 Website', value: 'landing' },
          { name: '📝 Different (Plain)', value: 'empty' },
        ],
      },
    ]);

    // Second question: Bundler
    const bundlerAnswer = await inquirer.prompt<{ bundler: ProjectAnswers['bundler'] }>([
      {
        type: 'list',
        name: 'bundler',
        message: chalk.cyan.bold('\nChoose a bundler:'),
        choices: [
          {
            name: `${logos.vite} Vite ${chalk.gray('(Fast & Modern)')}`,
            value: 'vite',
            short: 'Vite',
          },
          {
            name: `${logos.webpack} Webpack ${chalk.gray('(Mature & Flexible)')}`,
            value: 'webpack',
            short: 'Webpack',
          },
        ],
        default: 'vite',
      },
    ]);

    // Third question: CSS Framework
    const cssAnswer = await inquirer.prompt<{ cssFramework: ProjectAnswers['cssFramework'] }>([
      {
        type: 'list',
        name: 'cssFramework',
        message: chalk.cyan.bold('\nChoose the CSS Framework:'),
        choices: [
          {
            name: `${logos.tailwind} Tailwind ${chalk.gray('(Recommended)')}`,
            value: 'tailwind',
            short: 'Tailwind',
          },
          {
            name: `${logos.sass} Sass`,
            value: 'sass',
            short: 'Sass',
          },
          {
            name: `${logos.css} CSS`,
            value: 'css',
            short: 'CSS',
          },
        ],
        default: 'tailwind',
      },
    ]);

    // Fourth question: Component Library (conditional based on CSS framework)
    const componentChoices: Array<{ name: string; value: ProjectAnswers['componentLibrary']; short: string }> = [
      {
        name: `${logos.mui} Material UI`,
        value: 'mui',
        short: 'Material UI',
      },
      {
        name: `${logos.antd} AntDesign`,
        value: 'antd',
        short: 'AntDesign',
      },
    ];

    // Only add Shadcn if Tailwind is selected
    if (cssAnswer.cssFramework === 'tailwind') {
      componentChoices.push({
        name: `${logos.shadcn} Shadcn/ui ${chalk.gray('(Requires Tailwind)')}`,
        value: 'shadcn',
        short: 'Shadcn',
      });
    }

    componentChoices.push({
      name: `${logos.none} No library`,
      value: 'none',
      short: 'No library',
    });

    const componentAnswer = await inquirer.prompt<{ componentLibrary: ProjectAnswers['componentLibrary'] }>([
      {
        type: 'list',
        name: 'componentLibrary',
        message: chalk.cyan.bold('\nChoose component library:'),
        choices: componentChoices,
      },
    ]);

    // Fifth question: Redux (with Thunk)
    const reduxAnswer = await inquirer.prompt<{ useRedux: boolean }>([
      {
        type: 'confirm',
        name: 'useRedux',
        message: chalk.cyan.bold('\nDo you want to use Redux with Redux Thunk for state management?'),
        default: false,
      },
    ]);

    // Sixth question: TanStack Query
    const reactQueryAnswer = await inquirer.prompt<{ useReactQuery: boolean }>([
      {
        type: 'confirm',
        name: 'useReactQuery',
        message: chalk.cyan.bold('\nDo you want to use TanStack Query for data fetching?'),
        default: false,
      },
    ]);

    // Seventh question: Logger (loglevel)
    const loggerAnswer = await inquirer.prompt<{ useLogger: boolean }>([
      {
        type: 'confirm',
        name: 'useLogger',
        message: chalk.cyan.bold('\nDo you want to use loglevel for logging?'),
        default: false,
      },
    ]);

    // Eighth question: Animation Library (Framer Motion)
    const animationAnswer = await inquirer.prompt<{ useAnimation: boolean }>([
      {
        type: 'confirm',
        name: 'useAnimation',
        message: chalk.cyan.bold('\nDo you want to use Framer Motion for animations?'),
        default: false,
      },
    ]);

    // Ninth question: Routing type
    const routingAnswer = await inquirer.prompt<{ routingType: ProjectAnswers['routingType'] }>([
      {
        type: 'list',
        name: 'routingType',
        message: chalk.cyan.bold('\nChoose routing approach:'),
        choices: [
          {
            name: `${logos.router} React Router v6 ${chalk.gray('(Manual Routes)')}`,
            value: 'v6',
            short: 'React Router v6',
          },
          {
            name: `${logos.router} React Router v7+ ${chalk.gray('(File-based Routing)')} ${bundlerAnswer.bundler !== 'vite' ? chalk.red('(Requires Vite)') : ''}`,
            value: 'v7',
            short: 'React Router v7+',
            disabled: bundlerAnswer.bundler !== 'vite',
          },
        ],
        default: 'v6',
      },
    ]);

    // Combine all answers
    const answers: ProjectAnswers = {
      ...templateAnswer,
      ...bundlerAnswer,
      ...cssAnswer,
      ...componentAnswer,
      ...reduxAnswer,
      ...reactQueryAnswer,
      ...loggerAnswer,
      ...animationAnswer,
      ...routingAnswer,
    };

    return answers;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to collect user input: ${error.message}`);
    }
    throw error;
  }
}

