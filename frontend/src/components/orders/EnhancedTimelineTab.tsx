/**
 * Enhanced Timeline Tab Component
 * 
 * Displays order timeline with PT CEX business context
 * Uses BusinessTimelineGenerator for proper business flow alignment
 * 
 * COMPLIANCE:
 * - ✅ NO MOCK DATA: All timeline data from real order events
 * - ✅ BUSINESS ALIGNMENT: Follows PT CEX business cycle plan
 * - ✅ STATUS CONSISTENCY: Uses backend-aligned OrderStatus enum
 */

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, 
  User, 
  Building, 
  CreditCard, 
  Package, 
  Truck, 
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { OrderStatus } from '@/types/order';
import { 
  BusinessTimelineGenerator, 
  type BusinessTimelineEvent,
  type TimelineGenerationOptions 
} from '@/utils/BusinessTimelineGenerator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { OrderStatusAnimations, buildAnimationClasses, useOrderStatusAnimations } from '@/utils/OrderStatusAnimations';

interface EnhancedTimelineTabProps {
  orderEvents: any[];
  currentStatus: OrderStatus;
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
  className?: string;
}

const CATEGORY_ICONS = {
  status_change: Clock,
  payment: CreditCard,
  communication: MessageSquare,
  production: Package,
  shipping: Truck,
};

const CATEGORY_COLORS = {
  status_change: 'text-blue-600 bg-blue-100',
  payment: 'text-green-600 bg-green-100',
  communication: 'text-purple-600 bg-purple-100',
  production: 'text-orange-600 bg-orange-100',
  shipping: 'text-cyan-600 bg-cyan-100',
};

const CATEGORY_LABELS = {
  status_change: 'Perubahan Status',
  payment: 'Pembayaran',
  communication: 'Komunikasi',
  production: 'Produksi',
  shipping: 'Pengiriman',
};

const ACTOR_ICONS = {
  system: AlertCircle,
  admin: User,
  customer: User,
  vendor: Building,
};

// Timeline Tab Skeleton Component
function TimelineTabSkeleton() {
  return (
    <Card className="p-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>

      {/* Timeline Stats Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="text-center p-3 bg-muted/50 rounded-lg space-y-2">
            <Skeleton className="h-8 w-8 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>

      <Separator className="mb-6" />

      {/* Timeline Events Skeleton */}
      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map((index) => (
          <div key={index} className="relative">
            <div className="flex gap-4">
              {/* Timeline Icon Skeleton */}
              <div className="relative flex-shrink-0">
                <Skeleton className="w-10 h-10 rounded-full" />
                {/* Connector Line */}
                {index < 5 && (
                  <div className="absolute left-1/2 top-10 w-0.5 h-12 bg-border -translate-x-px" />
                )}
              </div>

              {/* Event Content Skeleton */}
              <div className="flex-1 pb-8">
                <div className="bg-card border rounded-lg p-4 space-y-3">
                  {/* Event Header Skeleton */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-12" />
                      </div>
                    </div>
                  </div>

                  {/* Event Metadata Skeleton */}
                  {index % 2 === 0 && (
                    <div className="p-2 bg-muted/50 rounded space-y-1">
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  )}

                  {/* Next Actions Skeleton */}
                  {index === 1 && (
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="w-4 h-4" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-5/6" />
                        <Skeleton className="h-3 w-4/5" />
                      </div>
                    </div>
                  )}

                  {/* Event Footer Skeleton */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-3 h-3" />
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-1" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-3 h-3" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline Footer Skeleton */}
      <div className="mt-8 pt-6 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((index) => (
              <div key={index} className="flex items-center gap-2">
                <Skeleton className="w-3 h-3 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
    </Card>
  );
}

export function EnhancedTimelineTab({
  orderEvents,
  currentStatus,
  isLoading = false,
  onRefresh,
  className
}: EnhancedTimelineTabProps) {
  // Animation state management
  const { animationState, startAnimation, stopAnimation, getAnimationClasses } = useOrderStatusAnimations('timeline-tab');
  
  // Generate business timeline
  const timelineOptions: TimelineGenerationOptions = {
    useIndonesian: true,
    includeSystemEvents: true,
    includeInternalNotes: false,
    maxEvents: 50
  };

  const businessTimeline = useMemo(() => {
    return BusinessTimelineGenerator.generateTimeline(
      orderEvents,
      currentStatus,
      timelineOptions
    );
  }, [orderEvents, currentStatus]);

  const timelineStats = useMemo(() => {
    return BusinessTimelineGenerator.getTimelineStats(businessTimeline);
  }, [businessTimeline]);

  const formatEventTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} hari yang lalu`;
    } else if (diffHours > 0) {
      return `${diffHours} jam yang lalu`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} menit yang lalu`;
    } else {
      return 'Baru saja';
    }
  };

  const getEventIcon = (event: BusinessTimelineEvent) => {
    const CategoryIcon = CATEGORY_ICONS[event.category];
    const ActorIcon = ACTOR_ICONS[event.actorType];
    
    if (event.isBusinessCritical) {
      return CategoryIcon;
    }
    
    return ActorIcon || Clock;
  };

  const getEventColor = (event: BusinessTimelineEvent) => {
    if (event.isBusinessCritical) {
      return CATEGORY_COLORS[event.category] || 'text-gray-600 bg-gray-100';
    }
    
    return 'text-gray-600 bg-gray-100';
  };

  const renderEventMetadata = (event: BusinessTimelineEvent) => {
    if (!event.metadata || Object.keys(event.metadata).length === 0) {
      return null;
    }

    return (
      <div className="mt-2 p-2 bg-muted/50 rounded text-xs space-y-1" role="region" aria-labelledby={`metadata-${event.id}`}>
        <span id={`metadata-${event.id}`} className="sr-only">Event metadata</span>
        {event.metadata.amount && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jumlah:</span>
            <span className="font-medium" aria-label={`Amount: ${event.metadata.amount.toLocaleString('id-ID')} Rupiah`}>Rp {event.metadata.amount.toLocaleString('id-ID')}</span>
          </div>
        )}
        {event.metadata.payment_method && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Metode:</span>
            <span className="font-medium" aria-label={`Payment method: ${event.metadata.payment_method}`}>{event.metadata.payment_method}</span>
          </div>
        )}
        {event.metadata.tracking_number && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tracking:</span>
            <span className="font-mono text-xs" aria-label={`Tracking number: ${event.metadata.tracking_number}`}>{event.metadata.tracking_number}</span>
          </div>
        )}
        {event.metadata.vendor_id && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vendor ID:</span>
            <span className="font-mono text-xs" aria-label={`Vendor ID: ${event.metadata.vendor_id}`}>{event.metadata.vendor_id}</span>
          </div>
        )}
        {event.metadata.synthetic && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Info className="w-3 h-3" aria-hidden="true" />
            <span aria-label="This is an automatically generated event based on status">Event otomatis berdasarkan status</span>
          </div>
        )}
      </div>
    );
  };

  const renderNextActions = (event: BusinessTimelineEvent) => {
    if (!event.nextActions || event.nextActions.length === 0) {
      return null;
    }

    return (
      <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10" role="region" aria-labelledby={`next-actions-${event.id}`}>
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-primary" aria-hidden="true" />
          <span className="text-sm font-medium text-primary" id={`next-actions-${event.id}`}>Tindakan Selanjutnya</span>
        </div>
        <ul className="text-sm space-y-1" role="list" aria-label="Next actions for this event">
          {event.nextActions.map((action, index) => (
            <li key={index} className="flex items-center gap-2" role="listitem">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" aria-hidden="true" />
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  if (isLoading) {
    return <TimelineTabSkeleton />;
  }

  return (
    <Card className={cn(buildAnimationClasses("p-4 sm:p-6", "fadeIn"), className)} role="region" aria-labelledby="timeline-title">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-semibold" id="timeline-title">Order Timeline</h3>
          <p className="text-sm text-muted-foreground" aria-label={`PT CEX Business Flow with ${businessTimeline.length} events`}>
            PT CEX Business Flow - {businessTimeline.length} events
          </p>
        </div>
        {onRefresh && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={async () => {
              try {
                await onRefresh();
                toast.success('Timeline refreshed successfully');
              } catch (error) {
                toast.error('Failed to refresh timeline');
              }
            }}
            disabled={isLoading}
            aria-label="Refresh timeline data"
            className="w-full sm:w-auto min-h-[44px] touch-manipulation"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
            )}
            <span className="text-sm font-medium">Refresh</span>
          </Button>
        )}
      </div>

      {/* Timeline Stats - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6" role="group" aria-label="Timeline statistics">
        <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg" role="article" aria-labelledby="total-events-stat">
          <p className="text-lg sm:text-2xl font-bold text-primary" id="total-events-stat" aria-label={`${timelineStats.totalEvents} total events`}>{timelineStats.totalEvents}</p>
          <p className="text-xs text-muted-foreground">Total Events</p>
        </div>
        <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg" role="article" aria-labelledby="critical-events-stat">
          <p className="text-lg sm:text-2xl font-bold text-orange-600" id="critical-events-stat" aria-label={`${timelineStats.businessCriticalEvents} critical events`}>{timelineStats.businessCriticalEvents}</p>
          <p className="text-xs text-muted-foreground">Critical Events</p>
        </div>
        <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg" role="article" aria-labelledby="action-required-stat">
          <p className="text-lg sm:text-2xl font-bold text-red-600" id="action-required-stat" aria-label={`${timelineStats.actionRequiredEvents} events requiring action`}>{timelineStats.actionRequiredEvents}</p>
          <p className="text-xs text-muted-foreground">Action Required</p>
        </div>
        <div className="text-center p-2 sm:p-3 bg-muted/50 rounded-lg" role="article" aria-labelledby="avg-time-stat">
          <p className="text-lg sm:text-2xl font-bold text-green-600" id="avg-time-stat" aria-label={`${timelineStats.averageStageTime} average days per stage`}>{timelineStats.averageStageTime}</p>
          <p className="text-xs text-muted-foreground">Avg Days/Stage</p>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Timeline Events */}
      {businessTimeline.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground" role="status" aria-label="No timeline events available">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
          <p>No timeline events available</p>
          <p className="text-sm">Events will appear as the order progresses</p>
        </div>
      ) : (
        <div className={buildAnimationClasses("space-y-4 sm:space-y-6", "fadeInUp")} role="list" aria-label="Timeline events">
          {businessTimeline.map((event, index) => {
            const EventIcon = getEventIcon(event);
            const isLast = index === businessTimeline.length - 1;

            return (
              <div key={event.id} className={buildAnimationClasses("relative", "timelineEventEntering")} role="listitem" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex gap-3 sm:gap-4">
                  {/* Timeline Icon - Mobile Optimized */}
                  <div className="relative flex-shrink-0">
                    <div className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-background flex items-center justify-center transition-all duration-300 hover:scale-110 touch-manipulation",
                      getEventColor(event)
                    )} aria-hidden="true">
                      <EventIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    
                    {/* Connector Line */}
                    {!isLast && (
                      <div className="absolute left-1/2 top-8 sm:top-10 w-0.5 h-8 sm:h-12 bg-border -translate-x-px" aria-hidden="true" />
                    )}
                  </div>

                  {/* Event Content - Mobile Optimized */}
                  <div className="flex-1 pb-6 sm:pb-8 min-w-0">
                    <div className={buildAnimationClasses("bg-card border rounded-lg p-3 sm:p-4 transition-all duration-200 hover:shadow-md hover:border-primary/30 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", event.isBusinessCritical ? "timelineEventHighlight" : undefined)} role="article" aria-labelledby={`event-${event.id}-title`}>
                      {/* Event Header - Mobile Optimized */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground text-sm sm:text-base break-words" id={`event-${event.id}-title`}>
                            {event.indonesianTitle}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1 break-words" aria-label={`Event description: ${event.indonesianDescription}`}>
                            {event.indonesianDescription}
                          </p>
                        </div>
                        
                        <div className="flex flex-col sm:items-end gap-2" role="group" aria-label="Event badges">
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            <Badge variant="outline" className="text-xs" aria-label={`Category: ${CATEGORY_LABELS[event.category] || 'Aktivitas'}`}>
                              {CATEGORY_LABELS[event.category] || 'Aktivitas'}
                            </Badge>
                            {event.isBusinessCritical && (
                              <Badge variant="destructive" className="text-xs" aria-label="This is a critical business event">
                                Critical
                              </Badge>
                            )}
                            {event.requiresAction && (
                              <Badge variant="default" className="text-xs" aria-label="This event requires action">
                                Action Required
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Event Metadata */}
                      {renderEventMetadata(event)}

                      {/* Next Actions */}
                      {renderNextActions(event)}

                      {/* Event Footer - Mobile Optimized */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 sm:mt-4 pt-3 border-t text-xs text-muted-foreground gap-2" role="group" aria-label="Event metadata">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <div className="flex items-center gap-1">
                            {React.createElement(ACTOR_ICONS[event.actorType] || User, { 
                              className: "w-3 h-3 flex-shrink-0",
                              "aria-hidden": "true"
                            })}
                            <span aria-label={`Performed by: ${event.actor}`}>{event.actor}</span>
                          </div>
                          <span className="hidden sm:inline" aria-hidden="true">•</span>
                          <span className="capitalize" aria-label={`Actor type: ${event.actorType}`}>{event.actorType}</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Clock className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                          <span aria-label={`Time: ${formatEventTime(event.timestamp)}`}>{formatEventTime(event.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline Footer - Mobile Optimized */}
      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t" role="group" aria-label="Timeline legend and information">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground gap-3">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4" role="group" aria-label="Status legend">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0" aria-hidden="true" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0" aria-hidden="true" />
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full flex-shrink-0" aria-hidden="true" />
              <span>Pending</span>
            </div>
          </div>
          <div className="text-xs text-center sm:text-right" aria-label="Timeline generation information">
            Timeline generated based on PT CEX business workflow
          </div>
        </div>
      </div>
    </Card>
  );
}

export default EnhancedTimelineTab;