import inquirer from 'inquirer';
import chalk from 'chalk';
import type { ProjectAnswers } from './types/index.js';

/**
 * Interactive prompts to gather project configuration from the user
 * @returns Project configuration answers
 */
export async function askQuestions(): Promise<ProjectAnswers> {
  try {
    // Question 1: Framework
    const frameworkAnswer = await inquirer.prompt<{ framework: ProjectAnswers['framework'] }>([
      {
        type: 'list',
        name: 'framework',
        message: chalk.cyan.bold('\nWhich framework you want to use:'),
        choices: [
          { name: '⚛️  React', value: 'react' },
          { name: '🅰️  Angular', value: 'angular' },
          { name: '▲ Next.js', value: 'nextjs' },
        ],
      },
    ]);

    // If Next.js is selected, only ask about template
    if (frameworkAnswer.framework === 'nextjs') {
      const templateAnswer = await inquirer.prompt<{ template: ProjectAnswers['template'] }>([
        {
          type: 'list',
          name: 'template',
          message: chalk.cyan.bold('\nDo you want any Template:'),
          choices: [
            { name: '📊 Dashboard', value: 'dashboard' },
            { name: '❌ No Templates', value: 'none' },
          ],
        },
      ]);

      // Return minimal answers for Next.js
      return {
        ...frameworkAnswer,
        cssFramework: 'tailwind', // Default for Next.js
        componentLibrary: 'plain', // Default for Next.js
        stateManagement: 'plain', // Default for Next.js
        auth: 'none', // Default for Next.js
        ...templateAnswer,
      };
    }

    // Question 2: CSS Library
    const cssChoices: Array<{ name: string; value: ProjectAnswers['cssFramework']; short: string }> = [
      { name: '🎨 Tailwind', value: 'tailwind', short: 'Tailwind' },
      { name: '💅 CSS', value: 'css', short: 'CSS' },
    ];

    // Only show SCSS if Angular is chosen
    if (frameworkAnswer.framework === 'angular') {
      cssChoices.splice(1, 0, { name: '📦 Scss', value: 'scss', short: 'Scss' });
    }

    const cssAnswer = await inquirer.prompt<{ cssFramework: ProjectAnswers['cssFramework'] }>([
      {
        type: 'list',
        name: 'cssFramework',
        message: chalk.cyan.bold('\nWhich CSS library do you prefer:'),
        choices: cssChoices,
      },
    ]);

    // Question 3: Component Library
    const componentChoices: Array<{ name: string; value: ProjectAnswers['componentLibrary']; short: string }> = [
      { name: '📦 Material UI', value: 'mui', short: 'Material UI' },
    ];

    // Only show Shadcn and AntDesign if React is chosen
    if (frameworkAnswer.framework === 'react') {
      componentChoices.push({ name: '🎨 Shadcn', value: 'shadcn', short: 'Shadcn' });
      componentChoices.push({ name: '🔷 AntDesign', value: 'antd', short: 'AntDesign' });
    }

    componentChoices.push({ name: '📝 Plain', value: 'plain', short: 'Plain' });

    const componentAnswer = await inquirer.prompt<{ componentLibrary: ProjectAnswers['componentLibrary'] }>([
      {
        type: 'list',
        name: 'componentLibrary',
        message: chalk.cyan.bold('\nWhich component library you need to use:'),
        choices: componentChoices,
      },
    ]);

    // Question 4: Bundler (only for React)
    let bundlerAnswer: { bundler?: ProjectAnswers['bundler'] } = {};
    if (frameworkAnswer.framework === 'react') {
      bundlerAnswer = await inquirer.prompt<{ bundler: ProjectAnswers['bundler'] }>([
        {
          type: 'list',
          name: 'bundler',
          message: chalk.cyan.bold('\nWhich bundler you want to use:'),
          choices: [
            { name: '⚡ Vite', value: 'vite' },
            { name: '📦 Webpack', value: 'webpack' },
          ],
        },
      ]);
    }

    // Question 5: State Management
    const stateManagementAnswer = await inquirer.prompt<{ stateManagement: ProjectAnswers['stateManagement'] }>([
      {
        type: 'list',
        name: 'stateManagement',
        message: chalk.cyan.bold('\nDo you want to use state management:'),
        choices: [
          { name: '🔄 Redux', value: 'redux' },
          { name: '📝 Plain', value: 'plain' },
        ],
      },
    ]);

    // Question 6: OIDC/Auth (only for React)
    let authAnswer: { auth?: ProjectAnswers['auth'] } = {};
    if (frameworkAnswer.framework === 'react') {
      authAnswer = await inquirer.prompt<{ auth: ProjectAnswers['auth'] }>([
        {
          type: 'list',
          name: 'auth',
          message: chalk.cyan.bold('\nDo you want to use OIDC/Auth:'),
          choices: [
            { name: '🔐 OIDC', value: 'oidc' },
            { name: '❌ None', value: 'none' },
          ],
        },
      ]);
    } else {
      // Default to none for non-React frameworks
      authAnswer = { auth: 'none' };
    }

    // Question 7: Template
    const templateAnswer = await inquirer.prompt<{ template: ProjectAnswers['template'] }>([
      {
        type: 'list',
        name: 'template',
        message: chalk.cyan.bold('\nDo you want any Template:'),
        choices: [
          { name: '📊 Dashboard', value: 'dashboard' },
          { name: '❌ No Templates', value: 'none' },
        ],
      },
    ]);

    // Combine all answers
    const answers: ProjectAnswers = {
      ...frameworkAnswer,
      ...cssAnswer,
      ...componentAnswer,
      ...bundlerAnswer,
      ...stateManagementAnswer,
      ...authAnswer,
      ...templateAnswer,
    };

    return answers;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to collect user input: ${error.message}`);
    }
    throw error;
  }
}

