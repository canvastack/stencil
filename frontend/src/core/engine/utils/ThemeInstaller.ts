import { Theme } from '../types';
import { validateTheme } from './themeValidator';

export class ThemeInstaller {
  private static instance: ThemeInstaller;
  private installedThemes: Map<string, Theme>;
  private activeTheme: string | null;

  private constructor() {
    this.installedThemes = new Map();
    this.activeTheme = null;
  }

  static getInstance(): ThemeInstaller {
    if (!ThemeInstaller.instance) {
      ThemeInstaller.instance = new ThemeInstaller();
    }
    return ThemeInstaller.instance;
  }

  async installTheme(theme: Theme): Promise<void> {
    // Validate theme structure
    const isValid = await validateTheme(theme);
    if (!isValid) {
      throw new Error('Invalid theme structure');
    }

    // Store theme
    this.installedThemes.set(theme.metadata.name, theme);
    
    // If this is the first theme, make it active
    if (!this.activeTheme) {
      this.activeTheme = theme.metadata.name;
    }
  }

  async uninstallTheme(themeName: string): Promise<void> {
    // Check if theme exists
    if (!this.installedThemes.has(themeName)) {
      throw new Error(`Theme ${themeName} not found`);
    }

    // Check if theme is active
    if (this.activeTheme === themeName) {
      throw new Error('Cannot uninstall active theme');
    }

    // Remove theme
    this.installedThemes.delete(themeName);
  }

  async activateTheme(themeName: string): Promise<void> {
    // Check if theme exists
    if (!this.installedThemes.has(themeName)) {
      throw new Error(`Theme ${themeName} not found`);
    }

    // Set as active theme
    this.activeTheme = themeName;
  }

  getActiveTheme(): Theme | null {
    if (!this.activeTheme) return null;
    return this.installedThemes.get(this.activeTheme) || null;
  }

  getInstalledThemes(): Theme[] {
    return Array.from(this.installedThemes.values());
  }

  isThemeInstalled(themeName: string): boolean {
    return this.installedThemes.has(themeName);
  }

  getTheme(themeName: string): Theme | null {
    return this.installedThemes.get(themeName) || null;
  }
}