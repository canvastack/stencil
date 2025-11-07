import { Theme } from './types';

export async function loadTheme(themeName: string): Promise<Theme> {
  try {
    // Load theme metadata
    const themeConfigModule = await import(`../../themes/${themeName}/theme.json`);
    const metadata = (themeConfigModule && (themeConfigModule.default ?? themeConfigModule)) as any;

    // Load theme components
    const components = await loadThemeComponents(themeName);

    // Load theme assets
    const assets = await loadThemeAssets(themeName);

    return {
      metadata,
      components: components as any,
      assets: assets as any,
    } as any;
  } catch (error) {
    console.error(`Failed to load theme: ${themeName}`, error);
    throw new Error(`Theme loading failed: ${themeName}`);
  }
}

async function loadThemeComponents(themeName: string) {
  // This will be implemented to dynamically import theme components
  // For now return an empty components object — the ThemeManager should
  // convert component source strings into runnable React components when
  // mounting a theme. Keep the return shape generic.
  return {} as Record<string, any>;
}

async function loadThemeAssets(themeName: string) {
  return {
    styles: [] as string[],
    images: {} as Record<string, string>,
    fonts: {} as Record<string, string>
  };
}