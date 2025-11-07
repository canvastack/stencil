import { Theme, ThemeMetadata } from '../types';

export class ThemePackager {
  static async createThemePackage(theme: Theme): Promise<Blob> {
    // Load JSZip dynamically to avoid build-time resolution errors when the
    // dependency isn't present in the environment (gives a clearer error).
    let JSZip: any;
    try {
      const mod = await import('jszip');
      JSZip = mod?.default ?? mod;
    } catch (err) {
      throw new Error('The dependency "jszip" is required to create theme packages. Please run `npm install jszip` and restart the dev server.');
    }

    const zip = new JSZip();

    // Add theme.json
    zip.file('theme.json', JSON.stringify(theme.metadata, null, 2));

    // Add components
    const componentsFolder = zip.folder('components');
    if (componentsFolder && theme.components) {
      Object.entries(theme.components).forEach(([name, component]) => {
        componentsFolder.file(`${name}.tsx`, component.toString());
      });
    }

    // Add styles
    const stylesFolder = zip.folder('styles');
    if (stylesFolder && theme.assets && Array.isArray(theme.assets.styles)) {
      theme.assets.styles.forEach((style, index) => {
        stylesFolder.file(`style${index}.css`, style);
      });
    }

    // Add assets
    const assetsFolder = zip.folder('assets');
    if (assetsFolder && theme.assets) {
      // Images
      const imagesFolder = assetsFolder.folder('images');
      if (imagesFolder && theme.assets.images) {
        Object.entries(theme.assets.images).forEach(([name, url]) => {
          imagesFolder.file(name, url);
        });
      }

      // Fonts
      const fontsFolder = assetsFolder.folder('fonts');
      if (fontsFolder && theme.assets.fonts) {
        Object.entries(theme.assets.fonts).forEach(([name, url]) => {
          fontsFolder.file(name, url);
        });
      }
    }

    // Generate README.md
    const readme = this.generateReadme(theme.metadata);
    zip.file('README.md', readme);

    // Generate ZIP file
    return await zip.generateAsync({ type: 'blob' });
  }

  static async extractThemePackage(zipBlob: Blob): Promise<Theme> {
    // Dynamically import JSZip when extracting packages
    let JSZip: any;
    try {
      const mod = await import('jszip');
      JSZip = mod?.default ?? mod;
    } catch (err) {
      throw new Error('The dependency "jszip" is required to extract theme packages. Please run `npm install jszip` and restart the dev server.');
    }

    const zip = await JSZip.loadAsync(zipBlob);
    
    // Extract theme.json
    const themeJsonFile = zip.file('theme.json');
    if (!themeJsonFile) {
      throw new Error('Invalid theme package: Missing theme.json');
    }
    
    const metadata: ThemeMetadata = JSON.parse(
      await themeJsonFile.async('string')
    );

    // Extract components
    const components: Record<string, any> = {};
    const componentsFolder = zip.folder('components');
    if (componentsFolder) {
      const componentFiles = componentsFolder.files;
      for (const path in componentFiles) {
        const file = componentFiles[path];
        if (path.endsWith('.tsx')) {
          // normalize name (strip folder path)
          const parts = path.split('/');
          const filename = parts[parts.length - 1];
          const name = filename.replace('.tsx', '');
          components[name] = await file.async('string');
        }
      }
    }

    // Extract styles
    const styles: string[] = [];
    const stylesFolder = zip.folder('styles');
    if (stylesFolder) {
      const styleFiles = stylesFolder.files;
      for (const path in styleFiles) {
        const file = styleFiles[path];
        // only add css files
        if (path.endsWith('.css') || path.endsWith('.scss') || path.endsWith('.pcss')) {
          styles.push(await file.async('string'));
        }
      }
    }

    // Extract assets
    const assets = {
      styles,
      images: {} as Record<string, Blob | string>,
      fonts: {} as Record<string, Blob | string>
    };

    const assetsFolder = zip.folder('assets');
    if (assetsFolder) {
      // Extract images
      const imagesFolder = assetsFolder.folder('images');
      if (imagesFolder) {
        const imageFiles = imagesFolder.files;
        for (const path in imageFiles) {
          const file = imageFiles[path];
          // keep filename only
          const parts = path.split('/');
          const name = parts[parts.length - 1];
          assets.images[name] = await file.async('blob');
        }
      }

      // Extract fonts
      const fontsFolder = assetsFolder.folder('fonts');
      if (fontsFolder) {
        const fontFiles = fontsFolder.files;
        for (const path in fontFiles) {
          const file = fontFiles[path];
          const parts = path.split('/');
          const name = parts[parts.length - 1];
          assets.fonts[name] = await file.async('blob');
        }
      }
    }

    // Note: We return loose types here because packaged components are stored
    // as source strings/blobs and may require further processing to convert
    // into runnable components. Casting to any keeps the packager generic.
    return {
      metadata,
      components: components as any,
      assets: assets as any,
    } as any;
  }

  private static generateReadme(metadata: ThemeMetadata): string {
    return `# ${metadata.name}

Version: ${metadata.version}
Author: ${metadata.author}

## Description
${metadata.description}

## Installation
1. Upload the theme package through the theme management interface
2. Activate the theme from the themes list
3. Configure any theme-specific settings

## Components
This theme includes several components that can be customized through the theme settings:

- Header
- Footer
- Navigation
- And more...

## Customization
Refer to the theme documentation for customization options and configuration details.

## Support
For support and bug reports, please contact the theme author.

## License
Please refer to the theme's license terms for usage rights and restrictions.
`;
  }
}