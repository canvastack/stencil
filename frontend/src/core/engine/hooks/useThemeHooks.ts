import { useEffect, useCallback, useRef } from 'react';
import { hookSystem } from './HookSystem';

export function useThemeHooks() {
  const hookIdsRef = useRef<string[]>([]);

  const addAction = useCallback((hookName: string, callback: (...args: any[]) => any, priority: number = 10) => {
    const id = hookSystem.addAction(hookName, callback, priority);
    hookIdsRef.current.push(id);
    return id;
  }, []);

  const addFilter = useCallback((hookName: string, callback: (...args: any[]) => any, priority: number = 10) => {
    const id = hookSystem.addFilter(hookName, callback, priority);
    hookIdsRef.current.push(id);
    return id;
  }, []);

  const removeAction = useCallback((hookName: string, idOrCallback: string | ((...args: any[]) => any)) => {
    return hookSystem.removeAction(hookName, idOrCallback);
  }, []);

  const removeFilter = useCallback((hookName: string, idOrCallback: string | ((...args: any[]) => any)) => {
    return hookSystem.removeFilter(hookName, idOrCallback);
  }, []);

  const doAction = useCallback((hookName: string, ...args: any[]) => {
    hookSystem.doAction(hookName, ...args);
  }, []);

  const applyFilters = useCallback(<T = any>(hookName: string, value: T, ...args: any[]): T => {
    return hookSystem.applyFilters(hookName, value, ...args);
  }, []);

  useEffect(() => {
    return () => {
      hookIdsRef.current.forEach(id => {
        hookSystem.getRegisteredActions().forEach(hookName => {
          hookSystem.removeAction(hookName, id);
        });
        hookSystem.getRegisteredFilters().forEach(hookName => {
          hookSystem.removeFilter(hookName, id);
        });
      });
      hookIdsRef.current = [];
    };
  }, []);

  return {
    addAction,
    addFilter,
    removeAction,
    removeFilter,
    doAction,
    applyFilters
  };
}

export function useAction(hookName: string, callback: (...args: any[]) => any, priority: number = 10, deps: any[] = []) {
  const { addAction, removeAction } = useThemeHooks();
  
  useEffect(() => {
    const id = addAction(hookName, callback, priority);
    
    return () => {
      removeAction(hookName, id);
    };
  }, [hookName, priority, ...deps]);
}

export function useFilter<T = any>(
  hookName: string, 
  callback: (value: T, ...args: any[]) => T, 
  priority: number = 10, 
  deps: any[] = []
) {
  const { addFilter, removeFilter } = useThemeHooks();
  
  useEffect(() => {
    const id = addFilter(hookName, callback, priority);
    
    return () => {
      removeFilter(hookName, id);
    };
  }, [hookName, priority, ...deps]);
}
