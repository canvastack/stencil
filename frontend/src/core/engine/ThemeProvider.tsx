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
    isLoading: false,
    error: null,
    availableThemes: []
  });

  // Update available themes list
  const updateAvailableThemes = useCallback(() => {
    const themes = themeManager.getThemeNames();
    setState(prev => {
      // Only update if themes actually changed
      const currentThemes = prev.availableThemes;
      if (JSON.stringify(currentThemes) !== JSON.stringify(themes)) {
        return { ...prev, availableThemes: themes };
      }
      return prev;
    });
  }, []);

  // Load theme with comprehensive error handling
  const loadTheme = useCallback(async (themeName: string, isInitial = false) => {
    // Prevent loading if already loaded and not initial
    if (!isInitial && state.currentThemeName === themeName && state.currentTheme && !state.isLoading) {
      console.log(`Theme '${themeName}' is already loaded and active`);
      return;
    }

    // Prevent re-loading if already loading
    if (state.isLoading && !isInitial) {
      console.log(`Theme is already loading, skipping load for '${themeName}'`);
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('Loading theme:', themeName);
      doAction(THEME_HOOKS.THEME_BEFORE_LOAD, themeName);
      
      let theme = themeManager.getTheme(themeName);
      
      if (!theme) {
        theme = await themeManager.loadTheme(themeName);
      }

      if (theme) {
        doAction(THEME_HOOKS.THEME_BEFORE_ACTIVATE, themeName, theme);
        
        await themeManager.activateTheme(themeName);
        
        console.log('Theme loaded successfully with components:', Object.keys(theme.components || {}));
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
    let isMounted = true;
    let isInitialized = false;
    
    const initializeTheme = async () => {
      if (isMounted && !isInitialized && !state.currentTheme) {
        console.log('Initializing theme:', initialTheme);
        isInitialized = true;
        await loadTheme(initialTheme, true);
      }
    };

    initializeTheme();

    // Set up theme manager event listeners
    const handleThemeRegistered = () => {
      if (isMounted) {
        updateAvailableThemes();
      }
    };

    const handleThemeUnregistered = (themeName: string) => {
      if (isMounted) {
        updateAvailableThemes();
        // If the current theme was unregistered, switch to fallback
        if (state.currentThemeName === themeName) {
          loadTheme(fallbackTheme);
        }
      }
    };

    themeManager.on('themeRegistered', handleThemeRegistered);
    themeManager.on('themeUnregistered', handleThemeUnregistered);

    return () => {
      isMounted = false;
      themeManager.off('themeRegistered');
      themeManager.off('themeUnregistered');
    };
  }, [initialTheme]);

  // Theme switching function with validation
  const setTheme = useCallback(async (themeName: string) => {
    setState(currentState => {
      if (themeName === currentState.currentThemeName) {
        console.log('Theme is already active:', themeName);
        return currentState; // Already active
      }

      if (currentState.isLoading) {
        console.warn('Theme is currently loading, please wait');
        return currentState;
      }

      // Trigger loadTheme in next tick to avoid state update in render cycle
      setTimeout(() => {
        loadTheme(themeName);
      }, 0);

      return currentState;
    });
  }, [loadTheme]);

  // Reload current theme
  const reloadTheme = useCallback(async () => {
    setState(currentState => {
      // Trigger loadTheme in next tick
      setTimeout(() => {
        loadTheme(currentState.currentThemeName);
      }, 0);
      
      return currentState;
    });
  }, [loadTheme]);

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