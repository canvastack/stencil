export enum FeatureFlag {
  VIRTUAL_SCROLLING = 'product-catalog-virtual-scrolling',
  MEMOIZED_COLUMNS = 'product-catalog-memoized-columns',
  LAZY_IMAGE_LOADING = 'product-catalog-lazy-images',
  STATE_REDUCER = 'product-catalog-state-reducer',
  
  ADVANCED_FILTERS = 'product-catalog-advanced-filters',
  SAVED_SEARCHES = 'product-catalog-saved-searches',
  BULK_EDIT_V2 = 'product-catalog-bulk-edit-v2',
  ANALYTICS_DASHBOARD = 'product-catalog-analytics',
  EXPORT_ENHANCED = 'product-catalog-export-enhanced',
  
  MOBILE_LAYOUT = 'product-catalog-mobile-layout',
  DARK_MODE_V2 = 'product-catalog-dark-mode-v2',
  KEYBOARD_NAV_ENHANCED = 'product-catalog-keyboard-nav',
  ACCESSIBILITY_ENHANCEMENTS = 'product-catalog-a11y',
  
  NEW_API_CLIENT = 'product-catalog-new-api-client',
  RBAC_ENHANCED = 'product-catalog-rbac-enhanced',
  AUDIT_LOGGING = 'product-catalog-audit-logging',
}

export type TargetAudience = 'internal' | 'beta' | 'all';

export interface FeatureFlagConfig {
  key: FeatureFlag;
  name: string;
  description: string;
  defaultValue: boolean;
  rolloutPercentage: number;
  targetAudience: TargetAudience;
  dependencies: FeatureFlag[];
  requiredPermissions: string[];
  category: 'performance' | 'feature' | 'ux' | 'technical';
}

export const featureFlagConfigs: Record<FeatureFlag, FeatureFlagConfig> = {
  [FeatureFlag.VIRTUAL_SCROLLING]: {
    key: FeatureFlag.VIRTUAL_SCROLLING,
    name: 'Virtual Scrolling',
    description: 'Enable virtual scrolling for large product lists (68% faster rendering)',
    defaultValue: false,
    rolloutPercentage: 0,
    targetAudience: 'internal',
    dependencies: [FeatureFlag.MEMOIZED_COLUMNS],
    requiredPermissions: ['products.read'],
    category: 'performance',
  },
  [FeatureFlag.MEMOIZED_COLUMNS]: {
    key: FeatureFlag.MEMOIZED_COLUMNS,
    name: 'Memoized Table Columns',
    description: 'Optimize table rendering with memoization',
    defaultValue: false,
    rolloutPercentage: 0,
    targetAudience: 'internal',
    dependencies: [],
    requiredPermissions: ['products.read'],
    category: 'performance',
  },
  [FeatureFlag.LAZY_IMAGE_LOADING]: {
    key: FeatureFlag.LAZY_IMAGE_LOADING,
    name: 'Lazy Image Loading',
    description: 'Load product images on-demand to reduce initial page weight',
    defaultValue: false,
    rolloutPercentage: 0,
    targetAudience: 'internal',
    dependencies: [],
    requiredPermissions: ['products.read'],
    category: 'performance',
  },
  [FeatureFlag.STATE_REDUCER]: {
    key: FeatureFlag.STATE_REDUCER,
    name: 'State Reducer Pattern',
    description: 'Use reducer for complex state management',
    defaultValue: false,
    rolloutPercentage: 0,
    targetAudience: 'internal',
    dependencies: [],
    requiredPermissions: ['products.read'],
    category: 'performance',
  },
  [FeatureFlag.ADVANCED_FILTERS]: {
    key: FeatureFlag.ADVANCED_FILTERS,
    name: 'Advanced Filters',
    description: 'Multi-column filtering with complex operators',
    defaultValue: false,
    rolloutPercentage: 0,
    targetAudience: 'beta',
    dependencies: [],
    requiredPermissions: ['products.read'],
    category: 'feature',
  },
  [FeatureFlag.SAVED_SEARCHES]: {
    key: FeatureFlag.SAVED_SEARCHES,
    name: 'Saved Searches',
    description: 'Save and reuse custom filter combinations',
    defaultValue: false,
    rolloutPercentage: 0,
    targetAudience: 'beta',
    dependencies: [FeatureFlag.ADVANCED_FILTERS],
    requiredPermissions: ['products.read'],
    category: 'feature',
  },
  [FeatureFlag.BULK_EDIT_V2]: {
    key: FeatureFlag.BULK_EDIT_V2,
    name: 'Bulk Edit V2',
    description: 'Enhanced bulk editing with preview and undo',
    defaultValue: false,
    rolloutPercentage: 0,
    targetAudience: 'beta',
    dependencies: [],
    requiredPermissions: ['products.update'],
    category: 'feature',
  },
  [FeatureFlag.ANALYTICS_DASHBOARD]: {
    key: FeatureFlag.ANALYTICS_DASHBOARD,
    name: 'Analytics Dashboard',
    description: 'Product catalog analytics and insights',
    defaultValue: false,
    rolloutPercentage: 0,
    targetAudience: 'beta',
    dependencies: [],
    requiredPermissions: ['analytics.read'],
    category: 'feature',
  },
  [FeatureFlag.EXPORT_ENHANCED]: {
    key: FeatureFlag.EXPORT_ENHANCED,
    name: 'Enhanced Export',
    description: 'Advanced export options with custom templates',
    defaultValue: false,
    rolloutPercentage: 0,
    targetAudience: 'all',
    dependencies: [],
    requiredPermissions: ['products.read'],
    category: 'feature',
  },
  [FeatureFlag.MOBILE_LAYOUT]: {
    key: FeatureFlag.MOBILE_LAYOUT,
    name: 'Mobile Layout',
    description: 'Optimized mobile-first product catalog layout',
    defaultValue: false,
    rolloutPercentage: 0,
    targetAudience: 'internal',
    dependencies: [],
    requiredPermissions: ['products.read'],
    category: 'ux',
  },
  [FeatureFlag.DARK_MODE_V2]: {
    key: FeatureFlag.DARK_MODE_V2,
    name: 'Dark Mode V2',
    description: 'Enhanced dark theme with better contrast and accessibility',
    defaultValue: false,
    rolloutPercentage: 0,
    targetAudience: 'internal',
    dependencies: [],
    requiredPermissions: [],
    category: 'ux',
  },
  [FeatureFlag.KEYBOARD_NAV_ENHANCED]: {
    key: FeatureFlag.KEYBOARD_NAV_ENHANCED,
    name: 'Enhanced Keyboard Navigation',
    description: 'Improved keyboard shortcuts and navigation',
    defaultValue: false,
    rolloutPercentage: 0,
    targetAudience: 'beta',
    dependencies: [],
    requiredPermissions: ['products.read'],
    category: 'ux',
  },
  [FeatureFlag.ACCESSIBILITY_ENHANCEMENTS]: {
    key: FeatureFlag.ACCESSIBILITY_ENHANCEMENTS,
    name: 'Accessibility Enhancements',
    description: 'WCAG 2.1 AAA compliance improvements',
    defaultValue: false,
    rolloutPercentage: 0,
    targetAudience: 'beta',
    dependencies: [],
    requiredPermissions: [],
    category: 'ux',
  },
  [FeatureFlag.NEW_API_CLIENT]: {
    key: FeatureFlag.NEW_API_CLIENT,
    name: 'New API Client',
    description: 'Improved API client with retry logic and caching',
    defaultValue: false,
    rolloutPercentage: 0,
    targetAudience: 'internal',
    dependencies: [],
    requiredPermissions: [],
    category: 'technical',
  },
  [FeatureFlag.RBAC_ENHANCED]: {
    key: FeatureFlag.RBAC_ENHANCED,
    name: 'Enhanced RBAC',
    description: 'Fine-grained role-based access control',
    defaultValue: false,
    rolloutPercentage: 0,
    targetAudience: 'internal',
    dependencies: [],
    requiredPermissions: [],
    category: 'technical',
  },
  [FeatureFlag.AUDIT_LOGGING]: {
    key: FeatureFlag.AUDIT_LOGGING,
    name: 'Audit Logging',
    description: 'Comprehensive audit trail for all product changes',
    defaultValue: false,
    rolloutPercentage: 0,
    targetAudience: 'beta',
    dependencies: [],
    requiredPermissions: ['audit.read'],
    category: 'technical',
  },
};

export const getFeatureFlagsByCategory = (category: FeatureFlagConfig['category']): FeatureFlagConfig[] => {
  return Object.values(featureFlagConfigs).filter(config => config.category === category);
};

export const getFeatureFlagsByAudience = (audience: TargetAudience): FeatureFlagConfig[] => {
  return Object.values(featureFlagConfigs).filter(config => config.targetAudience === audience);
};

export const getEnabledFlags = (): FeatureFlagConfig[] => {
  return Object.values(featureFlagConfigs).filter(config => config.defaultValue === true);
};

export const checkDependencies = (flag: FeatureFlag, enabledFlags: Set<FeatureFlag>): boolean => {
  const config = featureFlagConfigs[flag];
  if (!config) return false;
  
  return config.dependencies.every(dep => enabledFlags.has(dep));
};
