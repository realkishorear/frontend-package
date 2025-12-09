import inquirer from 'inquirer';

export async function askQuestions() {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'language',
      message: 'Select language:',
      choices: [
        { name: 'TypeScript', value: 'typescript' },
        { name: 'JavaScript', value: 'javascript' }
      ],
      default: 'typescript'
    },
    {
      type: 'list',
      name: 'template',
      message: 'Select a template:',
      choices: [
        { name: 'Dashboard', value: 'dashboard' },
        { name: 'website', value: 'landing' },
        { name: 'Nothing (Empty Starter)', value: 'empty' }
      ]
    },
    {
      type: 'confirm',
      name: 'tailwind',
      message: 'Add Tailwind CSS?',
      default: true
    },
    {
      type: 'list',
      name: 'componentLibrary',
      message: 'Select a component library:',
      choices: [
        { name: 'Material UI', value: 'mui' },
        { name: 'shadcn/ui (requires Tailwind CSS)', value: 'shadcn' },
        { name: 'Ant Design', value: 'antd' },
        { name: 'None', value: 'none' }
      ]
    }
  ]);

  // Automatically enable Tailwind CSS if shadcn/ui is selected
  if (answers.componentLibrary === 'shadcn' && !answers.tailwind) {
    answers.tailwind = true;
    console.log('\n⚠️  Note: Tailwind CSS has been automatically enabled (required for shadcn/ui)');
  }

  return answers;
}

