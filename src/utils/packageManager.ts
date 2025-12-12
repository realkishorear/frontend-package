import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';

export type PackageManager = 'npm' | 'yarn' | 'pnpm';

/**
 * Detects the package manager to use based on lock files in the target directory
 * @param targetPath - The path to check for lock files
 * @returns The detected package manager, defaults to 'npm'
 */
export async function detectPackageManager(targetPath: string): Promise<PackageManager> {
  const lockFiles = {
    'pnpm-lock.yaml': 'pnpm' as PackageManager,
    'yarn.lock': 'yarn' as PackageManager,
    'package-lock.json': 'npm' as PackageManager,
  };

  for (const [lockFile, manager] of Object.entries(lockFiles)) {
    const lockFilePath = path.join(targetPath, lockFile);
    if (await fs.pathExists(lockFilePath)) {
      return manager;
    }
  }

  // Check if pnpm or yarn are available globally
  try {
    await execa('pnpm', ['--version'], { stdio: 'ignore' });
    return 'pnpm';
  } catch {
    // pnpm not available
  }

  try {
    await execa('yarn', ['--version'], { stdio: 'ignore' });
    return 'yarn';
  } catch {
    // yarn not available
  }

  // Default to npm
  return 'npm';
}

/**
 * Gets the install command for a package manager
 * @param manager - The package manager to use
 * @returns The install command and arguments
 */
export function getInstallCommand(manager: PackageManager): { command: string; args: string[] } {
  switch (manager) {
    case 'pnpm':
      return { command: 'pnpm', args: ['install'] };
    case 'yarn':
      return { command: 'yarn', args: ['install'] };
    case 'npm':
    default:
      return { command: 'npm', args: ['install'] };
  }
}

/**
 * Installs dependencies using the specified package manager
 * @param targetPath - The path where dependencies should be installed
 * @param manager - The package manager to use (optional, will auto-detect if not provided)
 */
export async function installDependencies(
  targetPath: string,
  manager?: PackageManager
): Promise<void> {
  const packageManager = manager || (await detectPackageManager(targetPath));
  const { command, args } = getInstallCommand(packageManager);

  await execa(command, args, {
    cwd: targetPath,
    stdio: 'inherit',
  });
}

