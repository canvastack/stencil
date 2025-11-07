import type { Theme } from '../types';
import { ComponentType } from 'react';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export async function validateTheme(theme: Theme): Promise<boolean> {
  const result = await validateThemeDetailed(theme);
  return result.isValid;
}

export async function validateThemeDetailed(theme: Theme): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Validate metadata
    const metadataResult = validateMetadata(theme);
    errors.push(...metadataResult.errors);
    warnings.push(...metadataResult.warnings);

    // Validate required components
    const componentsResult = validateComponents(theme);
    errors.push(...componentsResult.errors);
    warnings.push(...componentsResult.warnings);

    // Validate assets
    const assetsResult = validateAssets(theme);
    errors.push(...assetsResult.errors);
    warnings.push(...assetsResult.warnings);

    // Validate component types
    const componentTypesResult = await validateComponentTypes(theme);
    errors.push(...componentTypesResult.errors);
    warnings.push(...componentTypesResult.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  } catch (error) {
    console.error('Theme validation failed:', error);
    return {
      isValid: false,
      errors: [`Validation error: ${error}`],
      warnings
    };
  }
}

function validateMetadata(theme: Theme): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { metadata } = theme;

  if (!metadata) {
    errors.push('Theme metadata is required');
    return { isValid: false, errors, warnings };
  }

  // Required fields
  if (!metadata.name || typeof metadata.name !== 'string') {
    errors.push('Theme name is required and must be a string');
  }

  if (!metadata.version || typeof metadata.version !== 'string') {
    errors.push('Theme version is required and must be a string');
  }

  if (!metadata.description || typeof metadata.description !== 'string') {
    errors.push('Theme description is required and must be a string');
  }

  if (!metadata.author || typeof metadata.author !== 'string') {
    errors.push('Theme author is required and must be a string');
  }

  // Version format validation
  if (metadata.version && !/^\d+\.\d+\.\d+/.test(metadata.version)) {
    warnings.push('Theme version should follow semantic versioning (e.g., 1.0.0)');
  }

  // Optional fields validation
  if (metadata.thumbnail && typeof metadata.thumbnail !== 'string') {
    warnings.push('Theme thumbnail should be a string (URL or path)');
  }

  return { isValid: errors.length === 0, errors, warnings };
}

function validateComponents(theme: Theme): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { components } = theme;

  if (!components || typeof components !== 'object') {
    errors.push('Theme components are required and must be an object');
    return { isValid: false, errors, warnings };
  }

  // Required components
  const requiredComponents = ['Header', 'Footer'];
  for (const componentName of requiredComponents) {
    if (!components[componentName as keyof typeof components]) {
      errors.push(`Required component '${componentName}' is missing`);
    }
  }

  // Optional components validation
  const optionalComponents = ['HeroCarousel', 'CTASection', 'Product3DViewer', 'ScrollToTop'];
  for (const componentName of optionalComponents) {
    const component = components[componentName as keyof typeof components];
    if (component && typeof component !== 'function') {
      warnings.push(`Optional component '${componentName}' should be a React component`);
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

function validateAssets(theme: Theme): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { assets } = theme;

  if (!assets || typeof assets !== 'object') {
    errors.push('Theme assets are required and must be an object');
    return { isValid: false, errors, warnings };
  }

  // Validate styles array
  if (!Array.isArray(assets.styles)) {
    errors.push('Theme assets.styles must be an array');
  } else {
    assets.styles.forEach((style, index) => {
      if (typeof style !== 'string') {
        errors.push(`Theme assets.styles[${index}] must be a string`);
      }
    });
  }

  // Validate images object
  if (!assets.images || typeof assets.images !== 'object') {
    errors.push('Theme assets.images must be an object');
  } else {
    Object.entries(assets.images).forEach(([key, value]) => {
      if (typeof value !== 'string') {
        warnings.push(`Theme assets.images.${key} should be a string (URL or path)`);
      }
    });
  }

  // Validate fonts object
  if (!assets.fonts || typeof assets.fonts !== 'object') {
    errors.push('Theme assets.fonts must be an object');
  } else {
    Object.entries(assets.fonts).forEach(([key, value]) => {
      if (typeof value !== 'string') {
        warnings.push(`Theme assets.fonts.${key} should be a string (URL or path)`);
      }
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
}

async function validateComponentTypes(theme: Theme): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { components } = theme;

  if (!components) {
    return { isValid: true, errors, warnings };
  }

  // Check if components are valid React components
  Object.entries(components).forEach(([name, component]) => {
    if (!component) {
      return; // Skip null/undefined components (handled in validateComponents)
    }

    // Check if it's a function (React component)
    if (typeof component !== 'function') {
      errors.push(`Component '${name}' must be a React component (function)`);
      return;
    }

    // Check if it has displayName or name
    const componentFunc = component as ComponentType;
    if (!componentFunc.displayName && !componentFunc.name) {
      warnings.push(`Component '${name}' should have a displayName or function name for better debugging`);
    }
  });

  return { isValid: errors.length === 0, errors, warnings };
}

// Security validation for theme packages
export function validateThemePackage(packageData: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for potentially dangerous imports or code
  const dangerousPatterns = [
    /eval\s*\(/,
    /Function\s*\(/,
    /document\.write/,
    /innerHTML\s*=/,
    /dangerouslySetInnerHTML/,
    /window\./,
    /global\./,
    /process\./,
    /require\s*\(/,
    /__dirname/,
    /__filename/,
    /fs\./,
    /path\./,
    /os\./
  ];

  const codeString = JSON.stringify(packageData);
  dangerousPatterns.forEach(pattern => {
    if (pattern.test(codeString)) {
      warnings.push(`Potentially unsafe code pattern detected: ${pattern.source}`);
    }
  });

  // Validate package structure
  if (!packageData.theme) {
    errors.push('Package must contain a theme object');
  }

  if (!packageData.manifest) {
    errors.push('Package must contain a manifest');
  }

  return { isValid: errors.length === 0, errors, warnings };
}