/**
 * StatisticsCard Component
 * 
 * Reusable card component for displaying statistics with icon and label.
 * Supports different variants for visual distinction.
 * 
 * Requirements: 4.2
 */

import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatisticsCardProps {
  /**
   * The main statistic value to display
   */
  value: string | number;
  
  /**
   * Label describing the statistic
   */
  label: string;
  
  /**
   * Optional description or subtitle
   */
  description?: string;
  
  /**
   * Icon component from lucide-react
   */
  icon?: LucideIcon;
  
  /**
   * Visual variant for the card
   * - default: neutral gray
   * - warning: orange/yellow for attention
   * - success: green for positive metrics
   * - danger: red for critical metrics
   */
  variant?: 'default' | 'warning' | 'success' | 'danger';
  
  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * Get variant-specific styles for the card
 */
const getVariantStyles = (variant: StatisticsCardProps['variant']) => {
  switch (variant) {
    case 'warning':
      return {
        border: 'border-orange-200 dark:border-orange-900',
        title: 'text-orange-600 dark:text-orange-400',
        icon: 'text-orange-600 dark:text-orange-400',
        value: 'text-orange-600 dark:text-orange-400',
      };
    case 'success':
      return {
        border: 'border-green-200 dark:border-green-900',
        title: 'text-green-600 dark:text-green-400',
        icon: 'text-green-600 dark:text-green-400',
        value: 'text-green-600 dark:text-green-400',
      };
    case 'danger':
      return {
        border: 'border-red-200 dark:border-red-900',
        title: 'text-red-600 dark:text-red-400',
        icon: 'text-red-600 dark:text-red-400',
        value: 'text-red-600 dark:text-red-400',
      };
    default:
      return {
        border: '',
        title: 'text-muted-foreground',
        icon: 'text-muted-foreground',
        value: '',
      };
  }
};

export default function StatisticsCard({
  value,
  label,
  description,
  icon: Icon,
  variant = 'default',
  className,
}: StatisticsCardProps) {
  const styles = getVariantStyles(variant);

  return (
    <Card 
      className={cn(
        'hover:shadow-md transition-shadow',
        styles.border,
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className={cn('text-sm font-medium', styles.title)}>
          {label}
        </CardTitle>
        {Icon && (
          <Icon className={cn('h-4 w-4', styles.icon)} />
        )}
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold', styles.value)}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
