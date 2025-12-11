import inquirer from 'inquirer';
import chalk from 'chalk';

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
  router: '📦',
  vite: '📦',
  webpack: '📦',
  parcel: '📦',
  rollup: '📦',
  esbuild: '📦'
};

export async function askQuestions() {
  // First question: Application type
  const templateAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: chalk.cyan.bold('\nChoose what kind of application you want to build:'),
      choices: [
        { name: '📊 Dashboard', value: 'dashboard' },
        { name: '🌐 Website', value: 'landing' },
        { name: '📝 Different (Plain)', value: 'empty' }
      ]
    }
  ]);

  // Second question: Bundler
  const bundlerAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'bundler',
      message: chalk.cyan.bold('\nChoose a bundler:'),
      choices: [
        { 
          name: `${logos.vite} Vite`, 
          value: 'vite',
          short: 'Vite'
        },
        { 
          name: `${logos.webpack} Webpack`, 
          value: 'webpack',
          short: 'Webpack'
        },
        { 
          name: `${logos.parcel} Parcel`, 
          value: 'parcel',
          short: 'Parcel'
        },
        { 
          name: `${logos.rollup} Rollup`, 
          value: 'rollup',
          short: 'Rollup'
        },
        { 
          name: `${logos.esbuild} esbuild`, 
          value: 'esbuild',
          short: 'esbuild'
        }
      ],
      default: 'vite'
    }
  ]);

  // Third question: CSS Framework
  const cssAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'cssFramework',
      message: chalk.cyan.bold('\nChoose the CSS Framework:'),
      choices: [
        { 
          name: `${logos.tailwind} Tailwind ${chalk.gray('(Recommended)')}`, 
          value: 'tailwind',
          short: 'Tailwind'
        },
        { 
          name: `${logos.sass} Sass`, 
          value: 'sass',
          short: 'Sass'
        },
        { 
          name: `${logos.css} CSS`, 
          value: 'css',
          short: 'CSS'
        }
      ],
      default: 'tailwind'
    }
  ]);

  // Fourth question: Component Library (conditional based on CSS framework)
  const componentChoices = [
    { 
      name: `${logos.mui} Material UI`, 
      value: 'mui',
      short: 'Material UI'
    },
    { 
      name: `${logos.antd} AntDesign`, 
      value: 'antd',
      short: 'AntDesign'
    }
  ];

  // Only add Shadcn if Tailwind is selected
  if (cssAnswer.cssFramework === 'tailwind') {
    componentChoices.push({
      name: `${logos.shadcn} Shadcn`,
      value: 'shadcn',
      short: 'Shadcn'
    });
  }

  componentChoices.push({
    name: `${logos.none} No library`,
    value: 'none',
    short: 'No library'
  });

  const componentAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'componentLibrary',
      message: chalk.cyan.bold('\nChoose component library:'),
      choices: componentChoices
    }
  ]);

  // Fifth question: Redux (with Thunk)
  const reduxAnswer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useRedux',
      message: chalk.cyan.bold('\nDo you want to use Redux with Redux Thunk for state management?'),
      default: false
    }
  ]);

  // Sixth question: TanStack Query
  const reactQueryAnswer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useReactQuery',
      message: chalk.cyan.bold('\nDo you want to use TanStack Query for data fetching?'),
      default: false
    }
  ]);

  // Seventh question: Logger (loglevel)
  const loggerAnswer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useLogger',
      message: chalk.cyan.bold('\nDo you want to use loglevel for logging?'),
      default: false
    }
  ]);

  // Eighth question: Routing type
  const routingAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'routingType',
      message: chalk.cyan.bold('\nChoose routing approach:'),
      choices: [
        { 
          name: `${logos.router} React Router v6 ${chalk.gray('(Manual Routes)')}`, 
          value: 'v6',
          short: 'React Router v6'
        },
        { 
          name: `${logos.router} React Router v7+ ${chalk.gray('(File-based Routing)')}`, 
          value: 'v7',
          short: 'React Router v7+'
        }
      ],
      default: 'v6'
    }
  ]);

  // Combine all answers
  return {
    ...templateAnswer,
    ...bundlerAnswer,
    ...cssAnswer,
    ...componentAnswer,
    ...reduxAnswer,
    ...reactQueryAnswer,
    ...loggerAnswer,
    ...routingAnswer
  };
  
}