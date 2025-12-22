import { createContext, useContext } from 'react';
import type { Theme } from './types';

interface ThemeContextType {
  currentTheme: Theme | null;
  currentThemeName: string;
  isLoading: boolean;
  error: Error | null;
  availableThemes: string[];
  setTheme: (themeName: string) => Promise<void>;
  reloadTheme: () => Promise<void>;
  getThemeMetadata: (themeName: string) => Promise<any>;
}

export const ThemeContext = createContext<ThemeContextType>({
  currentTheme: null,
  currentThemeName: 'default',
  isLoading: false,
  error: null,
  availableThemes: [],
  setTheme: async () => {},
  reloadTheme: async () => {},
  getThemeMetadata: async () => null,
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};