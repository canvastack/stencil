export interface EnvironmentConfig {
  app: {
    env: 'development' | 'staging' | 'production';
    title: string;
    description: string;
    baseUrl: string;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
  api: {
    baseUrl: string;
    authUrl: string;
    websocketUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  features: {
    useMockData: boolean;
    enableAnalytics: boolean;
    enableErrorTracking: boolean;
  };
  defaults: {
    tenantId: string | null;
  };
}

function getEnvVariable(key: string, defaultValue: string = ''): string {
  const value = import.meta.env[key];
  return value ?? defaultValue;
}

function getEnvBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = getEnvVariable(key);
  if (!value) return defaultValue;
  return value === 'true' || value === '1' || value === 'yes';
}

function getEnvNumber(key: string, defaultValue: number = 0): number {
  const value = getEnvVariable(key);
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

export const envConfig: EnvironmentConfig = {
  app: {
    env: (getEnvVariable('VITE_APP_ENV', 'development') as any) || 'development',
    title: getEnvVariable('VITE_APP_TITLE', 'Stencil CMS'),
    description: getEnvVariable('VITE_APP_DESCRIPTION', 'Multi-Tenant CMS Platform'),
    baseUrl: getEnvVariable('VITE_APP_BASE_URL', '/'),
    logLevel: (getEnvVariable('VITE_APP_LOG_LEVEL', 'error') as any) || 'error',
  },
  api: {
    baseUrl: getEnvVariable('VITE_API_BASE_URL', 'http://localhost:8000/api/v1'),
    authUrl: getEnvVariable('VITE_AUTH_URL', 'http://localhost:8000/auth'),
    websocketUrl: getEnvVariable('VITE_WEBSOCKET_URL', 'ws://localhost:8000/ws'),
    timeout: getEnvNumber('VITE_API_TIMEOUT', 30000),
    retryAttempts: getEnvNumber('VITE_REQUEST_RETRY_ATTEMPTS', 3),
    retryDelay: getEnvNumber('VITE_REQUEST_RETRY_DELAY', 1000),
  },
  features: {
    useMockData: getEnvBoolean('VITE_USE_MOCK_DATA', true),
    enableAnalytics: getEnvBoolean('VITE_ENABLE_ANALYTICS', false),
    enableErrorTracking: getEnvBoolean('VITE_ENABLE_ERROR_TRACKING', false),
  },
  defaults: {
    tenantId: getEnvVariable('VITE_DEFAULT_TENANT_ID') || null,
  },
};

export const isDevelopment = envConfig.app.env === 'development';
export const isProduction = envConfig.app.env === 'production';
export const isStaging = envConfig.app.env === 'staging';

if (isDevelopment) {
  console.log('[Environment Config]', envConfig);
}

export default envConfig;
