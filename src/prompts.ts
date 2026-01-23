import inquirer from 'inquirer';
import chalk from 'chalk';
import type { ProjectAnswers } from './types/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads the commands configuration
 * Tries multiple paths to handle both development and production builds
 */
function loadConfig() {
  // Try multiple possible locations
  const possiblePaths = [
    path.join(__dirname, 'generator', 'commands.config.json'), // Production: dist/generator/commands.config.json
    path.join(__dirname, '..', 'src', 'generator', 'commands.config.json'), // Development fallback
    path.join(__dirname, '..', '..', 'src', 'generator', 'commands.config.json'), // Alternative fallback
  ];

  for (const configPath of possiblePaths) {
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(configContent);
    }
  }

  throw new Error(
    `Could not find commands.config.json. Tried:\n${possiblePaths.join('\n')}`
  );
}

/**
 * Interactive prompts to gather project configuration from the user
 * Now JSON-driven - questions are generated from commands.config.json
 * @returns Project configuration answers
 */
export async function askQuestions(): Promise<ProjectAnswers> {
  try {
    const config = await loadConfig();
    const answers: any = {};

    // Question 1: Framework
    const frameworkQuestion = {
      type: 'list',
      name: 'framework',
      message: chalk.cyan.bold(`\n${config.questions.framework.message}`),
      choices: Object.values(config.frameworks).map((fw: any) => ({
        name: fw.label,
        value: fw.value,
        short: fw.label
      }))
    };

    const frameworkAnswer = await inquirer.prompt([frameworkQuestion]);
    answers.framework = frameworkAnswer.framework;

    const frameworkConfig = config.frameworks[answers.framework];

    // Question 2: Bundler (if framework requires it)
    if (frameworkConfig && frameworkConfig.requiresBundler) {
      const bundlerQuestion = {
        type: 'list',
        name: 'bundler',
        message: chalk.cyan.bold(`\n${config.questions.bundler.message}`),
        choices: Object.values(frameworkConfig.bundlers).map((b: any) => ({
          name: b.label,
          value: b.value,
          short: b.label
        }))
      };

      const bundlerAnswer = await inquirer.prompt([bundlerQuestion]);
      // Extract just the bundler part (e.g., "react-vite" -> "vite")
      const bundlerValue = bundlerAnswer.bundler; // e.g., "react-vite" or "react-webpack"
      const bundlerParts = bundlerValue.split('-');
      answers.bundler = bundlerParts[bundlerParts.length - 1] as 'vite' | 'webpack'; // Extract "vite" or "webpack"
      answers.frameworkValue = bundlerValue; // Keep full value for framework identification
    } else if (answers.framework === 'nextjs') {
      answers.frameworkValue = 'nextjs';
    }

    // Determine the effective framework value for filtering
    const effectiveFramework = answers.frameworkValue || answers.framework;

    // Question 3: CSS Library
    const cssChoices = Object.values(config.css)
      .filter((cssOption: any) => {
        // Filter based on requirements
        if (cssOption.requires && cssOption.requires.length > 0) {
          return cssOption.requires.every((req: any) => {
            if (req.framework) {
              return req.framework.includes(effectiveFramework) || 
                     req.framework.includes(answers.framework);
            }
            return true;
          });
        }
        return true;
      })
      .map((cssOption: any) => ({
        name: cssOption.label,
        value: cssOption.value,
        short: cssOption.label
      }));

    const cssAnswer = await inquirer.prompt([{
      type: 'list',
      name: 'css',
      message: chalk.cyan.bold(`\n${config.questions.css.message}`),
      choices: cssChoices
    }]);
    answers.css = cssAnswer.css;
    answers.cssFramework = cssAnswer.css; // For backward compatibility

    // Question 4: Component Library (filtered based on CSS and framework)
    const componentChoices = Object.values(config.components)
      .filter((compOption: any) => {
        // Filter based on requirements
        if (compOption.requires && compOption.requires.length > 0) {
          return compOption.requires.every((req: any) => {
            if (req.css) {
              return req.css.includes(answers.css);
            }
            if (req.framework) {
              const frameworkMatch = req.framework.includes(effectiveFramework) || 
                                     req.framework.includes(answers.framework);
              return frameworkMatch;
            }
            return true;
          });
        }
        return true;
      })
      .map((compOption: any) => ({
        name: compOption.label,
        value: compOption.value,
        short: compOption.label
      }));

    const componentAnswer = await inquirer.prompt([{
      type: 'list',
      name: 'components',
      message: chalk.cyan.bold(`\n${config.questions.components.message}`),
      choices: componentChoices
    }]);
    answers.components = componentAnswer.components;
    answers.componentLibrary = componentAnswer.components; // For backward compatibility

    // Question 5: State Management (only for React/Next.js)
    let stateManagement = 'plain';
    if (answers.framework === 'react' || answers.framework === 'nextjs') {
      const stateQuestion = {
        type: 'confirm',
        name: 'needsRedux',
        message: chalk.cyan.bold(`\n${config.questions.state.message}`),
        default: false
      };

      const stateAnswer = await inquirer.prompt([stateQuestion]);
      stateManagement = stateAnswer.needsRedux ? 'redux' : 'plain';
    }
    answers.stateManagement = stateManagement;
    answers.state = stateManagement === 'redux' ? 'redux' : 'plain';

    // Question 6: OIDC (Yes/No)
    const authQuestion = {
      type: 'confirm',
      name: 'needsOIDC',
      message: chalk.cyan.bold(`\n${config.questions.auth.message}`),
      default: false
    };

    const authAnswer = await inquirer.prompt([authQuestion]);
    answers.auth = authAnswer.needsOIDC ? 'oidc' : 'none';

    // Question 7: Template
    const templateChoices = Object.values(config.templates).map((t: any) => ({
      name: t.label,
      value: t.value,
      short: t.label
    }));

    const templateAnswer = await inquirer.prompt([{
      type: 'list',
      name: 'template',
      message: chalk.cyan.bold(`\n${config.questions.template.message}`),
      choices: templateChoices
    }]);
    answers.template = templateAnswer.template;

    // Return normalized answers matching ProjectAnswers type
    return {
      framework: answers.framework,
      bundler: answers.bundler,
      cssFramework: answers.cssFramework || answers.css,
      componentLibrary: answers.componentLibrary || answers.components,
      stateManagement: answers.stateManagement,
      auth: answers.auth,
      template: answers.template
    } as ProjectAnswers;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to collect user input: ${error.message}`);
    }
    throw error;
  }
}
