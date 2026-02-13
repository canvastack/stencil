/**
 * NegotiationTimeline Component
 * 
 * Visual timeline of all negotiation rounds.
 * Shows the progression of offers between admin and vendor.
 * 
 * Features:
 * - Color-coded by who made offer (green=admin, orange=vendor, blue=admin counter)
 * - Shows amount, date, notes for each round
 * - Visual connection lines between rounds
 * - Responsive design
 * - Current round highlight
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Clock,
  User,
  Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface NegotiationRound {
  round: number;
  type: 'initial' | 'vendor_counter' | 'admin_counter' | 'accepted' | 'rejected';
  offer: number | {
    total_counter: number;
    items?: any[];
  };
  notes?: string;
  timestamp: string;
  user_id?: number;
}

interface NegotiationTimelineProps {
  history: NegotiationRound[];
  currentRound: number;
  maxRounds?: number;
  currency?: string;
  className?: string;
}

export default function NegotiationTimeline({
  history,
  currentRound,
  maxRounds = 5,
  currency = 'IDR',
  className,
}: NegotiationTimelineProps) {
  /**
   * Format currency
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  /**
   * Get round config
   */
  const getRoundConfig = (type: NegotiationRound['type']) => {
    switch (type) {
      case 'initial':
        return {
          icon: DollarSign,
          label: 'Initial Offer',
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          borderColor: 'border-green-300 dark:border-green-700',
          iconBg: 'bg-green-500',
          actor: 'PT CEX',
          actorIcon: Building2,
        };
      case 'vendor_counter':
        return {
          icon: RefreshCw,
          label: 'Vendor Counter',
          color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
          borderColor: 'border-orange-300 dark:border-orange-700',
          iconBg: 'bg-orange-500',
          actor: 'Vendor',
          actorIcon: User,
        };
      case 'admin_counter':
        return {
          icon: RefreshCw,
          label: 'Admin Counter',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          borderColor: 'border-blue-300 dark:border-blue-700',
          iconBg: 'bg-blue-500',
          actor: 'PT CEX Admin',
          actorIcon: Building2,
        };
      case 'accepted':
        return {
          icon: CheckCircle,
          label: 'Accepted',
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          borderColor: 'border-green-300 dark:border-green-700',
          iconBg: 'bg-green-600',
          actor: 'Final',
          actorIcon: CheckCircle,
        };
      case 'rejected':
        return {
          icon: XCircle,
          label: 'Rejected',
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          borderColor: 'border-red-300 dark:border-red-700',
          iconBg: 'bg-red-600',
          actor: 'Final',
          actorIcon: XCircle,
        };
      default:
        return {
          icon: DollarSign,
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
          borderColor: 'border-gray-300 dark:border-gray-700',
          iconBg: 'bg-gray-500',
          actor: 'System',
          actorIcon: User,
        };
    }
  };

  /**
   * Extract offer amount
   */
  const getOfferAmount = (offer: number | { total_counter: number; items?: any[] }): number => {
    if (typeof offer === 'number') {
      return offer;
    }
    return offer.total_counter;
  };

  return (
    <Card className={cn('border-2', className)}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Negotiation Timeline</h3>
              <p className="text-sm text-muted-foreground">
                Round {currentRound} of {maxRounds}
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              {history.length} {history.length === 1 ? 'Round' : 'Rounds'}
            </Badge>
          </div>

          {/* Timeline */}
          <div className="relative space-y-6">
            {/* Vertical Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

            {/* Timeline Items */}
            {history.map((round, index) => {
              const config = getRoundConfig(round.type);
              const Icon = config.icon;
              const ActorIcon = config.actorIcon;
              const amount = getOfferAmount(round.offer);
              const isLast = index === history.length - 1;
              const isCurrent = round.round === currentRound;

              return (
                <div key={index} className="relative pl-16">
                  {/* Icon Circle */}
                  <div className={cn(
                    'absolute left-0 w-12 h-12 rounded-full flex items-center justify-center',
                    config.iconBg,
                    isCurrent && 'ring-4 ring-primary/20'
                  )}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  {/* Content Card */}
                  <Card className={cn(
                    'border-2',
                    config.borderColor,
                    isCurrent && 'ring-2 ring-primary'
                  )}>
                    <CardContent className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={config.color}>
                              {config.label}
                            </Badge>
                            {isCurrent && (
                              <Badge variant="default" className="text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ActorIcon className="h-4 w-4" />
                            <span>{config.actor}</span>
                            <span>•</span>
                            <Clock className="h-4 w-4" />
                            <span>{format(new Date(round.timestamp), 'MMM d, yyyy h:mm a')}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Round {round.round}</p>
                          <p className="text-lg font-bold">
                            {formatCurrency(amount)}
                          </p>
                        </div>
                      </div>

                      {/* Notes */}
                      {round.notes && (
                        <div className="pt-3 border-t">
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {round.notes}
                          </p>
                        </div>
                      )}

                      {/* Item Count (if available) */}
                      {typeof round.offer === 'object' && round.offer.items && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            {round.offer.items.length} {round.offer.items.length === 1 ? 'item' : 'items'} included
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Connector to next round */}
                  {!isLast && (
                    <div className="absolute left-6 top-12 w-0.5 h-6 bg-border" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress Indicator */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Negotiation Progress</p>
              <p className="text-sm text-muted-foreground">
                {currentRound} / {maxRounds} rounds
              </p>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all duration-300"
                style={{ width: `${(currentRound / maxRounds) * 100}%` }}
              />
            </div>
            {currentRound >= maxRounds && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Maximum rounds reached
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
