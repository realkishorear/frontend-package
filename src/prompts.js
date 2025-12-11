import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import terminalImage from 'terminal-image';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get icon paths from icons folder
const iconsDir = path.join(__dirname, '..', 'icons');

// Helper to check if icon file exists (synchronous)
const iconExists = (iconName) => {
  try {
    const iconPath = path.join(iconsDir, iconName);
    return fs.existsSync(iconPath);
  } catch {
    return false;
  }
};

// Icon file mappings - map option values to icon file names
const iconFiles = {
  tailwind: 'tailwind.jpg',
  sass: 'sass.png',
  css: 'css.jpg',
  mui: 'mui.png',
  antd: 'antd.png'
};

// Helper to display icon in terminal
const displayIcon = async (iconName) => {
  try {
    const iconPath = path.join(iconsDir, iconName);
    if (fs.existsSync(iconPath)) {
      const imageBuffer = fs.readFileSync(iconPath);
      const image = await terminalImage.buffer(imageBuffer, {
        width: '50%',
        height: '50%'
      });
      console.log(image);
      return true;
    }
  } catch (error) {
    // Silently fail if terminal doesn't support images
    return false;
  }
  return false;
};

// Helper to display icons for choices before prompt
const displayIconsForChoices = async (choices, iconFilesMap) => {
  const iconsToDisplay = [];
  
  for (const choice of choices) {
    const iconFile = iconFilesMap[choice.value];
    if (iconFile && iconExists(iconFile)) {
      iconsToDisplay.push({ value: choice.value, icon: iconFile, name: choice.name });
    }
  }
  
  if (iconsToDisplay.length > 0) {
    try {
      // Try to display icons in a compact way
      for (const item of iconsToDisplay) {
        try {
          const iconPath = path.join(iconsDir, item.icon);
          const imageBuffer = fs.readFileSync(iconPath);
          // Display smaller icons (15% size) to keep it compact
          const image = await terminalImage.buffer(imageBuffer, {
            width: '15%',
            height: '15%'
          });
          // Extract just the name without emoji for cleaner display
          const cleanName = item.name.replace(/[🖼️⚡💎🎨🐜✨🚫🔄🔍📝]/g, '').trim();
          console.log(chalk.cyan(`\n${cleanName}:`));
          console.log(image);
        } catch (error) {
          // Silently skip if image display fails for this specific icon
        }
      }
      if (iconsToDisplay.length > 0) {
        console.log('\n');
      }
    } catch (error) {
      // Terminal might not support images, silently continue
    }
  }
};

// Helper to get icon indicator - shows icon emoji if icon file exists
const getIconIndicator = (optionValue) => {
  const iconFile = iconFiles[optionValue];
  if (iconFile && iconExists(iconFile)) {
    // Icon file exists - use a visual indicator
    return '🖼️ '; // or we could use the actual icon name reference
  }
  // Fallback to emoji if no icon file
  const fallbackEmojis = {
    tailwind: '⚡',
    sass: '💎',
    css: '🎨',
    mui: '🎨',
    antd: '🐜',
    shadcn: '✨',
    none: '🚫',
    redux: '🔄',
    reactQuery: '🔍',
    logger: '📝'
  };
  return fallbackEmojis[optionValue] || '';
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

  // Second question: CSS Framework
  const cssChoices = [
    { 
      name: `${getIconIndicator('tailwind')} Tailwind ${chalk.gray('(Recommended)')}`, 
      value: 'tailwind',
      short: 'Tailwind'
    },
    { 
      name: `${getIconIndicator('sass')} Sass`, 
      value: 'sass',
      short: 'Sass'
    },
    { 
      name: `${getIconIndicator('css')} CSS`, 
      value: 'css',
      short: 'CSS'
    }
  ];
  
  // Display icons before showing the prompt
  await displayIconsForChoices(cssChoices, iconFiles);
  
  const cssAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'cssFramework',
      message: chalk.cyan.bold('\nChoose the CSS Framework:'),
      choices: cssChoices,
      default: 'tailwind'
    }
  ]);

  // Third question: Component Library (conditional based on CSS framework)
  const componentChoices = [
    { 
      name: `${getIconIndicator('mui')} Material UI`, 
      value: 'mui',
      short: 'Material UI'
    },
    { 
      name: `${getIconIndicator('antd')} AntDesign`, 
      value: 'antd',
      short: 'AntDesign'
    }
  ];

  // Only add Shadcn if Tailwind is selected
  if (cssAnswer.cssFramework === 'tailwind') {
    componentChoices.push({
      name: `${getIconIndicator('shadcn')} Shadcn`,
      value: 'shadcn',
      short: 'Shadcn'
    });
  }

  componentChoices.push({
    name: `${getIconIndicator('none')} No library`,
    value: 'none',
    short: 'No library'
  });

  // Display icons before showing the prompt
  await displayIconsForChoices(componentChoices, iconFiles);

  const componentAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'componentLibrary',
      message: chalk.cyan.bold('\nChoose component library:'),
      choices: componentChoices
    }
  ]);

  // Fourth question: Redux (with Thunk)
  const reduxAnswer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useRedux',
      message: chalk.cyan.bold('\nDo you want to use Redux with Redux Thunk for state management?'),
      default: false
    }
  ]);

  // Fifth question: React Query (TanStack Query)
  const reactQueryAnswer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useReactQuery',
      message: chalk.cyan.bold('\nDo you want to use React Query (TanStack Query) for data fetching?'),
      default: false
    }
  ]);

  // Sixth question: Logger (loglevel)
  const loggerAnswer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useLogger',
      message: chalk.cyan.bold('\nDo you want to use loglevel for logging?'),
      default: false
    }
  ]);

  // Combine all answers
  return {
    ...templateAnswer,
    ...cssAnswer,
    ...componentAnswer,
    ...reduxAnswer,
    ...reactQueryAnswer,
    ...loggerAnswer
  };
}

