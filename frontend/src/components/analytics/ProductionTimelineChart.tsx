import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface ProductionTimelineChartProps {
  data: {
    date: string;
    accepted: number;
    completed: number;
    overdue: number;
  }[];
  timeRange: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange: (range: '7d' | '30d' | '90d' | '1y') => void;
  loading?: boolean;
}

const timeRangeOptions = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '1y', label: '1Y' },
] as const;

export function ProductionTimelineChart({
  data,
  timeRange,
  onTimeRangeChange,
  loading,
}: ProductionTimelineChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <div className="flex gap-2">
              {timeRangeOptions.map((option) => (
                <Skeleton key={option.value} className="h-8 w-12" />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Format data for display
  const formattedData = data.map((item) => ({
    ...item,
    displayDate: format(parseISO(item.date), 'MMM dd'),
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Production Timeline</CardTitle>
          <div className="flex gap-2">
            {timeRangeOptions.map((option) => (
              <Button
                key={option.value}
                variant={timeRange === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onTimeRangeChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="displayDate"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
              }}
            />
            <Line
              type="monotone"
              dataKey="accepted"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name="Accepted"
              dot={{ fill: 'hsl(var(--primary))' }}
            />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={2}
              name="Completed"
              dot={{ fill: 'hsl(142, 76%, 36%)' }}
            />
            <Line
              type="monotone"
              dataKey="overdue"
              stroke="hsl(0, 84%, 60%)"
              strokeWidth={2}
              name="Overdue"
              dot={{ fill: 'hsl(0, 84%, 60%)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
