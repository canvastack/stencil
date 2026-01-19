import * as Sentry from '@sentry/react';

export const initSentry = () => {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.warn('Sentry DSN not configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_ENV || import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    beforeSend(event, hint) {
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers['Authorization'];
          delete event.request.headers['X-API-Key'];
        }
      }

      const tenantId = localStorage.getItem('tenant_id');
      const userId = localStorage.getItem('user_id');
      const accountType = localStorage.getItem('account_type');
      
      if (tenantId || userId || accountType) {
        event.contexts = event.contexts || {};
        event.contexts.tenant = {
          tenant_id: tenantId,
          user_id: userId,
          account_type: accountType,
        };
      }

      if (import.meta.env.DEV) {
        console.log('[Sentry] Event captured:', event);
      }

      return event;
    },

    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      /^Network request failed/,
      /^Failed to fetch/,
    ],
  });
};

export const captureException = (error: Error, context?: Record<string, unknown>) => {
  if (import.meta.env.DEV) {
    console.error('[Sentry] Exception:', error, context);
  }
  
  Sentry.captureException(error, {
    contexts: context ? { custom: context } : undefined,
  });
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, unknown>) => {
  if (import.meta.env.DEV) {
    console.log(`[Sentry] Message [${level}]:`, message, context);
  }
  
  Sentry.captureMessage(message, {
    level,
    contexts: context ? { custom: context } : undefined,
  });
};

export const setUserContext = (user: { id: string; email?: string; name?: string; account_type?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
    account_type: user.account_type,
  });
};

export const clearUserContext = () => {
  Sentry.setUser(null);
};

export const setTenantContext = (tenant: { id: string; name?: string; domain?: string }) => {
  Sentry.setContext('tenant', {
    tenant_id: tenant.id,
    tenant_name: tenant.name,
    tenant_domain: tenant.domain,
  });
};

export const clearTenantContext = () => {
  Sentry.setContext('tenant', null);
};
