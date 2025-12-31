import inquirer from 'inquirer';
import chalk from 'chalk';
import type { ProjectAnswers } from './types/index.js';

/**
 * Interactive prompts to gather project configuration from the user
 * Strictly follows prompt1.md requirements
 * @returns Project configuration answers
 */
export async function askQuestions(): Promise<ProjectAnswers> {
  try {
    // Question 1: Framework
    const frameworkAnswer = await inquirer.prompt<{ framework: ProjectAnswers['framework'] }>([
      {
        type: 'list',
        name: 'framework',
        message: chalk.cyan.bold('\nWhich framework you want to use to build the project:'),
        choices: [
          { name: '⚛️  React', value: 'react' },
          { name: '🅰️  Angular', value: 'angular' },
          { name: '▲ Next.js', value: 'nextjs' },
        ],
      },
    ]);

    // Handle Next.js flow: Template -> OIDC
    if (frameworkAnswer.framework === 'nextjs') {
      // Question 1: Template
      const templateAnswer = await inquirer.prompt<{ template: ProjectAnswers['template'] }>([
        {
          type: 'list',
          name: 'template',
          message: chalk.cyan.bold('\nWhat template the user want:'),
          choices: [
            { name: '📊 Dashboard', value: 'dashboard' },
            { name: '📝 Plain (Just hello world in center of page)', value: 'none' },
          ],
        },
      ]);

      // Question 2: OIDC
      const oidcAnswer = await inquirer.prompt<{ needsOIDC: boolean }>([
        {
          type: 'confirm',
          name: 'needsOIDC',
          message: chalk.cyan.bold('\nDo user need OIDC integration?'),
          default: false,
        },
      ]);

      // Return answers for Next.js
      return {
        ...frameworkAnswer,
        cssFramework: 'tailwind', // Default for Next.js
        componentLibrary: 'plain', // Default for Next.js
        stateManagement: 'plain', // Default for Next.js
        auth: oidcAnswer.needsOIDC ? 'oidc' : 'none',
        ...templateAnswer,
      };
    }

    // Handle Angular flow (Don't change as of now - keep existing behavior)
    if (frameworkAnswer.framework === 'angular') {
      // Question 2: CSS Library (Angular supports SCSS)
      const cssChoices: Array<{ name: string; value: ProjectAnswers['cssFramework']; short: string }> = [
        { name: '🎨 TailwindCSS', value: 'tailwind', short: 'TailwindCSS' },
        { name: '📦 Scss', value: 'scss', short: 'Scss' },
        { name: '💅 CSS', value: 'css', short: 'CSS' },
      ];

      const cssAnswer = await inquirer.prompt<{ cssFramework: ProjectAnswers['cssFramework'] }>([
        {
          type: 'list',
          name: 'cssFramework',
          message: chalk.cyan.bold('\nWhich CSS library user want to use:'),
          choices: cssChoices,
        },
      ]);

      // Question 3: Component Library (Angular)
      const componentChoices: Array<{ name: string; value: ProjectAnswers['componentLibrary']; short: string }> = [
        { name: '📦 Material UI', value: 'mui', short: 'Material UI' },
        { name: '📝 Plain', value: 'plain', short: 'Plain' },
      ];

      const componentAnswer = await inquirer.prompt<{ componentLibrary: ProjectAnswers['componentLibrary'] }>([
        {
          type: 'list',
          name: 'componentLibrary',
          message: chalk.cyan.bold('\nWhich component library user want to use:'),
          choices: componentChoices,
        },
      ]);

      // Question 4: State Management
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

      // Question 5: Template
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

      return {
        ...frameworkAnswer,
        ...cssAnswer,
        ...componentAnswer,
        stateManagement: stateManagementAnswer.stateManagement,
        auth: 'none', // Angular doesn't have OIDC option in prompt1.md
        ...templateAnswer,
      };
    }

    // Handle React flow: Bundler -> CSS -> Component Library (filtered by CSS) -> Redux -> OIDC -> Template
    // Question 1: Bundler
    const bundlerAnswer = await inquirer.prompt<{ bundler: ProjectAnswers['bundler'] }>([
      {
        type: 'list',
        name: 'bundler',
        message: chalk.cyan.bold('\nWhich bundler user want to use:'),
        choices: [
          { name: '📦 WebPack', value: 'webpack' },
          { name: '⚡ Vite', value: 'vite' },
        ],
      },
    ]);

    // Question 2: CSS Library
    const cssAnswer = await inquirer.prompt<{ cssFramework: ProjectAnswers['cssFramework'] }>([
      {
        type: 'list',
        name: 'cssFramework',
        message: chalk.cyan.bold('\nWhich CSS library user want to use:'),
        choices: [
          { name: '🎨 TailwindCSS', value: 'tailwind' },
          { name: '💅 CSS', value: 'css' },
        ],
      },
    ]);

    // Question 3: Component Library (filtered based on CSS library)
    // ShadCN only applicable with TailwindCSS
    const componentChoices: Array<{ name: string; value: ProjectAnswers['componentLibrary']; short: string }> = [];
    
    if (cssAnswer.cssFramework === 'tailwind') {
      // ShadCN is only applicable with TailwindCSS
      componentChoices.push({ name: '🎨 ShadCN', value: 'shadcn', short: 'ShadCN' });
    }
    
    // MaterialUI and AntDesign are applicable with both
    componentChoices.push({ name: '📦 MaterialUI', value: 'mui', short: 'MaterialUI' });
    componentChoices.push({ name: '🔷 AntDesign', value: 'antd', short: 'AntDesign' });
    componentChoices.push({ name: '📝 Plain', value: 'plain', short: 'Plain' });

    const componentAnswer = await inquirer.prompt<{ componentLibrary: ProjectAnswers['componentLibrary'] }>([
      {
        type: 'list',
        name: 'componentLibrary',
        message: chalk.cyan.bold('\nWhich component library user want to use:'),
        choices: componentChoices,
      },
    ]);

    // Question 4: Redux (Yes/No)
    const reduxAnswer = await inquirer.prompt<{ needsRedux: boolean }>([
      {
        type: 'confirm',
        name: 'needsRedux',
        message: chalk.cyan.bold('\nDo user need Redux?'),
        default: false,
      },
    ]);

    // Question 5: OIDC (Yes/No)
    const oidcAnswer = await inquirer.prompt<{ needsOIDC: boolean }>([
      {
        type: 'confirm',
        name: 'needsOIDC',
        message: chalk.cyan.bold('\nDo user need OIDC integration?'),
        default: false,
      },
    ]);

    // Question 6: Template
    const templateAnswer = await inquirer.prompt<{ template: ProjectAnswers['template'] }>([
      {
        type: 'list',
        name: 'template',
        message: chalk.cyan.bold('\nWhat template the user want:'),
        choices: [
          { name: '📊 Dashboard', value: 'dashboard' },
          { name: '📝 Plain', value: 'none' },
        ],
      },
    ]);

    // Combine all answers for React
    const answers: ProjectAnswers = {
      ...frameworkAnswer,
      ...bundlerAnswer,
      ...cssAnswer,
      ...componentAnswer,
      stateManagement: reduxAnswer.needsRedux ? 'redux' : 'plain',
      auth: oidcAnswer.needsOIDC ? 'oidc' : 'none',
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

