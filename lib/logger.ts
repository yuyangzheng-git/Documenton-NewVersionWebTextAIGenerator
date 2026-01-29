/**
 * 日志工具
 * 在生产环境自动禁用调试日志
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * 调试日志（仅开发环境）
   */
  log(...args: any[]): void {
    if (this.isDevelopment) {
      console.log(...args);
    }
  }

  /**
   * 信息日志（仅开发环境）
   */
  info(...args: any[]): void {
    if (this.isDevelopment) {
      console.info(...args);
    }
  }

  /**
   * 调试日志（仅开发环境）
   */
  debug(...args: any[]): void {
    if (this.isDevelopment) {
      console.debug(...args);
    }
  }

  /**
   * 警告日志（所有环境）
   */
  warn(...args: any[]): void {
    console.warn(...args);
  }

  /**
   * 错误日志（所有环境）
   */
  error(...args: any[]): void {
    console.error(...args);
  }

  /**
   * 分组日志（仅开发环境）
   */
  group(label: string, fn: () => void): void {
    if (this.isDevelopment) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  }

  /**
   * 性能计时（仅开发环境）
   */
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  /**
   * 性能计时结束（仅开发环境）
   */
  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  /**
   * 表格日志（仅开发环境）
   */
  table(data: any): void {
    if (this.isDevelopment) {
      console.table(data);
    }
  }
}

// 导出单例
export const logger = new Logger();

// 导出快捷方法
export const { log, info, warn, error, debug, group, time, timeEnd, table } = logger;
