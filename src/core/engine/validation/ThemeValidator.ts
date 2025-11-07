import type { Theme } from '../types';

export interface ValidationError {
  type: 'structure' | 'security' | 'compatibility' | 'performance' | 'accessibility';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

export interface ValidationWarning {
  type: 'best-practice' | 'deprecated' | 'performance' | 'security';
  message: string;
  file?: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: string;
}

export interface ThemeFile {
  path: string;
  name: string;
  content: string;
  size: number;
  lastModified: Date;
}

export class ThemeValidator {
  private static readonly CANVABIS_VERSION = '1.0.0';
  private static readonly MAX_FILE_SIZE = 1024 * 1024;
  private static readonly MAX_TOTAL_SIZE = 10 * 1024 * 1024;

  async validateTheme(theme: Theme): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      this.validateMetadata(theme, errors, warnings);
      this.validateCompatibility(theme, errors, warnings);
      this.validateComponents(theme, errors, warnings);
      await this.performSecurityScan(theme, errors, warnings);
      this.validatePerformance(theme, errors, warnings);
      this.validateAccessibility(theme, errors, warnings);
    } catch (error) {
      errors.push({
        type: 'structure',
        severity: 'critical',
        message: `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
        suggestion: 'Fix critical errors before proceeding'
      });
    }

    const score = this.calculateScore(errors, warnings);
    const summary = this.generateSummary(errors, warnings, score);

    return {
      isValid: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
      score,
      errors,
      warnings,
      summary
    };
  }

  async validateThemePackage(files: ThemeFile[]): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      await this.validateStructure(files, errors, warnings);
      await this.validateThemeJson(files, errors, warnings);
      await this.validateComponentFiles(files, errors, warnings);
      await this.securityScan(files, errors, warnings);
      await this.validateFileSizes(files, errors, warnings);
    } catch (error) {
      errors.push({
        type: 'structure',
        severity: 'critical',
        message: `Package validation failed: ${error instanceof Error ? error.message : String(error)}`,
        suggestion: 'Ensure package structure is correct'
      });
    }

    const score = this.calculateScore(errors, warnings);
    const summary = this.generateSummary(errors, warnings, score);

    return {
      isValid: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
      score,
      errors,
      warnings,
      summary
    };
  }

  private validateMetadata(theme: Theme, errors: ValidationError[], warnings: ValidationWarning[]): void {
    const { metadata } = theme;

    if (!metadata) {
      errors.push({
        type: 'structure',
        severity: 'critical',
        message: 'Theme metadata is required',
        suggestion: 'Add metadata object to theme configuration'
      });
      return;
    }

    const requiredFields = ['name', 'version', 'description', 'author'];
    for (const field of requiredFields) {
      if (!metadata[field as keyof typeof metadata]) {
        errors.push({
          type: 'structure',
          severity: 'high',
          message: `Missing required field in metadata: ${field}`,
          suggestion: `Add "${field}" to theme metadata`
        });
      }
    }

    if (metadata.version && !/^\d+\.\d+\.\d+/.test(metadata.version)) {
      errors.push({
        type: 'structure',
        severity: 'medium',
        message: 'Invalid version format',
        suggestion: 'Use semantic versioning (e.g., 1.0.0)'
      });
    }
  }

  private validateCompatibility(theme: Theme, errors: ValidationError[], warnings: ValidationWarning[]): void {
    const { metadata } = theme;
    
    if (!metadata?.compatibility) {
      warnings.push({
        type: 'best-practice',
        message: 'No compatibility information provided',
        suggestion: 'Add compatibility field to specify supported versions'
      });
      return;
    }

    if (metadata.compatibility.stencil) {
      const currentVersion = ThemeValidator.CANVABIS_VERSION;
      const requiredVersion = metadata.compatibility.stencil;
      
      if (!this.isVersionCompatible(currentVersion, requiredVersion)) {
        errors.push({
          type: 'compatibility',
          severity: 'critical',
          message: `Theme requires Stencil ${requiredVersion}, but current version is ${currentVersion}`,
          suggestion: 'Update theme or upgrade Stencil version'
        });
      }
    }
  }

  private validateComponents(theme: Theme, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!theme.components) {
      errors.push({
        type: 'structure',
        severity: 'critical',
        message: 'Theme components are required',
        suggestion: 'Add components object to theme'
      });
      return;
    }

    const requiredComponents = ['Header', 'Footer'];
    for (const componentName of requiredComponents) {
      if (!theme.components[componentName as keyof typeof theme.components]) {
        errors.push({
          type: 'structure',
          severity: 'high',
          message: `Required component '${componentName}' is missing`,
          suggestion: `Create ${componentName} component`
        });
      }
    }
  }

  private async performSecurityScan(theme: Theme, errors: ValidationError[], warnings: ValidationWarning[]): Promise<void> {
    const dangerousPatterns = [
      { pattern: /eval\s*\(/g, message: 'Use of eval() is dangerous and can lead to code injection' },
      { pattern: /Function\s*\(/g, message: 'Function constructor is dangerous' },
      { pattern: /document\.write/g, message: 'document.write can cause XSS vulnerabilities' },
      { pattern: /innerHTML\s*=/g, message: 'innerHTML can cause XSS, use textContent or sanitize input' },
      { pattern: /dangerouslySetInnerHTML/g, message: 'dangerouslySetInnerHTML should be used with caution' }
    ];

    const themeString = JSON.stringify(theme);
    
    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(themeString)) {
        warnings.push({
          type: 'security',
          message,
          suggestion: 'Review and ensure safe usage or use alternatives'
        });
      }
    }
  }

  private validatePerformance(theme: Theme, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (theme.assets?.styles && Array.isArray(theme.assets.styles)) {
      if (theme.assets.styles.length > 10) {
        warnings.push({
          type: 'performance',
          message: 'Large number of style files may impact performance',
          suggestion: 'Consider bundling styles into fewer files'
        });
      }

      const totalStyleSize = theme.assets.styles.reduce((sum, style) => sum + style.length, 0);
      if (totalStyleSize > 100000) {
        warnings.push({
          type: 'performance',
          message: 'Total CSS size exceeds 100KB',
          suggestion: 'Optimize and minify CSS files'
        });
      }
    }
  }

  private validateAccessibility(theme: Theme, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!theme.metadata?.supports?.includes('accessibility')) {
      warnings.push({
        type: 'best-practice',
        message: 'Theme does not declare accessibility support',
        suggestion: 'Consider adding accessibility features and declaring support'
      });
    }
  }

  private async validateStructure(files: ThemeFile[], errors: ValidationError[], warnings: ValidationWarning[]): Promise<void> {
    const requiredFiles = ['theme.json', 'components/layout/Header.tsx', 'components/layout/Footer.tsx'];
    
    for (const requiredFile of requiredFiles) {
      if (!files.find(f => f.path === requiredFile || f.path.endsWith(requiredFile))) {
        errors.push({
          type: 'structure',
          severity: 'critical',
          message: `Required file missing: ${requiredFile}`,
          file: requiredFile,
          suggestion: `Create the file ${requiredFile} in your theme package`
        });
      }
    }

    const recommendedFiles = ['README.md', 'CHANGELOG.md', 'preview.jpg'];
    for (const recommendedFile of recommendedFiles) {
      if (!files.find(f => f.path === recommendedFile)) {
        warnings.push({
          type: 'best-practice',
          message: `Recommended file missing: ${recommendedFile}`,
          file: recommendedFile,
          suggestion: `Consider adding ${recommendedFile} for better documentation`
        });
      }
    }

    const allowedExtensions = ['.tsx', '.ts', '.jsx', '.js', '.css', '.scss', '.json', '.md', '.jpg', '.jpeg', '.png', '.svg', '.webp', '.woff', '.woff2', '.ttf', '.otf'];
    
    for (const file of files) {
      const ext = file.path.substring(file.path.lastIndexOf('.')).toLowerCase();
      if (ext && !allowedExtensions.includes(ext)) {
        warnings.push({
          type: 'best-practice',
          message: `Unusual file extension: ${file.path}`,
          file: file.path,
          suggestion: 'Ensure this file is necessary and safe'
        });
      }
    }
  }

  private async validateThemeJson(files: ThemeFile[], errors: ValidationError[], warnings: ValidationWarning[]): Promise<void> {
    const themeJsonFile = files.find(f => f.path === 'theme.json' || f.path.endsWith('/theme.json'));
    if (!themeJsonFile) return;

    try {
      const themeJson = JSON.parse(themeJsonFile.content);
      
      const requiredFields = ['name', 'displayName', 'version', 'description', 'author'];
      for (const field of requiredFields) {
        if (!themeJson[field]) {
          errors.push({
            type: 'structure',
            severity: 'high',
            message: `Missing required field in theme.json: ${field}`,
            file: 'theme.json',
            suggestion: `Add "${field}" field to theme.json`
          });
        }
      }

      if (themeJson.version && !/^\d+\.\d+\.\d+/.test(themeJson.version)) {
        errors.push({
          type: 'structure',
          severity: 'medium',
          message: 'Invalid version format in theme.json',
          file: 'theme.json',
          suggestion: 'Use semantic versioning (e.g., 1.0.0)'
        });
      }

      if (themeJson.compatibility?.stencil) {
        const compatible = this.isVersionCompatible(
          ThemeValidator.CANVABIS_VERSION,
          themeJson.compatibility.stencil
        );
        
        if (!compatible) {
          errors.push({
            type: 'compatibility',
            severity: 'critical',
            message: `Theme is not compatible with current Stencil version (${ThemeValidator.CANVABIS_VERSION})`,
            file: 'theme.json',
            suggestion: 'Update compatibility range or theme code'
          });
        }
      }

    } catch (error) {
      errors.push({
        type: 'structure',
        severity: 'critical',
        message: 'Invalid JSON in theme.json',
        file: 'theme.json',
        suggestion: 'Fix JSON syntax errors'
      });
    }
  }

  private async validateComponentFiles(files: ThemeFile[], errors: ValidationError[], warnings: ValidationWarning[]): Promise<void> {
    const componentFiles = files.filter(f => 
      (f.path.includes('/components/') || f.path.startsWith('components/')) && 
      (f.path.endsWith('.tsx') || f.path.endsWith('.jsx'))
    );

    for (const file of componentFiles) {
      const hasReactImport = /import\s+(?:React|\{[^}]*\})\s+from\s+['"]react['"]/.test(file.content);
      if (!hasReactImport && /export\s+default/.test(file.content)) {
        warnings.push({
          type: 'best-practice',
          message: 'Component may be missing React import',
          file: file.path,
          suggestion: 'Ensure React is imported if needed'
        });
      }

      const hasDefaultExport = /export\s+default/.test(file.content);
      if (!hasDefaultExport) {
        errors.push({
          type: 'structure',
          severity: 'high',
          message: 'Component missing default export',
          file: file.path,
          suggestion: 'Add default export to component'
        });
      }
    }
  }

  private async securityScan(files: ThemeFile[], errors: ValidationError[], warnings: ValidationWarning[]): Promise<void> {
    const dangerousPatterns = [
      { pattern: /eval\s*\(/g, message: 'Use of eval() is dangerous' },
      { pattern: /Function\s*\(/g, message: 'Function constructor is dangerous' },
      { pattern: /document\.write/g, message: 'document.write can cause XSS' },
      { pattern: /innerHTML\s*=/g, message: 'innerHTML can cause XSS, use textContent' },
      { pattern: /dangerouslySetInnerHTML/g, message: 'dangerouslySetInnerHTML should be used carefully' },
      { pattern: /__dirname/g, message: '__dirname not available in browser' },
      { pattern: /__filename/g, message: '__filename not available in browser' },
      { pattern: /process\.env/g, message: 'process.env access in client code' }
    ];

    for (const file of files) {
      if (file.path.endsWith('.tsx') || file.path.endsWith('.ts') || file.path.endsWith('.js') || file.path.endsWith('.jsx')) {
        for (const { pattern, message } of dangerousPatterns) {
          if (pattern.test(file.content)) {
            warnings.push({
              type: 'security',
              message: `Security concern in ${file.path}: ${message}`,
              file: file.path,
              suggestion: 'Review and ensure safe usage'
            });
          }
        }
      }
    }
  }

  private async validateFileSizes(files: ThemeFile[], errors: ValidationError[], warnings: ValidationWarning[]): Promise<void> {
    let totalSize = 0;
    
    for (const file of files) {
      totalSize += file.size;
      
      if (file.size > ThemeValidator.MAX_FILE_SIZE) {
        warnings.push({
          type: 'performance',
          message: `File exceeds 1MB: ${file.path} (${Math.round(file.size / 1024)}KB)`,
          file: file.path,
          suggestion: 'Consider optimizing or splitting this file'
        });
      }
    }

    if (totalSize > ThemeValidator.MAX_TOTAL_SIZE) {
      warnings.push({
        type: 'performance',
        message: `Total package size exceeds 10MB (${Math.round(totalSize / 1024 / 1024)}MB)`,
        suggestion: 'Optimize assets and code to reduce package size'
      });
    }
  }

  private calculateScore(errors: ValidationError[], warnings: ValidationWarning[]): number {
    let score = 100;
    
    for (const error of errors) {
      switch (error.severity) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    }
    
    score -= warnings.length * 2;
    
    return Math.max(0, Math.min(100, score));
  }

  private generateSummary(errors: ValidationError[], warnings: ValidationWarning[], score: number): string {
    const criticalErrors = errors.filter(e => e.severity === 'critical').length;
    const highErrors = errors.filter(e => e.severity === 'high').length;
    const totalErrors = errors.length;
    const totalWarnings = warnings.length;

    if (criticalErrors > 0) {
      return `Theme has ${criticalErrors} critical error(s) that must be fixed before installation.`;
    }
    
    if (highErrors > 0) {
      return `Theme has ${highErrors} high-priority error(s) that should be addressed.`;
    }

    if (totalErrors > 0) {
      return `Theme has ${totalErrors} error(s) and ${totalWarnings} warning(s). Score: ${score}/100`;
    }

    if (totalWarnings > 0) {
      return `Theme is valid with ${totalWarnings} warning(s). Score: ${score}/100`;
    }

    return `Theme is valid and ready for installation. Score: ${score}/100`;
  }

  private isVersionCompatible(currentVersion: string, requiredVersion: string): boolean {
    const parseVersion = (v: string) => {
      const match = v.match(/(\d+)\.(\d+)\.(\d+)/);
      return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [0, 0, 0];
    };

    const current = parseVersion(currentVersion);
    const required = parseVersion(requiredVersion.replace(/[^0-9.]/g, ''));

    if (requiredVersion.startsWith('^')) {
      return current[0] === required[0] && 
             (current[1] > required[1] || (current[1] === required[1] && current[2] >= required[2]));
    }

    if (requiredVersion.startsWith('~')) {
      return current[0] === required[0] && current[1] === required[1] && current[2] >= required[2];
    }

    return current[0] >= required[0] && current[1] >= required[1] && current[2] >= required[2];
  }
}

export const themeValidator = new ThemeValidator();
