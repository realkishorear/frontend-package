import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads the commands configuration from JSON file
 * Tries multiple paths to handle both development and production builds
 * @returns {Object} The commands configuration
 */
function loadConfig() {
  // Try multiple possible locations
  const possiblePaths = [
    path.join(__dirname, 'commands.config.json'), // Production: dist/generator/commands.config.json
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
 * Validates a requirement against the current answers
 * @param {Object} requirement - The requirement object (e.g., { framework: ["react-vite", "nextjs"] })
 * @param {Object} answers - The user's answers
 * @returns {boolean} True if requirement is met
 */
function validateRequirement(requirement, answers) {
  for (const [key, value] of Object.entries(requirement)) {
    if (key === 'framework') {
      const frameworkValue = answers.frameworkValue || answers.framework;
      // Check if framework value matches (e.g., "react-vite" or just "react")
      const matches = value.some(v => {
        // Check exact match
        if (v === frameworkValue || v === answers.framework) return true;
        // Check if framework value starts with the requirement (e.g., "react-vite" starts with "react")
        if (frameworkValue && frameworkValue.startsWith(v + '-')) return true;
        if (answers.framework === v) return true;
        return false;
      });
      if (!matches) {
        return false;
      }
    } else if (key === 'css') {
      const cssValue = answers.css || answers.cssFramework;
      if (!value.includes(cssValue)) {
        return false;
      }
    } else if (key === 'components') {
      const componentsValue = answers.components || answers.componentLibrary;
      if (!value.includes(componentsValue)) {
        return false;
      }
    } else if (key === 'state') {
      const stateValue = answers.state || answers.stateManagement;
      if (stateValue && stateValue !== 'plain' && !value.includes(stateValue)) {
        return false;
      }
      if ((!stateValue || stateValue === 'plain') && value.length > 0) {
        return false;
      }
    } else if (key === 'auth') {
      if (answers.auth && answers.auth !== 'none' && !value.includes(answers.auth)) {
        return false;
      }
      if ((!answers.auth || answers.auth === 'none') && value.length > 0) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Validates all requirements for a feature
 * @param {Array} requires - Array of requirement objects
 * @param {Object} answers - The user's answers
 * @returns {boolean} True if all requirements are met
 */
function validateRequirements(requires, answers) {
  if (!requires || requires.length === 0) {
    return true;
  }

  // All requirements must be satisfied (AND logic)
  return requires.every(requirement => validateRequirement(requirement, answers));
}

/**
 * Validates conflicts for a feature
 * @param {Array} conflicts - Array of conflict objects
 * @param {Object} answers - The user's answers
 * @returns {boolean} True if no conflicts exist
 */
function validateConflicts(conflicts, answers) {
  if (!conflicts || conflicts.length === 0) {
    return true;
  }

  // No conflicts should exist (AND logic - all conflicts must be false)
  return conflicts.every(conflict => {
    for (const [key, value] of Object.entries(conflict)) {
      if (key === 'framework' && value.includes(answers.framework)) {
        return false;
      }
      if (key === 'css' && value.includes(answers.css)) {
        return false;
      }
      if (key === 'components' && value.includes(answers.components)) {
        return false;
      }
      if (key === 'state' && answers.state && value.includes(answers.state)) {
        return false;
      }
      if (key === 'auth' && answers.auth && value.includes(answers.auth)) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Checks if a feature is valid for the given answers
 * @param {Object} featureConfig - The feature configuration
 * @param {Object} answers - The user's answers
 * @returns {boolean} True if feature is valid
 */
function isFeatureValid(featureConfig, answers) {
  if (!featureConfig) {
    return false;
  }

  const requirementsMet = validateRequirements(featureConfig.requires, answers);
  const noConflicts = validateConflicts(featureConfig.conflicts, answers);

  return requirementsMet && noConflicts;
}

/**
 * Gets commands for a feature
 * @param {Object} featureConfig - The feature configuration
 * @returns {Array<string>} Array of commands
 */
function getFeatureCommands(featureConfig) {
  if (!featureConfig) {
    return [];
  }

  // Support both single 'command' and array 'commands'
  if (featureConfig.command) {
    return [featureConfig.command];
  }
  if (featureConfig.commands && Array.isArray(featureConfig.commands)) {
    return featureConfig.commands;
  }

  return [];
}

/**
 * Builds an ordered array of commands based on config and answers
 * @param {Object} config - The commands configuration (optional, will load if not provided)
 * @param {Object} answers - The user's answers object
 * @returns {Array<string>} Ordered array of command strings
 */
export function buildCommands(config = null, answers) {
  // Load config if not provided
  const commandsConfig = config || loadConfig();

  // Validate answers object
  if (!answers || typeof answers !== 'object') {
    throw new Error('Answers must be a valid object');
  }

  if (!answers.framework) {
    throw new Error('Framework is required in answers');
  }

  const commands = [];

  // 1. Framework command (always first)
  // Handle new structure where framework can have bundlers
  let frameworkConfig = null;
  let frameworkValue = answers.frameworkValue || answers.framework;
  
  // Check if framework has bundlers (React/Angular structure)
  const frameworkBase = commandsConfig.frameworks[answers.framework];
  if (frameworkBase && frameworkBase.bundlers) {
    // Framework requires bundler selection - find the bundler config
    for (const [bundlerKey, bundlerConfig] of Object.entries(frameworkBase.bundlers)) {
      if (bundlerConfig.value === frameworkValue) {
        frameworkConfig = bundlerConfig;
        break;
      }
    }
  } else if (frameworkBase) {
    // Direct framework (Next.js)
    frameworkConfig = frameworkBase;
  }

  if (!frameworkConfig) {
    throw new Error(`Invalid framework: ${answers.framework}${frameworkValue ? ` with bundler ${frameworkValue}` : ''}`);
  }

  // Update answers for validation - use frameworkValue for requirement checks
  const validationAnswers = {
    ...answers,
    framework: frameworkValue || answers.framework
  };

  if (isFeatureValid(frameworkConfig, validationAnswers)) {
    const frameworkCommands = getFeatureCommands(frameworkConfig);
    commands.push(...frameworkCommands);
  } else {
    throw new Error(`Framework ${answers.framework} is not valid with current selections`);
  }

  // 2. CSS commands
  if (answers.css || answers.cssFramework) {
    const cssValue = answers.css || answers.cssFramework;
    const cssConfig = commandsConfig.css[cssValue];
    if (cssConfig && isFeatureValid(cssConfig, validationAnswers)) {
      const cssCommands = getFeatureCommands(cssConfig);
      commands.push(...cssCommands);
    }
  }

  // 3. Component library commands
  if (answers.components || answers.componentLibrary) {
    const componentsValue = answers.components || answers.componentLibrary;
    const componentsConfig = commandsConfig.components[componentsValue];
    if (componentsConfig && isFeatureValid(componentsConfig, validationAnswers)) {
      const componentsCommands = getFeatureCommands(componentsConfig);
      commands.push(...componentsCommands);
    }
  }

  // 4. State management commands
  if (answers.state || answers.stateManagement) {
    const stateValue = answers.state || answers.stateManagement;
    if (stateValue && stateValue !== 'plain') {
      const stateConfig = commandsConfig.state[stateValue];
      if (stateConfig && isFeatureValid(stateConfig, validationAnswers)) {
        const stateCommands = getFeatureCommands(stateConfig);
        commands.push(...stateCommands);
      }
    }
  }

  // 5. Auth commands
  if (answers.auth && answers.auth !== 'none') {
    const authConfig = commandsConfig.auth[answers.auth];
    if (authConfig && isFeatureValid(authConfig, validationAnswers)) {
      const authCommands = getFeatureCommands(authConfig);
      commands.push(...authCommands);
    }
  }

  return commands;
}

/**
 * Validates answers against the config without generating commands
 * @param {Object} config - The commands configuration (optional)
 * @param {Object} answers - The user's answers object
 * @returns {Object} Validation result with isValid and errors array
 */
export function validateAnswers(config = null, answers) {
  const commandsConfig = config || loadConfig();
  const errors = [];

  // Validate framework
  if (!answers.framework) {
    errors.push('Framework is required');
  } else if (!commandsConfig.frameworks[answers.framework]) {
    errors.push(`Invalid framework: ${answers.framework}`);
  }

  // Validate CSS
  if (answers.css && !commandsConfig.css[answers.css]) {
    errors.push(`Invalid CSS option: ${answers.css}`);
  }

  // Validate components
  if (answers.components && !commandsConfig.components[answers.components]) {
    errors.push(`Invalid component library: ${answers.components}`);
  } else if (answers.components) {
    const componentsConfig = commandsConfig.components[answers.components];
    if (!isFeatureValid(componentsConfig, answers)) {
      errors.push(`Component library ${answers.components} is not compatible with current selections`);
    }
  }

  // Validate state
  if (answers.state && !commandsConfig.state[answers.state]) {
    errors.push(`Invalid state management: ${answers.state}`);
  } else if (answers.state) {
    const stateConfig = commandsConfig.state[answers.state];
    if (!isFeatureValid(stateConfig, answers)) {
      errors.push(`State management ${answers.state} is not compatible with current selections`);
    }
  }

  // Validate auth
  if (answers.auth && !commandsConfig.auth[answers.auth]) {
    errors.push(`Invalid auth option: ${answers.auth}`);
  } else if (answers.auth) {
    const authConfig = commandsConfig.auth[answers.auth];
    if (!isFeatureValid(authConfig, answers)) {
      errors.push(`Auth option ${answers.auth} is not compatible with current selections`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
