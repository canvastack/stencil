import React, { Suspense, lazy, ComponentType, ReactNode, useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface DynamicComponentLoaderProps {
  componentName: string;
  fallback?: ReactNode;
  errorFallback?: ComponentType<{ error: Error; retry: () => void }>;
  props?: Record<string, any>;
  children?: ReactNode;
}

interface ComponentCache {
  [key: string]: {
    [componentName: string]: ComponentType<any>;
  };
}

// Global component cache to avoid re-importing
const componentCache: ComponentCache = {};

// Loading component cache to prevent duplicate imports
const loadingComponents = new Set<string>();

// Eager load all theme components using import.meta.glob for build compatibility
// Use explicit relative path from this file for better build compatibility
const themeComponents = import.meta.glob('../../themes/*/components/*.tsx', { eager: true });

export function DynamicComponentLoader({
  componentName,
  fallback = <div>Loading component...</div>,
  errorFallback: ErrorFallback,
  props = {},
  children
}: DynamicComponentLoaderProps) {
  const { currentThemeName, currentTheme } = useTheme();
  const [Component, setComponent] = useState<ComponentType<any> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const cacheKey = `${currentThemeName}-${componentName}`;

  useEffect(() => {
    let isMounted = true;

    const loadComponent = async () => {
      if (!currentTheme || !currentThemeName) {
        setIsLoading(false);
        return;
      }

      setError(null);
      setIsLoading(true);

      try {
        // Check if component is already cached
        if (componentCache[currentThemeName]?.[componentName]) {
          if (isMounted) {
            setComponent(componentCache[currentThemeName][componentName]);
            setIsLoading(false);
          }
          return;
        }

        // Check if component exists in current theme
        if (currentTheme.components[componentName as keyof typeof currentTheme.components]) {
          const comp = currentTheme.components[componentName as keyof typeof currentTheme.components];
          
          // Cache the component
          if (!componentCache[currentThemeName]) {
            componentCache[currentThemeName] = {};
          }
          componentCache[currentThemeName][componentName] = comp;

          if (isMounted) {
            setComponent(comp);
            setIsLoading(false);
          }
          return;
        }

        // Try to load component from glob imports
        if (!loadingComponents.has(cacheKey)) {
          loadingComponents.add(cacheKey);
          
          try {
            // Construct the glob path pattern
            const globPath = `/src/themes/${currentThemeName}/components/${componentName}.tsx`;
            
            // Find matching module from glob imports
            let componentModule: any = null;
            for (const [path, module] of Object.entries(themeComponents)) {
              if (path.includes(globPath) || path.endsWith(`/${currentThemeName}/components/${componentName}.tsx`)) {
                componentModule = module;
                break;
              }
            }

            if (componentModule) {
              const DynamicComponent = componentModule.default || componentModule[componentName];

              if (DynamicComponent) {
                // Cache the component
                if (!componentCache[currentThemeName]) {
                  componentCache[currentThemeName] = {};
                }
                componentCache[currentThemeName][componentName] = DynamicComponent;

                if (isMounted) {
                  setComponent(DynamicComponent);
                  setIsLoading(false);
                }
              } else {
                throw new Error(`Component ${componentName} not found in theme ${currentThemeName}`);
              }
            } else {
              throw new Error(`Component ${componentName} not found in glob imports for theme ${currentThemeName}`);
            }
          } finally {
            loadingComponents.delete(cacheKey);
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`Failed to load component ${componentName} from theme ${currentThemeName}:`, error);
        
        if (isMounted) {
          setError(error);
          setIsLoading(false);
        }
      }
    };

    loadComponent();

    return () => {
      isMounted = false;
    };
  }, [currentThemeName, currentTheme, componentName, cacheKey]);

  // Error state
  if (error) {
    if (ErrorFallback) {
      return <ErrorFallback error={error} retry={() => window.location.reload()} />;
    }
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <h3 className="text-red-800 font-semibold">Component Load Error</h3>
        <p className="text-red-600 text-sm mt-1">
          Failed to load component "{componentName}" from theme "{currentThemeName}"
        </p>
        <details className="mt-2">
          <summary className="text-red-700 cursor-pointer text-sm">Error Details</summary>
          <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap">{error.message}</pre>
        </details>
      </div>
    );
  }

  // Loading state
  if (isLoading || !Component) {
    return <>{fallback}</>;
  }

  // Render the component
  return <Component {...props}>{children}</Component>;
}

// Higher-order component for lazy loading theme components
export function withThemeComponent<P extends object>(
  componentName: string,
  fallback?: ReactNode,
  errorFallback?: ComponentType<{ error: Error; retry: () => void }>
) {
  return function ThemeComponent(props: P & { children?: ReactNode }) {
    return (
      <DynamicComponentLoader
        componentName={componentName}
        fallback={fallback}
        errorFallback={errorFallback}
        props={props}
      >
        {props.children}
      </DynamicComponentLoader>
    );
  };
}

// Lazy component factory for theme components
export function createLazyThemeComponent(
  componentName: string,
  themeName?: string
): ComponentType<any> {
  return lazy(async () => {
    const theme = themeName || 'default'; // Use current theme if not specified
    
    try {
      // Find component from glob imports
      const globPath = `/src/themes/${theme}/components/${componentName}.tsx`;
      
      let componentModule: any = null;
      for (const [path, module] of Object.entries(themeComponents)) {
        if (path.includes(globPath) || path.endsWith(`/${theme}/components/${componentName}.tsx`)) {
          componentModule = module;
          break;
        }
      }

      if (componentModule) {
        return {
          default: componentModule.default || componentModule[componentName]
        };
      } else {
        throw new Error(`Component ${componentName} not found in glob imports`);
      }
    } catch (error) {
      console.error(`Failed to lazy load component ${componentName} from theme ${theme}:`, error);
      
      // Fallback to a simple error component
      return {
        default: ({ error: err, ...props }: any) => (
          <div className="p-4 border border-red-300 bg-red-50 rounded-md">
            <p className="text-red-600">Component "{componentName}" could not be loaded</p>
          </div>
        )
      };
    }
  });
}

// Theme-aware Suspense wrapper
export function ThemeSuspense({ 
  children, 
  fallback = <div>Loading...</div> 
}: { 
  children: ReactNode; 
  fallback?: ReactNode; 
}) {
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// Preload components for better performance
export async function preloadThemeComponents(
  themeName: string, 
  componentNames: string[]
): Promise<void> {
  const promises = componentNames.map(async (componentName) => {
    const cacheKey = `${themeName}-${componentName}`;
    
    if (componentCache[themeName]?.[componentName] || loadingComponents.has(cacheKey)) {
      return; // Already cached or loading
    }

    loadingComponents.add(cacheKey);
    
    try {
      // Find component from glob imports
      const globPath = `/src/themes/${themeName}/components/${componentName}.tsx`;
      
      let componentModule: any = null;
      for (const [path, module] of Object.entries(themeComponents)) {
        if (path.includes(globPath) || path.endsWith(`/${themeName}/components/${componentName}.tsx`)) {
          componentModule = module;
          break;
        }
      }

      if (componentModule) {
        const component = componentModule.default || componentModule[componentName];
        
        if (component) {
          if (!componentCache[themeName]) {
            componentCache[themeName] = {};
          }
          componentCache[themeName][componentName] = component;
        }
      }
    } catch (error) {
      console.warn(`Failed to preload component ${componentName} from theme ${themeName}:`, error);
    } finally {
      loadingComponents.delete(cacheKey);
    }
  });

  await Promise.allSettled(promises);
}

// Clear component cache for a theme (useful when theme is updated)
export function clearThemeComponentCache(themeName?: string): void {
  if (themeName) {
    delete componentCache[themeName];
  } else {
    // Clear all caches
    Object.keys(componentCache).forEach(key => {
      delete componentCache[key];
    });
  }
}