import JSZip from 'jszip';
import { Theme, ThemeMetadata } from '../types';
import { ThemeValidator, ThemeFile, ValidationResult } from '../validation/ThemeValidator';
import { themeStorage } from '../utils/themeStorage';

export type InstallationStage = 'uploading' | 'extracting' | 'validating' | 'installing' | 'activating' | 'complete' | 'error';

export interface InstallationProgress {
  stage: InstallationStage;
  progress: number;
  message: string;
  error?: string;
}

export interface InstallationResult {
  success: boolean;
  themeName?: string;
  error?: string;
  validation?: ValidationResult;
}

export interface ExportOptions {
  includeReadme?: boolean;
  includeChangelog?: boolean;
  includeLicense?: boolean;
  includeScreenshots?: boolean;
}

export class ThemePackageManager {
  private validator: ThemeValidator;
  private installationCallbacks: Map<string, (progress: InstallationProgress) => void>;

  constructor() {
    this.validator = new ThemeValidator();
    this.installationCallbacks = new Map();
  }

  async installThemeFromZip(
    zipFile: File,
    onProgress?: (progress: InstallationProgress) => void
  ): Promise<InstallationResult> {
    const installId = this.generateId();
    
    if (onProgress) {
      this.installationCallbacks.set(installId, onProgress);
    }

    try {
      this.updateProgress(installId, {
        stage: 'uploading',
        progress: 10,
        message: 'Validating upload...'
      });

      if (!this.isValidZipFile(zipFile)) {
        throw new Error('Invalid ZIP file format. Please upload a valid theme package.');
      }

      if (zipFile.size > 50 * 1024 * 1024) {
        throw new Error('Theme package too large. Maximum size is 50MB.');
      }

      this.updateProgress(installId, {
        stage: 'extracting',
        progress: 25,
        message: 'Extracting theme files...'
      });

      const extractedFiles = await this.extractZipFile(zipFile);

      this.updateProgress(installId, {
        stage: 'validating',
        progress: 50,
        message: 'Validating theme structure and security...'
      });

      const validation = await this.validator.validateThemePackage(extractedFiles);
      
      if (!validation.isValid) {
        const criticalErrors = validation.errors.filter(e => e.severity === 'critical' || e.severity === 'high');
        if (criticalErrors.length > 0) {
          throw new Error(`Theme validation failed: ${criticalErrors[0].message}`);
        }
      }

      this.updateProgress(installId, {
        stage: 'installing',
        progress: 75,
        message: 'Installing theme...'
      });

      const theme = await this.convertFilesToTheme(extractedFiles);
      const themeName = theme.metadata.name;

      if (await this.themeExists(themeName)) {
        const shouldOverwrite = await this.confirmOverwrite(themeName);
        if (!shouldOverwrite) {
          throw new Error('Installation cancelled: Theme already exists.');
        }
        await this.backupExistingTheme(themeName);
      }

      await this.saveThemeToStorage(theme);

      this.updateProgress(installId, {
        stage: 'activating',
        progress: 90,
        message: 'Registering theme...'
      });

      await this.registerTheme(theme);

      this.updateProgress(installId, {
        stage: 'complete',
        progress: 100,
        message: 'Theme installed successfully!'
      });

      return { 
        success: true, 
        themeName,
        validation 
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      this.updateProgress(installId, {
        stage: 'error',
        progress: 0,
        message: 'Installation failed',
        error: errorMessage
      });

      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      this.installationCallbacks.delete(installId);
    }
  }

  async exportThemeAsZip(
    theme: Theme,
    options: ExportOptions = {}
  ): Promise<Blob> {
    const zip = new JSZip();

    zip.file('theme.json', JSON.stringify(theme.metadata, null, 2));

    if (theme.components) {
      const componentsFolder = zip.folder('components');
      if (componentsFolder) {
        const layoutFolder = componentsFolder.folder('layout');
        
        Object.entries(theme.components).forEach(([name, component]) => {
          const componentCode = typeof component === 'function' 
            ? this.componentToString(component)
            : component;
          
          if (name === 'Header' || name === 'Footer') {
            layoutFolder?.file(`${name}.tsx`, componentCode);
          } else {
            componentsFolder.file(`${name}.tsx`, componentCode);
          }
        });
      }
    }

    if (theme.assets) {
      if (Array.isArray(theme.assets.styles) && theme.assets.styles.length > 0) {
        const stylesFolder = zip.folder('styles');
        theme.assets.styles.forEach((style, index) => {
          stylesFolder?.file(`style-${index}.css`, style);
        });
      }

      const assetsFolder = zip.folder('assets');
      
      if (theme.assets.images && Object.keys(theme.assets.images).length > 0) {
        const imagesFolder = assetsFolder?.folder('images');
        Object.entries(theme.assets.images).forEach(([name, data]) => {
          imagesFolder?.file(name, data);
        });
      }

      if (theme.assets.fonts && Object.keys(theme.assets.fonts).length > 0) {
        const fontsFolder = assetsFolder?.folder('fonts');
        Object.entries(theme.assets.fonts).forEach(([name, data]) => {
          fontsFolder?.file(name, data);
        });
      }
    }

    if (options.includeReadme !== false) {
      zip.file('README.md', this.generateReadme(theme.metadata));
    }

    if (options.includeChangelog) {
      zip.file('CHANGELOG.md', this.generateChangelog(theme.metadata));
    }

    if (options.includeLicense) {
      zip.file('LICENSE', this.generateLicense(theme.metadata));
    }

    return await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
  }

  async uninstallTheme(themeName: string): Promise<void> {
    const activeTheme = await this.getActiveTheme();
    
    if (activeTheme === themeName) {
      throw new Error('Cannot uninstall active theme. Please activate another theme first.');
    }

    await this.backupExistingTheme(themeName);
    await this.removeThemeFromStorage(themeName);
    await this.unregisterTheme(themeName);
  }

  private async extractZipFile(zipFile: File): Promise<ThemeFile[]> {
    const zip = new JSZip();
    const zipData = await zip.loadAsync(zipFile);
    const files: ThemeFile[] = [];

    for (const [path, zipEntry] of Object.entries(zipData.files)) {
      if (!zipEntry.dir) {
        let content: string;
        
        if (this.isTextFile(path)) {
          content = await zipEntry.async('text');
        } else {
          const blob = await zipEntry.async('blob');
          content = await this.blobToBase64(blob);
        }

        files.push({
          path: this.normalizePath(path),
          name: path.split('/').pop() || '',
          content,
          size: zipEntry._data?.uncompressedSize || content.length,
          lastModified: zipEntry.date || new Date()
        });
      }
    }

    return files;
  }

  private async convertFilesToTheme(files: ThemeFile[]): Promise<Theme> {
    const themeJsonFile = files.find(f => f.path === 'theme.json');
    
    if (!themeJsonFile) {
      throw new Error('theme.json not found in package');
    }

    const metadata: ThemeMetadata = JSON.parse(themeJsonFile.content);

    const components: Record<string, any> = {};
    const componentFiles = files.filter(f => 
      f.path.includes('components/') && (f.path.endsWith('.tsx') || f.path.endsWith('.jsx'))
    );

    for (const file of componentFiles) {
      const componentName = file.name.replace(/\.(tsx|jsx)$/, '');
      components[componentName] = file.content;
    }

    const styleFiles = files.filter(f => 
      f.path.includes('styles/') && (f.path.endsWith('.css') || f.path.endsWith('.scss'))
    );
    const styles = styleFiles.map(f => f.content);

    const imageFiles = files.filter(f => 
      f.path.includes('assets/images/') && this.isImageFile(f.path)
    );
    const images: Record<string, string> = {};
    for (const file of imageFiles) {
      images[file.name] = file.content;
    }

    const fontFiles = files.filter(f => 
      f.path.includes('assets/fonts/') && this.isFontFile(f.path)
    );
    const fonts: Record<string, string> = {};
    for (const file of fontFiles) {
      fonts[file.name] = file.content;
    }

    return {
      metadata,
      components: components as any,
      assets: {
        styles,
        images,
        fonts
      }
    } as Theme;
  }

  private async saveThemeToStorage(theme: Theme): Promise<void> {
    await themeStorage.saveTheme(theme.metadata.name, theme);
  }

  private async registerTheme(theme: Theme): Promise<void> {
    const { themeManager } = await import('../ThemeManager');
    await themeManager.registerTheme(theme.metadata.name, theme);
  }

  private async themeExists(themeName: string): Promise<boolean> {
    const theme = await themeStorage.getTheme(themeName);
    return theme !== null;
  }

  private async confirmOverwrite(_themeName: string): Promise<boolean> {
    return true;
  }

  private async backupExistingTheme(themeName: string): Promise<void> {
    const theme = await themeStorage.getTheme(themeName);
    
    if (theme) {
      const backupKey = `theme_backup_${themeName}_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(theme));
    }
  }

  private async removeThemeFromStorage(themeName: string): Promise<void> {
    await themeStorage.deleteTheme(themeName);
  }

  private async unregisterTheme(themeName: string): Promise<void> {
    const { themeManager } = await import('../ThemeManager');
    await themeManager.unregisterTheme(themeName);
  }

  private async getActiveTheme(): Promise<string> {
    const { themeManager } = await import('../ThemeManager');
    return themeManager.getActiveThemeName();
  }

  private isValidZipFile(file: File): boolean {
    return file.type === 'application/zip' || 
           file.type === 'application/x-zip-compressed' ||
           file.name.endsWith('.zip');
  }

  private isTextFile(path: string): boolean {
    const textExtensions = ['.tsx', '.ts', '.jsx', '.js', '.css', '.scss', '.json', '.md', '.txt', '.html'];
    return textExtensions.some(ext => path.endsWith(ext));
  }

  private isImageFile(path: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico'];
    return imageExtensions.some(ext => path.toLowerCase().endsWith(ext));
  }

  private isFontFile(path: string): boolean {
    const fontExtensions = ['.woff', '.woff2', '.ttf', '.otf', '.eot'];
    return fontExtensions.some(ext => path.toLowerCase().endsWith(ext));
  }

  private normalizePath(path: string): string {
    const normalized = path.replace(/\\/g, '/');
    const parts = normalized.split('/');
    if (parts[0] && !parts[0].includes('.')) {
      parts.shift();
    }
    return parts.join('/');
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private componentToString(component: any): string {
    if (typeof component === 'string') return component;
    if (typeof component === 'function') {
      return component.toString();
    }
    return `export default function Component() { return null; }`;
  }

  private generateReadme(metadata: ThemeMetadata): string {
    return `# ${metadata.name}

**Version**: ${metadata.version}  
**Author**: ${metadata.author}

## Description

${metadata.description}

## Installation

1. Upload this theme package through the theme management interface
2. Activate the theme from the themes list
3. Configure theme settings as needed

## Features

${metadata.supports?.map(feature => `- ${feature}`).join('\n') || 'No features listed'}

## Customization

Refer to the theme settings page for customization options.

## Support

For support and bug reports, please contact ${metadata.author}.

## License

${metadata.license || 'All rights reserved'}
`;
  }

  private generateChangelog(metadata: ThemeMetadata): string {
    return `# Changelog

## [${metadata.version}] - ${new Date().toISOString().split('T')[0]}

### Added
- Initial release

### Changed
- N/A

### Fixed
- N/A
`;
  }

  private generateLicense(metadata: ThemeMetadata): string {
    const year = new Date().getFullYear();
    const author = metadata.author;
    const license = metadata.license || 'MIT';

    if (license === 'MIT') {
      return `MIT License

Copyright (c) ${year} ${author}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
    }

    return `${license} License

Copyright (c) ${year} ${author}

All rights reserved.`;
  }

  private updateProgress(installId: string, progress: InstallationProgress): void {
    const callback = this.installationCallbacks.get(installId);
    if (callback) {
      callback(progress);
    }
  }

  private generateId(): string {
    return `install_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const themePackageManager = new ThemePackageManager();
