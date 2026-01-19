type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

interface Logger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
}

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

class AppLogger implements Logger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}]: ${message}${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (isDevelopment) {
      return true;
    }
    
    if (isProduction) {
      return level === 'error' || level === 'warn';
    }
    
    return true;
  }

  private sendToErrorTracking(message: string, context?: LogContext) {
    if (isProduction && window.Sentry) {
      window.Sentry.captureException(new Error(message), {
        extra: context,
      });
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
      
      if (isProduction) {
        this.sendToErrorTracking(message, context);
      }
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context));
      
      if (isProduction) {
        this.sendToErrorTracking(message, context);
      }
    }
  }
}

export const logger = new AppLogger();

export default logger;
