import { useEffect, useState } from 'react';
import { themeStyleManager } from './utils/styleManager';

interface StyleLoadOptions {
  base?: boolean;
  theme?: boolean;
}

export function useThemeStyles(themeName: string, options: StyleLoadOptions = { base: true, theme: true }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadStyles() {
      try {
        const styles: string[] = [];

        if (options.base) {
          const baseStyles = await import(`../themes/${themeName}/styles/base.css`);
          styles.push(baseStyles.default);
        }

        if (options.theme) {
          const themeStyles = await import(`../themes/${themeName}/styles/theme.css`);
          styles.push(themeStyles.default);
        }

        themeStyleManager.injectStyles(themeName, styles);
        setIsLoaded(true);
      } catch (error) {
        console.error(`Failed to load styles for theme: ${themeName}`, error);
      }
    }

    loadStyles();

    return () => {
      themeStyleManager.removeStyles(themeName);
    };
  }, [themeName, options.base, options.theme]);

  return isLoaded;
}