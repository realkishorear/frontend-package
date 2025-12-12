import { ValidationError } from './errors.js';
import path from 'path';
import fs from 'fs-extra';

export interface ProjectAnswers {
  template: string;
  bundler: string;
  cssFramework: string;
  componentLibrary: string;
  useRedux: boolean;
  useReactQuery: boolean;
  useLogger: boolean;
  useAnimation: boolean;
  routingType: string;
}

/**
 * Validates project answers
 */
export function validateAnswers(answers: Partial<ProjectAnswers>): asserts answers is ProjectAnswers {
  const required = ['template', 'bundler', 'cssFramework', 'componentLibrary', 'routingType'];
  const missing = required.filter((field) => !answers[field as keyof ProjectAnswers]);

  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      missing[0]
    );
  }

  // Validate template
  const validTemplates = ['dashboard', 'landing', 'empty'];
  if (!validTemplates.includes(answers.template!)) {
    throw new ValidationError(
      `Invalid template: ${answers.template}. Must be one of: ${validTemplates.join(', ')}`,
      'template'
    );
  }

  // Validate bundler
  const validBundlers = ['vite', 'webpack'];
  if (!validBundlers.includes(answers.bundler!)) {
    throw new ValidationError(
      `Invalid bundler: ${answers.bundler}. Must be one of: ${validBundlers.join(', ')}`,
      'bundler'
    );
  }

  // Validate CSS framework
  const validCssFrameworks = ['tailwind', 'sass', 'css'];
  if (!validCssFrameworks.includes(answers.cssFramework!)) {
    throw new ValidationError(
      `Invalid CSS framework: ${answers.cssFramework}. Must be one of: ${validCssFrameworks.join(', ')}`,
      'cssFramework'
    );
  }

  // Validate component library
  const validComponentLibraries = ['mui', 'antd', 'shadcn', 'none'];
  if (!validComponentLibraries.includes(answers.componentLibrary!)) {
    throw new ValidationError(
      `Invalid component library: ${answers.componentLibrary}. Must be one of: ${validComponentLibraries.join(', ')}`,
      'componentLibrary'
    );
  }

  // Validate routing type
  const validRoutingTypes = ['v6', 'v7'];
  if (!validRoutingTypes.includes(answers.routingType!)) {
    throw new ValidationError(
      `Invalid routing type: ${answers.routingType}. Must be one of: ${validRoutingTypes.join(', ')}`,
      'routingType'
    );
  }

  // Validate shadcn requires tailwind
  if (answers.componentLibrary === 'shadcn' && answers.cssFramework !== 'tailwind') {
    throw new ValidationError(
      'shadcn/ui requires Tailwind CSS. Please select Tailwind as your CSS framework.',
      'componentLibrary'
    );
  }

  // Validate React Router v7 requires Vite
  if (answers.routingType === 'v7' && answers.bundler !== 'vite') {
    throw new ValidationError(
      'React Router v7+ requires Vite as the bundler. Please select Vite.',
      'routingType'
    );
  }
}

/**
 * Validates that a target path is safe to use
 */
export async function validateTargetPath(targetPath: string, projectName: string): Promise<void> {
  if (projectName !== '.' && (await fs.pathExists(targetPath))) {
    throw new ValidationError(
      `Directory "${projectName}" already exists. Please choose a different name or remove the existing directory.`,
      'projectName'
    );
  }

  // Check if directory is writable
  try {
    const testFile = path.join(targetPath, '.jgd-fe-test');
    await fs.ensureDir(targetPath);
    await fs.writeFile(testFile, 'test');
    await fs.remove(testFile);
  } catch (error) {
    throw new ValidationError(
      `Cannot write to directory "${targetPath}". Please check permissions.`,
      'targetPath'
    );
  }
}

