import { captureException } from './sentry';

export interface LogEvent {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  tenantId?: string;
  userId?: string;
  accountType?: string;
  sessionId?: string;
}

class Logger {
  private sessionId: string;
  private logQueue: LogEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL = 5000;
  private readonly MAX_QUEUE_SIZE = 100;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startAutoFlush();
    
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private startAutoFlush(): void {
    this.flushInterval = setInterval(() => {
      if (this.logQueue.length > 0) {
        this.flush();
      }
    }, this.FLUSH_INTERVAL);
  }

  private createLogEvent(
    level: LogEvent['level'],
    message: string,
    context?: Record<string, unknown>
  ): LogEvent {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      tenantId: localStorage.getItem('tenant_id') || undefined,
      userId: localStorage.getItem('user_id') || undefined,
      accountType: localStorage.getItem('account_type') || undefined,
      sessionId: this.sessionId,
    };
  }

  private async sendToBackend(events: LogEvent[]): Promise<void> {
    if (events.length === 0) return;

    const token = localStorage.getItem('token');
    if (!token) {
      if (import.meta.env.DEV) {
        console.warn('[Logger] No auth token, skipping backend logging');
      }
      return;
    }

    const accountType = localStorage.getItem('account_type');
    const endpoint = accountType === 'platform' 
      ? '/api/v1/platform/logs'
      : '/api/v1/tenant/logs';

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(accountType === 'tenant' && {
            'X-Tenant-ID': localStorage.getItem('tenant_id') || '',
          }),
        },
        body: JSON.stringify({ logs: events }),
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Logger] Failed to send logs to backend:', error);
      }
    }
  }

  private queueLog(event: LogEvent): void {
    this.logQueue.push(event);

    if (this.logQueue.length > this.MAX_QUEUE_SIZE) {
      this.logQueue.shift();
      if (import.meta.env.DEV) {
        console.warn('[Logger] Queue overflow, dropping oldest log');
      }
    }

    if (this.logQueue.length >= this.BATCH_SIZE) {
      this.flush();
    }
  }

  flush(): void {
    if (this.logQueue.length === 0) return;

    const logsToSend = [...this.logQueue];
    this.logQueue = [];
    
    this.sendToBackend(logsToSend);
  }

  info(message: string, context?: Record<string, unknown>): void {
    const event = this.createLogEvent('info', message, context);
    
    if (import.meta.env.DEV) {
      console.log(`[INFO] ${message}`, context);
    }
    
    this.queueLog(event);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    const event = this.createLogEvent('warn', message, context);
    
    console.warn(`[WARN] ${message}`, context);
    
    this.queueLog(event);
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    const event = this.createLogEvent('error', message, {
      ...context,
      error: {
        name: errorObj.name,
        message: errorObj.message,
        stack: errorObj.stack,
      },
    });
    
    console.error(`[ERROR] ${message}`, errorObj, context);
    
    this.queueLog(event);
    
    captureException(errorObj, context);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (import.meta.env.DEV) {
      const event = this.createLogEvent('debug', message, context);
      console.debug(`[DEBUG] ${message}`, context);
      this.queueLog(event);
    }
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }
}

export const logger = new Logger();

if (typeof window !== 'undefined') {
  (window as any).__logger = logger;
}
