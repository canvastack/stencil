import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AccessTrendsData } from '@/types/tenant-url';

/**
 * Props untuk AccessTrendsChart component
 */
interface Props {
  data: AccessTrendsData | undefined;
}

/**
 * AccessTrendsChart Component
 * 
 * Line chart untuk menampilkan tren akses URL dari waktu ke waktu.
 * Menampilkan 2 metrics: Total Accesses dan Unique Visitors.
 * 
 * @component
 * @example
 * ```tsx
 * <AccessTrendsChart data={trendsData} />
 * ```
 * 
 * @param {Props} props - Component props
 * @param {AccessTrendsData | undefined} props.data - Data tren akses dari API
 * 
 * @returns {JSX.Element} Responsive line chart dengan dual metrics
 */
export default function AccessTrendsChart({ data }: Props) {
  if (!data || data.labels.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No trend data available
      </div>
    );
  }

  const chartData = data.labels.map((label, index) => ({
    date: label,
    accesses: data.total_accesses[index] || 0,
    visitors: data.unique_visitors[index] || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="date" 
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
        <Legend />
        <Line
          type="monotone"
          dataKey="accesses"
          name="Total Accesses"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="visitors"
          name="Unique Visitors"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
