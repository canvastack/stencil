/**
 * Debug utilities for development
 */

export type DebugCategory = 'auth' | 'data' | 'api' | 'state' | 'performance' | 'general';

/**
 * Debug log function that integrates with DevDebugger
 */
export const debugLog = (label: string, data: any, category: DebugCategory = 'general') => {
  // Always log to console in development
  if (import.meta.env.DEV) {
    console.log(`[${category.toUpperCase()}] ${label}:`, data);
  }
  
  // Send to DevDebugger if available
  if ((window as any).debugLog) {
    (window as any).debugLog(label, data, category);
  }
};

/**
 * Force replace existing log entry (useful for live data updates)
 */
export const debugReplace = (label: string, data: any, category: DebugCategory = 'general') => {
  // Log to console in development  
  if (import.meta.env.DEV) {
    console.log(`[${category.toUpperCase()}] ${label} [REPLACE]:`, data);
  }
  
  // Temporarily enable replace mode for this call
  const wasReplaceMode = (window as any).debugReplaceMode;
  (window as any).debugReplaceMode = true;
  
  if ((window as any).debugLog) {
    (window as any).debugLog(label, data, category);
  }
  
  // Restore previous mode
  (window as any).debugReplaceMode = wasReplaceMode;
};

/**
 * Debug auth state
 */
export const debugAuth = (label: string, data: any) => {
  debugLog(label, data, 'auth');
};

/**
 * Debug API calls
 */
export const debugApi = (label: string, data: any) => {
  debugLog(label, data, 'api');
};

/**
 * Debug data structures
 */
export const debugData = (label: string, data: any) => {
  debugLog(label, data, 'data');
};

/**
 * Debug state changes
 */
export const debugState = (label: string, data: any) => {
  debugLog(label, data, 'state');
};

/**
 * Debug performance metrics
 */
export const debugPerformance = (label: string, data: any) => {
  debugLog(label, data, 'performance');
};

/**
 * Check if debug mode is enabled
 */
export const isDebugEnabled = (): boolean => {
  return import.meta.env.VITE_DEBUG_MODE === 'true' || import.meta.env.DEV;
};

/**
 * Conditional debug logging - only logs if debug is enabled
 */
export const conditionalDebug = (label: string, data: any, category: DebugCategory = 'general') => {
  if (isDebugEnabled()) {
    debugLog(label, data, category);
  }
};