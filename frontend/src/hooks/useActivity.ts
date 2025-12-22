import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { activityService } from '../services/activity/activityService';

// Track page visits automatically
export const usePageTracking = () => {
  const location = useLocation();
  const previousPath = useRef<string>('');

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Don't track the same page twice in a row
    if (currentPath !== previousPath.current) {
      activityService.trackPageVisit(currentPath, {
        search: location.search,
        hash: location.hash,
      });
      
      previousPath.current = currentPath;
    }
  }, [location]);
};

// Track API performance
export const useApiTracking = () => {
  return useCallback((endpoint: string, method: string = 'GET') => {
    const tracker = activityService.createPerformanceTracker(
      'api_call',
      'api',
      `${method.toLowerCase()}_${endpoint}`
    );

    return {
      success: (details?: Record<string, any>) => tracker.finish('success', details),
      error: (details?: Record<string, any>) => tracker.finish('error', details),
    };
  }, []);
};

// Track form submissions
export const useFormTracking = () => {
  return useCallback(async (formName: string, success: boolean, details?: Record<string, any>) => {
    await activityService.trackFormSubmission(formName, success, details);
  }, []);
};

// Track CRUD operations
export const useCrudTracking = () => {
  return useCallback(async (
    operation: 'create' | 'read' | 'update' | 'delete',
    resource: string,
    resourceId?: string,
    details?: Record<string, any>
  ) => {
    await activityService.trackCrud(operation, resource, resourceId, details);
  }, []);
};

// Track downloads
export const useDownloadTracking = () => {
  return useCallback(async (filename: string, fileType: string, fileSize?: number) => {
    await activityService.trackDownload(filename, fileType, fileSize);
  }, []);
};

// Performance tracker hook
export const usePerformanceTracking = () => {
  return useCallback((action: string, resource: string, resourceId?: string) => {
    return activityService.createPerformanceTracker(action, resource, resourceId);
  }, []);
};

// Login/logout tracking
export const useAuthTracking = () => {
  return {
    trackLogin: useCallback(async (method: string = 'standard') => {
      await activityService.trackLogin(method);
    }, []),
    
    trackLogout: useCallback(async () => {
      await activityService.trackLogout();
    }, []),
  };
};