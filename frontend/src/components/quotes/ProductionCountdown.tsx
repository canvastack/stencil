/**
 * ProductionCountdown Component
 * 
 * Displays production progress with countdown timer for vendor quote acceptance.
 * Shows days elapsed, days remaining, progress bar, and overdue warnings.
 * 
 * COMPLIANCE:
 * - ✅ NO MOCK DATA: All data from real quote acceptance records
 * - ✅ RESPONSIVE: Mobile-first design with touch-friendly interactions
 * - ✅ ACCESSIBLE: WCAG 2.1 compliant with proper ARIA labels
 */

import React from 'react';
import { differenceInDays, addDays, format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductionCountdownProps {
  acceptedDate: string;
  estimatedDays: number;
  className?: string;
}

export function ProductionCountdown({ 
  acceptedDate, 
  estimatedDays,
  className 
}: ProductionCountdownProps) {
  // Parse dates
  const accepted = new Date(acceptedDate);
  const expectedDelivery = addDays(accepted, estimatedDays);
  const now = new Date();
  
  // Calculate progress metrics
  const daysElapsed = differenceInDays(now, accepted);
  const daysRemaining = estimatedDays - daysElapsed;
  const progress = Math.min((daysElapsed / estimatedDays) * 100, 100);
  const isOverdue = daysRemaining < 0;
  const isApproachingDeadline = daysRemaining > 0 && daysRemaining <= 3;
  
  // Determine status colors
  const getStatusColor = () => {
    if (isOverdue) return 'text-red-600 dark:text-red-400';
    if (isApproachingDeadline) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };
  
  const getProgressColor = () => {
    if (isOverdue) return 'bg-red-500';
    if (isApproachingDeadline) return 'bg-orange-500';
    return 'bg-green-500';
  };
  
  return (
    <div className={cn("space-y-3", className)} role="region" aria-labelledby="production-countdown-title">
      <span id="production-countdown-title" className="sr-only">Production countdown information</span>
      
      {/* Date Range */}
      <div className="flex justify-between text-sm" role="group" aria-label="Production date range">
        <div>
          <p className="text-muted-foreground">Accepted</p>
          <p className="font-medium" aria-label={`Accepted on ${format(accepted, 'MMMM d, yyyy')}`}>
            {format(accepted, 'MMM d, yyyy')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground">Expected</p>
          <p className="font-medium" aria-label={`Expected delivery on ${format(expectedDelivery, 'MMMM d, yyyy')}`}>
            {format(expectedDelivery, 'MMM d, yyyy')}
          </p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="space-y-1" role="group" aria-label="Production progress">
        <Progress 
          value={progress} 
          className="h-3"
          indicatorClassName={getProgressColor()}
          aria-label={`Production progress: ${Math.round(progress)} percent complete`}
        />
        <p className="text-xs text-muted-foreground text-right" aria-hidden="true">
          {Math.round(progress)}% complete
        </p>
      </div>
      
      {/* Days Counter */}
      <div className="flex justify-between items-center" role="group" aria-label="Production timeline">
        <div>
          <p className="text-sm text-muted-foreground">Days Elapsed</p>
          <p className="text-2xl font-bold" aria-label={`${daysElapsed} days have elapsed`}>
            {daysElapsed}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Days Remaining</p>
          <p 
            className={cn("text-2xl font-bold", getStatusColor())}
            aria-label={isOverdue ? `Overdue by ${Math.abs(daysRemaining)} days` : `${daysRemaining} days remaining`}
          >
            {daysRemaining > 0 ? daysRemaining : 'Overdue'}
          </p>
        </div>
      </div>
      
      {/* Overdue Warning */}
      {isOverdue && (
        <Alert 
          variant="destructive" 
          className="animate-in fade-in-50 duration-300"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            Production is <strong>{Math.abs(daysRemaining)} days overdue</strong>! 
            Please contact the vendor for an update.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Approaching Deadline Warning */}
      {isApproachingDeadline && (
        <Alert 
          className="border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-100 animate-in fade-in-50 duration-300"
          role="alert"
          aria-live="polite"
        >
          <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" aria-hidden="true" />
          <AlertDescription>
            Approaching deadline - only <strong>{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</strong> remaining
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default ProductionCountdown;
