export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted?: string;
  mutedForeground?: string;
  border?: string;
  input?: string;
  ring?: string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontSize: {
    base: string;
    sm: string;
    lg: string;
    xl: string;
    [key: string]: string;
  };
  fontWeight?: {
    normal?: number;
    medium?: number;
    semibold?: number;
    bold?: number;
  };
  lineHeight?: {
    tight?: string;
    normal?: string;
    relaxed?: string;
  };
}

export interface ThemeLayout {
  maxWidth: string;
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    [key: string]: string;
  };
  borderRadius?: {
    sm?: string;
    md?: string;
    lg?: string;
    full?: string;
  };
}

export interface ThemeFeatures {
  darkMode: boolean;
  animations: boolean;
  lazyLoading: boolean;
  [key: string]: boolean;
}

export interface ThemeConfig {
  colors: ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayout;
  features: ThemeFeatures;
}

export interface ThemeMetadata {
  id: string;
  name: string;
  displayName: string;
  author: string;
  version: string;
  description: string;
  preview?: string;
  screenshots?: string[];
  category?: string;
  tags?: string[];
  license?: string;
  homepage?: string;
  repository?: string;
}

export interface Theme {
  metadata: ThemeMetadata;
  config: ThemeConfig;
  templates?: Record<string, any>;
  components?: Record<string, any>;
  assets?: Record<string, string>;
}

export interface MarketplaceTheme extends ThemeMetadata {
  downloads: number;
  rating: number;
  reviews: number;
  price: number;
  isPremium: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  lastUpdated: string;
  size: number;
  compatibility: string;
}

export interface ThemePackage {
  metadata: ThemeMetadata;
  files: Record<string, string>;
  dependencies?: Record<string, string>;
  checksum?: string;
}

export interface ThemeFile {
  path: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  size?: number;
  modified?: string;
  children?: ThemeFile[];
}

export type ThemeInstallStatus = 'idle' | 'downloading' | 'extracting' | 'installing' | 'completed' | 'error';

export interface ThemeInstallProgress {
  status: ThemeInstallStatus;
  progress: number;
  message: string;
  error?: string;
}
