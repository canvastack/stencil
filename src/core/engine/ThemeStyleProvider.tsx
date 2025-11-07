import { useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { useThemeStyles } from './useThemeStyles';

export function ThemeStyleProvider({ children }: { children: React.ReactNode }) {
  const { currentTheme } = useTheme();
  const isStylesLoaded = useThemeStyles(currentTheme?.metadata.name || 'default');

  useEffect(() => {
    // Mencegah FOUC (Flash of Unstyled Content)
    if (isStylesLoaded) {
      document.documentElement.style.visibility = 'visible';
    } else {
      document.documentElement.style.visibility = 'hidden';
    }
  }, [isStylesLoaded]);

  if (!isStylesLoaded) {
    return null;
  }

  return <>{children}</>;
}