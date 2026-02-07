import React from 'react';
import { Order } from '@/types/order';
import { Quote } from '@/types/quote';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface OrderTimelineProps {
  order: Order;
  quote?: Quote;
  showDelayNotification?: boolean;
}

interface TimelineStage {
  id: string;
  label: string;
  description: string;
  status: 'completed' | 'current' | 'pending' | 'delayed';
  date?: string;
}

export function OrderTimeline({ order, quote, showDelayNotification = true }: OrderTimelineProps) {
  // Detect if order is delayed
  const isDelayed = (): boolean => {
    if (!order.estimatedDelivery) return false;
    
    const estimatedDate = new Date(order.estimatedDelivery);
    const now = new Date();
    
    // Check if we're past the estimated delivery date and order is not completed
    if (order.status !== 'completed' && now > estimatedDate) {
      return true;
    }
    
    return false;
  };

  const getDelayDays = (): number => {
    if (!order.estimatedDelivery) return 0;
    
    const estimatedDate = new Date(order.estimatedDelivery);
    const now = new Date();
    
    const diffTime = now.getTime() - estimatedDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const delayed = isDelayed();
  const delayDays = getDelayDays();
  // Map order status to timeline stages
  const getTimelineStages = (): TimelineStage[] => {
    const stages: TimelineStage[] = [
      {
        id: 'order_placed',
        label: 'Order Placed',
        description: 'Your order has been received',
        status: 'completed',
        date: order.createdAt,
      },
      {
        id: 'quote_requested',
        label: 'Quote Requested',
        description: 'Requesting quote from vendor',
        status: 'pending',
      },
      {
        id: 'quote_accepted',
        label: 'Quote Accepted',
        description: 'Quote has been accepted',
        status: 'pending',
      },
      {
        id: 'in_production',
        label: 'In Production',
        description: 'Your order is being produced',
        status: 'pending',
      },
      {
        id: 'shipped',
        label: 'Shipped',
        description: 'Your order has been shipped',
        status: 'pending',
      },
      {
        id: 'delivered',
        label: 'Delivered',
        description: 'Order delivered successfully',
        status: 'pending',
      },
    ];

    // Update stages based on order status
    const statusMap: Record<string, number> = {
      new: 1,
      draft: 1,
      pending: 1,
      vendor_sourcing: 1,
      vendor_negotiation: 2,
      customer_quote: 2,
      awaiting_payment: 2,
      partial_payment: 3,
      full_payment: 3,
      processing: 4,
      in_production: 4,
      quality_control: 4,
      shipping: 5,
      completed: 6,
    };

    const currentStageIndex = statusMap[order.status] || 0;

    // Update stage statuses based on current order status
    stages.forEach((stage, index) => {
      if (index < currentStageIndex) {
        stage.status = 'completed';
      } else if (index === currentStageIndex) {
        // Mark as delayed if order is delayed
        stage.status = delayed ? 'delayed' : 'current';
      } else {
        stage.status = 'pending';
      }
    });

    // Update with quote information if available
    if (quote) {
      if (quote.sent_at) {
        stages[1].status = 'completed';
        stages[1].date = quote.sent_at;
      }

      if (quote.status.value === 'accepted' || quote.responded_at) {
        stages[2].status = 'completed';
        stages[2].date = quote.responded_at || undefined;
      }
    }

    // Update production dates
    if (order.productionStart) {
      stages[3].date = order.productionStart;
    }

    if (order.status === 'shipping' || order.status === 'completed') {
      stages[4].status = 'completed';
    }

    if (order.status === 'completed' && order.actualDelivery) {
      stages[5].status = 'completed';
      stages[5].date = order.actualDelivery;
    }

    return stages;
  };

  const stages = getTimelineStages();

  // Calculate progress percentage
  const completedStages = stages.filter((s) => s.status === 'completed').length;
  const progressPercentage = Math.round((completedStages / stages.length) * 100);

  // Get current stage
  const currentStage = stages.find((s) => s.status === 'current');

  const getStageIcon = (status: TimelineStage['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case 'current':
        return <Clock className="h-6 w-6 text-blue-600 animate-pulse" />;
      case 'delayed':
        return <AlertCircle className="h-6 w-6 text-orange-600" />;
      default:
        return <Circle className="h-6 w-6 text-gray-300" />;
    }
  };

  const getStageColor = (status: TimelineStage['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600';
      case 'current':
        return 'bg-blue-600';
      case 'delayed':
        return 'bg-orange-600';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Progress</CardTitle>
        <CardDescription>
          Track your order through each stage of production and delivery
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Delay Notification */}
        {delayed && showDelayNotification && (
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-orange-900 mb-1">Order Delayed</h4>
                <p className="text-sm text-orange-800">
                  This order is {delayDays} day{delayDays !== 1 ? 's' : ''} past the estimated delivery date.
                  We apologize for the inconvenience and are working to complete your order as soon as possible.
                </p>
                {order.estimatedDelivery && (
                  <p className="text-xs text-orange-700 mt-2">
                    Original estimated delivery: {format(new Date(order.estimatedDelivery), 'MMMM dd, yyyy')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground">{progressPercentage}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Current Stage Badge */}
        {currentStage && (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                currentStage.status === 'delayed'
                  ? 'text-orange-600 border-orange-600'
                  : 'text-blue-600 border-blue-600'
              )}
            >
              Current Stage: {currentStage.label}
              {currentStage.status === 'delayed' && ' (Delayed)'}
            </Badge>
          </div>
        )}

        {/* Estimated Delivery */}
        {order.estimatedDelivery && !delayed && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-semibold text-sm">Estimated Delivery</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(order.estimatedDelivery), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Timeline stages */}
          <div className="space-y-6">
            {stages.map((stage, index) => (
              <div key={stage.id} className="relative flex gap-4">
                {/* Icon */}
                <div className="relative z-10 flex-shrink-0">
                  {getStageIcon(stage.status)}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4
                        className={cn(
                          'font-semibold',
                          stage.status === 'current' && 'text-blue-600',
                          stage.status === 'completed' && 'text-green-600',
                          stage.status === 'delayed' && 'text-orange-600',
                          stage.status === 'pending' && 'text-gray-400'
                        )}
                      >
                        {stage.label}
                      </h4>
                      <p
                        className={cn(
                          'text-sm',
                          stage.status === 'pending' ? 'text-gray-400' : 'text-muted-foreground'
                        )}
                      >
                        {stage.description}
                      </p>
                    </div>

                    {stage.date && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(stage.date), 'MMM dd, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Last Update */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Last updated: {format(new Date(order.updatedAt), 'MMMM dd, yyyy \'at\' h:mm a')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
