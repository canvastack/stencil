import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle,
  Package,
  AlertCircle,
  TrendingUp,
  ClipboardCheck,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useState } from 'react';

interface RecentActivityFeedProps {
  activities: {
    id: string;
    type: 'quote_accepted' | 'production_update' | 'delivery' | 'overdue_alert' | 'qc_inspection';
    title: string;
    description: string;
    timestamp: string;
    orderId?: string;
  }[];
  onActivityClick: (activityId: string) => void;
  loading?: boolean;
}

const ACTIVITY_CONFIG = {
  quote_accepted: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-950',
    label: 'Quote Accepted',
  },
  production_update: {
    icon: Package,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-950',
    label: 'Production Update',
  },
  delivery: {
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-950',
    label: 'Delivery',
  },
  overdue_alert: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-950',
    label: 'Overdue Alert',
  },
  qc_inspection: {
    icon: ClipboardCheck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-950',
    label: 'QC Inspection',
  },
};

export function RecentActivityFeed({ activities, onActivityClick, loading }: RecentActivityFeedProps) {
  const [filterType, setFilterType] = useState<string>('all');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter activities
  const filteredActivities =
    filterType === 'all'
      ? activities
      : activities.filter((activity) => activity.type === filterType);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="quote_accepted">Quote Accepted</SelectItem>
              <SelectItem value="production_update">Production Updates</SelectItem>
              <SelectItem value="delivery">Deliveries</SelectItem>
              <SelectItem value="overdue_alert">Overdue Alerts</SelectItem>
              <SelectItem value="qc_inspection">QC Inspections</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {filteredActivities.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No activities found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => {
                const config = ACTIVITY_CONFIG[activity.type];
                const Icon = config.icon;

                return (
                  <button
                    key={activity.id}
                    onClick={() => onActivityClick(activity.id)}
                    className="flex gap-3 w-full text-left hover:bg-muted/50 p-3 rounded-lg transition-colors"
                  >
                    <div className={`${config.bgColor} p-2 rounded-full h-fit`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm leading-tight">
                          {activity.title}
                        </p>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(parseISO(activity.timestamp), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
