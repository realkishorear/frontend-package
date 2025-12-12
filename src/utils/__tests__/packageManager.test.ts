import { detectPackageManager, getInstallCommand } from '../packageManager.js';
import fs from 'fs-extra';
import path from 'path';

describe('packageManager', () => {
  const testDir = path.join(process.cwd(), 'test-tmp');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('detectPackageManager', () => {
    it('should detect npm when package-lock.json exists', async () => {
      await fs.writeFile(path.join(testDir, 'package-lock.json'), '{}');
      const manager = await detectPackageManager(testDir);
      expect(manager).toBe('npm');
    });

    it('should detect yarn when yarn.lock exists', async () => {
      await fs.writeFile(path.join(testDir, 'yarn.lock'), '');
      const manager = await detectPackageManager(testDir);
      expect(manager).toBe('yarn');
    });

    it('should detect pnpm when pnpm-lock.yaml exists', async () => {
      await fs.writeFile(path.join(testDir, 'pnpm-lock.yaml'), '');
      const manager = await detectPackageManager(testDir);
      expect(manager).toBe('pnpm');
    });

    it('should default to npm when no lock file exists', async () => {
      const manager = await detectPackageManager(testDir);
      expect(manager).toBe('npm');
    });
  });

  describe('getInstallCommand', () => {
    it('should return npm install command', () => {
      const { command, args } = getInstallCommand('npm');
      expect(command).toBe('npm');
      expect(args).toEqual(['install']);
    });

    it('should return yarn install command', () => {
      const { command, args } = getInstallCommand('yarn');
      expect(command).toBe('yarn');
      expect(args).toEqual(['install']);
    });

    it('should return pnpm install command', () => {
      const { command, args } = getInstallCommand('pnpm');
      expect(command).toBe('pnpm');
      expect(args).toEqual(['install']);
    });
  });
});

