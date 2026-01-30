/**
 * Accessibility Preferences Hook
 * 
 * Detects and responds to user accessibility preferences:
 * - High contrast mode
 * - Reduced motion
 * - Color scheme preferences
 * - Screen reader usage
 */

import { useState, useEffect } from 'react';

interface AccessibilityPreferences {
  prefersHighContrast: boolean;
  prefersReducedMotion: boolean;
  prefersDarkMode: boolean;
  prefersLightMode: boolean;
  isScreenReaderActive: boolean;
  colorScheme: 'light' | 'dark' | 'no-preference';
  contrastLevel: 'normal' | 'high' | 'no-preference';
  motionLevel: 'normal' | 'reduced' | 'no-preference';
}

export const useAccessibilityPreferences = (): AccessibilityPreferences => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    prefersHighContrast: false,
    prefersReducedMotion: false,
    prefersDarkMode: false,
    prefersLightMode: false,
    isScreenReaderActive: false,
    colorScheme: 'no-preference',
    contrastLevel: 'no-preference',
    motionLevel: 'no-preference',
  });

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return;

    const updatePreferences = () => {
      // High contrast detection
      const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
      const prefersHighContrast = highContrastQuery.matches;

      // Reduced motion detection
      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const prefersReducedMotion = reducedMotionQuery.matches;

      // Color scheme detection
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const lightModeQuery = window.matchMedia('(prefers-color-scheme: light)');
      const prefersDarkMode = darkModeQuery.matches;
      const prefersLightMode = lightModeQuery.matches;

      // Determine color scheme
      let colorScheme: 'light' | 'dark' | 'no-preference' = 'no-preference';
      if (prefersDarkMode) colorScheme = 'dark';
      else if (prefersLightMode) colorScheme = 'light';

      // Determine contrast level
      let contrastLevel: 'normal' | 'high' | 'no-preference' = 'no-preference';
      if (prefersHighContrast) contrastLevel = 'high';
      else contrastLevel = 'normal';

      // Determine motion level
      let motionLevel: 'normal' | 'reduced' | 'no-preference' = 'no-preference';
      if (prefersReducedMotion) motionLevel = 'reduced';
      else motionLevel = 'normal';

      // Screen reader detection (heuristic)
      const isScreenReaderActive = detectScreenReader();

      setPreferences({
        prefersHighContrast,
        prefersReducedMotion,
        prefersDarkMode,
        prefersLightMode,
        isScreenReaderActive,
        colorScheme,
        contrastLevel,
        motionLevel,
      });
    };

    // Initial check
    updatePreferences();

    // Set up media query listeners
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const lightModeQuery = window.matchMedia('(prefers-color-scheme: light)');

    // Add listeners
    highContrastQuery.addEventListener('change', updatePreferences);
    reducedMotionQuery.addEventListener('change', updatePreferences);
    darkModeQuery.addEventListener('change', updatePreferences);
    lightModeQuery.addEventListener('change', updatePreferences);

    // Cleanup
    return () => {
      highContrastQuery.removeEventListener('change', updatePreferences);
      reducedMotionQuery.removeEventListener('change', updatePreferences);
      darkModeQuery.removeEventListener('change', updatePreferences);
      lightModeQuery.removeEventListener('change', updatePreferences);
    };
  }, []);

  return preferences;
};

/**
 * Heuristic screen reader detection
 * Note: This is not 100% reliable but provides a reasonable guess
 */
function detectScreenReader(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for common screen reader indicators
  const indicators = [
    // NVDA
    () => 'speechSynthesis' in window && window.speechSynthesis.getVoices().length > 0,
    // JAWS, NVDA, and others often modify the navigator
    () => navigator.userAgent.includes('JAWS') || navigator.userAgent.includes('NVDA'),
    // Check for high contrast mode (often used with screen readers)
    () => window.matchMedia('(prefers-contrast: high)').matches,
    // Check for reduced motion (often used with screen readers)
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    // Check for Windows High Contrast mode
    () => window.matchMedia('(-ms-high-contrast: active)').matches,
  ];

  return indicators.some(check => {
    try {
      return check();
    } catch {
      return false;
    }
  });
}

/**
 * Hook for specific accessibility feature detection
 */
export const useHighContrast = (): boolean => {
  const { prefersHighContrast } = useAccessibilityPreferences();
  return prefersHighContrast;
};

export const useReducedMotion = (): boolean => {
  const { prefersReducedMotion } = useAccessibilityPreferences();
  return prefersReducedMotion;
};

export const useScreenReader = (): boolean => {
  const { isScreenReaderActive } = useAccessibilityPreferences();
  return isScreenReaderActive;
};

/**
 * Hook for applying accessibility-aware CSS classes
 */
export const useAccessibilityClasses = () => {
  const preferences = useAccessibilityPreferences();

  return {
    // Base classes that respect user preferences
    getTransitionClasses: (baseClasses: string = '') => {
      const transitionClasses = preferences.prefersReducedMotion 
        ? 'transition-none' 
        : 'transition-all duration-200 ease-in-out';
      return `${baseClasses} ${transitionClasses}`.trim();
    },

    // Focus classes with enhanced visibility for high contrast
    getFocusClasses: (baseClasses: string = '') => {
      const focusClasses = preferences.prefersHighContrast
        ? 'focus-visible:outline-4 focus-visible:outline-offset-4'
        : 'focus-visible:outline-2 focus-visible:outline-offset-2';
      return `${baseClasses} ${focusClasses}`.trim();
    },

    // Button classes with accessibility enhancements
    getButtonClasses: (baseClasses: string = '') => {
      const buttonClasses = [
        baseClasses,
        preferences.prefersHighContrast ? 'border-2 border-current font-semibold' : '',
        preferences.prefersReducedMotion ? 'transition-none' : 'transition-all duration-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
      ].filter(Boolean).join(' ');
      
      return buttonClasses;
    },

    // Text classes with enhanced contrast
    getTextClasses: (baseClasses: string = '') => {
      const textClasses = preferences.prefersHighContrast
        ? `${baseClasses} font-medium`
        : baseClasses;
      return textClasses;
    },

    preferences,
  };
};

export default useAccessibilityPreferences;