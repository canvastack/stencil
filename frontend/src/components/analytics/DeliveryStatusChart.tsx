import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DeliveryStatusChartProps {
  data: {
    status: 'on_track' | 'approaching' | 'overdue' | 'completed';
    count: number;
    percentage: number;
  }[];
  onStatusClick: (status: string) => void;
  loading?: boolean;
}

const STATUS_CONFIG = {
  on_track: {
    label: 'On Track',
    color: 'hsl(142, 76%, 36%)', // green
  },
  approaching: {
    label: 'Approaching Deadline',
    color: 'hsl(38, 92%, 50%)', // orange
  },
  overdue: {
    label: 'Overdue',
    color: 'hsl(0, 84%, 60%)', // red
  },
  completed: {
    label: 'Completed',
    color: 'hsl(221, 83%, 53%)', // blue
  },
};

export function DeliveryStatusChart({ data, onStatusClick, loading }: DeliveryStatusChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Format data for chart
  const chartData = data.map((item) => ({
    name: STATUS_CONFIG[item.status].label,
    value: item.count,
    percentage: item.percentage,
    status: item.status,
    color: STATUS_CONFIG[item.status].color,
  }));

  const totalOrders = data.reduce((sum, item) => sum + item.count, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} orders ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-col gap-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <button
            key={`legend-${index}`}
            onClick={() => onStatusClick(entry.payload.status)}
            className="flex items-center gap-2 text-sm hover:bg-muted/50 p-2 rounded-md transition-colors"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="flex-1 text-left">{entry.value}</span>
            <span className="text-muted-foreground">
              {entry.payload.value} ({entry.payload.percentage.toFixed(1)}%)
            </span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              onClick={(data) => onStatusClick(data.status)}
              className="cursor-pointer"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="text-center mt-4">
          <p className="text-2xl font-bold">{totalOrders}</p>
          <p className="text-sm text-muted-foreground">Total Orders</p>
        </div>
      </CardContent>
    </Card>
  );
}
