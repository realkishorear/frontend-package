import { ValidationError } from './errors.js';
import path from 'path';
import fs from 'fs-extra';
import type { ProjectAnswers } from '../types/index.js';

/**
 * Validates project answers
 */
export function validateAnswers(answers: Partial<ProjectAnswers>): asserts answers is ProjectAnswers {
  // For Next.js, only framework and template are required
  if (answers.framework === 'nextjs') {
    if (!answers.framework || !answers.template) {
      throw new ValidationError(
        'Missing required fields: framework, template',
        'framework'
      );
    }
    // Set defaults for Next.js
    if (!answers.cssFramework) answers.cssFramework = 'tailwind';
    if (!answers.componentLibrary) answers.componentLibrary = 'plain';
    if (!answers.stateManagement) answers.stateManagement = 'plain';
    return;
  }

  const required = ['framework', 'cssFramework', 'componentLibrary', 'stateManagement', 'template'];
  const missing = required.filter((field) => !answers[field as keyof ProjectAnswers]);

  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      missing[0]
    );
  }

  // Validate framework
  const validFrameworks = ['react', 'angular', 'nextjs'];
  if (!validFrameworks.includes(answers.framework!)) {
    throw new ValidationError(
      `Invalid framework: ${answers.framework}. Must be one of: ${validFrameworks.join(', ')}`,
      'framework'
    );
  }

  // Validate bundler (required only for React)
  if (answers.framework === 'react') {
    if (!answers.bundler) {
      throw new ValidationError(
        'Bundler is required for React projects',
        'bundler'
      );
    }
    const validBundlers = ['vite', 'webpack'];
    if (!validBundlers.includes(answers.bundler)) {
      throw new ValidationError(
        `Invalid bundler: ${answers.bundler}. Must be one of: ${validBundlers.join(', ')}`,
        'bundler'
      );
    }
  }

  // Validate CSS framework
  const validCssFrameworks = ['tailwind', 'scss', 'css'];
  if (!validCssFrameworks.includes(answers.cssFramework!)) {
    throw new ValidationError(
      `Invalid CSS framework: ${answers.cssFramework}. Must be one of: ${validCssFrameworks.join(', ')}`,
      'cssFramework'
    );
  }

  // Validate SCSS only for Angular
  if (answers.cssFramework === 'scss' && answers.framework !== 'angular') {
    throw new ValidationError(
      'SCSS is only available for Angular projects. Please select Angular or choose a different CSS framework.',
      'cssFramework'
    );
  }

  // Validate component library
  const validComponentLibraries = ['mui', 'shadcn', 'plain'];
  if (!validComponentLibraries.includes(answers.componentLibrary!)) {
    throw new ValidationError(
      `Invalid component library: ${answers.componentLibrary}. Must be one of: ${validComponentLibraries.join(', ')}`,
      'componentLibrary'
    );
  }

  // Validate Shadcn only for React
  if (answers.componentLibrary === 'shadcn' && answers.framework !== 'react') {
    throw new ValidationError(
      'Shadcn is only available for React projects. Please select React or choose a different component library.',
      'componentLibrary'
    );
  }

  // Validate shadcn requires tailwind
  if (answers.componentLibrary === 'shadcn' && answers.cssFramework !== 'tailwind') {
    throw new ValidationError(
      'shadcn/ui requires Tailwind CSS. Please select Tailwind as your CSS framework.',
      'componentLibrary'
    );
  }

  // Validate state management
  const validStateManagement = ['redux', 'plain'];
  if (!validStateManagement.includes(answers.stateManagement!)) {
    throw new ValidationError(
      `Invalid state management: ${answers.stateManagement}. Must be one of: ${validStateManagement.join(', ')}`,
      'stateManagement'
    );
  }

  // Validate template
  const validTemplates = ['dashboard', 'none'];
  if (!validTemplates.includes(answers.template!)) {
    throw new ValidationError(
      `Invalid template: ${answers.template}. Must be one of: ${validTemplates.join(', ')}`,
      'template'
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

