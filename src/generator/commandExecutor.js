import { execa } from 'execa';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { buildCommands } from './commandBuilder.js';

/**
 * Executes commands generated from the command builder
 * @param {string} targetPath - The target directory path for the project
 * @param {Object} answers - User answers from prompts
 * @param {string} projectName - The project name (used to replace 'my-app' in commands)
 */
export async function executeCommands(targetPath, answers, projectName) {
  try {
    // Build commands from configuration
    const commands = buildCommands(null, answers);
    
    if (!commands || commands.length === 0) {
      console.log(chalk.yellow('⚠️  No commands to execute.'));
      return;
    }

    console.log(chalk.blue('\n🚀 Starting project generation...\n'));

    // Determine the parent directory and project directory
    const parentDir = path.dirname(targetPath);
    const projectDirName = path.basename(targetPath);
    const projectDir = targetPath;

    // Execute each command
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      // Replace 'my-app' placeholder with actual project name
      const processedCommand = command.replace(/my-app/g, projectDirName);
      
      console.log(chalk.cyan(`[${i + 1}/${commands.length}] Executing: ${processedCommand}`));
      
      // Parse command into executable and args
      const parts = processedCommand.trim().split(/\s+/);
      const executable = parts[0];
      const args = parts.slice(1);

      // Determine working directory
      // First command typically creates the project (runs in parent dir)
      // Subsequent commands run inside the project directory
      let cwd;
      if (i === 0 && (executable === 'npm' || executable === 'npx') && args[0] === 'create') {
        // First command creates project - run in parent directory
        cwd = parentDir;
        console.log(chalk.gray(`   Working directory: ${cwd}`));
      } else {
        // Subsequent commands run in project directory
        cwd = projectDir;
        // Ensure project directory exists before running commands in it
        if (!fs.existsSync(projectDir)) {
          console.log(chalk.yellow(`   Waiting for project directory to be created...`));
          // Wait a bit for the directory to be created
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log(chalk.gray(`   Working directory: ${cwd}`));
      }

      try {
        // Execute the command
        const { stdout, stderr } = await execa(executable, args, {
          cwd,
          stdio: 'inherit',
          shell: true
        });

        if (stderr && !stderr.includes('npm warn')) {
          console.log(chalk.gray(`   ${stderr}`));
        }
      } catch (error) {
        // Some commands may fail but that's okay (e.g., if package already exists)
        if (error.message && !error.message.includes('already exists')) {
          console.log(chalk.yellow(`   ⚠️  Warning: ${error.message}`));
        }
      }
    }

    console.log(chalk.green('\n✅ Project generation completed!\n'));
    
    // Display next steps
    console.log(chalk.blue('📋 Next steps:'));
    console.log(chalk.white(`   cd ${projectDirName}`));
    console.log(chalk.white('   npm install'));
    console.log(chalk.white('   npm run dev\n'));

  } catch (error) {
    console.error(chalk.red(`\n❌ Error executing commands: ${error.message}`));
    throw error;
  }
}
