/**
 * Accessible Status Badge Component
 * 
 * Provides WCAG 2.1 AA compliant status indicators with:
 * - High contrast mode support
 * - Color-blind friendly patterns and symbols
 * - Screen reader accessible text alternatives
 * - Semantic HTML structure
 * - Keyboard navigation support
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { StatusColorSystem } from '@/utils/StatusColorSystem';
import { OrderStatus } from '@/types/order';
import { BusinessStage } from '@/utils/OrderProgressCalculator';
import { cn } from '@/lib/utils';

interface AccessibleStatusBadgeProps {
  status?: OrderStatus;
  stage?: BusinessStage;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showSymbol?: boolean;
  showPattern?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const AccessibleStatusBadge: React.FC<AccessibleStatusBadgeProps> = ({
  status,
  stage,
  variant,
  size = 'md',
  showSymbol = true,
  showPattern = false,
  className,
  children,
}) => {
  // Determine which type of status we're dealing with
  const isStatus = status !== undefined;
  const currentValue = isStatus ? status! : stage!;

  // Get color configuration
  const colorConfig = isStatus 
    ? StatusColorSystem.getAccessibleStatusColor(status!)
    : StatusColorSystem.getAccessibleStageColor(stage!);

  // Get accessibility information
  const semanticInfo = isStatus
    ? StatusColorSystem.getSemanticInfo(status!)
    : StatusColorSystem.getStageSemanticInfo(stage!);

  const pattern = isStatus
    ? StatusColorSystem.getColorBlindPattern(status!)
    : StatusColorSystem.getColorBlindStagePattern(stage!);

  const accessibilityAttrs = isStatus
    ? StatusColorSystem.getAccessibilityAttributes(status!)
    : StatusColorSystem.getStageAccessibilityAttributes(stage!);

  // Check user preferences
  const prefersHighContrast = StatusColorSystem.prefersHighContrast();
  const prefersReducedMotion = StatusColorSystem.prefersReducedMotion();

  // Generate unique IDs for accessibility
  const descriptionId = `${isStatus ? 'status' : 'stage'}-description-${currentValue}`;
  const symbolId = `${isStatus ? 'status' : 'stage'}-symbol-${currentValue}`;

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2',
  };

  // Pattern classes for color-blind users
  const patternClasses = showPattern ? `status-badge-with-pattern ${pattern.cssClass}` : '';

  // High contrast classes
  const highContrastClasses = prefersHighContrast 
    ? 'border-2 border-current font-semibold' 
    : '';

  return (
    <div className="inline-flex items-center gap-1">
      {/* Symbol indicator for color-blind users */}
      {showSymbol && (
        <span
          id={symbolId}
          className="status-symbol"
          data-symbol={pattern.symbol}
          aria-hidden="true"
        />
      )}

      {/* Main badge */}
      <Badge
        variant={variant || colorConfig.tailwind.badge as any}
        className={cn(
          sizeClasses[size],
          patternClasses,
          highContrastClasses,
          'transition-all duration-200',
          prefersReducedMotion && 'transition-none',
          className
        )}
        {...accessibilityAttrs}
        style={{
          backgroundColor: prefersHighContrast 
            ? colorConfig.highContrast.primary 
            : colorConfig.secondary,
          color: prefersHighContrast 
            ? colorConfig.highContrast.text 
            : colorConfig.text,
          borderColor: prefersHighContrast 
            ? colorConfig.highContrast.border 
            : colorConfig.border,
        }}
      >
        {children || semanticInfo.label}
      </Badge>

      {/* Screen reader description */}
      <span id={descriptionId} className="sr-only">
        {semanticInfo.screenReaderText}
      </span>
    </div>
  );
};

/**
 * Status Badge specifically for Order Status
 */
export const OrderStatusBadge: React.FC<Omit<AccessibleStatusBadgeProps, 'stage'> & { status: OrderStatus }> = (props) => (
  <AccessibleStatusBadge {...props} />
);

/**
 * Stage Badge specifically for Business Stage
 */
export const BusinessStageBadge: React.FC<Omit<AccessibleStatusBadgeProps, 'status'> & { stage: BusinessStage }> = (props) => (
  <AccessibleStatusBadge {...props} />
);

/**
 * Status Legend Component
 * Shows all possible statuses with their colors, patterns, and symbols
 * Useful for helping users understand the color coding system
 */
interface StatusLegendProps {
  type: 'status' | 'stage';
  className?: string;
}

export const StatusLegend: React.FC<StatusLegendProps> = ({ type, className }) => {
  const items = type === 'status' 
    ? Object.values(OrderStatus)
    : Object.values(BusinessStage);

  return (
    <div 
      className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2', className)}
      role="group"
      aria-label={`${type} legend`}
    >
      {items.map((item) => (
        <div key={item} className="flex items-center gap-2 text-sm">
          {type === 'status' ? (
            <OrderStatusBadge 
              status={item as OrderStatus} 
              size="sm" 
              showSymbol={true}
              showPattern={false}
            />
          ) : (
            <BusinessStageBadge 
              stage={item as BusinessStage} 
              size="sm" 
              showSymbol={true}
              showPattern={false}
            />
          )}
          <span className="text-muted-foreground">
            {item.replace(/_/g, ' ').toLowerCase()}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * Accessibility Information Component
 * Provides information about the accessibility features
 */
export const AccessibilityInfo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('text-sm text-muted-foreground space-y-2', className)}>
      <h4 className="font-medium text-foreground">Accessibility Features</h4>
      <ul className="space-y-1 list-disc list-inside">
        <li>Colors meet WCAG 2.1 AA contrast standards (4.5:1 minimum)</li>
        <li>Symbols and patterns provide non-color identification</li>
        <li>High contrast mode automatically detected and applied</li>
        <li>Screen reader descriptions for all status indicators</li>
        <li>Keyboard navigation support with focus indicators</li>
        <li>Reduced motion preferences respected</li>
      </ul>
    </div>
  );
};

export default AccessibleStatusBadge;