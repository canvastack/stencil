import React from 'react';
import { useTheme } from './ThemeContext';
import { DynamicComponentLoader } from './DynamicComponentLoader';

interface ThemeComponentProps {
  name: string;
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  [key: string]: any;
}

/**
 * ThemeComponent - A wrapper that renders components from the active theme
 * 
 * Usage:
 * <ThemeComponent name="Header" />
 * <ThemeComponent name="Footer" className="custom-class" />
 * <ThemeComponent name="CustomComponent" prop1="value1" prop2="value2" />
 */
export function ThemeComponent({ 
  name, 
  fallback, 
  errorFallback, 
  children,
  ...props 
}: ThemeComponentProps) {
  const { currentTheme, isLoading, error } = useTheme();

  // Show loading state
  if (isLoading) {
    return fallback || <div>Loading theme...</div>;
  }

  // Show error state
  if (error) {
    if (errorFallback) {
      const ErrorComponent = errorFallback;
      return <ErrorComponent error={error} retry={() => window.location.reload()} />;
    }
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <p className="text-red-600">Theme error: {error.message}</p>
      </div>
    );
  }

  // Check if component exists in current theme
  if (currentTheme?.components[name]) {
    const Component = currentTheme.components[name];
    return <Component {...props}>{children}</Component>;
  }

  // Use dynamic component loader as fallback
  return (
    <DynamicComponentLoader
      componentName={name}
      fallback={fallback}
      errorFallback={errorFallback}
      props={props}
    >
      {children}
    </DynamicComponentLoader>
  );
}

// Convenience components for common theme components
export const ThemeHeader = (props: any) => <ThemeComponent name="Header" {...props} />;
export const ThemeFooter = (props: any) => <ThemeComponent name="Footer" {...props} />;
export const ThemeHeroCarousel = (props: any) => <ThemeComponent name="HeroCarousel" {...props} />;
export const ThemeCTASection = (props: any) => <ThemeComponent name="CTASection" {...props} />;
export const ThemeProduct3DViewer = (props: any) => <ThemeComponent name="Product3DViewer" {...props} />;
export const ThemeScrollToTop = (props: any) => <ThemeComponent name="ScrollToTop" {...props} />;
export const ThemeTypingEffect = (props: any) => <ThemeComponent name="TypingEffect" {...props} />;

export default ThemeComponent;