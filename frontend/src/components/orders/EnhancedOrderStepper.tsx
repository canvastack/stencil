/**
 * Enhanced Order Stepper Component
 * 
 * Generic order stepper that supports business workflow
 * Displays order progress with business-specific stages and context
 * Supports Interactive Stage Clicking for detailed stage information
 * 
 * COMPLIANCE:
 * - ✅ NO MOCK DATA: All data from OrderProgressCalculator
 * - ✅ BUSINESS ALIGNMENT: Follows business cycle plan
 * - ✅ GENERIC NAMING: Scalable component architecture
 * - ✅ INTERACTIVE: Clickable stages for detailed information
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  FileText,
  Search,
  MessageSquare,
  FileCheck,
  CreditCard,
  DollarSign,
  Cog,
  Shield,
  Truck,
  CheckCircle,
  ChevronRight,
  Sparkles,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { OrderStatus } from '@/types/order';
import { 
  OrderProgressCalculator, 
  BusinessStage, 
  type OrderProgressInfo,
  type BusinessStageInfo 
} from '@/utils/OrderProgressCalculator';
import { StatusColorSystem } from '@/utils/StatusColorSystem';
import StageHelpTooltip from './StageHelpTooltip';

interface EnhancedOrderStepperProps {
  currentStatus: OrderStatus;
  showLabels?: boolean;
  showDescription?: boolean;
  useIndonesian?: boolean;
  compact?: boolean;
  className?: string;
  onStageClick?: (stage: BusinessStage) => void;
  timeline?: any[];
  onQuickAction?: (stage: BusinessStage, actionType: 'advance' | 'complete', note: string) => Promise<void>;
  isLoading?: boolean;
}

interface QuickAction {
  label: string;
  icon: React.ComponentType<any>;
  onClick: () => void;
  variant: 'default' | 'secondary' | 'outline';
}

const STAGE_ICONS: Record<BusinessStage, React.ComponentType<any>> = {
  [BusinessStage.DRAFT]: FileText,
  [BusinessStage.PENDING]: Clock,
  [BusinessStage.VENDOR_SOURCING]: Search,
  [BusinessStage.VENDOR_NEGOTIATION]: MessageSquare,
  [BusinessStage.CUSTOMER_QUOTE]: FileCheck,
  [BusinessStage.AWAITING_PAYMENT]: CreditCard,
  [BusinessStage.PARTIAL_PAYMENT]: DollarSign,
  [BusinessStage.FULL_PAYMENT]: CheckCircle2,
  [BusinessStage.IN_PRODUCTION]: Cog,
  [BusinessStage.QUALITY_CONTROL]: Shield,
  [BusinessStage.SHIPPING]: Truck,
  [BusinessStage.COMPLETED]: CheckCircle,
};

// Timeline Skeleton Component
function TimelineSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="space-y-4">
        {/* Progress Bar Skeleton */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>

        {/* Current Stage Skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>

        {/* Estimated Completion Skeleton */}
        <Skeleton className="h-3 w-40" />
      </div>
    );
  }

  return (
    <Card className="p-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>

      {/* Progress Bar Skeleton */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-3 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Timeline Stages Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((index) => (
          <div key={index} className="relative">
            <div className="flex items-start gap-4">
              {/* Stage Icon Skeleton */}
              <div className="relative flex-shrink-0">
                <Skeleton className="w-10 h-10 rounded-full" />
                {/* Connector Line Skeleton */}
                {index < 5 && (
                  <div className="absolute left-1/2 top-10 w-0.5 h-8 bg-gray-200 -translate-x-px" />
                )}
              </div>

              {/* Stage Content Skeleton */}
              <div className="flex-1 pb-8 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                
                {/* Current stage additional skeleton */}
                {index === 2 && (
                  <div className="mt-3 p-3 bg-muted/20 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <div className="flex gap-2">
                        <Skeleton className="h-7 w-20" />
                        <Skeleton className="h-7 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-3 w-40" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Skeleton */}
      <div className="mt-6 pt-6 border-t">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function EnhancedOrderStepper({
  currentStatus,
  showLabels = true,
  showDescription = false,
  useIndonesian = true,
  compact = false,
  className,
  onStageClick,
  timeline = [],
  onQuickAction,
  isLoading = false
}: EnhancedOrderStepperProps) {
  // Show loading skeleton if data is loading
  if (isLoading) {
    return <TimelineSkeleton compact={compact} />;
  }
  // Calculate progress using OrderProgressCalculator
  const progressInfo: OrderProgressInfo = OrderProgressCalculator.calculateProgress(currentStatus);
  const allStages: BusinessStageInfo[] = OrderProgressCalculator.getAllStageInfo();

  const getStageStatus = (stage: BusinessStage): 'completed' | 'current' | 'upcoming' | 'skipped' => {
    if (progressInfo.completedStages.includes(stage)) {
      return 'completed';
    }
    if (stage === progressInfo.currentStage) {
      return 'current';
    }
    return 'upcoming';
  };

  const getStageColorClasses = (stage: BusinessStage, status: 'completed' | 'current' | 'upcoming' | 'skipped') => {
    const colorConfig = StatusColorSystem.getTimelineStageColor(stage, status);
    
    return {
      container: cn(
        "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300",
        colorConfig.tailwind.bg,
        colorConfig.tailwind.text,
        colorConfig.tailwind.border,
        status === 'current' && "ring-2 ring-offset-2 ring-primary/20 shadow-lg",
        status === 'completed' && "shadow-md"
      ),
      text: cn(
        status === 'completed' ? 'text-green-700' : 
        status === 'current' ? 'text-primary' : 'text-muted-foreground'
      ),
      description: cn(
        "text-sm transition-colors",
        status === 'completed' ? 'text-green-600' : 
        status === 'current' ? 'text-foreground' : 'text-muted-foreground'
      )
    };
  };

  // Check if stage needs help tooltip (complex stages)
  const stageNeedsHelp = (stage: BusinessStage): boolean => {
    const complexStages = [
      BusinessStage.VENDOR_SOURCING,
      BusinessStage.VENDOR_NEGOTIATION,
      BusinessStage.CUSTOMER_QUOTE,
      BusinessStage.IN_PRODUCTION,
      BusinessStage.QUALITY_CONTROL
    ];
    return complexStages.includes(stage);
  };

  const getConnectorColor = (index: number) => {
    return index < progressInfo.stageIndex ? 'bg-green-500' : 'bg-gray-200';
  };

  const getContextSensitiveActionLabel = (stage: BusinessStage): string => {
    switch (stage) {
      case BusinessStage.DRAFT:
        return 'Submit Order';
      case BusinessStage.PENDING:
        return 'Start Processing';
      case BusinessStage.VENDOR_SOURCING:
        return 'Complete Sourcing';
      case BusinessStage.VENDOR_NEGOTIATION:
        return 'Finalize Negotiation';
      case BusinessStage.CUSTOMER_QUOTE:
        return 'Send Quote';
      case BusinessStage.AWAITING_PAYMENT:
        return 'Confirm Payment';
      case BusinessStage.PARTIAL_PAYMENT:
        return 'Complete Payment';
      case BusinessStage.FULL_PAYMENT:
        return 'Start Production';
      case BusinessStage.IN_PRODUCTION:
        return 'Complete Production';
      case BusinessStage.QUALITY_CONTROL:
        return 'Pass QC';
      case BusinessStage.SHIPPING:
        return 'Ship Order';
      case BusinessStage.COMPLETED:
        return 'Mark Complete';
      default:
        return 'Complete Stage';
    }
  };

  const getAdvanceActionLabel = (nextStage: BusinessStage): string => {
    switch (nextStage) {
      case BusinessStage.VENDOR_SOURCING:
        return 'Start Sourcing';
      case BusinessStage.VENDOR_NEGOTIATION:
        return 'Begin Negotiation';
      case BusinessStage.CUSTOMER_QUOTE:
        return 'Prepare Quote';
      case BusinessStage.AWAITING_PAYMENT:
        return 'Request Payment';
      case BusinessStage.IN_PRODUCTION:
        return 'Send to Production';
      case BusinessStage.QUALITY_CONTROL:
        return 'Send to QC';
      case BusinessStage.SHIPPING:
        return 'Prepare Shipping';
      case BusinessStage.COMPLETED:
        return 'Complete Order';
      default:
        return 'Advance Order';
    }
  };

  const getQuickActionForStage = (stage: BusinessStage): QuickAction | null => {
    if (!onQuickAction) return null;

    switch (stage) {
      case BusinessStage.DRAFT:
        return {
          label: 'Submit',
          icon: ArrowRight,
          onClick: () => onQuickAction(BusinessStage.PENDING, 'advance', 'Order submitted for processing'),
          variant: 'default'
        };
      case BusinessStage.PENDING:
        return {
          label: 'Start Sourcing',
          icon: ArrowRight,
          onClick: () => onQuickAction(BusinessStage.VENDOR_SOURCING, 'advance', 'Started vendor sourcing'),
          variant: 'default'
        };
      case BusinessStage.VENDOR_SOURCING:
        return {
          label: 'Complete',
          icon: CheckCircle2,
          onClick: () => onQuickAction(BusinessStage.VENDOR_NEGOTIATION, 'advance', 'Vendor sourcing completed'),
          variant: 'default'
        };
      case BusinessStage.VENDOR_NEGOTIATION:
        return {
          label: 'Finalize',
          icon: CheckCircle2,
          onClick: () => onQuickAction(BusinessStage.CUSTOMER_QUOTE, 'advance', 'Vendor negotiation finalized'),
          variant: 'default'
        };
      case BusinessStage.CUSTOMER_QUOTE:
        return {
          label: 'Send Quote',
          icon: ArrowRight,
          onClick: () => onQuickAction(BusinessStage.AWAITING_PAYMENT, 'advance', 'Quote sent to customer'),
          variant: 'default'
        };
      case BusinessStage.AWAITING_PAYMENT:
        return {
          label: 'Confirm Payment',
          icon: CheckCircle2,
          onClick: () => onQuickAction(BusinessStage.FULL_PAYMENT, 'advance', 'Payment confirmed'),
          variant: 'default'
        };
      case BusinessStage.FULL_PAYMENT:
        return {
          label: 'Start Production',
          icon: ArrowRight,
          onClick: () => onQuickAction(BusinessStage.IN_PRODUCTION, 'advance', 'Order sent to production'),
          variant: 'default'
        };
      case BusinessStage.IN_PRODUCTION:
        return {
          label: 'Complete',
          icon: CheckCircle2,
          onClick: () => onQuickAction(BusinessStage.QUALITY_CONTROL, 'advance', 'Production completed'),
          variant: 'default'
        };
      case BusinessStage.QUALITY_CONTROL:
        return {
          label: 'Pass QC',
          icon: CheckCircle2,
          onClick: () => onQuickAction(BusinessStage.SHIPPING, 'advance', 'Quality control passed'),
          variant: 'default'
        };
      case BusinessStage.SHIPPING:
        return {
          label: 'Ship',
          icon: ArrowRight,
          onClick: () => onQuickAction(BusinessStage.COMPLETED, 'advance', 'Order shipped'),
          variant: 'default'
        };
      default:
        return null;
    }
  };

  const handleStageClick = (stage: BusinessStage) => {
    if (onStageClick) {
      onStageClick(stage);
    }
  };

  const getStageEvent = (stage: BusinessStage) => {
    return timeline.find(event => {
      // Try to map event to stage using the OrderProgressCalculator
      try {
        return OrderProgressCalculator.mapEventToStage(event) === stage;
      } catch (error) {
        // Fallback: try to match by event type or status
        if (event.type === 'status_change' && event.to_status) {
          const eventStage = OrderProgressCalculator.mapStatusToStage(event.to_status);
          return eventStage === stage;
        }
        return false;
      }
    });
  };

  if (compact) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progressInfo.progressPercentage}%</span>
          </div>
          <Progress value={progressInfo.progressPercentage} className="h-2" />
        </div>

        {/* Current Stage Info */}
        <div className="flex items-center gap-3">
          <div className={getStageColorClasses(progressInfo.currentStage, 'current').container}>
            {React.createElement(STAGE_ICONS[progressInfo.currentStage], { 
              className: "w-4 h-4" 
            })}
          </div>
          <div>
            <p className="font-medium">
              {useIndonesian 
                ? OrderProgressCalculator.getStageInfo(progressInfo.currentStage).indonesianLabel
                : OrderProgressCalculator.getStageInfo(progressInfo.currentStage).label
              }
            </p>
            {showDescription && (
              <p className="text-sm text-muted-foreground">
                {useIndonesian 
                  ? OrderProgressCalculator.getStageInfo(progressInfo.currentStage).indonesianDescription
                  : OrderProgressCalculator.getStageInfo(progressInfo.currentStage).description
                }
              </p>
            )}
          </div>
        </div>

        {/* Estimated Completion */}
        {!progressInfo.isTerminal && (
          <div className="text-sm text-muted-foreground">
            Estimasi selesai: {OrderProgressCalculator.estimateCompletionDays(progressInfo.currentStage)} hari
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Order Progress</h3>
          <p className="text-sm text-muted-foreground">
            Business Workflow - {progressInfo.progressPercentage}% Complete
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Stage {progressInfo.stageIndex + 1} of {progressInfo.totalStages}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="relative">
          <Progress value={progressInfo.progressPercentage} className="h-3" />
          {/* Add gradient overlay for better visual appeal */}
          <div 
            className={cn(
              "absolute top-0 left-0 h-3 rounded-full transition-all duration-500",
              `bg-gradient-to-r ${StatusColorSystem.getProgressColor(progressInfo.progressPercentage).gradient}`,
              "opacity-80"
            )}
            style={{ width: `${progressInfo.progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Start</span>
          <span className="font-medium">{progressInfo.progressPercentage}%</span>
          <span>Complete</span>
        </div>
      </div>

      {/* Stepper */}
      <div className="space-y-4">
        {allStages.map((stageInfo, index) => {
          const status = getStageStatus(stageInfo.stage);
          const IconComponent = STAGE_ICONS[stageInfo.stage];
          const isLast = index === allStages.length - 1;
          const stageEvent = getStageEvent(stageInfo.stage);
          const isClickable = onStageClick !== undefined;
          const colorClasses = getStageColorClasses(stageInfo.stage, status);

          return (
            <div key={stageInfo.stage} className="relative">
              <div 
                className={cn(
                  "flex items-start gap-4 transition-all duration-200",
                  isClickable && "cursor-pointer hover:bg-muted/50 hover:shadow-sm rounded-lg p-3 -m-3",
                  isClickable && "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  status === 'current' && "bg-primary/5 rounded-lg p-3 -m-3"
                )}
                onClick={() => handleStageClick(stageInfo.stage)}
                onKeyDown={(e) => {
                  if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleStageClick(stageInfo.stage);
                  }
                }}
                tabIndex={isClickable ? 0 : undefined}
                role={isClickable ? "button" : undefined}
                aria-label={isClickable ? `View details for ${useIndonesian ? stageInfo.indonesianLabel : stageInfo.label}` : undefined}
              >
                {/* Stage Icon */}
                <div className="relative flex-shrink-0">
                  <div className={colorClasses.container}>
                    {status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : status === 'current' ? (
                      <>
                        <IconComponent className="w-5 h-5" />
                        {/* Add subtle animation for current stage */}
                        <div className="absolute inset-0 rounded-full animate-pulse bg-primary/10" />
                      </>
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </div>
                  
                  {/* Connector Line */}
                  {!isLast && (
                    <div className={cn(
                      "absolute left-1/2 top-10 w-0.5 h-8 -translate-x-px transition-all duration-300",
                      getConnectorColor(index)
                    )} />
                  )}
                </div>

                {/* Stage Content */}
                <div className="flex-1 pb-8">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={colorClasses.text}>
                      {useIndonesian ? stageInfo.indonesianLabel : stageInfo.label}
                    </h4>
                    
                    {/* Stage Badges */}
                    <div className="flex gap-1">
                      {stageInfo.isPaymentStage && (
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                          Payment
                        </Badge>
                      )}
                      {stageInfo.isProductionStage && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          Production
                        </Badge>
                      )}
                      {stageInfo.requiresVendor && (
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                          Vendor
                        </Badge>
                      )}
                    </div>

                    {/* Help Tooltip for Complex Stages */}
                    {stageNeedsHelp(stageInfo.stage) && (
                      <StageHelpTooltip stage={stageInfo.stage} side="right">
                        <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-primary cursor-help transition-colors" />
                      </StageHelpTooltip>
                    )}

                    {/* Click indicator */}
                    {isClickable && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>

                  {/* Stage Event Timestamp */}
                  {stageEvent && (
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(stageEvent.timestamp).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}

                  {(showDescription || showLabels) && (
                    <p className={colorClasses.description}>
                      {useIndonesian ? stageInfo.indonesianDescription : stageInfo.description}
                    </p>
                  )}

                  {/* Current Stage Additional Info with Primary Actions */}
                  {status === 'current' && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-primary font-medium">Current Stage</span>
                        </div>
                        
                        {/* Primary Action Buttons */}
                        <div className="flex items-center gap-2">
                          {/* Quick Action Button - One-click for common transitions */}
                          {(() => {
                            const quickAction = getQuickActionForStage(stageInfo.stage);
                            return quickAction ? (
                              <Button
                                size="sm"
                                variant={quickAction.variant}
                                onClick={quickAction.onClick}
                                className="h-7 px-3 text-xs font-medium"
                              >
                                <quickAction.icon className="w-3 h-3 mr-1" />
                                {quickAction.label}
                              </Button>
                            ) : null;
                          })()}
                          
                          {/* Standard Complete Stage Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStageClick(stageInfo.stage)}
                            className="h-7 px-3 text-xs font-medium"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {getContextSensitiveActionLabel(stageInfo.stage)}
                          </Button>
                          
                          {progressInfo.nextStage && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStageClick(progressInfo.nextStage!)}
                              className="h-7 px-3 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10"
                            >
                              <ArrowRight className="w-3 h-3 mr-1" />
                              {getAdvanceActionLabel(progressInfo.nextStage)}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {!progressInfo.isTerminal && (
                        <p className="text-sm text-muted-foreground">
                          Estimasi selesai: {OrderProgressCalculator.estimateCompletionDays(progressInfo.currentStage)} hari
                        </p>
                      )}
                    </div>
                  )}

                  {/* Completed Stage Info */}
                  {status === 'completed' && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Completed</span>
                      {stageEvent && (
                        <span className="text-xs text-muted-foreground">
                          • {new Date(stageEvent.timestamp).toLocaleDateString('id-ID')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-6 border-t">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Completed Stages</p>
            <p className="font-medium">{progressInfo.completedStages.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Current Stage</p>
            <p className="font-medium">
              {useIndonesian 
                ? OrderProgressCalculator.getStageInfo(progressInfo.currentStage).indonesianLabel
                : OrderProgressCalculator.getStageInfo(progressInfo.currentStage).label
              }
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Next Stage</p>
            <p className="font-medium">
              {progressInfo.nextStage 
                ? (useIndonesian 
                    ? OrderProgressCalculator.getStageInfo(progressInfo.nextStage).indonesianLabel
                    : OrderProgressCalculator.getStageInfo(progressInfo.nextStage).label
                  )
                : 'Complete'
              }
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default EnhancedOrderStepper;