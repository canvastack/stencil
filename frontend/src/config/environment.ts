// Environment configuration for different deployment stages
export interface EnvironmentConfig {
  API_BASE_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
  DEBUG_MODE: boolean;
  
  // Security
  ENABLE_HTTPS: boolean;
  SECURITY_HEADERS: boolean;
  CSP_ENABLED: boolean;
  
  // Monitoring & Analytics
  SENTRY_DSN?: string;
  GOOGLE_ANALYTICS_ID?: string;
  HOTJAR_ID?: string;
  
  // Performance
  PERFORMANCE_MONITORING: boolean;
  ERROR_REPORTING: boolean;
  
  // Features
  FEATURES: {
    PWA_ENABLED: boolean;
    SERVICE_WORKER_ENABLED: boolean;
    OFFLINE_SUPPORT: boolean;
    REAL_TIME_NOTIFICATIONS: boolean;
    PERFORMANCE_TRACKING: boolean;
  };
  
  // API Configuration
  API_TIMEOUT: number;
  MAX_RETRIES: number;
  RATE_LIMITING: {
    REQUESTS_PER_MINUTE: number;
    BURST_LIMIT: number;
  };
}

const getEnvironment = (): EnvironmentConfig['ENVIRONMENT'] => {
  const env = import.meta.env.MODE || 'development';
  if (env === 'production') return 'production';
  if (env === 'staging') return 'staging';
  return 'development';
};

const isDevelopment = () => getEnvironment() === 'development';
const isStaging = () => getEnvironment() === 'staging';
const isProduction = () => getEnvironment() === 'production';

// Base configuration
const baseConfig: Omit<EnvironmentConfig, 'API_BASE_URL' | 'SENTRY_DSN' | 'GOOGLE_ANALYTICS_ID' | 'HOTJAR_ID'> = {
  APP_NAME: 'CanvaStack Stencil CMS',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  ENVIRONMENT: getEnvironment(),
  DEBUG_MODE: isDevelopment(),
  
  // Security settings
  ENABLE_HTTPS: isProduction(),
  SECURITY_HEADERS: isProduction() || isStaging(),
  CSP_ENABLED: isProduction(),
  
  // Monitoring
  PERFORMANCE_MONITORING: true,
  ERROR_REPORTING: isProduction() || isStaging(),
  
  // Features
  FEATURES: {
    PWA_ENABLED: isProduction() || isStaging(),
    SERVICE_WORKER_ENABLED: isProduction() || isStaging(),
    OFFLINE_SUPPORT: isProduction() || isStaging(),
    REAL_TIME_NOTIFICATIONS: true,
    PERFORMANCE_TRACKING: true,
  },
  
  // API settings
  API_TIMEOUT: isProduction() ? 15000 : 30000,
  MAX_RETRIES: 3,
  RATE_LIMITING: {
    REQUESTS_PER_MINUTE: isProduction() ? 100 : 1000,
    BURST_LIMIT: isProduction() ? 10 : 50,
  },
};

// Environment-specific configurations
const environmentConfigs: Record<EnvironmentConfig['ENVIRONMENT'], Partial<EnvironmentConfig>> = {
  development: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    DEBUG_MODE: true,
    ENABLE_HTTPS: false,
    SECURITY_HEADERS: false,
    CSP_ENABLED: false,
    ERROR_REPORTING: false,
    FEATURES: {
      ...baseConfig.FEATURES,
      PWA_ENABLED: false,
      SERVICE_WORKER_ENABLED: false,
      OFFLINE_SUPPORT: false,
    },
  },
  
  staging: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://staging-api.canvastencil.com/api',
    SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    GOOGLE_ANALYTICS_ID: import.meta.env.VITE_GA_ID,
    DEBUG_MODE: false,
    ERROR_REPORTING: true,
  },
  
  production: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.canvastencil.com/api',
    SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    GOOGLE_ANALYTICS_ID: import.meta.env.VITE_GA_ID,
    HOTJAR_ID: import.meta.env.VITE_HOTJAR_ID,
    DEBUG_MODE: false,
    ERROR_REPORTING: true,
  },
};

// Merge base config with environment-specific config
export const config: EnvironmentConfig = {
  ...baseConfig,
  ...environmentConfigs[getEnvironment()],
} as EnvironmentConfig;

// Validation
const validateConfig = (config: EnvironmentConfig): void => {
  const requiredFields = ['API_BASE_URL', 'APP_NAME', 'APP_VERSION'];
  
  for (const field of requiredFields) {
    if (!config[field as keyof EnvironmentConfig]) {
      throw new Error(`Missing required configuration: ${field}`);
    }
  }
  
  if (config.ERROR_REPORTING && !config.SENTRY_DSN && isProduction()) {
    console.warn('Sentry DSN not configured for production environment');
  }
  
  if (isProduction() && !config.GOOGLE_ANALYTICS_ID) {
    console.warn('Google Analytics not configured for production environment');
  }
};

// Validate configuration on import
validateConfig(config);

// Export utility functions
export const getConfig = () => config;
export const isDevMode = () => config.DEBUG_MODE;
export const isProdMode = () => config.ENVIRONMENT === 'production';
export const isStagingMode = () => config.ENVIRONMENT === 'staging';
export const getApiUrl = (endpoint: string) => `${config.API_BASE_URL}${endpoint}`;

// Export environment helpers
export { isDevelopment, isStaging, isProduction };

export default config;