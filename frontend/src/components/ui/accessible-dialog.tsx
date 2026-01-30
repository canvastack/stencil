/**
 * Accessible Dialog Wrapper
 * 
 * A wrapper component that ensures all Dialog components have proper DialogTitle
 * for accessibility compliance. This component automatically adds a hidden
 * DialogTitle if one is not provided.
 * 
 * Usage:
 * ```tsx
 * import { AccessibleDialog } from '@/components/ui/accessible-dialog';
 * 
 * <AccessibleDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Dialog Title" // Will be hidden if hideTitle is true
 *   hideTitle={true} // Optional: hides the title visually but keeps it for screen readers
 * >
 *   <DialogContent>
 *     {/* Your dialog content */}
 *   </DialogContent>
 * </AccessibleDialog>
 * ```
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

interface AccessibleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  hideTitle?: boolean;
  hideDescription?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AccessibleDialog({
  open,
  onOpenChange,
  title,
  description,
  hideTitle = false,
  hideDescription = false,
  children,
  className,
}: AccessibleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <DialogHeader>
          {hideTitle ? (
            <VisuallyHidden.Root>
              <DialogTitle>{title}</DialogTitle>
            </VisuallyHidden.Root>
          ) : (
            <DialogTitle>{title}</DialogTitle>
          )}
          {description && (
            hideDescription ? (
              <VisuallyHidden.Root>
                <DialogDescription>{description}</DialogDescription>
              </VisuallyHidden.Root>
            ) : (
              <DialogDescription>{description}</DialogDescription>
            )
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to ensure Dialog accessibility
 * 
 * This hook can be used to check if a Dialog component has proper accessibility
 * attributes and warn developers if they're missing.
 */
export function useDialogAccessibility(title?: string, isOpen?: boolean) {
  React.useEffect(() => {
    if (isOpen && !title) {
      console.warn(
        'Dialog Accessibility Warning: Dialog is open but no title is provided. ' +
        'This may cause accessibility issues for screen reader users. ' +
        'Please provide a title prop or use AccessibleDialog component.'
      );
    }
  }, [title, isOpen]);
}

export default AccessibleDialog;