export interface SandboxConfig {
  allowedAPIs: string[];
  allowedDomains: string[];
  maxMemoryUsage: number;
  maxExecutionTime: number;
  allowFileSystem: boolean;
  allowNetworkAccess: boolean;
  allowedOrigins: string[];
}

export interface SandboxViolation {
  type: 'api' | 'network' | 'memory' | 'timeout' | 'permission';
  message: string;
  timestamp: Date;
  blocked: boolean;
}

export interface SandboxMetrics {
  executionTime: number;
  memoryUsage: number;
  networkRequests: number;
  violations: SandboxViolation[];
}

export class ThemeSandbox {
  private config: SandboxConfig;
  private violations: SandboxViolation[] = [];
  private networkRequests: number = 0;

  constructor(config?: Partial<SandboxConfig>) {
    this.config = {
      allowedAPIs: [
        'fetch',
        'localStorage',
        'sessionStorage',
        'console',
        'setTimeout',
        'setInterval',
        'clearTimeout',
        'clearInterval'
      ],
      allowedDomains: [
        'api.stencil.com',
        'cdn.stencil.com',
        'fonts.googleapis.com',
        'fonts.gstatic.com',
        'cdnjs.cloudflare.com',
        'unpkg.com'
      ],
      allowedOrigins: [
        window.location.origin
      ],
      maxMemoryUsage: 50 * 1024 * 1024,
      maxExecutionTime: 5000,
      allowFileSystem: false,
      allowNetworkAccess: true,
      ...config
    };
  }

  async executeThemeCode<T = any>(
    code: string,
    context: Record<string, any> = {}
  ): Promise<{ result: T; metrics: SandboxMetrics }> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();
    
    this.violations = [];
    this.networkRequests = 0;

    try {
      const sandbox = this.createSandbox();
      const wrappedCode = this.wrapCodeInSandbox(code);
      
      const result = await this.executeWithTimeout<T>(wrappedCode, {
        ...sandbox,
        ...context
      });

      const executionTime = performance.now() - startTime;
      const memoryUsage = this.getMemoryUsage() - startMemory;

      const metrics: SandboxMetrics = {
        executionTime,
        memoryUsage: Math.max(0, memoryUsage),
        networkRequests: this.networkRequests,
        violations: this.violations
      };

      return { result, metrics };
      
    } catch (error) {
      const executionTime = performance.now() - startTime;
      const memoryUsage = this.getMemoryUsage() - startMemory;

      throw {
        error: error instanceof Error ? error.message : String(error),
        metrics: {
          executionTime,
          memoryUsage: Math.max(0, memoryUsage),
          networkRequests: this.networkRequests,
          violations: this.violations
        }
      };
    }
  }

  validateThemeAccess(operation: string): boolean {
    if (!this.config.allowedAPIs.includes(operation)) {
      this.recordViolation({
        type: 'api',
        message: `Unauthorized API access: ${operation}`,
        timestamp: new Date(),
        blocked: true
      });
      return false;
    }
    return true;
  }

  validateNetworkAccess(url: string): boolean {
    if (!this.config.allowNetworkAccess) {
      this.recordViolation({
        type: 'network',
        message: `Network access is disabled`,
        timestamp: new Date(),
        blocked: true
      });
      return false;
    }

    try {
      const urlObj = new URL(url);
      const isDomainAllowed = this.config.allowedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );

      if (!isDomainAllowed) {
        this.recordViolation({
          type: 'network',
          message: `Network access to ${urlObj.hostname} is not allowed`,
          timestamp: new Date(),
          blocked: true
        });
        return false;
      }

      return true;
    } catch {
      this.recordViolation({
        type: 'network',
        message: `Invalid URL: ${url}`,
        timestamp: new Date(),
        blocked: true
      });
      return false;
    }
  }

  getViolations(): SandboxViolation[] {
    return [...this.violations];
  }

  clearViolations(): void {
    this.violations = [];
  }

  private createSandbox(): Record<string, any> {
    const self = this;

    return {
      console: {
        log: (...args: any[]) => console.log('[Theme]', ...args),
        warn: (...args: any[]) => console.warn('[Theme]', ...args),
        error: (...args: any[]) => console.error('[Theme]', ...args),
        info: (...args: any[]) => console.info('[Theme]', ...args)
      },

      setTimeout: (fn: Function, delay: number) => {
        if (this.validateThemeAccess('setTimeout')) {
          return setTimeout(fn, Math.min(delay, this.config.maxExecutionTime));
        }
        throw new Error('setTimeout is not allowed');
      },

      setInterval: (fn: Function, delay: number) => {
        if (this.validateThemeAccess('setInterval')) {
          return setInterval(fn, Math.max(delay, 100));
        }
        throw new Error('setInterval is not allowed');
      },

      clearTimeout: (id: number) => {
        if (this.validateThemeAccess('clearTimeout')) {
          return clearTimeout(id);
        }
      },

      clearInterval: (id: number) => {
        if (this.validateThemeAccess('clearInterval')) {
          return clearInterval(id);
        }
      },

      fetch: this.createRestrictedFetch(),

      localStorage: this.createRestrictedStorage('localStorage'),
      sessionStorage: this.createRestrictedStorage('sessionStorage'),

      window: undefined,
      document: undefined,
      global: undefined,
      process: undefined,
      require: undefined,
      module: undefined,
      exports: undefined,
      eval: undefined,
      Function: undefined
    };
  }

  private createRestrictedFetch(): typeof fetch {
    return async (url: RequestInfo | URL, options?: RequestInit) => {
      const urlString = url.toString();
      
      if (!this.validateNetworkAccess(urlString)) {
        throw new Error(`Network access to ${urlString} is not allowed`);
      }

      this.networkRequests++;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          mode: 'cors',
          credentials: 'same-origin'
        });

        clearTimeout(timeoutId);
        return response;
        
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };
  }

  private createRestrictedStorage(storageType: 'localStorage' | 'sessionStorage'): Storage {
    const storage = window[storageType];
    const themePrefix = 'theme_';

    return {
      length: storage.length,
      
      key: (index: number) => {
        const key = storage.key(index);
        return key?.startsWith(themePrefix) ? key : null;
      },

      getItem: (key: string) => {
        if (!this.validateThemeAccess(storageType)) {
          throw new Error(`${storageType} access is not allowed`);
        }
        return storage.getItem(themePrefix + key);
      },

      setItem: (key: string, value: string) => {
        if (!this.validateThemeAccess(storageType)) {
          throw new Error(`${storageType} access is not allowed`);
        }
        
        const fullKey = themePrefix + key;
        if (fullKey.length + value.length > 100000) {
          this.recordViolation({
            type: 'memory',
            message: `Storage quota exceeded for key: ${key}`,
            timestamp: new Date(),
            blocked: false
          });
        }
        
        return storage.setItem(fullKey, value);
      },

      removeItem: (key: string) => {
        if (!this.validateThemeAccess(storageType)) {
          throw new Error(`${storageType} access is not allowed`);
        }
        return storage.removeItem(themePrefix + key);
      },

      clear: () => {
        if (!this.validateThemeAccess(storageType)) {
          throw new Error(`${storageType} access is not allowed`);
        }
        
        for (let i = storage.length - 1; i >= 0; i--) {
          const key = storage.key(i);
          if (key?.startsWith(themePrefix)) {
            storage.removeItem(key);
          }
        }
      }
    };
  }

  private wrapCodeInSandbox(code: string): string {
    return `
      (function(sandbox) {
        'use strict';
        
        const {
          console,
          setTimeout,
          setInterval,
          clearTimeout,
          clearInterval,
          fetch,
          localStorage,
          sessionStorage
        } = sandbox;
        
        ${code}
      })
    `;
  }

  private async executeWithTimeout<T>(
    code: string,
    context: Record<string, any>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.recordViolation({
          type: 'timeout',
          message: `Execution timeout exceeded (${this.config.maxExecutionTime}ms)`,
          timestamp: new Date(),
          blocked: true
        });
        reject(new Error('Theme execution timeout'));
      }, this.config.maxExecutionTime);

      try {
        const fn = new Function('sandbox', code);
        const result = fn(context);
        
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  private recordViolation(violation: SandboxViolation): void {
    this.violations.push(violation);
    console.warn('[ThemeSandbox] Security violation:', violation);
  }

  updateConfig(config: Partial<SandboxConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }

  getConfig(): SandboxConfig {
    return { ...this.config };
  }

  resetMetrics(): void {
    this.violations = [];
    this.networkRequests = 0;
  }
}

export const themeSandbox = new ThemeSandbox();
