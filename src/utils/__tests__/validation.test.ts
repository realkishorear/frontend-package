import { validateAnswers } from '../validation.js';
import type { ProjectAnswers } from '../../types/index.js';

describe('validation', () => {
  const validAnswers: ProjectAnswers = {
    template: 'empty',
    bundler: 'vite',
    cssFramework: 'tailwind',
    componentLibrary: 'none',
    useRedux: false,
    useReactQuery: false,
    useLogger: false,
    useAnimation: false,
    routingType: 'v6',
  };

  describe('validateAnswers', () => {
    it('should pass validation for valid answers', () => {
      expect(() => validateAnswers(validAnswers)).not.toThrow();
    });

    it('should throw for missing required fields', () => {
      const incomplete = { ...validAnswers };
      delete (incomplete as Partial<ProjectAnswers>).template;
      expect(() => validateAnswers(incomplete)).toThrow();
    });

    it('should throw for invalid template', () => {
      const invalid = { ...validAnswers, template: 'invalid' as any };
      expect(() => validateAnswers(invalid)).toThrow();
    });

    it('should throw for invalid bundler', () => {
      const invalid = { ...validAnswers, bundler: 'invalid' as any };
      expect(() => validateAnswers(invalid)).toThrow();
    });

    it('should throw when shadcn is selected without tailwind', () => {
      const invalid = {
        ...validAnswers,
        componentLibrary: 'shadcn' as const,
        cssFramework: 'css' as const,
      };
      expect(() => validateAnswers(invalid)).toThrow();
    });

    it('should throw when React Router v7 is selected without Vite', () => {
      const invalid = {
        ...validAnswers,
        routingType: 'v7' as const,
        bundler: 'webpack' as const,
      };
      expect(() => validateAnswers(invalid)).toThrow();
    });
  });
});

