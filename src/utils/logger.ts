import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel = LogLevel.INFO;

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setVerbose(verbose: boolean): void {
    if (verbose) {
      this.level = LogLevel.DEBUG;
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(chalk.gray(`[DEBUG] ${message}`), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(chalk.blue(message), ...args);
    }
  }

  success(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(chalk.green(`✅ ${message}`), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      console.log(chalk.yellow(`⚠️  ${message}`), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(chalk.red(`❌ ${message}`), ...args);
    }
  }

  step(message: string): void {
    this.info(`📁 ${message}`);
  }

  config(message: string): void {
    this.info(`⚙️  ${message}`);
  }
}

export const logger = new Logger();

