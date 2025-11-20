import type { Theme, ThemeRegistry } from './types';
import { validateTheme } from './utils/themeValidator';

export interface ThemeManagerEvents {
  themeRegistered: (name: string, theme: Theme) => void;
  themeActivated: (name: string, theme: Theme) => void;
  themeUnregistered: (name: string) => void;
  themeValidationFailed: (name: string, error: Error) => void;
}

class ThemeManager {
  private registry: ThemeRegistry = {
    themes: {},
    activeTheme: 'default'
  };
  
  private eventListeners: Partial<ThemeManagerEvents> = {};
  private loadingThemes = new Set<string>();

  // Event system for theme lifecycle
  on<K extends keyof ThemeManagerEvents>(event: K, listener: ThemeManagerEvents[K]): void {
    this.eventListeners[event] = listener;
  }

  off<K extends keyof ThemeManagerEvents>(event: K): void {
    delete this.eventListeners[event];
  }

  private emit<K extends keyof ThemeManagerEvents>(event: K, ...args: Parameters<ThemeManagerEvents[K]>): void {
    const listener = this.eventListeners[event];
    if (listener) {
      (listener as any)(...args);
    }
  }

  async registerTheme(name: string, theme: Theme, skipValidation = false): Promise<void> {
    try {
      // Skip validation for default theme or when explicitly requested
      if (!skipValidation) {
        const isValid = await validateTheme(theme);
        if (!isValid) {
          const error = new Error(`Theme validation failed for ${name}`);
          this.emit('themeValidationFailed', name, error);
          throw error;
        }
      }

      this.registry.themes[name] = theme;
      this.emit('themeRegistered', name, theme);
      
      console.log(`Theme '${name}' registered successfully`);
    } catch (error) {
      console.error(`Failed to register theme '${name}':`, error);
      throw error;
    }
  }

  registerThemeSync(name: string, theme: Theme): void {
    try {
      this.registry.themes[name] = theme;
      this.emit('themeRegistered', name, theme);
      console.log(`Theme '${name}' registered successfully`);
    } catch (error) {
      console.error(`Failed to register theme '${name}' synchronously:`, error);
      throw error;
    }
  }

  async unregisterTheme(name: string): Promise<void> {
    if (name === 'default') {
      throw new Error('Cannot unregister default theme');
    }
    
    if (this.registry.activeTheme === name) {
      await this.activateTheme('default');
    }
    
    delete this.registry.themes[name];
    this.emit('themeUnregistered', name);
  }

  async activateTheme(name: string): Promise<void> {
    if (!this.registry.themes[name]) {
      throw new Error(`Theme ${name} not found`);
    }
    
    const previousTheme = this.registry.activeTheme;
    this.registry.activeTheme = name;
    
    try {
      const theme = this.registry.themes[name];
      this.emit('themeActivated', name, theme);
      console.log(`Theme '${name}' activated successfully`);
    } catch (error) {
      // Rollback on activation failure
      this.registry.activeTheme = previousTheme;
      throw error;
    }
  }

  async loadTheme(name: string): Promise<Theme> {
    // Return existing theme if already loaded
    if (this.registry.themes[name]) {
      return this.registry.themes[name];
    }

    // If already loading, wait for it to complete instead of throwing error
    if (this.loadingThemes.has(name)) {
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (!this.loadingThemes.has(name)) {
            clearInterval(checkInterval);
            const theme = this.registry.themes[name];
            if (theme) {
              resolve(theme);
            } else {
              reject(new Error(`Theme ${name} failed to load`));
            }
          }
        }, 50);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error(`Theme ${name} loading timeout`));
        }, 5000);
      });
    }

    this.loadingThemes.add(name);
    
    try {
      // Dynamic import for theme modules - use relative path for build compatibility
      const themeModule = await import(`../../themes/${name}/index.ts`);
      const theme = themeModule.default;
      
      await this.registerTheme(name, theme);
      return theme;
    } catch (error) {
      console.error(`Failed to load theme '${name}':`, error);
      throw new Error(`Failed to load theme '${name}': ${error}`);
    } finally {
      this.loadingThemes.delete(name);
    }
  }

  getActiveTheme(): Theme {
    const theme = this.registry.themes[this.registry.activeTheme];
    if (!theme) {
      throw new Error(`Active theme '${this.registry.activeTheme}' not found`);
    }
    return theme;
  }

  getActiveThemeName(): string {
    return this.registry.activeTheme;
  }

  getTheme(name: string): Theme | undefined {
    return this.registry.themes[name];
  }

  getAllThemes(): Record<string, Theme> {
    return { ...this.registry.themes };
  }

  getThemeNames(): string[] {
    return Object.keys(this.registry.themes);
  }

  isThemeRegistered(name: string): boolean {
    return name in this.registry.themes;
  }

  isThemeLoading(name: string): boolean {
    return this.loadingThemes.has(name);
  }

  // Get theme metadata without loading the full theme
  async getThemeMetadata(name: string): Promise<any> {
    try {
      const themeModule = await import(`../../themes/${name}/theme.json`);
      return themeModule.default;
    } catch (error) {
      console.warn(`Could not load metadata for theme '${name}':`, error);
      return null;
    }
  }
}

export const themeManager = new ThemeManager();