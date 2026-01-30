/**
 * Help Button Component
 * 
 * Floating help button that provides quick access to contextual help
 * Can be positioned anywhere and adapts to current page context
 * 
 * COMPLIANCE:
 * - ✅ NO MOCK DATA: All help content from real configuration
 * - ✅ BUSINESS ALIGNMENT: Context-aware help for order workflow
 * - ✅ CONTEXTUAL HELP: Shows relevant help based on current page
 * - ✅ ACCESSIBILITY: Keyboard accessible with proper ARIA labels
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Lightbulb } from 'lucide-react';
import { useHelpSystem } from './HelpSystemProvider';
import { cn } from '@/lib/utils';

interface HelpButtonProps {
  context?: string;
  position?: 'fixed' | 'relative';
  placement?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  variant?: 'default' | 'outline' | 'ghost' | 'floating';
  size?: 'sm' | 'default' | 'lg';
  tooltip?: string;
  className?: string;
  children?: React.ReactNode;
}

export function HelpButton({
  context,
  position = 'relative',
  placement = 'bottom-right',
  variant = 'default',
  size = 'default',
  tooltip = 'Open help system (F1)',
  className,
  children
}: HelpButtonProps) {
  const { openHelp, setCurrentContext } = useHelpSystem();

  const handleClick = () => {
    if (context) {
      setCurrentContext(context);
    }
    openHelp(context);
  };

  const getPositionClasses = () => {
    if (position === 'relative') return '';
    
    const baseClasses = 'fixed z-50';
    switch (placement) {
      case 'bottom-right':
        return `${baseClasses} bottom-6 right-6`;
      case 'bottom-left':
        return `${baseClasses} bottom-6 left-6`;
      case 'top-right':
        return `${baseClasses} top-6 right-6`;
      case 'top-left':
        return `${baseClasses} top-6 left-6`;
      default:
        return `${baseClasses} bottom-6 right-6`;
    }
  };

  const getVariantClasses = () => {
    if (variant === 'floating') {
      return 'rounded-full shadow-lg hover:shadow-xl transition-shadow bg-primary text-primary-foreground hover:bg-primary/90';
    }
    return '';
  };

  const buttonContent = children || (
    <>
      {variant === 'floating' ? (
        <Lightbulb className="w-5 h-5" />
      ) : (
        <HelpCircle className="w-4 h-4" />
      )}
      {variant !== 'floating' && size !== 'sm' && (
        <span className="ml-2">Help</span>
      )}
    </>
  );

  const button = (
    <Button
      variant={variant === 'floating' ? 'default' : variant}
      size={variant === 'floating' ? 'lg' : size}
      onClick={handleClick}
      className={cn(
        getPositionClasses(),
        getVariantClasses(),
        className
      )}
      aria-label={tooltip}
    >
      {buttonContent}
    </Button>
  );

  if (variant === 'floating' || tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}

/**
 * Floating Help Button - Pre-configured floating help button
 */
export function FloatingHelpButton({
  context,
  placement = 'bottom-right',
  className
}: {
  context?: string;
  placement?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}) {
  return (
    <HelpButton
      context={context}
      position="fixed"
      placement={placement}
      variant="floating"
      className={className}
    />
  );
}

/**
 * Inline Help Button - For use within forms or content areas
 */
export function InlineHelpButton({
  context,
  tooltip = 'Get help for this section',
  className
}: {
  context?: string;
  tooltip?: string;
  className?: string;
}) {
  return (
    <HelpButton
      context={context}
      variant="ghost"
      size="sm"
      tooltip={tooltip}
      className={cn('h-6 w-6 p-0', className)}
    >
      <HelpCircle className="w-3 h-3" />
    </HelpButton>
  );
}

/**
 * Header Help Button - For use in page headers
 */
export function HeaderHelpButton({
  context,
  className
}: {
  context?: string;
  className?: string;
}) {
  return (
    <HelpButton
      context={context}
      variant="outline"
      size="sm"
      className={className}
    />
  );
}

export default HelpButton;