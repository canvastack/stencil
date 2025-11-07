import { Theme } from '../types';

interface ThemeStorage {
  saveTheme(name: string, theme: Theme): Promise<void>;
  getTheme(name: string): Promise<Theme | null>;
  deleteTheme(name: string): Promise<void>;
  listThemes(): Promise<string[]>;
}

class LocalThemeStorage implements ThemeStorage {
  private readonly STORAGE_PREFIX = 'theme:';

  async saveTheme(name: string, theme: Theme): Promise<void> {
    const key = this.STORAGE_PREFIX + name;
    try {
      localStorage.setItem(key, JSON.stringify(theme));
    } catch (error) {
      console.error(`Failed to save theme: ${name}`, error);
      throw new Error(`Theme storage failed: ${name}`);
    }
  }

  async getTheme(name: string): Promise<Theme | null> {
    const key = this.STORAGE_PREFIX + name;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Failed to load theme: ${name}`, error);
      return null;
    }
  }

  async deleteTheme(name: string): Promise<void> {
    const key = this.STORAGE_PREFIX + name;
    localStorage.removeItem(key);
  }

  async listThemes(): Promise<string[]> {
    const themes: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.STORAGE_PREFIX)) {
        themes.push(key.replace(this.STORAGE_PREFIX, ''));
      }
    }
    return themes;
  }
}

export const themeStorage = new LocalThemeStorage();