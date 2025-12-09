import inquirer from 'inquirer';

export async function askQuestions() {
  const answers = await inquirer.prompt([
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
      type: 'list',
      name: 'cssFramework',
      message: 'Select CSS framework:',
      choices: [
        { name: 'CSS', value: 'css' },
        { name: 'SASS', value: 'sass' },
        { name: 'Tailwind', value: 'tailwind' }
      ],
      default: 'tailwind'
    },
    {
      type: 'list',
      name: 'componentLibrary',
      message: 'Select a component library:',
      choices: [
        { name: 'Material UI', value: 'mui' },
        { name: 'shadcn/ui', value: 'shadcn' },
        { name: 'Ant Design', value: 'antd' },
        { name: 'None', value: 'none' }
      ]
    }
  ]);

  return answers;
}

