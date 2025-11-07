import { ReactNode, useEffect, useState, useCallback, useMemo } from 'react';
import { ThemeContext } from './ThemeContext';
import { themeManager } from './ThemeManager';
import type { Theme } from './types';
import { doAction, applyFilters, THEME_HOOKS } from './hooks';

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: string;
  fallbackTheme?: string;
  onThemeChange?: (themeName: string, theme: Theme) => void;
  onThemeError?: (error: Error, themeName: string) => void;
}

interface ThemeState {
  currentTheme: Theme | null;
  currentThemeName: string;
  isLoading: boolean;
  error: Error | null;
  availableThemes: string[];
}

export function ThemeProvider({ 
  children, 
  initialTheme = 'default',
  fallbackTheme = 'default',
  onThemeChange,
  onThemeError
}: ThemeProviderProps) {
  const [state, setState] = useState<ThemeState>({
    currentTheme: null,
    currentThemeName: initialTheme,
    isLoading: true,
    error: null,
    availableThemes: []
  });

  // Update available themes list
  const updateAvailableThemes = useCallback(() => {
    const themes = themeManager.getThemeNames();
    setState(prev => ({ ...prev, availableThemes: themes }));
  }, []);

  // Load theme with comprehensive error handling
  const loadTheme = useCallback(async (themeName: string, isInitial = false) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      doAction(THEME_HOOKS.THEME_BEFORE_LOAD, themeName);
      
      let theme = themeManager.getTheme(themeName);
      
      if (!theme) {
        theme = await themeManager.loadTheme(themeName);
      }

      if (theme) {
        doAction(THEME_HOOKS.THEME_BEFORE_ACTIVATE, themeName, theme);
        
        await themeManager.activateTheme(themeName);
        
        setState(prev => ({
          ...prev,
          currentTheme: theme,
          currentThemeName: themeName,
          isLoading: false,
          error: null
        }));
        
        updateAvailableThemes();
        
        doAction(THEME_HOOKS.THEME_AFTER_ACTIVATE, themeName, theme);
        doAction(THEME_HOOKS.THEME_AFTER_LOAD, themeName, theme);
        
        onThemeChange?.(themeName, theme);
      } else {
        throw new Error(`Theme '${themeName}' could not be loaded`);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`Failed to load theme '${themeName}':`, err);
      
      if (themeName !== fallbackTheme && !isInitial) {
        console.log(`Attempting to load fallback theme '${fallbackTheme}'`);
        try {
          await loadTheme(fallbackTheme, true);
          return;
        } catch (fallbackError) {
          console.error(`Fallback theme '${fallbackTheme}' also failed:`, fallbackError);
        }
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err
      }));
      
      onThemeError?.(err, themeName);
    }
  }, [fallbackTheme, onThemeChange, onThemeError, updateAvailableThemes]);

  // Initialize theme on mount
  useEffect(() => {
    loadTheme(initialTheme, true);

    // Set up theme manager event listeners
    const handleThemeRegistered = () => {
      updateAvailableThemes();
    };

    const handleThemeUnregistered = (themeName: string) => {
      updateAvailableThemes();
      // If the current theme was unregistered, switch to fallback
      if (state.currentThemeName === themeName) {
        loadTheme(fallbackTheme);
      }
    };

    themeManager.on('themeRegistered', handleThemeRegistered);
    themeManager.on('themeUnregistered', handleThemeUnregistered);

    return () => {
      themeManager.off('themeRegistered');
      themeManager.off('themeUnregistered');
    };
  }, [initialTheme, loadTheme, fallbackTheme, state.currentThemeName, updateAvailableThemes]);

  // Theme switching function with validation
  const setTheme = useCallback(async (themeName: string) => {
    if (themeName === state.currentThemeName) {
      return; // Already active
    }

    if (state.isLoading) {
      console.warn('Theme is currently loading, please wait');
      return;
    }

    await loadTheme(themeName);
  }, [state.currentThemeName, state.isLoading, loadTheme]);

  // Reload current theme
  const reloadTheme = useCallback(async () => {
    await loadTheme(state.currentThemeName);
  }, [state.currentThemeName, loadTheme]);

  // Get theme metadata
  const getThemeMetadata = useCallback(async (themeName: string) => {
    return await themeManager.getThemeMetadata(themeName);
  }, []);

  // Context value with memoization for performance
  const contextValue = useMemo(() => ({
    currentTheme: state.currentTheme,
    currentThemeName: state.currentThemeName,
    isLoading: state.isLoading,
    error: state.error,
    availableThemes: state.availableThemes,
    setTheme,
    reloadTheme,
    getThemeMetadata
  }), [
    state.currentTheme,
    state.currentThemeName,
    state.isLoading,
    state.error,
    state.availableThemes,
    setTheme,
    reloadTheme,
    getThemeMetadata
  ]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}