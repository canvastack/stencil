import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PerformanceDistribution } from '@/types/tenant-url';

/**
 * Props untuk PerformanceChart component
 */
interface Props {
  data: PerformanceDistribution | undefined;
}

/**
 * PerformanceChart Component
 * 
 * Bar chart untuk menampilkan distribusi response time URL accesses.
 * Mengelompokkan response time ke dalam buckets: <100ms, 100-500ms, 500ms-1s, 1-2s, >2s.
 * 
 * @component
 * @example
 * ```tsx
 * <PerformanceChart data={performanceData} />
 * ```
 * 
 * @param {Props} props - Component props
 * @param {PerformanceDistribution | undefined} props.data - Data distribusi performa dari API
 * 
 * @returns {JSX.Element} Responsive bar chart dengan response time buckets
 */
export default function PerformanceChart({ data }: Props) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
        No performance data available
      </div>
    );
  }

  const chartData = [
    { range: '<100ms', count: data.under_100ms, color: 'hsl(var(--chart-1))' },
    { range: '100-500ms', count: data.under_500ms, color: 'hsl(var(--chart-2))' },
    { range: '500ms-1s', count: data.under_1s, color: 'hsl(var(--chart-3))' },
    { range: '1-2s', count: data.under_2s, color: 'hsl(var(--chart-4))' },
    { range: '>2s', count: data.over_2s, color: 'hsl(var(--chart-5))' },
  ];

  const totalCount = chartData.reduce((sum, item) => sum + item.count, 0);

  if (totalCount === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
        No performance data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="range"
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
          formatter={(value: number) => value.toLocaleString()}
        />
        <Bar 
          dataKey="count" 
          fill="hsl(var(--primary))"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
