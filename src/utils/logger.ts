// Centralized logging utility
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: Date;
  component?: string;
}

class Logger {
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  constructor() {
    this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;
  }

  private log(level: LogLevel, message: string, data?: unknown, component?: string): void {
    if (level < this.logLevel) return;

    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      component,
    };

    this.logs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Output to console in development
    if (process.env.NODE_ENV !== 'production') {
      const levelName = Object.keys(LogLevel).find(key => LogLevel[key as keyof typeof LogLevel] === level) || 'UNKNOWN';
      const prefix = `[${levelName}] ${component ? `[${component}] ` : ''}`;
      
      switch (level) {
        case LogLevel.DEBUG:
          console.log(`${prefix}${message}`, data ? data : '');
          break;
        case LogLevel.INFO:
          console.info(`${prefix}${message}`, data ? data : '');
          break;
        case LogLevel.WARN:
          console.warn(`${prefix}${message}`, data ? data : '');
          break;
        case LogLevel.ERROR:
          console.error(`${prefix}${message}`, data ? data : '');
          break;
      }
    }

    // In production, you might want to send logs to a service
    if (process.env.NODE_ENV === 'production' && level >= LogLevel.ERROR) {
      // Send to error tracking service
      this.sendToErrorService(entry);
    }
  }

  private sendToErrorService(): void {
    // Implement error tracking service integration
    // This could be Sentry, LogRocket, or any other service
  }

  debug(message: string, data?: unknown, component?: string): void {
    this.log(LogLevel.DEBUG, message, data, component);
  }

  info(message: string, data?: unknown, component?: string): void {
    this.log(LogLevel.INFO, message, data, component);
  }

  warn(message: string, data?: unknown, component?: string): void {
    this.log(LogLevel.WARN, message, data, component);
  }

  error(message: string, data?: unknown, component?: string): void {
    this.log(LogLevel.ERROR, message, data, component);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

export const logger = new Logger();