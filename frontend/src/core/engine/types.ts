import { ComponentType, ReactNode } from 'react';

export interface PageProps {
  className?: string;
  children?: ReactNode;
  params?: Record<string, string>;
}

export interface ThemeMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  thumbnail?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  compatibility?: {
    minVersion: string;
    maxVersion?: string;
  };
  dependencies?: Record<string, string>;
}

export interface ThemeComponents {
  // Required components
  Header: ComponentType;
  Footer: ComponentType;
  
  // Optional layout components
  HeroCarousel?: ComponentType;
  CTASection?: ComponentType;
  Product3DViewer?: ComponentType;
  ScrollToTop?: ComponentType;
  
  // Page components (can be overridden by themes)
  HomePage?: ComponentType;
  AboutPage?: ComponentType;
  ContactPage?: ComponentType;
  ProductsPage?: ComponentType;
  ProductDetailPage?: ComponentType;
  CartPage?: ComponentType;
  FAQPage?: ComponentType;
  NotFoundPage?: ComponentType;
  
  // Additional theme-specific components
  [key: string]: ComponentType | undefined;
}

export interface ThemeAssets {
  styles: string[];
  images: Record<string, string>;
  fonts: Record<string, string>;
  icons?: Record<string, string>;
  videos?: Record<string, string>;
  documents?: Record<string, string>;
}

export interface ThemeConfig {
  // Theme customization options
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    foreground?: string;
    [key: string]: string | undefined;
  };
  
  // Typography settings
  typography?: {
    fontFamily?: string;
    fontSize?: {
      base?: string;
      sm?: string;
      lg?: string;
      xl?: string;
      [key: string]: string | undefined;
    };
    fontWeight?: Record<string, string>;
  };
  
  // Layout settings
  layout?: {
    maxWidth?: string;
    spacing?: Record<string, string>;
    borderRadius?: Record<string, string>;
  };
  
  // Feature flags
  features?: {
    darkMode?: boolean;
    animations?: boolean;
    lazyLoading?: boolean;
    [key: string]: boolean | undefined;
  };
  
  // Custom theme-specific settings
  [key: string]: any;
}

export interface ThemeHooks {
  // Lifecycle hooks
  onActivate?: () => void | Promise<void>;
  onDeactivate?: () => void | Promise<void>;
  onInstall?: () => void | Promise<void>;
  onUninstall?: () => void | Promise<void>;
  
  // Customization hooks
  onConfigChange?: (config: ThemeConfig) => void | Promise<void>;
  
  // Event hooks
  [key: string]: ((...args: any[]) => void | Promise<void>) | undefined;
}

export interface Theme {
  metadata: ThemeMetadata;
  components: ThemeComponents;
  assets: ThemeAssets;
  config?: ThemeConfig;
  hooks?: ThemeHooks;
  
  // Theme-specific data
  customData?: Record<string, any>;
}

export interface ThemeRegistry {
  themes: Record<string, Theme>;
  activeTheme: string;
}

export interface ThemePackage {
  manifest: {
    name: string;
    version: string;
    description: string;
    author: string;
    main: string;
    files: string[];
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };
  theme: Theme;
  files: Record<string, string | Uint8Array>;
}

export interface ThemeInstallOptions {
  overwrite?: boolean;
  activate?: boolean;
  validateOnly?: boolean;
  skipDependencies?: boolean;
}

export interface ThemeValidationError {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  path?: string;
}

export interface ThemeLoadResult {
  success: boolean;
  theme?: Theme;
  errors: ThemeValidationError[];
  warnings: ThemeValidationError[];
}