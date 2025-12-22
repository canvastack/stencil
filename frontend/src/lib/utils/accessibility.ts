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

/**
 * Keyboard navigation announcement helper
 */
export const announceNavigation = (
  current: number, 
  total: number, 
  itemName: string = 'item'
) => {
  announceToScreenReader(
    `${itemName} ${current + 1} of ${total}`,
    'polite'
  );
};

/**
 * Announce selection changes
 */
export const announceSelection = (
  selectedCount: number,
  totalCount: number,
  itemName: string = 'item'
) => {
  if (selectedCount === 0) {
    announceToScreenReader('Selection cleared', 'polite');
  } else if (selectedCount === totalCount) {
    announceToScreenReader(`All ${totalCount} ${itemName}s selected`, 'polite');
  } else {
    announceToScreenReader(
      `${selectedCount} of ${totalCount} ${itemName}s selected`,
      'polite'
    );
  }
};

/**
 * Announce loading states
 */
export const announceLoading = (isLoading: boolean, context: string = 'content') => {
  if (isLoading) {
    announceToScreenReader(`Loading ${context}...`, 'polite');
  } else {
    announceToScreenReader(`${context} loaded`, 'polite');
  }
};

/**
 * Announce errors to screen readers
 */
export const announceError = (message: string) => {
  announceToScreenReader(`Error: ${message}`, 'assertive');
};

/**
 * Announce success to screen readers
 */
export const announceSuccess = (message: string) => {
  announceToScreenReader(`Success: ${message}`, 'polite');
};

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Save current focus
   */
  saveFocus: (): HTMLElement | null => {
    return document.activeElement as HTMLElement;
  },

  /**
   * Restore focus to previous element
   */
  restoreFocus: (element: HTMLElement | null) => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  },

  /**
   * Trap focus within container (for modals, dialogs)
   */
  trapFocus: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  },

  /**
   * Focus first error in form
   */
  focusFirstError: (container: HTMLElement = document.body) => {
    const errorElement = container.querySelector<HTMLElement>(
      '[aria-invalid="true"], .error, [data-error="true"]'
    );
    
    if (errorElement) {
      errorElement.focus();
      announceToScreenReader('Please fix the errors in the form', 'assertive');
    }
  },
};

/**
 * Skip navigation helper
 */
export const createSkipLink = (targetId: string, label: string = 'Skip to main content') => {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.className = 'skip-to-content';
  skipLink.textContent = label;
  skipLink.setAttribute('aria-label', label);
  
  return skipLink;
};
