import { createContext, useContext, useState, useCallback } from 'react';
import { Theme } from '../types';
import { ThemeInstaller } from './utils/ThemeInstaller';
import { ThemePackager } from './utils/ThemePackager';

interface ThemeManagerContextType {
  activeTheme: Theme | null;
  installedThemes: Theme[];
  installTheme: (themePackage: Blob) => Promise<void>;
  uninstallTheme: (themeName: string) => Promise<void>;
  activateTheme: (themeName: string) => Promise<void>;
  exportTheme: (themeName: string) => Promise<Blob>;
  updateThemeFile: (themeName: string, type: 'components' | 'assets' | 'styles', filePath: string, content: string) => Promise<void>;
}

const ThemeManagerContext = createContext<ThemeManagerContextType>({
  activeTheme: null,
  installedThemes: [],
  installTheme: async () => {},
  uninstallTheme: async () => {},
  activateTheme: async () => {},
  exportTheme: async () => new Blob(),
  updateThemeFile: async () => {},
});

export const useThemeManager = () => useContext(ThemeManagerContext);

export function ThemeManagerProvider({ children }: { children: React.ReactNode }) {
  const themeInstaller = ThemeInstaller.getInstance();
  const [activeTheme, setActiveTheme] = useState<Theme | null>(themeInstaller.getActiveTheme());
  const [installedThemes, setInstalledThemes] = useState<Theme[]>(themeInstaller.getInstalledThemes());

  const installTheme = useCallback(async (themePackage: Blob) => {
    try {
      // Extract and validate theme package
      const theme = await ThemePackager.extractThemePackage(themePackage);
      
      // Install theme
      await themeInstaller.installTheme(theme);
      
      // Update state
      setInstalledThemes(themeInstaller.getInstalledThemes());
      
    } catch (error) {
      console.error('Failed to install theme:', error);
      throw error;
    }
  }, []);

  const uninstallTheme = useCallback(async (themeName: string) => {
    try {
      await themeInstaller.uninstallTheme(themeName);
      setInstalledThemes(themeInstaller.getInstalledThemes());
    } catch (error) {
      console.error('Failed to uninstall theme:', error);
      throw error;
    }
  }, []);

  const activateTheme = useCallback(async (themeName: string) => {
    try {
      await themeInstaller.activateTheme(themeName);
      setActiveTheme(themeInstaller.getActiveTheme());
    } catch (error) {
      console.error('Failed to activate theme:', error);
      throw error;
    }
  }, []);

  const exportTheme = useCallback(async (themeName: string) => {
    try {
      const theme = themeInstaller.getTheme(themeName);
      if (!theme) {
        throw new Error(`Theme ${themeName} not found`);
      }
      return await ThemePackager.createThemePackage(theme);
    } catch (error) {
      console.error('Failed to export theme:', error);
      throw error;
    }
  }, []);

  const updateThemeFile = useCallback(async (themeName: string, type: 'components' | 'assets' | 'styles', filePath: string, content: string) => {
    try {
      const theme = themeInstaller.getTheme(themeName);
      if (!theme) throw new Error(`Theme ${themeName} not found`);

      if (type === 'components') {
        // filePath is component name (without extension)
        theme.components = {
          ...theme.components,
          [filePath]: content,
        };
      } else if (type === 'styles') {
        // filePath could be index of style or name; for simplicity append/update by name
        const styles = Array.isArray(theme.assets?.styles) ? [...theme.assets!.styles] : [];
        const idx = Number(filePath);
        if (!Number.isNaN(idx)) {
          styles[idx] = content;
        } else {
          // replace by name if exists otherwise push
          const existingIndex = styles.findIndex((s) => s && s.includes(`/* ${filePath} */`));
          if (existingIndex >= 0) styles[existingIndex] = content; else styles.push(content);
        }
        theme.assets = { ...(theme.assets || {}), styles } as any;
      } else if (type === 'assets') {
        // filePath is asset filename; store as string placeholder or leave as-is
        theme.assets = theme.assets || { styles: [], images: {}, fonts: {} } as any;
        // we store content directly as string (caller decides format)
        (theme.assets as any).images = { ...(theme.assets as any).images, [filePath]: content };
      }

      // Update installer state and provider state
      setInstalledThemes(themeInstaller.getInstalledThemes());
      // If the updated theme is active, refresh activeTheme reference
      if (themeInstaller.getActiveTheme()?.metadata.name === themeName) {
        setActiveTheme(themeInstaller.getActiveTheme());
      }
    } catch (error) {
      console.error('Failed to update theme file:', error);
      throw error;
    }
  }, []);

  return (
    <ThemeManagerContext.Provider
      value={{
        activeTheme,
        installedThemes,
        installTheme,
        uninstallTheme,
        activateTheme,
        exportTheme,
        updateThemeFile,
      }}
    >
      {children}
    </ThemeManagerContext.Provider>
  );
}