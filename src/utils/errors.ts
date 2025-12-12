/**
 * Custom error classes for better error handling
 */

export class ProjectGenerationError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'ProjectGenerationError';
    Object.setPrototypeOf(this, ProjectGenerationError.prototype);
  }
}

export class ConfigurationError extends Error {
  constructor(message: string, public readonly config?: string) {
    super(message);
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

export class TemplateError extends Error {
  constructor(message: string, public readonly template?: string) {
    super(message);
    this.name = 'TemplateError';
    Object.setPrototypeOf(this, TemplateError.prototype);
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

