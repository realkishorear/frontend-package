import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads the commands configuration from JSON file
 * @returns {Object} The commands configuration
 */
function loadConfig() {
  const configPath = path.join(__dirname, 'commands.config.json');
  const configContent = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(configContent);
}

/**
 * Checks if a condition is met based on current answers
 * @param {Object} condition - Condition object (e.g., { framework: ["react", "nextjs"] })
 * @param {Object} answers - Current answers
 * @returns {boolean} True if condition is met
 */
function checkCondition(condition, answers) {
  for (const [key, value] of Object.entries(condition)) {
    if (key === 'framework') {
      const currentFramework = answers.framework || answers.frameworkValue;
      if (!value.includes(currentFramework)) {
        return false;
      }
    } else if (key === 'css') {
      if (!value.includes(answers.css)) {
        return false;
      }
    } else if (key === 'components') {
      if (!value.includes(answers.components)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Filters choices based on requirements
 * @param {Object} section - Section from config (e.g., css, components)
 * @param {Object} answers - Current answers
 * @returns {Array} Filtered choices
 */
function filterChoices(section, answers) {
  const choices = [];
  
  for (const [key, config] of Object.entries(section)) {
    // Check if this option is valid for current answers
    if (config.requires && config.requires.length > 0) {
      const allRequirementsMet = config.requires.every(requirement => 
        checkCondition(requirement, answers)
      );
      if (!allRequirementsMet) {
        continue; // Skip this option
      }
    }
    
    // Add to choices
    choices.push({
      name: config.label || key,
      value: config.value || key,
      short: config.label || key
    });
  }
  
  return choices;
}

/**
 * Builds framework question
 * @param {Object} config - Full config
 * @returns {Object} Inquirer question object
 */
function buildFrameworkQuestion(config) {
  const frameworks = Object.values(config.frameworks).map(fw => ({
    name: fw.label,
    value: fw.value,
    short: fw.label
  }));
  
  return {
    type: 'list',
    name: 'framework',
    message: chalk.cyan.bold(`\n${config.questions.framework.message}`),
    choices: frameworks
  };
}

/**
 * Builds bundler question for React/Angular
 * @param {Object} config - Full config
 * @param {string} framework - Selected framework
 * @returns {Object|null} Inquirer question object or null
 */
function buildBundlerQuestion(config, framework) {
  const frameworkConfig = config.frameworks[framework];
  if (!frameworkConfig || !frameworkConfig.requiresBundler) {
    return null;
  }
  
  const bundlers = Object.values(frameworkConfig.bundlers).map(b => ({
    name: b.label,
    value: b.value,
    short: b.label
  }));
  
  return {
    type: 'list',
    name: 'bundler',
    message: chalk.cyan.bold(`\n${config.questions.bundler.message}`),
    choices: bundlers
  };
}

/**
 * Builds CSS question
 * @param {Object} config - Full config
 * @param {Object} answers - Current answers
 * @returns {Object} Inquirer question object
 */
function buildCSSQuestion(config, answers) {
  const choices = filterChoices(config.css, answers);
  
  return {
    type: 'list',
    name: 'css',
    message: chalk.cyan.bold(`\n${config.questions.css.message}`),
    choices: choices
  };
}

/**
 * Builds component library question
 * @param {Object} config - Full config
 * @param {Object} answers - Current answers
 * @returns {Object} Inquirer question object
 */
function buildComponentsQuestion(config, answers) {
  const choices = filterChoices(config.components, answers);
  
  return {
    type: 'list',
    name: 'components',
    message: chalk.cyan.bold(`\n${config.questions.components.message}`),
    choices: choices
  };
}

/**
 * Builds state management question (only for React/Next.js)
 * @param {Object} config - Full config
 * @param {Object} answers - Current answers
 * @returns {Object|null} Inquirer question object or null
 */
function buildStateQuestion(config, answers) {
  const framework = answers.framework || answers.frameworkValue;
  const questionConfig = config.questions.state;
  
  if (questionConfig.conditional && questionConfig.conditional.showIf) {
    const condition = questionConfig.conditional.showIf;
    if (condition.framework && !condition.framework.includes(framework)) {
      return null; // Don't show this question
    }
  }
  
  return {
    type: questionConfig.type,
    name: 'state',
    message: chalk.cyan.bold(`\n${questionConfig.message}`),
    default: questionConfig.default || false
  };
}

/**
 * Builds auth question
 * @param {Object} config - Full config
 * @returns {Object} Inquirer question object
 */
function buildAuthQuestion(config) {
  const questionConfig = config.questions.auth;
  
  return {
    type: questionConfig.type,
    name: 'auth',
    message: chalk.cyan.bold(`\n${questionConfig.message}`),
    default: questionConfig.default || false
  };
}

/**
 * Builds template question
 * @param {Object} config - Full config
 * @returns {Object} Inquirer question object
 */
function buildTemplateQuestion(config) {
  const templates = Object.values(config.templates).map(t => ({
    name: t.label,
    value: t.value,
    short: t.label
  }));
  
  return {
    type: 'list',
    name: 'template',
    message: chalk.cyan.bold(`\n${config.questions.template.message}`),
    choices: templates
  };
}

/**
 * Builds all questions based on config and current answers
 * @param {Object} config - Full config (optional, will load if not provided)
 * @param {Object} currentAnswers - Current answers (for conditional questions)
 * @returns {Array} Array of inquirer question objects
 */
export function buildQuestions(config = null, currentAnswers = {}) {
  const commandsConfig = config || loadConfig();
  const questions = [];
  
  // 1. Framework question (always first)
  questions.push(buildFrameworkQuestion(commandsConfig));
  
  // 2. Bundler question (if framework requires it)
  const framework = currentAnswers.framework || 'react'; // Default for building
  const bundlerQuestion = buildBundlerQuestion(commandsConfig, framework);
  if (bundlerQuestion) {
    questions.push(bundlerQuestion);
  }
  
  return questions;
}

/**
 * Builds questions dynamically based on previous answers
 * This is used during the interactive flow
 * @param {Object} config - Full config (optional)
 * @param {Object} answers - Current answers
 * @returns {Array} Array of inquirer question objects for next step
 */
export function buildNextQuestions(config = null, answers) {
  const commandsConfig = config || loadConfig();
  const questions = [];
  
  // Determine framework value (could be from bundler selection)
  const frameworkValue = answers.frameworkValue || answers.framework;
  const framework = answers.framework;
  
  // If framework requires bundler and we don't have it yet
  const frameworkConfig = commandsConfig.frameworks[framework];
  if (frameworkConfig && frameworkConfig.requiresBundler && !answers.bundler) {
    const bundlerQuestion = buildBundlerQuestion(commandsConfig, framework);
    if (bundlerQuestion) {
      return [bundlerQuestion];
    }
  }
  
  // CSS question
  const cssAnswers = { ...answers, framework: frameworkValue || framework };
  questions.push(buildCSSQuestion(commandsConfig, cssAnswers));
  
  // Components question (depends on CSS)
  const componentAnswers = { ...cssAnswers, css: answers.css };
  questions.push(buildComponentsQuestion(commandsConfig, componentAnswers));
  
  // State question (only for React/Next.js)
  const stateQuestion = buildStateQuestion(commandsConfig, {
    ...answers,
    framework: frameworkValue || framework
  });
  if (stateQuestion) {
    questions.push(stateQuestion);
  }
  
  // Auth question
  questions.push(buildAuthQuestion(commandsConfig));
  
  // Template question
  questions.push(buildTemplateQuestion(commandsConfig));
  
  return questions;
}

/**
 * Normalizes answers to match command builder format
 * @param {Object} answers - Raw answers from prompts
 * @returns {Object} Normalized answers
 */
export function normalizeAnswers(answers) {
  const normalized = { ...answers };
  
  // If framework has bundler, extract the framework+bundler combination
  if (answers.framework && answers.bundler) {
    normalized.frameworkValue = answers.bundler; // e.g., "react-vite"
    normalized.framework = answers.framework; // e.g., "react"
  } else if (answers.framework === 'nextjs') {
    normalized.frameworkValue = 'nextjs';
    normalized.framework = 'nextjs';
  }
  
  // Normalize state (convert boolean to value)
  if (answers.state === true) {
    normalized.state = 'redux';
  } else if (answers.state === false || !answers.state) {
    normalized.state = 'plain';
  }
  
  // Normalize auth (convert boolean to value)
  if (answers.auth === true) {
    normalized.auth = 'oidc';
  } else if (answers.auth === false || !answers.auth) {
    normalized.auth = 'none';
  }
  
  return normalized;
}
