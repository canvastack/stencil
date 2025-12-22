import {
  initSentry,
  captureException,
  captureMessage,
  setUserContext,
  clearUserContext,
  setTenantContext,
  clearTenantContext,
} from './sentry';

import { logger, type LogEvent } from './logger';

import { performanceMonitor, type PerformanceMetric } from './performance';

export {
  initSentry,
  captureException,
  captureMessage,
  setUserContext,
  clearUserContext,
  setTenantContext,
  clearTenantContext,
  logger,
  performanceMonitor,
};

export type { LogEvent, PerformanceMetric };

export const initMonitoring = () => {
  initSentry();
  performanceMonitor.init();
  
  if (import.meta.env.DEV) {
    console.log('[Monitoring] Initialized: Sentry + Performance + Logger');
  }
};
