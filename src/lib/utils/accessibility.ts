/**
 * Accessibility Utilities
 * Helper functions for WCAG 2.1 AA compliance
 */

/**
 * Announce message to screen readers without visual display
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Generate unique ID for ARIA relationships
 */
export const generateAriaId = (prefix: string) => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if element has proper ARIA label
 */
export const hasAccessibleLabel = (element: HTMLElement): boolean => {
  return !!(
    element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby') ||
    element.querySelector('label')
  );
};

/**
 * Get accessible name for element (for testing)
 */
export const getAccessibleName = (element: HTMLElement): string | null => {
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;
  
  const ariaLabelledby = element.getAttribute('aria-labelledby');
  if (ariaLabelledby) {
    const labelElement = document.getElementById(ariaLabelledby);
    return labelElement?.textContent || null;
  }
  
  const labelFor = document.querySelector(`label[for="${element.id}"]`);
  if (labelFor) return labelFor.textContent;
  
  return element.textContent;
};
