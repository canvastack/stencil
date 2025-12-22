/**
 * Application Configuration
 * Centralized configuration using Vite environment variables
 */

export const config = {
  app: {
    name: import.meta.env.VITE_APP_NAME || 'CanvaStencil',
    title: import.meta.env.VITE_APP_TITLE || 'Stencil CMS',
    version: import.meta.env.VITE_APP_VERSION || '3.7.0',
    env: import.meta.env.VITE_APP_ENV || import.meta.env.VITE_APP_ENVIRONMENT || 'development',
    description: import.meta.env.VITE_APP_DESCRIPTION || 'Multi-Tenant CMS Platform',
    baseUrl: import.meta.env.VITE_APP_BASE_URL || '/',
  },
  
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
    platformUrl: import.meta.env.VITE_PLATFORM_API_URL || 'http://localhost:8000/api/v1/platform',
    tenantUrl: import.meta.env.VITE_TENANT_API_URL || 'http://localhost:8000/api/v1/tenant',
    authUrl: import.meta.env.VITE_AUTH_URL || 'http://localhost:8000/auth',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
  },
  
  auth: {
    tokenKey: import.meta.env.VITE_AUTH_TOKEN_KEY || 'stencil_auth_token',
    userKey: import.meta.env.VITE_AUTH_USER_KEY || 'stencil_auth_user',
    sessionDomain: import.meta.env.VITE_SESSION_DOMAIN || 'localhost',
    secureCookie: import.meta.env.VITE_SECURE_COOKIE === 'true',
  },
  
  websocket: {
    url: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:6001',
    reverbAppKey: import.meta.env.VITE_REVERB_APP_KEY || '',
    enabled: import.meta.env.VITE_ENABLE_WEBSOCKET === 'true',
  },
  
  features: {
    debug: import.meta.env.VITE_ENABLE_DEBUG === 'true' || import.meta.env.VITE_DEBUG_MODE === 'true',
    mockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true' || import.meta.env.VITE_MOCK_API === 'true' || import.meta.env.VITE_USE_MOCK_DATA === 'true',
    devtools: import.meta.env.VITE_ENABLE_DEVTOOLS === 'true',
    pwa: import.meta.env.VITE_ENABLE_PWA === 'true',
    offline: import.meta.env.VITE_ENABLE_OFFLINE === 'true',
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    errorReporting: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true' || import.meta.env.VITE_ENABLE_ERROR_TRACKING === 'true',
    performanceMonitoring: import.meta.env.VITE_PERFORMANCE_MONITORING === 'true',
    webVitalsTracking: import.meta.env.VITE_WEB_VITALS_TRACKING === 'true',
  },
  
  deployment: {
    platform: import.meta.env.VITE_APP_DEPLOY_PLATFORM || 'local',
    isGithubPages: import.meta.env.VITE_APP_IS_GITHUB_PAGES === 'true',
  },
  
  logging: {
    level: (import.meta.env.VITE_APP_LOG_LEVEL || 'error') as 'debug' | 'info' | 'warn' | 'error',
  },
  
  monitoring: {
    sentry: {
      dsn: import.meta.env.VITE_SENTRY_DSN || '',
      org: import.meta.env.VITE_SENTRY_ORG || '',
      project: import.meta.env.VITE_SENTRY_PROJECT || 'stencil-cms',
    },
    analytics: {
      gaId: import.meta.env.VITE_GA_ID || '',
      hotjarId: import.meta.env.VITE_HOTJAR_ID || '',
    },
  },
  
  retry: {
    attempts: parseInt(import.meta.env.VITE_REQUEST_RETRY_ATTEMPTS || '3', 10),
    delay: parseInt(import.meta.env.VITE_REQUEST_RETRY_DELAY || '1000', 10),
  },
  
  tenant: {
    defaultId: import.meta.env.VITE_DEFAULT_TENANT_ID || '',
  },
  
  // Helper methods
  isDevelopment: () => import.meta.env.DEV || import.meta.env.MODE === 'development',
  isProduction: () => import.meta.env.PROD || import.meta.env.MODE === 'production',
  getMode: () => import.meta.env.MODE || 'development',
} as const;

// Type-safe access
export type AppConfig = typeof config;

// Export individual sections for convenience
export const { app, api, auth, websocket, features, deployment, logging, monitoring, retry, tenant } = config;

export default config;
