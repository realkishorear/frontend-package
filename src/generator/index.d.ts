import type { ProjectAnswers } from '../types/index.js';

export declare function generateProject(
  targetPath: string,
  answers: ProjectAnswers,
  projectName: string
): Promise<void>;

