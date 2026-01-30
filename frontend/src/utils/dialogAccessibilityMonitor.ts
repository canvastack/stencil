/**
 * Dialog Accessibility Monitor
 * 
 * A utility that monitors Dialog components at runtime to ensure they have
 * proper accessibility attributes. This helps identify Dialog components
 * that might be missing DialogTitle elements.
 */

let isMonitoringEnabled = false;

export function enableDialogAccessibilityMonitoring() {
  if (isMonitoringEnabled || typeof window === 'undefined') {
    return;
  }

  isMonitoringEnabled = true;

  // Monitor for Dialog components that might be missing DialogTitle
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          // Check for Radix Dialog Content elements
          const dialogContents = element.querySelectorAll('[data-radix-dialog-content]');
          
          dialogContents.forEach((dialogContent) => {
            // Check if this dialog has a proper title
            const hasDialogTitle = dialogContent.querySelector('[data-radix-dialog-title]');
            const hasAriaLabelledBy = dialogContent.hasAttribute('aria-labelledby');
            const hasAriaLabel = dialogContent.hasAttribute('aria-label');
            
            if (!hasDialogTitle && !hasAriaLabelledBy && !hasAriaLabel) {
              console.warn(
                'Dialog Accessibility Issue: Found Dialog without proper title.',
                'Dialog element:', dialogContent,
                'Please ensure the Dialog has a DialogTitle component or proper aria-labelledby/aria-label attributes.'
              );
              
              // Add a temporary accessible name to fix the immediate issue
              if (!dialogContent.hasAttribute('aria-label')) {
                dialogContent.setAttribute('aria-label', 'Dialog');
              }
            }
          });
        }
      });
    });
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log('Dialog Accessibility Monitor enabled');
}

export function disableDialogAccessibilityMonitoring() {
  isMonitoringEnabled = false;
  console.log('Dialog Accessibility Monitor disabled');
}

// Auto-enable in development mode
if (process.env.NODE_ENV === 'development') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enableDialogAccessibilityMonitoring);
  } else {
    enableDialogAccessibilityMonitoring();
  }
}