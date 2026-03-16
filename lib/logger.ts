/**
 * Structured Logging
 * Enhanced with Pino for production-ready logging
 */

import pino from 'pino';

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

const isDevelopment = process.env.NODE_ENV === 'development';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

const pinoLogger = pino({
  level: logLevel,
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      singleLine: false,
    },
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: process.env.NODE_ENV,
  },
});

class Logger {
  private isDevelopment: boolean;
  private pino: pino.Logger;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.pino = pinoLogger;
  }

  /**
   * Debug log (development only)
   */
  log(...args: any[]): void {
    if (this.isDevelopment) {
      this.pino.debug(args);
    }
  }

  /**
   * Info log
   */
  info(...args: any[]): void {
    this.pino.info(args);
  }

  /**
   * Debug log (development only)
   */
  debug(...args: any[]): void {
    if (this.isDevelopment) {
      this.pino.debug(args);
    }
  }

  /**
   * Warning log
   */
  warn(...args: any[]): void {
    this.pino.warn(args);
  }

  /**
   * Error log
   */
  error(...args: any[]): void {
    this.pino.error(args);
  }

  /**
   * Group log (development only - fallback to console)
   */
  group(label: string, fn: () => void): void {
    if (this.isDevelopment) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  }

  /**
   * Performance timing (development only - fallback to console)
   */
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  /**
   * Performance timing end (development only - fallback to console)
   */
  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  /**
   * Table log (development only - fallback to console)
   */
  table(data: any): void {
    if (this.isDevelopment) {
      console.table(data);
    }
  }
}

// Export singleton
export const logger = new Logger();

// Export shortcuts
export const { log, info, warn, error, debug, group, time, timeEnd, table } = logger;

// Export function to create child loggers with context
export const createLogger = (context: string) => {
  return pinoLogger.child({ context });
};

export default logger;
